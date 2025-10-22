"""
Medical report model for MediMate platform with document analysis and AI insights.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from enum import Enum


class ReportType(str, Enum):
    """Medical report type enumeration."""
    LAB_RESULTS = "lab_results"
    IMAGING = "imaging"
    PATHOLOGY = "pathology"
    CONSULTATION_NOTES = "consultation_notes"
    DISCHARGE_SUMMARY = "discharge_summary"
    PRESCRIPTION = "prescription"
    VACCINATION_RECORD = "vaccination_record"
    INSURANCE_CLAIM = "insurance_claim"
    REFERRAL = "referral"
    OTHER = "other"


class DocumentFormat(str, Enum):
    """Supported document formats."""
    PDF = "pdf"
    JPG = "jpg"
    JPEG = "jpeg"
    PNG = "png"
    TIFF = "tiff"
    DOC = "doc"
    DOCX = "docx"


class ProcessingStatus(str, Enum):
    """Document processing status."""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING_REVIEW = "pending_review"


class ConfidenceLevel(str, Enum):
    """AI analysis confidence levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class MedicalEntity(BaseModel):
    """Medical entity extracted from documents."""
    entity_type: str = Field(..., description="Type of medical entity")
    entity_text: str = Field(..., description="Extracted text")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence score")
    start_offset: Optional[int] = Field(None, description="Start position in text")
    end_offset: Optional[int] = Field(None, description="End position in text")
    category: Optional[str] = Field(None, description="Entity category")
    traits: List[Dict[str, Any]] = Field(default_factory=list, description="Entity traits")
    attributes: List[Dict[str, Any]] = Field(default_factory=list, description="Entity attributes")


class LabValue(BaseModel):
    """Laboratory test value with reference ranges."""
    test_name: str = Field(..., description="Name of the test")
    value: Union[str, float, int] = Field(..., description="Test result value")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    reference_range: Optional[str] = Field(None, description="Normal reference range")
    status: Optional[str] = Field(None, description="Result status (normal, high, low, critical)")
    flag: Optional[str] = Field(None, description="Result flag")
    notes: Optional[str] = Field(None, description="Additional notes")


class Medication(BaseModel):
    """Medication information extracted from reports."""
    medication_name: str = Field(..., description="Name of medication")
    dosage: Optional[str] = Field(None, description="Dosage information")
    frequency: Optional[str] = Field(None, description="Frequency of administration")
    route: Optional[str] = Field(None, description="Route of administration")
    duration: Optional[str] = Field(None, description="Duration of treatment")
    instructions: Optional[str] = Field(None, description="Special instructions")


class Diagnosis(BaseModel):
    """Diagnosis information from medical reports."""
    diagnosis_code: Optional[str] = Field(None, description="ICD-10 or other diagnosis code")
    diagnosis_name: str = Field(..., description="Diagnosis description")
    confidence: Optional[ConfidenceLevel] = Field(None, description="AI confidence in diagnosis")
    severity: Optional[str] = Field(None, description="Severity level")
    status: Optional[str] = Field(None, description="Status (primary, secondary, rule-out)")


class RiskAssessment(BaseModel):
    """AI-generated risk assessment."""
    overall_risk: str = Field(..., description="Overall risk level")
    risk_factors: List[str] = Field(default_factory=list, description="Identified risk factors")
    recommendations: List[str] = Field(default_factory=list, description="AI recommendations")
    follow_up_needed: bool = Field(default=False, description="Whether follow-up is recommended")
    urgency_level: str = Field(default="routine", description="Urgency level")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence in assessment")


class DocumentMetadata(BaseModel):
    """Metadata about the uploaded document."""
    original_filename: str = Field(..., description="Original file name")
    file_size_bytes: int = Field(..., ge=0, description="File size in bytes")
    file_format: DocumentFormat = Field(..., description="Document format")
    mime_type: str = Field(..., description="MIME type")
    upload_timestamp: datetime = Field(default_factory=lambda: datetime.now(), description="Upload time")
    checksum: Optional[str] = Field(None, description="File checksum for integrity")
    page_count: Optional[int] = Field(None, ge=1, description="Number of pages")
    language: Optional[str] = Field(None, description="Detected language")
    
    @validator('file_size_bytes', pre=True)
    def validate_file_size(cls, v):
        """Validate file size is within limits."""
        max_size = 50 * 1024 * 1024  # 50MB
        if v > max_size:
            raise ValueError(f'File size exceeds maximum limit of {max_size} bytes')
        return v


class ProcessingMetrics(BaseModel):
    """Metrics about document processing."""
    processing_start_time: datetime = Field(default_factory=lambda: datetime.now())
    processing_end_time: Optional[datetime] = Field(None)
    textract_processing_time: Optional[float] = Field(None, description="Textract processing time in seconds")
    ai_analysis_time: Optional[float] = Field(None, description="AI analysis time in seconds")
    total_processing_time: Optional[float] = Field(None, description="Total processing time in seconds")
    text_extraction_confidence: Optional[float] = Field(None, ge=0, le=1)
    ai_analysis_confidence: Optional[float] = Field(None, ge=0, le=1)
    
    @property
    def processing_duration(self) -> Optional[float]:
        """Calculate processing duration in seconds."""
        if self.processing_end_time:
            return (self.processing_end_time - self.processing_start_time).total_seconds()
        return None


class MedicalReport(BaseModel):
    """Main medical report model for MediMate platform."""
    
    # Core identification
    report_id: str = Field(..., description="Unique report identifier")
    patient_id: str = Field(..., description="Patient user ID")
    uploaded_by: str = Field(..., description="User who uploaded the report")
    
    # Document information
    document_metadata: DocumentMetadata = Field(..., description="Document metadata")
    report_type: ReportType = Field(..., description="Type of medical report")
    report_date: Optional[date] = Field(None, description="Date of the medical report")
    
    # Processing information
    processing_status: ProcessingStatus = Field(default=ProcessingStatus.UPLOADED)
    processing_metrics: Optional[ProcessingMetrics] = Field(None)
    
    # Extracted content
    extracted_text: Optional[str] = Field(None, description="Raw extracted text")
    structured_data: Dict[str, Any] = Field(default_factory=dict, description="Structured extracted data")
    
    # AI Analysis results
    ai_analysis: Optional[str] = Field(None, description="AI-generated analysis")
    ai_summary: Optional[str] = Field(None, description="AI-generated summary")
    
    # Medical entities and insights
    medical_entities: List[MedicalEntity] = Field(default_factory=list)
    lab_values: List[LabValue] = Field(default_factory=list)
    medications: List[Medication] = Field(default_factory=list)
    diagnoses: List[Diagnosis] = Field(default_factory=list)
    
    # Risk assessment
    risk_assessment: Optional[RiskAssessment] = Field(None)
    
    # Clinical context
    healthcare_provider: Optional[str] = Field(None, description="Healthcare provider name")
    facility_name: Optional[str] = Field(None, description="Medical facility name")
    ordering_physician: Optional[str] = Field(None, description="Ordering physician")
    
    # System metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
    
    # Privacy and sharing
    is_sensitive: bool = Field(default=True, description="Whether report contains sensitive information")
    sharing_permissions: Dict[str, bool] = Field(
        default_factory=lambda: {
            "share_with_doctors": False,
            "include_in_summary": False,
            "allow_ai_analysis": True
        }
    )
    
    # Quality and validation
    validation_status: Optional[str] = Field(None, description="Manual validation status")
    validated_by: Optional[str] = Field(None, description="Who validated the report")
    validation_notes: Optional[str] = Field(None, description="Validation notes")
    
    # Error handling
    processing_errors: List[str] = Field(default_factory=list, description="Processing errors")
    warnings: List[str] = Field(default_factory=list, description="Processing warnings")
    
    # Additional metadata
    tags: List[str] = Field(default_factory=list, description="Report tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('report_date')
    def validate_report_date(cls, v):
        """Validate report date is not in the future."""
        if v and v > date.today():
            raise ValueError('Report date cannot be in the future')
        return v
    

    
    def update_timestamp(self):
        """Update the last modified timestamp."""
        self.updated_at = datetime.now()
    
    def start_processing(self):
        """Mark report as processing."""
        self.processing_status = ProcessingStatus.PROCESSING
        if not self.processing_metrics:
            self.processing_metrics = ProcessingMetrics()
        self.update_timestamp()
    
    def complete_processing(self, success: bool = True):
        """Mark processing as completed."""
        if success:
            self.processing_status = ProcessingStatus.COMPLETED
        else:
            self.processing_status = ProcessingStatus.FAILED
        
        if self.processing_metrics:
            self.processing_metrics.processing_end_time = datetime.now()
        
        self.update_timestamp()
    
    def add_medical_entity(self, entity: MedicalEntity):
        """Add a medical entity to the report."""
        self.medical_entities.append(entity)
        self.update_timestamp()
    
    def add_lab_value(self, lab_value: LabValue):
        """Add a lab value to the report."""
        self.lab_values.append(lab_value)
        self.update_timestamp()
    
    def add_error(self, error_message: str):
        """Add a processing error."""
        self.processing_errors.append(error_message)
        self.update_timestamp()
    
    def add_warning(self, warning_message: str):
        """Add a processing warning."""
        self.warnings.append(warning_message)
        self.update_timestamp()
    
    @property
    def has_errors(self) -> bool:
        """Check if report has processing errors."""
        return len(self.processing_errors) > 0
    
    @property
    def has_warnings(self) -> bool:
        """Check if report has processing warnings."""
        return len(self.warnings) > 0
    
    @property
    def is_processed(self) -> bool:
        """Check if report has been processed."""
        return self.processing_status in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]
    
    @property
    def processing_time(self) -> Optional[float]:
        """Get total processing time in seconds."""
        if self.processing_metrics:
            return self.processing_metrics.processing_duration
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert report model to dictionary for DynamoDB storage."""
        return self.dict(exclude_none=True, by_alias=True)
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True
        validate_assignment = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class DocumentAnalysisRequest(BaseModel):
    """Request model for document analysis."""
    patient_id: str = Field(default="demo", description="Patient identifier")
    report_type: ReportType = Field(default=ReportType.OTHER)
    report_date: Optional[date] = None
    healthcare_provider: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class DocumentAnalysisResponse(BaseModel):
    """Response model for document analysis."""
    report_id: str
    extracted_text: str
    analysis: str
    medical_entities: List[Dict[str, Any]] = Field(default_factory=list)
    risk_assessment: Dict[str, Any] = Field(default_factory=dict)
    processing_time: Optional[float] = None
    success: bool = Field(default=True)
    message: str = Field(default="Document analysis completed successfully")


class ReportSummary(BaseModel):
    """Summary model for report listings."""
    report_id: str
    report_type: ReportType
    report_date: Optional[date]
    created_at: datetime
    processing_status: ProcessingStatus
    has_errors: bool
    ai_summary: Optional[str] = None