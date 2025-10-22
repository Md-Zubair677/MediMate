from flask import Flask, render_template, request, session, redirect, url_for, jsonify
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import json

app = Flask(__name__)
app.secret_key = 'medimate-demo-secret-key'

class AWSCredentialManager:
    def __init__(self):
        self.session_clients = {}
    
    def validate_credentials(self, access_key, secret_key, region='us-east-1'):
        try:
            session = boto3.Session(
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region
            )
            sts_client = session.client('sts')
            identity = sts_client.get_caller_identity()
            return {
                'valid': True,
                'account_id': identity.get('Account'),
                'user_arn': identity.get('Arn')
            }
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    
    def create_user_session(self, user_id, access_key, secret_key, region):
        try:
            user_session = boto3.Session(
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region
            )
            self.session_clients[user_id] = {
                'bedrock': user_session.client('bedrock-runtime', region_name=region),
                'textract': user_session.client('textract', region_name=region),
                's3': user_session.client('s3'),
                'ses': user_session.client('ses'),
                'sns': user_session.client('sns')
            }
            return True
        except Exception:
            return False
    
    def get_user_client(self, user_id, service):
        if user_id in self.session_clients:
            return self.session_clients[user_id].get(service)
        return None

credential_manager = AWSCredentialManager()

@app.route('/')
def index():
    if 'aws_configured' in session and session['aws_configured']:
        return redirect(url_for('dashboard'))
    return render_template('credentials_setup.html')

@app.route('/setup-credentials', methods=['POST'])
def setup_credentials():
    access_key = request.form.get('aws_access_key_id')
    secret_key = request.form.get('aws_secret_access_key')
    region = request.form.get('aws_region', 'us-east-1')
    
    if not access_key or not secret_key:
        return jsonify({'success': False, 'error': 'Please provide AWS credentials'})
    
    validation_result = credential_manager.validate_credentials(access_key, secret_key, region)
    
    if validation_result['valid']:
        user_id = f"user_{validation_result['account_id']}_{hash(access_key) % 10000}"
        
        if credential_manager.create_user_session(user_id, access_key, secret_key, region):
            session['user_id'] = user_id
            session['aws_configured'] = True
            session['aws_region'] = region
            session['account_id'] = validation_result['account_id']
            
            return jsonify({
                'success': True,
                'message': 'AWS credentials validated successfully!',
                'account_id': validation_result['account_id'],
                'redirect': url_for('dashboard')
            })
    
    return jsonify({'success': False, 'error': 'Invalid AWS credentials'})

@app.route('/dashboard')
def dashboard():
    if 'aws_configured' not in session or not session['aws_configured']:
        return redirect(url_for('index'))
    return render_template('dashboard.html', 
                         account_id=session.get('account_id'),
                         region=session.get('aws_region'))

@app.route('/api/chat', methods=['POST'])
def chat_api():
    if 'user_id' not in session:
        return jsonify({'error': 'AWS credentials not configured'}), 401
    
    user_id = session['user_id']
    message = request.json.get('message')
    bedrock_client = credential_manager.get_user_client(user_id, 'bedrock')
    
    if not bedrock_client:
        return jsonify({'error': 'Bedrock client not available'}), 500
    
    try:
        response = bedrock_client.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 1000,
                'messages': [{'role': 'user', 'content': f'As a healthcare AI assistant: {message}'}]
            })
        )
        result = json.loads(response['body'].read())
        ai_response = result['content'][0]['text']
        return jsonify({'response': ai_response})
    except Exception as e:
        return jsonify({'error': f'Chat error: {str(e)}'}), 500

@app.route('/logout')
def logout():
    user_id = session.get('user_id')
    if user_id and user_id in credential_manager.session_clients:
        del credential_manager.session_clients[user_id]
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
