import boto3
import json
from datetime import datetime

class CloudWatchService:
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch', region_name='ap-south-1')
        self.logs = boto3.client('logs', region_name='ap-south-1')
        self.log_group = '/aws/medimate/symptom-analysis'
    
    def log_triage_decision(self, patient_id, triage_level, symptoms, confidence=None):
        """Log triage decision to CloudWatch"""
        try:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'patient_id': patient_id,
                'triage_level': triage_level,
                'symptoms': symptoms,
                'confidence': confidence
            }
            
            self.logs.put_log_events(
                logGroupName=self.log_group,
                logStreamName=f"triage-{datetime.now().strftime('%Y-%m-%d')}",
                logEvents=[{
                    'timestamp': int(datetime.now().timestamp() * 1000),
                    'message': json.dumps(log_entry)
                }]
            )
            
            return {"status": "logged"}
        except Exception as e:
            print(f"CloudWatch logging failed: {e}")
            return {"status": "log_failed"}
    
    def put_metric(self, metric_name, value, unit='Count'):
        """Put custom metric to CloudWatch"""
        try:
            self.cloudwatch.put_metric_data(
                Namespace='MediMate/SymptomAnalysis',
                MetricData=[{
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.now()
                }]
            )
            return {"status": "metric_sent"}
        except Exception as e:
            print(f"Metric failed: {e}")
            return {"status": "metric_failed"}

cloudwatch_service = CloudWatchService()