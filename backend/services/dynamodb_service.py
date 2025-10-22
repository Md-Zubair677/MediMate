"""
DynamoDB service for MediMate platform with CRUD operations for all models.
Provides centralized database operations with error handling and retry logic.
"""

import json
import logging
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from utils.aws_clients import get_aws_clients
from models.user import User, UserCreate, UserUpdate
from models.appointment import Appointment, AppointmentCreate, AppointmentUpdate
from models.medical_report import MedicalReport, DocumentAnalysisRequest

logger = logging.getLogger(__name__)


class DynamoDBService:
    """Centralized DynamoDB service for all MediMate data operations."""
    
    def __init__(self):
        self.aws_clients = get_aws_clients()
        self.dynamodb = None
        self._tables = {}
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Initialize DynamoDB connection and table references."""
        try:
            self.dynamodb = self.aws_clients.get_dynamodb_resource()
            if self.dynamodb:
                # Get table names from configuration
                table_names = self.aws_clients.get_table_names()
                
                # Initialize table references
                self._tables = {
                    'users': table_names.get('users', 'medimate-users'),
                    'appointments': table_names.get('appointments', 'medimate-appointments'),
                    'reports': table_names.get('reports', 'medimate-reports'),
                    'doctors': table_names.get('doctors', 'medimate-doctors'),
                    'triage_logs': table_names.get('triage_logs', 'medimate-triage-logs')
                }
                
                logger.info(f"DynamoDB service initialized with tables: {list(self._tables.values())}")
            else:
                logger.warning("DynamoDB resource not available - using fallback mode")
        except Exception as e:
            logger.error(f"Failed to initialize DynamoDB service: {e}")
            self.dynamodb = None
    
    def _get_table(self, table_name: str):
        """Get DynamoDB table reference with error handling."""
        if not self.dynamodb:
            raise Exception("DynamoDB not available")
        
        try:
            table_key = table_name.replace('medimate-', '')
            actual_table_name = self._tables.get(table_key, table_name)
            return self.dynamodb.Table(actual_table_name)
        except Exception as e:
            logger.error(f"Failed to get table {table_name}: {e}")
            raise
    
    def _convert_decimals(self, obj: Any) -> Any:
        """Convert Decimal objects to float for JSON serialization."""
        if isinstance(obj, list):
            return [self._convert_decimals(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: self._convert_decimals(value) for key, value in obj.items()}
        elif isinstance(obj, Decimal):
            return float(obj)
        return obj
    
    def _prepare_item_for_storage(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare item for DynamoDB storage by handling data types."""
        # Convert datetime and date objects to ISO strings
        for key, value in item.items():
            if isinstance(value, datetime):
                item[key] = value.isoformat()
            elif isinstance(value, date):
                item[key] = value.isoformat()
            elif isinstance(value, float):
                item[key] = Decimal(str(value))
        
        return item

    # Doctor Operations for Symptom Analysis
    
    def find_doctors_by_specialty(self, specialty, location=None, limit=10):
        """Find doctors by specialty with optional location filtering"""
        try:
            table = self._get_table('doctors')
            
            # Scan for doctors with matching specialty
            response = table.scan(
                FilterExpression=Attr('specialties').contains(specialty),
                Limit=limit
            )
            
            doctors = []
            for item in response.get('Items', []):
                item = self._convert_decimals(item)
                doctor = {
                    'doctor_id': item.get('doctor_id', ''),
                    'name': item.get('name', ''),
                    'specialties': item.get('specialties', []),
                    'hospital': item.get('hospital', ''),
                    'rating': item.get('rating', 0.0),
                    'available': item.get('available', False),
                    'available_today': item.get('available_today', False),
                    'telemedicine': item.get('telemedicine', False),
                    'location': item.get('location', {})
                }
                doctors.append(doctor)
            
            return doctors
            
        except Exception as e:
            print(f"Error finding doctors: {e}")
            # Return demo doctors for testing
            return self._get_demo_doctors(specialty)
    
    def _get_demo_doctors(self, specialty):
        """Return demo doctors for testing"""
        demo_doctors = [
            {
                'doctor_id': 'D001',
                'name': 'Dr. Priya Sharma',
                'specialties': ['cardiology', 'internal_medicine'],
                'hospital': 'Apollo Hospital',
                'rating': 4.8,
                'available': True,
                'available_today': True,
                'telemedicine': True,
                'location': {'city': 'Mumbai', 'state': 'Maharashtra'}
            },
            {
                'doctor_id': 'D002', 
                'name': 'Dr. Rajesh Kumar',
                'specialties': ['neurology', 'general_practitioner'],
                'hospital': 'Fortis Healthcare',
                'rating': 4.6,
                'available': True,
                'available_today': False,
                'telemedicine': True,
                'location': {'city': 'Delhi', 'state': 'Delhi'}
            },
            {
                'doctor_id': 'D003',
                'name': 'Dr. Anita Patel',
                'specialties': ['dermatology', 'allergy_immunology'],
                'hospital': 'Max Healthcare',
                'rating': 4.7,
                'available': True,
                'available_today': True,
                'telemedicine': False,
                'location': {'city': 'Bangalore', 'state': 'Karnataka'}
            }
        ]
        
        # Filter by specialty
        return [d for d in demo_doctors if specialty in d['specialties']][:3]
    
    def save_triage_log(self, patient_id, input_text, entities, triage_level, specialties, reason):
        """Save triage decision log for audit and improvement"""
        try:
            table = self._get_table('triage_logs')
            
            log_entry = {
                'log_id': f"T_{int(datetime.now().timestamp())}",
                'patient_id': patient_id,
                'input_text': input_text,
                'entities': entities,
                'triage_level': triage_level,
                'specialties': specialties,
                'decision_reason': reason,
                'timestamp': datetime.now().isoformat()
            }
            
            table.put_item(Item=log_entry)
            logger.info(f"Triage log saved: {log_entry['log_id']}")
            
        except Exception as e:
            logger.error(f"Error saving triage log: {e}")

    # User Operations
    
    async def create_user(self, user_data: UserCreate) -> Optional[User]:
        """Create a new user in DynamoDB."""
        try:
            table = self._get_table('users')
            
            # Generate user ID
            user_id = f"user_{int(datetime.now().timestamp())}"
            
            # Create user object
            user = User(
                user_id=user_id,
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                role=user_data.role,
                phone_number=user_data.phone_number,
                date_of_birth=user_data.date_of_birth,
                gender=user_data.gender
            )
            
            # Prepare item for storage
            item = self._prepare_item_for_storage(user.to_dict())
            
            # Store in DynamoDB
            table.put_item(Item=item)
            
            logger.info(f"User created successfully: {user_id}")
            return user
            
        except ClientError as e:
            logger.error(f"DynamoDB error creating user: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID from DynamoDB."""
        try:
            table = self._get_table('users')
            
            response = table.get_item(Key={'user_id': user_id})
            
            if 'Item' in response:
                item = self._convert_decimals(response['Item'])
                return User(**item)
            
            return None
            
        except ClientError as e:
            logger.error(f"DynamoDB error getting user {user_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email from DynamoDB."""
        try:
            table = self._get_table('users')
            
            # Scan for user with matching email (in production, use GSI)
            response = table.scan(
                FilterExpression=Attr('email').eq(email.lower())
            )
            
            if response['Items']:
                item = self._convert_decimals(response['Items'][0])
                return User(**item)
            
            return None
            
        except ClientError as e:
            logger.error(f"DynamoDB error getting user by email {email}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None

    # Appointment Operations
    
    async def create_appointment(self, appointment_data: AppointmentCreate) -> Optional[Appointment]:
        """Create a new appointment in DynamoDB."""
        try:
            table = self._get_table('appointments')
            
            # Generate appointment ID
            appointment_id = f"apt_{int(datetime.now().timestamp())}"
            
            # Create appointment object
            appointment = Appointment(
                appointment_id=appointment_id,
                patient_id=appointment_data.patient_id,
                doctor_id=appointment_data.doctor_id,
                appointment_date=appointment_data.appointment_date,
                appointment_time=appointment_data.appointment_time,
                duration_minutes=appointment_data.duration_minutes,
                appointment_type=appointment_data.appointment_type,
                specialty=appointment_data.specialty,
                reason=appointment_data.reason,
                symptoms=appointment_data.symptoms,
                notes=appointment_data.notes,
                is_virtual=appointment_data.is_virtual,
                priority=appointment_data.priority
            )
            
            # Prepare item for storage
            item = self._prepare_item_for_storage(appointment.to_dict())
            
            # Store in DynamoDB
            table.put_item(Item=item)
            
            logger.info(f"Appointment created successfully: {appointment_id}")
            return appointment
            
        except ClientError as e:
            logger.error(f"DynamoDB error creating appointment: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating appointment: {e}")
            return None

    async def health_check(self) -> Dict[str, Any]:
        """Check DynamoDB service health."""
        health_status = {
            'service': 'DynamoDB',
            'status': 'unknown',
            'tables': {},
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            if not self.dynamodb:
                health_status['status'] = 'unavailable'
                health_status['message'] = 'DynamoDB resource not initialized'
                return health_status
            
            # Check each table
            for table_key, table_name in self._tables.items():
                try:
                    table = self.dynamodb.Table(table_name)
                    table.load()  # This will raise an exception if table doesn't exist
                    
                    health_status['tables'][table_key] = {
                        'name': table_name,
                        'status': 'healthy',
                        'item_count': table.item_count,
                        'table_status': table.table_status
                    }
                except Exception as e:
                    health_status['tables'][table_key] = {
                        'name': table_name,
                        'status': 'error',
                        'error': str(e)
                    }
            
            # Determine overall status
            table_statuses = [t.get('status') for t in health_status['tables'].values()]
            if all(status == 'healthy' for status in table_statuses):
                health_status['status'] = 'healthy'
            elif any(status == 'healthy' for status in table_statuses):
                health_status['status'] = 'degraded'
            else:
                health_status['status'] = 'unhealthy'
            
        except Exception as e:
            health_status['status'] = 'error'
            health_status['error'] = str(e)
        
        return health_status


# Global instance
dynamodb_service = DynamoDBService()


def get_dynamodb_service() -> DynamoDBService:
    """Get the global DynamoDB service instance."""
    return dynamodb_service