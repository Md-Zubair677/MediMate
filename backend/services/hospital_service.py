import math
from typing import List, Optional
from ..models.hospital import Hospital, HospitalType, HospitalWithDistance, LocationRequest

class HospitalService:
    def __init__(self):
        self.hospitals = self._initialize_hospitals()
        self.doctor_hospital_mapping = self._create_doctor_hospital_mapping()
    
    def _initialize_hospitals(self) -> List[Hospital]:
        """Initialize sample hospitals with realistic data"""
        return [
            Hospital(
                id="hosp_001",
                name="MediMate General Hospital",
                type=HospitalType.GENERAL,
                address="123 Healthcare Blvd",
                city="New York",
                state="NY",
                zip_code="10001",
                latitude=40.7589,
                longitude=-73.9851,
                phone="(555) 123-4567",
                rating=4.8,
                specialties=["Cardiology", "Neurology", "Emergency Medicine", "Internal Medicine"],
                doctor_ids=["doc_001", "doc_002", "doc_010", "doc_015"]
            ),
            Hospital(
                id="hosp_002", 
                name="St. Mary's Medical Center",
                type=HospitalType.TEACHING,
                address="456 Medical Ave",
                city="Los Angeles",
                state="CA", 
                zip_code="90210",
                latitude=34.0522,
                longitude=-118.2437,
                phone="(555) 234-5678",
                rating=4.6,
                specialties=["Oncology", "Pediatrics", "Surgery", "Radiology"],
                doctor_ids=["doc_003", "doc_004", "doc_011", "doc_016"]
            ),
            Hospital(
                id="hosp_003",
                name="Chicago Heart Institute",
                type=HospitalType.SPECIALTY,
                address="789 Cardiac Way",
                city="Chicago",
                state="IL",
                zip_code="60601",
                latitude=41.8781,
                longitude=-87.6298,
                phone="(555) 345-6789",
                rating=4.9,
                specialties=["Cardiology", "Cardiovascular Surgery", "Interventional Cardiology"],
                doctor_ids=["doc_001", "doc_005", "doc_012"]
            ),
            Hospital(
                id="hosp_004",
                name="Miami Beach Emergency Center",
                type=HospitalType.EMERGENCY,
                address="321 Ocean Drive",
                city="Miami",
                state="FL",
                zip_code="33139",
                latitude=25.7617,
                longitude=-80.1918,
                phone="(555) 456-7890",
                rating=4.4,
                specialties=["Emergency Medicine", "Trauma Surgery", "Critical Care"],
                doctor_ids=["doc_006", "doc_013", "doc_017"]
            ),
            Hospital(
                id="hosp_005",
                name="Seattle Children's Hospital",
                type=HospitalType.SPECIALTY,
                address="654 Kids Lane",
                city="Seattle",
                state="WA",
                zip_code="98101",
                latitude=47.6062,
                longitude=-122.3321,
                phone="(555) 567-8901",
                rating=4.7,
                specialties=["Pediatrics", "Pediatric Surgery", "Neonatology"],
                doctor_ids=["doc_007", "doc_014", "doc_018"]
            ),
            Hospital(
                id="hosp_006",
                name="Boston Medical Center",
                type=HospitalType.GENERAL,
                address="987 Commonwealth Ave",
                city="Boston",
                state="MA",
                zip_code="02215",
                latitude=42.3601,
                longitude=-71.0589,
                phone="(555) 678-9012",
                rating=4.5,
                specialties=["Neurology", "Orthopedics", "Dermatology", "Psychiatry"],
                doctor_ids=["doc_008", "doc_009", "doc_019", "doc_020"]
            )
        ]
    
    def _create_doctor_hospital_mapping(self) -> dict:
        """Create mapping of doctors to their hospitals"""
        mapping = {}
        for hospital in self.hospitals:
            for doctor_id in hospital.doctor_ids:
                mapping.setdefault(doctor_id, []).append(hospital.id)
        return mapping
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    async def find_nearest_hospitals(self, location: LocationRequest) -> List[HospitalWithDistance]:
        """Find hospitals near patient location"""
        hospitals_with_distance = []
        
        for hospital in self.hospitals:
            distance = self.calculate_distance(
                location.latitude, location.longitude,
                hospital.latitude, hospital.longitude
            )
            
            if distance <= location.max_distance_km:
                hospitals_with_distance.append(HospitalWithDistance(
                    hospital=hospital,
                    distance_km=round(distance, 2),
                    available_doctors=hospital.doctor_ids
                ))
        
        # Sort by distance
        hospitals_with_distance.sort(key=lambda x: x.distance_km)
        return hospitals_with_distance
    
    async def get_hospital_by_doctor(self, doctor_id: str) -> Optional[Hospital]:
        """Get hospital where doctor works"""
        hospital_ids = self.doctor_hospital_mapping.get(doctor_id, [])
        if hospital_ids:
            # Return first hospital if doctor works at multiple
            hospital_id = hospital_ids[0] if isinstance(hospital_ids, list) else hospital_ids
            return next((h for h in self.hospitals if h.id == hospital_id), None)
        return None
    
    async def get_doctors_by_hospital(self, hospital_id: str) -> List[str]:
        """Get all doctors working at a hospital"""
        hospital = next((h for h in self.hospitals if h.id == hospital_id), None)
        return hospital.doctor_ids if hospital else []

# Global service instance
hospital_service = HospitalService()