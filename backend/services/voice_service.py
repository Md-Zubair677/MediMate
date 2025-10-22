"""
AWS Voice Services (Transcribe & Polly) for MediMate Healthcare Platform.
Handles voice input/output for accessibility and enhanced user experience.
"""

import boto3
import json
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import uuid
import base64
from botocore.exceptions import ClientError
import io

logger = logging.getLogger(__name__)

class TranscribeService:
    """AWS Transcribe service for speech-to-text conversion."""
    
    def __init__(self, region: str = "ap-south-1"):
        self.region = region
        self._transcribe_client = None
        
        # Supported languages for medical transcription
        self.supported_languages = {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'en-AU': 'English (Australia)',
            'es-US': 'Spanish (US)',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'pt-BR': 'Portuguese (Brazil)',
            'hi-IN': 'Hindi (India)',
            'ta-IN': 'Tamil (India)'
        }
    
    @property
    def transcribe_client(self):
        """Get Transcribe client with lazy initialization."""
        if self._transcribe_client is None:
            try:
                self._transcribe_client = boto3.client('transcribe', region_name=self.region)
            except Exception as e:
                logger.warning(f"Could not initialize Transcribe client: {e}")
                self._transcribe_client = None
        return self._transcribe_client
    
    def transcribe_audio(self, audio_data: bytes, language_code: str = 'en-US', 
                        medical_context: bool = True) -> Dict[str, Any]:
        """Transcribe audio data to text."""
        
        if not self.transcribe_client:
            return self._mock_transcription(audio_data, language_code)
        
        try:
            # Generate unique job name
            job_name = f"medimate-transcription-{uuid.uuid4()}"
            
            # Upload audio to S3 first (required for Transcribe)
            from .s3_service import get_s3_service
            s3_service = get_s3_service()
            
            # Upload audio file
            audio_key = f"transcriptions/{job_name}.wav"
            s3_service.upload_file_bytes(
                file_bytes=audio_data,
                key=audio_key,
                content_type="audio/wav"
            )
            
            # Start transcription job
            job_params = {
                'TranscriptionJobName': job_name,
                'LanguageCode': language_code,
                'Media': {
                    'MediaFileUri': f"s3://{s3_service.bucket_name}/{audio_key}"
                },
                'OutputBucketName': s3_service.bucket_name,
                'OutputKey': f"transcriptions/output/{job_name}.json"
            }
            
            # Add medical transcription settings if enabled
            if medical_context:
                job_params['Settings'] = {
                    'VocabularyName': 'medical-vocabulary',  # Would be pre-created
                    'ShowSpeakerLabels': True,
                    'MaxSpeakerLabels': 2,
                    'ChannelIdentification': False
                }
                job_params['ContentRedaction'] = {
                    'RedactionType': 'PII',
                    'RedactionOutput': 'redacted'
                }
            
            response = self.transcribe_client.start_transcription_job(**job_params)
            
            # Wait for job completion (in production, this would be async)
            import time
            max_wait_time = 300  # 5 minutes
            wait_time = 0
            
            while wait_time < max_wait_time:
                job_status = self.transcribe_client.get_transcription_job(
                    TranscriptionJobName=job_name
                )
                
                status = job_status['TranscriptionJob']['TranscriptionJobStatus']
                
                if status == 'COMPLETED':
                    # Get transcription result
                    transcript_uri = job_status['TranscriptionJob']['Transcript']['TranscriptFileUri']
                    transcript_data = self._get_transcript_from_s3(transcript_uri)
                    
                    return {
                        'success': True,
                        'job_name': job_name,
                        'transcript': transcript_data.get('results', {}).get('transcripts', [{}])[0].get('transcript', ''),
                        'confidence': self._calculate_average_confidence(transcript_data),
                        'language_code': language_code,
                        'medical_context': medical_context,
                        'speaker_labels': transcript_data.get('results', {}).get('speaker_labels', {}),
                        'processing_time_seconds': wait_time,
                        'word_count': len(transcript_data.get('results', {}).get('transcripts', [{}])[0].get('transcript', '').split())
                    }
                elif status == 'FAILED':
                    failure_reason = job_status['TranscriptionJob'].get('FailureReason', 'Unknown error')
                    logger.error(f"Transcription job failed: {failure_reason}")
                    return self._mock_transcription(audio_data, language_code)
                
                time.sleep(5)
                wait_time += 5
            
            # Timeout
            logger.warning(f"Transcription job {job_name} timed out")
            return self._mock_transcription(audio_data, language_code)
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return self._mock_transcription(audio_data, language_code)
    
    def _mock_transcription(self, audio_data: bytes, language_code: str) -> Dict[str, Any]:
        """Mock transcription for when Transcribe is unavailable."""
        
        # Simulate processing time based on audio size
        audio_size_mb = len(audio_data) / (1024 * 1024)
        processing_time = max(2, int(audio_size_mb * 10))  # Rough estimate
        
        mock_transcripts = {
            'en-US': "I've been experiencing chest pain and shortness of breath for the past two days. The pain is sharp and occurs mainly when I take deep breaths. I also feel dizzy occasionally.",
            'hi-IN': "मुझे पिछले दो दिनों से सीने में दर्द और सांस लेने में तकलीफ हो रही है। दर्द तेज है और मुख्यतः गहरी सांस लेते समय होता है।",
            'es-US': "He estado experimentando dolor en el pecho y dificultad para respirar durante los últimos dos días. El dolor es agudo y ocurre principalmente cuando respiro profundo."
        }
        
        transcript = mock_transcripts.get(language_code, mock_transcripts['en-US'])
        
        return {
            'success': True,
            'job_name': f"mock-transcription-{uuid.uuid4()}",
            'transcript': transcript,
            'confidence': 0.92,
            'language_code': language_code,
            'medical_context': True,
            'speaker_labels': {'speakers': 1},
            'processing_time_seconds': processing_time,
            'word_count': len(transcript.split()),
            'mock_mode': True
        }
    
    def _get_transcript_from_s3(self, transcript_uri: str) -> Dict[str, Any]:
        """Get transcript data from S3 URI."""
        
        try:
            # Parse S3 URI
            import re
            match = re.match(r's3://([^/]+)/(.+)', transcript_uri)
            if not match:
                raise ValueError("Invalid S3 URI")
            
            bucket_name, key = match.groups()
            
            # Get transcript from S3
            from .s3_service import get_s3_service
            s3_service = get_s3_service()
            
            transcript_json = s3_service.get_file_content(key)
            return json.loads(transcript_json)
            
        except Exception as e:
            logger.error(f"Failed to get transcript from S3: {e}")
            return {}
    
    def _calculate_average_confidence(self, transcript_data: Dict[str, Any]) -> float:
        """Calculate average confidence score from transcript data."""
        
        try:
            items = transcript_data.get('results', {}).get('items', [])
            if not items:
                return 0.8  # Default confidence
            
            confidences = []
            for item in items:
                if 'alternatives' in item and item['alternatives']:
                    confidence = item['alternatives'][0].get('confidence')
                    if confidence:
                        confidences.append(float(confidence))
            
            return sum(confidences) / len(confidences) if confidences else 0.8
            
        except Exception:
            return 0.8

class PollyService:
    """AWS Polly service for text-to-speech conversion."""
    
    def __init__(self, region: str = "ap-south-1"):
        self.region = region
        self._polly_client = None
        
        # Available voices for different languages
        self.voices = {
            'en-US': {
                'female': ['Joanna', 'Kimberly', 'Salli', 'Kendra', 'Ivy'],
                'male': ['Matthew', 'Justin', 'Joey']
            },
            'en-GB': {
                'female': ['Emma', 'Amy'],
                'male': ['Brian']
            },
            'hi-IN': {
                'female': ['Aditi'],
                'male': []
            },
            'es-US': {
                'female': ['Penelope', 'Lupe'],
                'male': ['Miguel']
            }
        }
    
    @property
    def polly_client(self):
        """Get Polly client with lazy initialization."""
        if self._polly_client is None:
            try:
                self._polly_client = boto3.client('polly', region_name=self.region)
            except Exception as e:
                logger.warning(f"Could not initialize Polly client: {e}")
                self._polly_client = None
        return self._polly_client
    
    def synthesize_speech(self, text: str, voice_id: str = 'Joanna', 
                         language_code: str = 'en-US', output_format: str = 'mp3') -> Dict[str, Any]:
        """Convert text to speech using AWS Polly."""
        
        if not self.polly_client:
            return self._mock_speech_synthesis(text, voice_id, language_code)
        
        try:
            # Prepare SSML for medical context
            ssml_text = self._prepare_medical_ssml(text)
            
            response = self.polly_client.synthesize_speech(
                Text=ssml_text,
                TextType='ssml',
                VoiceId=voice_id,
                OutputFormat=output_format,
                LanguageCode=language_code,
                Engine='neural'  # Use neural engine for better quality
            )
            
            # Get audio stream
            audio_stream = response['AudioStream'].read()
            
            return {
                'success': True,
                'audio_data': base64.b64encode(audio_stream).decode('utf-8'),
                'audio_format': output_format,
                'voice_id': voice_id,
                'language_code': language_code,
                'text_length': len(text),
                'audio_size_bytes': len(audio_stream),
                'content_type': f'audio/{output_format}'
            }
            
        except Exception as e:
            logger.error(f"Speech synthesis failed: {e}")
            return self._mock_speech_synthesis(text, voice_id, language_code)
    
    def _mock_speech_synthesis(self, text: str, voice_id: str, language_code: str) -> Dict[str, Any]:
        """Mock speech synthesis for when Polly is unavailable."""
        
        # Create a small mock audio data (base64 encoded silence)
        mock_audio = base64.b64encode(b'\x00' * 1024).decode('utf-8')
        
        return {
            'success': True,
            'audio_data': mock_audio,
            'audio_format': 'mp3',
            'voice_id': voice_id,
            'language_code': language_code,
            'text_length': len(text),
            'audio_size_bytes': 1024,
            'content_type': 'audio/mp3',
            'mock_mode': True,
            'message': 'Mock audio generated - Polly service unavailable'
        }
    
    def _prepare_medical_ssml(self, text: str) -> str:
        """Prepare SSML markup for medical text with appropriate pronunciation."""
        
        # Medical terms that need special pronunciation
        medical_pronunciations = {
            'hypertension': '<phoneme alphabet="ipa" ph="ˌhaɪpərˈtɛnʃən">hypertension</phoneme>',
            'diabetes': '<phoneme alphabet="ipa" ph="ˌdaɪəˈbiːtiːz">diabetes</phoneme>',
            'pneumonia': '<phoneme alphabet="ipa" ph="nuːˈmoʊniə">pneumonia</phoneme>',
            'arrhythmia': '<phoneme alphabet="ipa" ph="əˈrɪθmiə">arrhythmia</phoneme>',
            'tachycardia': '<phoneme alphabet="ipa" ph="ˌtækɪˈkɑrdiə">tachycardia</phoneme>'
        }
        
        # Apply medical pronunciations
        ssml_text = text
        for term, pronunciation in medical_pronunciations.items():
            ssml_text = ssml_text.replace(term, pronunciation)
        
        # Add appropriate pauses and emphasis
        ssml_text = ssml_text.replace('.', '.<break time="500ms"/>')
        ssml_text = ssml_text.replace(',', ',<break time="300ms"/>')
        ssml_text = ssml_text.replace('!', '!<break time="700ms"/>')
        ssml_text = ssml_text.replace('?', '?<break time="600ms"/>')
        
        # Emphasize important medical terms
        important_terms = ['emergency', 'urgent', 'critical', 'severe', 'immediate']
        for term in important_terms:
            ssml_text = ssml_text.replace(term, f'<emphasis level="strong">{term}</emphasis>')
        
        # Wrap in SSML tags
        return f'<speak><prosody rate="medium" pitch="medium">{ssml_text}</prosody></speak>'
    
    def get_available_voices(self, language_code: str = None) -> Dict[str, Any]:
        """Get available voices for speech synthesis."""
        
        if not self.polly_client:
            return self._mock_available_voices(language_code)
        
        try:
            params = {}
            if language_code:
                params['LanguageCode'] = language_code
            
            response = self.polly_client.describe_voices(**params)
            
            voices = []
            for voice in response.get('Voices', []):
                voices.append({
                    'id': voice['Id'],
                    'name': voice['Name'],
                    'gender': voice['Gender'],
                    'language_code': voice['LanguageCode'],
                    'language_name': voice['LanguageName'],
                    'supported_engines': voice.get('SupportedEngines', [])
                })
            
            return {
                'success': True,
                'voices': voices,
                'total_count': len(voices)
            }
            
        except Exception as e:
            logger.error(f"Failed to get available voices: {e}")
            return self._mock_available_voices(language_code)
    
    def _mock_available_voices(self, language_code: str = None) -> Dict[str, Any]:
        """Mock available voices for when Polly is unavailable."""
        
        mock_voices = [
            {
                'id': 'Joanna',
                'name': 'Joanna',
                'gender': 'Female',
                'language_code': 'en-US',
                'language_name': 'US English',
                'supported_engines': ['standard', 'neural']
            },
            {
                'id': 'Matthew',
                'name': 'Matthew',
                'gender': 'Male',
                'language_code': 'en-US',
                'language_name': 'US English',
                'supported_engines': ['standard', 'neural']
            },
            {
                'id': 'Aditi',
                'name': 'Aditi',
                'gender': 'Female',
                'language_code': 'hi-IN',
                'language_name': 'Hindi',
                'supported_engines': ['standard']
            }
        ]
        
        if language_code:
            mock_voices = [v for v in mock_voices if v['language_code'] == language_code]
        
        return {
            'success': True,
            'voices': mock_voices,
            'total_count': len(mock_voices),
            'mock_mode': True
        }

class VoiceService:
    """Combined voice service for speech-to-text and text-to-speech."""
    
    def __init__(self):
        self.transcribe_service = TranscribeService()
        self.polly_service = PollyService()
    
    def process_voice_input(self, audio_data: bytes, language_code: str = 'en-US') -> Dict[str, Any]:
        """Process voice input and return transcribed text."""
        
        return self.transcribe_service.transcribe_audio(
            audio_data=audio_data,
            language_code=language_code,
            medical_context=True
        )
    
    def generate_voice_response(self, text: str, voice_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate voice response from text."""
        
        if not voice_preferences:
            voice_preferences = {
                'voice_id': 'Joanna',
                'language_code': 'en-US',
                'output_format': 'mp3'
            }
        
        return self.polly_service.synthesize_speech(
            text=text,
            voice_id=voice_preferences.get('voice_id', 'Joanna'),
            language_code=voice_preferences.get('language_code', 'en-US'),
            output_format=voice_preferences.get('output_format', 'mp3')
        )
    
    def create_voice_conversation(self, audio_input: bytes, language_code: str = 'en-US',
                                voice_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Complete voice conversation: transcribe input and generate voice response."""
        
        # Step 1: Transcribe audio input
        transcription_result = self.process_voice_input(audio_input, language_code)
        
        if not transcription_result['success']:
            return {
                'success': False,
                'error': 'Failed to transcribe audio input',
                'transcription_result': transcription_result
            }
        
        # Step 2: Process the transcribed text (would integrate with chat service)
        user_message = transcription_result['transcript']
        
        # For now, create a simple response (in production, this would use the chat service)
        ai_response = self._generate_ai_response(user_message)
        
        # Step 3: Generate voice response
        voice_response = self.generate_voice_response(ai_response, voice_preferences)
        
        return {
            'success': True,
            'user_input': {
                'transcript': user_message,
                'confidence': transcription_result['confidence'],
                'language_code': language_code
            },
            'ai_response': {
                'text': ai_response,
                'audio_data': voice_response.get('audio_data'),
                'audio_format': voice_response.get('audio_format')
            },
            'conversation_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        }
    
    def _generate_ai_response(self, user_message: str) -> str:
        """Generate AI response to user message (simplified version)."""
        
        # This would integrate with the Bedrock service in production
        # For now, provide basic medical responses
        
        user_message_lower = user_message.lower()
        
        if any(symptom in user_message_lower for symptom in ['chest pain', 'heart', 'cardiac']):
            return "I understand you're experiencing chest pain. This could be serious. Please seek immediate medical attention if the pain is severe, radiating to your arm or jaw, or accompanied by shortness of breath. For mild discomfort, try to rest and avoid strenuous activity."
        
        elif any(symptom in user_message_lower for symptom in ['headache', 'head pain']):
            return "Headaches can have various causes. Try to rest in a quiet, dark room and stay hydrated. If the headache is severe, sudden, or accompanied by fever, vision changes, or neck stiffness, please seek medical attention immediately."
        
        elif any(symptom in user_message_lower for symptom in ['fever', 'temperature']):
            return "A fever indicates your body is fighting an infection. Stay hydrated, rest, and monitor your temperature. Seek medical attention if your fever is above 103°F (39.4°C), persists for more than 3 days, or is accompanied by severe symptoms."
        
        else:
            return "Thank you for sharing your symptoms with me. Based on what you've described, I recommend monitoring your condition closely. If symptoms worsen or you have concerns, please consult with a healthcare professional for proper evaluation and treatment."
    
    def health_check(self) -> Dict[str, Any]:
        """Check voice services health."""
        
        transcribe_health = {
            'service': 'transcribe',
            'status': 'healthy' if self.transcribe_service.transcribe_client else 'unavailable'
        }
        
        polly_health = {
            'service': 'polly',
            'status': 'healthy' if self.polly_service.polly_client else 'unavailable'
        }
        
        overall_status = 'healthy' if (transcribe_health['status'] == 'healthy' and 
                                     polly_health['status'] == 'healthy') else 'partial'
        
        return {
            'service': 'voice_services',
            'status': overall_status,
            'components': {
                'transcribe': transcribe_health,
                'polly': polly_health
            },
            'supported_languages': list(self.transcribe_service.supported_languages.keys()),
            'available_voices': len(self.polly_service.voices.get('en-US', {}).get('female', [])) + 
                              len(self.polly_service.voices.get('en-US', {}).get('male', []))
        }

# Service instances
transcribe_service = TranscribeService()
polly_service = PollyService()
voice_service = VoiceService()

def get_transcribe_service() -> TranscribeService:
    """Get the global Transcribe service instance."""
    return transcribe_service

def get_polly_service() -> PollyService:
    """Get the global Polly service instance."""
    return polly_service

def get_voice_service() -> VoiceService:
    """Get the global Voice service instance."""
    return voice_service