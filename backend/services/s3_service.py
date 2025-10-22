import boto3
import uuid
from datetime import datetime

class S3Service:
    def __init__(self):
        self.s3 = boto3.client('s3', region_name='ap-south-1')
        self.bucket_name = 'medimate-patient-files'
    
    def upload_medical_file(self, file_content, patient_id, file_type='pdf'):
        """Upload medical file to S3"""
        try:
            file_key = f"patients/{patient_id}/reports/{uuid.uuid4()}.{file_type}"
            
            self.s3.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ServerSideEncryption='AES256'
            )
            
            return {
                "status": "uploaded",
                "file_key": file_key,
                "url": f"s3://{self.bucket_name}/{file_key}"
            }
        except Exception as e:
            print(f"S3 upload failed: {e}")
            return {"status": "upload_failed"}
    
    def get_file_url(self, file_key, expiration=3600):
        """Generate presigned URL for file access"""
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return {"status": "success", "url": url}
        except Exception as e:
            print(f"URL generation failed: {e}")
            return {"status": "failed"}

s3_service = S3Service()