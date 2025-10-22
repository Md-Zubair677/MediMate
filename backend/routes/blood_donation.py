from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import json
import uuid
from datetime import datetime, timedelta
import boto3
import os

router = APIRouter(prefix="/api/blood-donation", tags=["blood-donation"])

class DonorData(BaseModel):
    fullName: str
    gender: str
    age: int
    email: str
    phone: str
    location: str
    eligibilityScore: int
    quizAnswers: Dict[str, str]

class NotificationData(BaseModel):
    email: str
    phone: str
    message: str

# Database models
donors_db = []
hospitals_db = [
    {
        "hospital_id": "h001",
        "name": "City General Hospital",
        "address": "123 Main St, Downtown, City 12345",
        "contact": "+1-555-0101",
        "email": "bloodbank@citygeneral.com",
        "coordinates": {"lat": 40.7128, "lng": -74.0060},
        "assigned_donors": []
    },
    {
        "hospital_id": "h002", 
        "name": "Regional Medical Center",
        "address": "456 Health Ave, Uptown, City 12346",
        "contact": "+1-555-0102",
        "email": "donations@regional.com",
        "coordinates": {"lat": 40.7589, "lng": -73.9851},
        "assigned_donors": []
    },
    {
        "hospital_id": "h003",
        "name": "Community Blood Bank",
        "address": "789 Care Blvd, Midtown, City 12347", 
        "contact": "+1-555-0103",
        "email": "help@communityblood.org",
        "coordinates": {"lat": 40.7505, "lng": -73.9934},
        "assigned_donors": []
    }
]

def find_nearest_hospital(donor_location: str):
    """Find nearest hospital based on donor location"""
    # For demo, return first hospital. In production, use GPS distance calculation
    return hospitals_db[0]

def calculate_pickup_time():
    """Calculate pickup time (next business day, 10 AM)"""
    tomorrow = datetime.now() + timedelta(days=1)
    pickup_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
    return pickup_time.strftime("%Y-%m-%d %H:%M")

async def send_aws_sns_notification(phone: str, email: str, donor_name: str, hospital_name: str, pickup_time: str):
    """Send SMS and Email via AWS SNS"""
    try:
        # Initialize SNS client
        sns_client = boto3.client('sns', region_name='us-east-1')
        
        # SNS Topic ARN
        topic_arn = "arn:aws:sns:us-east-1:676206948283:medimate-blood-donation-notifications"
        
        # SMS Message
        sms_message = f"Hi {donor_name}, you are eligible to donate blood! {hospital_name} team will visit your location at {pickup_time}. Thank you for saving lives! - MediMate"
        
        # Email Message
        email_subject = "Blood Donation Confirmation – MediMate"
        email_body = f"""Hello {donor_name},

Congratulations! You are eligible to donate blood.

Nearest Hospital: {hospital_name}
Scheduled Pickup: {pickup_time}
Hospital Address: {hospital_name} - Contact for details

Our hospital team will visit your location at the scheduled time. Please be ready and stay hydrated.

Thank you for saving lives!

Regards,
MediMate Team"""

        # Publish to SNS topic with message attributes
        try:
            response = sns_client.publish(
                TopicArn=topic_arn,
                Subject=email_subject,
                Message=email_body,
                MessageAttributes={
                    'donor_name': {
                        'DataType': 'String',
                        'StringValue': donor_name
                    },
                    'hospital_name': {
                        'DataType': 'String',
                        'StringValue': hospital_name
                    },
                    'pickup_time': {
                        'DataType': 'String',
                        'StringValue': pickup_time
                    },
                    'notification_type': {
                        'DataType': 'String',
                        'StringValue': 'blood_donation_confirmation'
                    }
                }
            )
            print(f"📧 SNS notification sent! MessageId: {response['MessageId']}")
            
            # Also try direct SMS if phone number is provided
            if phone.startswith('+'):
                sms_response = sns_client.publish(
                    PhoneNumber=phone,
                    Message=sms_message
                )
                print(f"📱 SMS sent to {phone}! MessageId: {sms_response['MessageId']}")
            
        except Exception as e:
            print(f"SNS notification failed: {e}")
            # Fallback to console logging
            print(f"📧 Email to {email}: {email_subject}")
            print(f"📱 SMS to {phone}: {sms_message}")
            
        return True
        
    except Exception as e:
        print(f"AWS SNS Error: {e}")
        return False

@router.post("/process-eligible")
async def process_eligible_donor(donor_data: DonorData):
    """Process eligible donor - assign hospital and schedule pickup"""
    try:
        # Generate donor ID
        donor_id = f"DN{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:4].upper()}"
        
        # Find nearest hospital
        nearest_hospital = find_nearest_hospital(donor_data.location)
        
        # Calculate pickup time
        pickup_time = calculate_pickup_time()
        
        # Create donor record
        donor_record = {
            "donor_id": donor_id,
            "name": donor_data.fullName,
            "gender": donor_data.gender,
            "age": donor_data.age,
            "email": donor_data.email,
            "phone": donor_data.phone,
            "location": donor_data.location,
            "eligibility_status": "Eligible",
            "assigned_hospital": nearest_hospital["name"],
            "hospital_id": nearest_hospital["hospital_id"],
            "pickup_time": pickup_time,
            "donation_status": "Pending",
            "eligibility_score": donor_data.eligibilityScore,
            "quiz_answers": donor_data.quizAnswers,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add to database
        donors_db.append(donor_record)
        
        # Add donor to hospital's assigned list
        for hospital in hospitals_db:
            if hospital["hospital_id"] == nearest_hospital["hospital_id"]:
                hospital["assigned_donors"].append(donor_id)
                break
        
        # Send AWS SNS notifications
        await send_aws_sns_notification(
            donor_data.phone,
            donor_data.email,
            donor_data.fullName,
            nearest_hospital["name"],
            pickup_time
        )
        
        return {
            "success": True,
            "donorId": donor_id,
            "hospital": nearest_hospital,
            "pickupTime": pickup_time,
            "message": "Donor processed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process donor: {str(e)}")

@router.get("/donor/{donor_id}")
async def get_donor_details(donor_id: str):
    """Get donor details by ID"""
    try:
        donor = next((d for d in donors_db if d["donor_id"] == donor_id), None)
        if not donor:
            raise HTTPException(status_code=404, detail="Donor not found")
        
        return {"donor": donor}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get donor: {str(e)}")

@router.put("/donor/{donor_id}/status")
async def update_donation_status(donor_id: str, status: str):
    """Update donation status (for hospital staff)"""
    try:
        donor = next((d for d in donors_db if d["donor_id"] == donor_id), None)
        if not donor:
            raise HTTPException(status_code=404, detail="Donor not found")
        
        donor["donation_status"] = status
        donor["updated_at"] = datetime.now().isoformat()
        
        # If completed, send thank you notification
        if status == "Completed":
            await send_aws_sns_notification(
                donor["phone"],
                donor["email"],
                donor["name"],
                donor["assigned_hospital"],
                "Thank you for your blood donation! Your contribution will help save lives."
            )
        
        return {"success": True, "message": f"Status updated to {status}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

@router.get("/hospitals")
async def get_hospitals():
    """Get all hospitals with assigned donors"""
    try:
        return {"hospitals": hospitals_db}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get hospitals: {str(e)}")

@router.get("/hospital/{hospital_id}/donors")
async def get_hospital_donors(hospital_id: str):
    """Get donors assigned to a hospital"""
    try:
        hospital = next((h for h in hospitals_db if h["hospital_id"] == hospital_id), None)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        assigned_donors = [d for d in donors_db if d["hospital_id"] == hospital_id]
        
        return {
            "hospital": hospital,
            "donors": assigned_donors,
            "total_donors": len(assigned_donors)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get hospital donors: {str(e)}")

@router.post("/notify-hospital")
async def notify_hospital(donor_data: DonorData):
    """Legacy endpoint - redirect to process-eligible"""
    return await process_eligible_donor(donor_data)

@router.post("/notifications/send")
async def send_notification(notification_data: NotificationData):
    """Send custom notification"""
    try:
        await send_aws_sns_notification(
            notification_data.phone,
            notification_data.email,
            "User",
            "MediMate",
            notification_data.message
        )
        
        return {"success": True, "message": "Notification sent"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")
