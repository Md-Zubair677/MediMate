# MediMate Healthcare Platform - Backend

A comprehensive FastAPI-based backend for the MediMate healthcare AI platform, providing intelligent medical consultation, appointment management, and document analysis services.

## 🚀 Features

### Core Functionality
- **AI Health Consultations** - AWS Bedrock (Claude 3.5 Sonnet) powered health guidance
- **Appointment Management** - Complete booking system with 22+ medical specialties
- **Medical Document Analysis** - AWS Textract + Comprehend Medical integration
- **User Authentication** - AWS Cognito integration with JWT tokens
- **Data Management** - DynamoDB integration with comprehensive CRUD operations

### Technical Features
- **FastAPI Framework** - Modern, fast, and well-documented API
- **Pydantic Models** - Type-safe data validation and serialization
- **AWS Integration** - Comprehensive AWS services integration
- **Service Layer Architecture** - Clean separation of concerns
- **Error Handling** - Robust error handling with fallback mechanisms
- **Development Tools** - Testing, validation, and startup scripts

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment configuration template
├── .env                   # Development environment variables
├── models/                # Pydantic data models
│   ├── __init__.py
│   ├── base.py           # Base models and common types
│   ├── user.py           # User and patient models
│   ├── appointment.py    # Appointment and doctor models
│   ├── medical.py        # Medical document and analysis models
│   └── chat.py           # Chat and consultation models
├── services/              # Business logic services
│   ├── __init__.py
│   ├── dynamodb_service.py    # DynamoDB operations
│   ├── auth_service.py        # Authentication services
│   ├── bedrock_service.py     # AI consultation services
│   └── textract_service.py    # Document processing services
├── test_app.py           # Application testing script
├── start_server.py       # Development server startup
└── README.md             # This file
```

## 🛠 Installation & Setup

### Prerequisites
- Python 3.8+
- AWS Account (optional for demo mode)
- pip or conda for package management

### Installation Steps

1. **Clone and Navigate**
   ```bash
   cd MediMate/backend
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Test Installation**
   ```bash
   python test_app.py
   ```

5. **Start Development Server**
   ```bash
   python start_server.py
   # or
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Application
APP_NAME=MediMate Healthcare Platform API
DEBUG=true
DEMO_MODE=true

# AWS Services
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0

# Database
DYNAMODB_APPOINTMENTS_TABLE=medimate-appointments
DYNAMODB_USERS_TABLE=medimate-users
DYNAMODB_REPORTS_TABLE=medimate-reports

# Security
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=*
```

### Demo Mode

The application includes comprehensive demo mode functionality:
- **Mock AWS Services** - Works without AWS credentials
- **Sample Data** - Pre-configured doctors and mock responses
- **Fallback Mechanisms** - Graceful degradation when services unavailable

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Core Endpoints

#### Health & Status
```
GET  /                    # API welcome message
GET  /health             # Health check with service status
```

#### AI Chat Consultation
```
POST /api/chat           # Health consultation with AI
```

#### Appointment Management
```
GET  /api/doctors        # List available doctors
POST /api/appointments   # Book new appointment
GET  /api/appointments/{patient_id}  # Get patient appointments
```

#### Medical Document Analysis
```
POST /api/reports/analyze  # Upload and analyze medical documents
```

### Request/Response Examples

#### Health Consultation
```json
POST /api/chat
{
  "patient_id": "patient-123",
  "symptoms": "I have a headache and feel tired",
  "medical_history": "No significant medical history",
  "urgency_level": "normal"
}
```

#### Appointment Booking
```json
POST /api/appointments
{
  "patient_id": "patient-123",
  "doctor_id": "doc_0",
  "specialty": "Cardiology",
  "appointment_date": "2024-01-15",
  "appointment_time": "10:00",
  "reason": "Regular checkup"
}
```

## 🏗 Architecture

### Service Layer Pattern
- **Models Layer** - Pydantic models for data validation
- **Services Layer** - Business logic and AWS integrations
- **API Layer** - FastAPI endpoints and request handling

### AWS Integration
- **Bedrock** - AI-powered health consultations
- **DynamoDB** - Data storage and retrieval
- **Textract** - Medical document text extraction
- **Comprehend Medical** - Medical entity extraction
- **Cognito** - User authentication (planned)

### Error Handling
- **Graceful Degradation** - Fallback responses when AWS unavailable
- **Comprehensive Logging** - Detailed error tracking
- **User-Friendly Messages** - Clear error communication

## 🧪 Testing

### Run Application Tests
```bash
python test_app.py
```

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test doctors endpoint
curl http://localhost:8000/api/doctors

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "test", "symptoms": "headache"}'
```

## 🚀 Deployment

### Development
```bash
python start_server.py
```

### Production
```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export DEBUG=false
export DEMO_MODE=false

# Start with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📊 Monitoring

### Health Checks
- Application health: `/health`
- Service status monitoring
- AWS service connectivity checks

### Logging
- Structured logging with Python logging
- Error tracking and debugging
- Performance monitoring

## 🔒 Security

### Authentication
- JWT token-based authentication
- AWS Cognito integration ready
- Secure session management

### Data Protection
- Input validation with Pydantic
- CORS configuration
- Environment-based secrets management

## 🤝 Development

### Code Organization
- **Clean Architecture** - Separation of concerns
- **Type Safety** - Pydantic models throughout
- **Error Handling** - Comprehensive error management
- **Documentation** - Well-documented code and APIs

### Adding New Features
1. Define Pydantic models in `models/`
2. Implement business logic in `services/`
3. Create API endpoints in `main.py`
4. Add tests and documentation

## 📝 API Models

### Key Data Models
- **User** - Patient information and medical history
- **Appointment** - Booking and scheduling data
- **Doctor** - Healthcare provider information
- **ChatMessage** - AI consultation messages
- **MedicalReport** - Document analysis results

## 🎯 Next Steps

### Immediate Priorities
1. **Frontend Integration** - Connect React frontend
2. **Authentication** - Complete Cognito integration
3. **Testing** - Comprehensive test suite
4. **Documentation** - API documentation completion

### Future Enhancements
1. **Real-time Features** - WebSocket support
2. **Advanced Analytics** - ML-powered insights
3. **Notification System** - Email/SMS notifications
4. **Mobile API** - Mobile app support

## 🆘 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   pip install -r requirements.txt
   ```

2. **AWS Credentials**
   - Set `DEMO_MODE=true` for development
   - Configure AWS credentials for production

3. **Port Conflicts**
   - Change `PORT` in `.env`
   - Check for other services on port 8000

4. **Model Validation Errors**
   - Check request format against API docs
   - Validate required fields

### Getting Help
- Check logs for detailed error messages
- Review API documentation at `/docs`
- Verify environment configuration
- Test with demo mode enabled

## 📄 License

MediMate Healthcare Platform - Internal Development Project

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: January 2024