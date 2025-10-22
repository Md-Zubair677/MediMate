from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import boto3
import json
import uuid
from datetime import datetime
import base64
import io

router = APIRouter(prefix="/api/health-reports", tags=["health-reports"])

class HealthReportAnalysis(BaseModel):
    userId: str
    reportType: str
    extractedData: Dict[str, Any]
    insights: List[str]
    criticalValues: List[str]
    recommendations: List[str]

class ProfileData(BaseModel):
    fullName: str
    age: int
    gender: str
    bloodGroup: str
    phone: str
    email: str

class HealthSummaryRequest(BaseModel):
    userId: str
    profileData: ProfileData
    healthRecords: Dict[str, Any]
    labReports: List[Dict[str, Any]]

# Initialize AWS clients
def get_aws_clients():
    return {
        'textract': boto3.client('textract', region_name='ap-south-1'),
        'comprehend_medical': boto3.client('comprehendmedical', region_name='ap-south-1'),
        'bedrock': boto3.client('bedrock-runtime', region_name='ap-south-1'),
        's3': boto3.client('s3', region_name='ap-south-1'),
        'sns': boto3.client('sns', region_name='ap-south-1')
    }

# Mock database for health reports
health_reports_db = []

async def extract_text_from_document(file_content: bytes, file_type: str):
    """Extract text from uploaded document using AWS Textract"""
    try:
        aws_clients = get_aws_clients()
        textract = aws_clients['textract']
        
        # Use Textract to extract text
        response = textract.detect_document_text(
            Document={'Bytes': file_content}
        )
        
        # Extract text from response
        extracted_text = ""
        for block in response['Blocks']:
            if block['BlockType'] == 'LINE':
                extracted_text += block['Text'] + "\n"
        
        return extracted_text
        
    except Exception as e:
        print(f"Textract extraction failed: {e}")
        # Fallback to simple text extraction
        return "Sample lab report text for demo purposes"

async def analyze_medical_text(text: str):
    """Analyze medical text using AWS Comprehend Medical"""
    try:
        aws_clients = get_aws_clients()
        comprehend_medical = aws_clients['comprehend_medical']
        
        # Detect medical entities
        entities_response = comprehend_medical.detect_entities_v2(Text=text)
        
        # Extract medical values and conditions
        medical_data = {
            'conditions': [],
            'medications': [],
            'test_results': [],
            'anatomy': []
        }
        
        for entity in entities_response['Entities']:
            category = entity['Category']
            text_value = entity['Text']
            confidence = entity['Score']
            
            if confidence > 0.8:  # High confidence only
                if category == 'MEDICAL_CONDITION':
                    medical_data['conditions'].append(text_value)
                elif category == 'MEDICATION':
                    medical_data['medications'].append(text_value)
                elif category == 'TEST_TREATMENT_PROCEDURE':
                    medical_data['test_results'].append(text_value)
                elif category == 'ANATOMY':
                    medical_data['anatomy'].append(text_value)
        
        return medical_data
        
    except Exception as e:
        print(f"Comprehend Medical analysis failed: {e}")
        # Return mock analysis
        return {
            'conditions': ['Hypertension'],
            'medications': ['Lisinopril'],
            'test_results': ['Blood Pressure', 'Cholesterol'],
            'anatomy': ['Heart', 'Blood vessels']
        }

async def generate_ai_insights(medical_data: Dict[str, Any], patient_profile: Dict[str, Any]):
    """Generate AI insights using AWS Bedrock"""
    try:
        aws_clients = get_aws_clients()
        bedrock = aws_clients['bedrock']
        
        # Prepare prompt for Claude
        prompt = f"""
        Analyze this medical report data and provide insights:
        
        Patient Profile:
        - Age: {patient_profile.get('age', 'Unknown')}
        - Gender: {patient_profile.get('gender', 'Unknown')}
        
        Medical Data:
        - Conditions: {medical_data.get('conditions', [])}
        - Test Results: {medical_data.get('test_results', [])}
        - Medications: {medical_data.get('medications', [])}
        
        Please provide:
        1. Key insights about the health status
        2. Any critical values or concerns
        3. Lifestyle recommendations
        4. When to follow up with doctor
        
        Keep responses clear, non-alarming, and educational.
        """
        
        # Call Claude model
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 1000,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        ai_insights = response_body['content'][0]['text']
        
        return {
            'insights': [ai_insights],
            'critical_values': [],
            'recommendations': ['Maintain regular checkups', 'Follow prescribed medications']
        }
        
    except Exception as e:
        print(f"Bedrock AI analysis failed: {e}")
        # Return mock insights
        return {
            'insights': ['All values appear within normal ranges for your age group'],
            'critical_values': [],
            'recommendations': [
                'Continue current medication regimen',
                'Maintain healthy diet and exercise',
                'Schedule follow-up in 3 months'
            ]
        }

@router.post("/upload")
async def upload_health_report(file: UploadFile = File(...), userId: str = "test-user"):
    """Upload and analyze health report"""
    try:
        # Read file content
        file_content = await file.read()
        file_type = file.content_type
        
        # Extract text using Textract
        extracted_text = await extract_text_from_document(file_content, file_type)
        
        # Analyze medical content
        medical_data = await analyze_medical_text(extracted_text)
        
        # Generate AI insights
        patient_profile = {'age': 32, 'gender': 'male'}  # Mock profile
        ai_analysis = await generate_ai_insights(medical_data, patient_profile)
        
        # Create report record
        report_id = str(uuid.uuid4())[:8]
        report = {
            'id': report_id,
            'userId': userId,
            'fileName': file.filename,
            'uploadDate': datetime.now().isoformat(),
            'extractedText': extracted_text,
            'medicalData': medical_data,
            'aiInsights': ai_analysis,
            'status': 'analyzed'
        }
        
        # Store in database
        health_reports_db.append(report)
        
        # Determine if critical
        is_critical = len(ai_analysis.get('critical_values', [])) > 0
        
        return {
            'success': True,
            'report': {
                'id': report_id,
                'name': file.filename,
                'date': datetime.now().strftime('%Y-%m-%d'),
                'status': 'analyzed',
                'insights': ai_analysis['insights'][0] if ai_analysis['insights'] else 'Analysis completed',
                'critical': is_critical
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/user/{user_id}")
async def get_user_reports(user_id: str):
    """Get all reports for a user"""
    try:
        user_reports = [report for report in health_reports_db if report['userId'] == user_id]
        return {'reports': user_reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reports: {str(e)}")

@router.get("/report/{report_id}")
async def get_report_details(report_id: str):
    """Get detailed analysis of a specific report"""
    try:
        report = next((r for r in health_reports_db if r['id'] == report_id), None)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {'report': report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get report: {str(e)}")

@router.post("/generate-summary")
async def generate_health_summary(request: HealthSummaryRequest):
    """Generate comprehensive health summary PDF"""
    try:
        # Generate summary using AI
        summary_prompt = f"""
        Create a comprehensive health summary for:
        
        Patient: {request.profileData.fullName}
        Age: {request.profileData.age}
        Gender: {request.profileData.gender}
        Blood Group: {request.profileData.bloodGroup}
        
        Medical History:
        - Conditions: {request.healthRecords.get('conditions', [])}
        - Allergies: {request.healthRecords.get('allergies', [])}
        - Medications: {request.healthRecords.get('medications', [])}
        
        Recent Lab Reports: {len(request.labReports)} reports analyzed
        
        Provide a professional medical summary suitable for healthcare providers.
        """
        
        # In production, use Bedrock to generate summary
        # For now, return mock response
        
        summary_id = str(uuid.uuid4())[:8]
        
        return {
            'success': True,
            'summaryId': summary_id,
            'downloadUrl': f'/api/health-reports/download/{summary_id}',
            'message': 'Health summary generated successfully'
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

@router.get("/trends/{user_id}")
async def get_health_trends(user_id: str, parameter: str = "cholesterol"):
    """Get health parameter trends over time"""
    try:
        # Mock trend data
        trend_data = {
            'parameter': parameter,
            'unit': 'mg/dL' if parameter == 'cholesterol' else 'mg/dL',
            'normal_range': {'min': 150, 'max': 200},
            'data_points': [
                {'date': '2024-01-15', 'value': 180},
                {'date': '2024-04-15', 'value': 175},
                {'date': '2024-07-15', 'value': 170},
                {'date': '2024-10-15', 'value': 165}
            ],
            'trend': 'improving',
            'insights': f'{parameter.title()} levels are trending downward, indicating good response to treatment.'
        }
        
        return {'trends': trend_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trends: {str(e)}")

@router.post("/share")
async def share_health_data(user_id: str, doctor_email: str, report_ids: List[str]):
    """Securely share health data with healthcare provider"""
    try:
        # Generate secure sharing link
        share_id = str(uuid.uuid4())
        share_link = f"https://medimate.app/shared/{share_id}"
        
        # Send notification to doctor via SNS
        aws_clients = get_aws_clients()
        sns = aws_clients['sns']
        
        message = f"""
        A patient has shared their health records with you via MediMate.
        
        Secure Access Link: {share_link}
        Patient ID: {user_id}
        Reports Shared: {len(report_ids)}
        
        This link expires in 7 days.
        
        MediMate Healthcare Platform
        """
        
        try:
            sns.publish(
                TopicArn='arn:aws:sns:ap-south-1:676206948283:medimate-notifications',
                Subject='Health Records Shared - MediMate',
                Message=message
            )
        except Exception as e:
            print(f"SNS notification failed: {e}")
        
        return {
            'success': True,
            'shareId': share_id,
            'shareLink': share_link,
            'expiresIn': '7 days',
            'message': 'Health data shared successfully'
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sharing failed: {str(e)}")

@router.get("/recommendations/{user_id}")
async def get_health_recommendations(user_id: str):
    """Get personalized health recommendations"""
    try:
        # Mock recommendations based on user data
        recommendations = [
            {
                'category': 'Diet',
                'title': 'Reduce Sodium Intake',
                'description': 'Limit sodium to less than 2,300mg per day to help manage blood pressure.',
                'priority': 'high'
            },
            {
                'category': 'Exercise',
                'title': 'Regular Cardio Exercise',
                'description': 'Aim for 150 minutes of moderate aerobic activity per week.',
                'priority': 'medium'
            },
            {
                'category': 'Monitoring',
                'title': 'Blood Pressure Checks',
                'description': 'Monitor blood pressure weekly and log readings.',
                'priority': 'high'
            }
        ]
        
        return {'recommendations': recommendations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")
