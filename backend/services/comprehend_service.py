import boto3
import json
from botocore.exceptions import ClientError

class ComprehendMedicalService:
    def __init__(self):
        self.client = boto3.client('comprehendmedical', region_name='us-east-1')  # Comprehend Medical only in specific regions
    
    def extract_entities(self, text):
        """Extract medical entities from text using AWS Comprehend Medical"""
        try:
            response = self.client.detect_entities_v2(Text=text)
            return self._format_entities(response.get('Entities', []))
        except ClientError as e:
            print(f"Comprehend Medical error: {e}")
            return self._fallback_extraction(text)
        except Exception as e:
            print(f"Error in entity extraction: {e}")
            return self._fallback_extraction(text)
    
    def _format_entities(self, entities):
        """Format Comprehend Medical entities into standardized format"""
        formatted = []
        for entity in entities:
            formatted.append({
                'text': entity.get('Text', ''),
                'category': entity.get('Category', ''),
                'type': entity.get('Type', ''),
                'confidence': entity.get('Score', 0.0),
                'begin_offset': entity.get('BeginOffset', 0),
                'end_offset': entity.get('EndOffset', 0)
            })
        return formatted
    
    def _fallback_extraction(self, text):
        """Fallback entity extraction using keyword matching"""
        symptoms = []
        
        # Common symptom keywords
        symptom_keywords = [
            'pain', 'ache', 'fever', 'headache', 'nausea', 'vomiting', 
            'dizziness', 'fatigue', 'cough', 'shortness of breath',
            'chest pain', 'abdominal pain', 'back pain', 'rash',
            'bleeding', 'swelling', 'weakness'
        ]
        
        text_lower = text.lower()
        for keyword in symptom_keywords:
            if keyword in text_lower:
                symptoms.append({
                    'text': keyword,
                    'category': 'SYMPTOM',
                    'type': 'DX_NAME',
                    'confidence': 0.8,
                    'begin_offset': text_lower.find(keyword),
                    'end_offset': text_lower.find(keyword) + len(keyword)
                })
        
        return symptoms

# Global instance
comprehend_service = ComprehendMedicalService()

def extract_medical_entities(text):
    """Main function to extract medical entities"""
    return comprehend_service.extract_entities(text)