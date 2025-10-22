"""
Medical document and analysis models for MediMate Healthcare Platform.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    """Medical document types."""
    LAB_REPORT = "lab_report"
    RADIOLOGY = "radiology"
    PRESCRIPTION = "prescription"
    DISCHARGE_SUMMARY = "discharge_summary"
    CONSULTATION_NOTE = "consultation_note"
    PATHOLOGY = "pathology"
    CARDIOLOGY = "cardiology"
    OTHER = "other"

class RiskLevel(str, Enum):
    """Risk assessment levels."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class EntityType(str, Enum):
    """Medical entity types from AWS Comprehend Medical."""
    MEDICATION = "MEDICATION"
    CONDITION = "CONDITION"
    ANATOMY = "ANATOMY"
    TEST_TREATMENT_PROCEDURE = "TEST_TREATMENT_PROCEDURE"
    PROTECTED_HEALTH_INFORMATION = "PROTECTED_HEALTH_INFORMATION"

class DocumentAnalysisRequest(BaseModel):
    """Medical document analysis request model."""
    patient_id: str = Field(..., description="Patient's unique identifier")
    document_type: DocumentType = Field(DocumentType.LAB_REPORT, description="Type of medical document")
    filename: Optional[str] = Field(None, description="Original filename")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional document metadata")

class MedicalEntity(BaseModel):
    """Medical entity extracted from document."""
    text: str = Field(..., description="Entity text")
    type: EntityType = Field(..., description="Entity type")
    category: Optional[str] = Field(None, description="Entity category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    begin_offset: Optional[int] = Field(None, description="Start position in text")
    end_offset: Optional[int] = Field(None, description="End position in text")
    attributes: Optional[List[Dict[str, Any]]] = Field(None, description="Entity attributes")
    traits: Optional[List[Dict[str, Any]]] = Field(None, description="Entity traits")

class LabValue(BaseModel):
    """Laboratory test value."""
    test_name: str = Field(..., description="Name of the test")
    value: Union[str, float, int] = Field(..., description="Test value")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    reference_range: Optional[str] = Field(None, description="Normal reference range")
    status: Optional[str] = Field(None, description="Result status (normal, high, low, critical)")
    flag: Optional[str] = Field(None, description="Result flag")

class RiskAssessment(BaseModel):
    """Health risk assessment model."""
    overall_risk: RiskLevel = Field(..., description="Overall risk level")
    risk_factors: List[str] = Field(default_factory=list, description="Identified risk factors")
    recommendations: List[str] = Field(default_factory=list, description="Risk mitigation recommendations")
    follow_up_needed: bool = Field(False, description="Whether follow-up is needed")
    urgency: Optional[str] = Field(None, description="Urgency level")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Assessment confidence")

class DocumentAnalysisResponse(BaseModel):
    """Medical document analysis response model."""
    success: bool = Field(True, description="Analysis success status")
    report_id: str = Field(..., description="Unique report identifier")
    extracted_text: str = Field(..., description="Text extracted from the document")
    analysis: str = Field(..., description="AI analysis of the medical document")
    medical_entities: List[MedicalEntity] = Field(default_factory=list, description="Extracted medical entities")
    lab_values: Optional[List[LabValue]] = Field(None, description="Extracted lab values")
    risk_assessment: Optional[RiskAssessment] = Field(None, description="Health risk assessment")
    key_findings: List[str] = Field(default_factory=list, description="Key medical findings")
    recommendations: List[str] = Field(default_factory=list, description="Medical recommendations")
    processed_at: datetime = Field(default_factory=lambda: datetime.now(), description="Processing timestamp")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")

class MedicalReport(BaseModel):
    """Complete medical report model."""
    report_id: str = Field(..., description="Unique report identifier")
    patient_id: str = Field(..., description="Patient identifier")
    document_type: DocumentType = Field(..., description="Type of document")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    upload_date: datetime = Field(default_factory=lambda: datetime.now(), description="Upload timestamp")
    analysis_results: Optional[DocumentAnalysisResponse] = Field(None, description="Analysis results")
    status: str = Field("uploaded", description="Processing status")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class ReportSummary(BaseModel):
    """Summary of patient's medical reports."""
    patient_id: str = Field(..., description="Patient identifier")
    total_reports: int = Field(0, description="Total number of reports")
    recent_reports: List[Dict[str, Any]] = Field(default_factory=list, description="Recent reports")
    report_types: Dict[str, int] = Field(default_factory=dict, description="Count by report type")
    last_upload: Optional[datetime] = Field(None, description="Last upload timestamp")

class MedicalInsight(BaseModel):
    """Medical insight from AI analysis."""
    insight_type: str = Field(..., description="Type of insight")
    description: str = Field(..., description="Insight description")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level")
    supporting_evidence: List[str] = Field(default_factory=list, description="Supporting evidence")
    clinical_significance: Optional[str] = Field(None, description="Clinical significance")
    recommended_action: Optional[str] = Field(None, description="Recommended action")

class HealthPrediction(BaseModel):
    """Health prediction model from ML analysis."""
    risk_level: RiskLevel = Field(..., description="Predicted risk level")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    risk_factors: List[str] = Field(default_factory=list, description="Contributing risk factors")
    predicted_conditions: List[str] = Field(default_factory=list, description="Potential conditions")
    time_horizon_days: int = Field(90, description="Prediction time horizon in days")
    recommendations: List[str] = Field(default_factory=list, description="Preventive recommendations")
    created_at: datetime = Field(default_factory=lambda: datetime.now(), description="Prediction timestamp")

class PersonalizedRecommendation(BaseModel):
    """Personalized health recommendation model."""
    type: str = Field(..., description="Recommendation type (diet, exercise, lifestyle)")
    title: str = Field(..., description="Recommendation title")
    description: str = Field(..., description="Detailed description")
    recommendations: List[str] = Field(..., description="Specific recommendations")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Recommendation confidence")
    duration_days: int = Field(30, description="Recommended duration in days")
    priority: Optional[str] = Field("medium", description="Priority level (low, medium, high)")
    category: Optional[str] = Field(None, description="Recommendation category")
    created_at: datetime = Field(default_factory=lambda: datetime.now(), description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

class MedicationAdherenceRisk(BaseModel):
    """Medication adherence risk assessment."""
    patient_id: str = Field(..., description="Patient identifier")
    adherence_risk: str = Field(..., description="Risk level (low, moderate, high)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Assessment confidence")
    risk_factors: List[str] = Field(default_factory=list, description="Risk factors")
    interventions: List[str] = Field(default_factory=list, description="Recommended interventions")
    follow_up_days: int = Field(30, description="Recommended follow-up period")
    assessment_date: datetime = Field(default_factory=lambda: datetime.now(), description="Assessment date")

class PatientProfile(BaseModel):
    """Comprehensive patient profile for ML models."""
    patient_id: str = Field(..., description="Patient identifier")
    age: int = Field(..., description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")
    weight: Optional[float] = Field(None, description="Weight in kg")
    height: Optional[float] = Field(None, description="Height in cm")
    bmi: Optional[float] = Field(None, description="Body Mass Index")
    medical_conditions: List[str] = Field(default_factory=list, description="Medical conditions")
    medications: List[str] = Field(default_factory=list, description="Current medications")
    allergies: List[str] = Field(default_factory=list, description="Known allergies")
    lifestyle_factors: Dict[str, Any] = Field(default_factory=dict, description="Lifestyle information")
    lab_values: Dict[str, Any] = Field(default_factory=dict, description="Recent lab values")
    fitness_level: Optional[str] = Field(None, description="Fitness level")
    activity_level: Optional[str] = Field(None, description="Activity level")
    dietary_restrictions: List[str] = Field(default_factory=list, description="Dietary restrictions")
    health_goals: List[str] = Field(default_factory=list, description="Health goals")
    last_updated: datetime = Field(default_factory=lambda: datetime.now(), description="Last update timestamp")