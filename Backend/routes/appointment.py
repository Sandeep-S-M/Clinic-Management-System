from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.appointment import Appointment
from model.patient_input import PatientInput
from schemas.patient_input import PatientInput as PatientSchema
from dependencies.db import get_db
from dependencies.auth import require_role
from model.user import User
from datetime import datetime
from model.doctor_input import DoctorInput
from utils.email import send_email
import threading
from pydantic import BaseModel

class PrescriptionRequest(BaseModel):
    notes: str

router = APIRouter()

MAX_TOKENS = 10


@router.post("/book")
def book_appointment(data: PatientSchema, doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("patient"))):

    try:
        parsed_date = datetime.strptime(data.appointment_date, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Please use YYYY-MM-DD"}

    valid_doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not valid_doctor:
        # Fallback to finding any doctor in the database
        valid_doctor = db.query(User).filter(User.role == "doctor").first()
        if not valid_doctor:
            return {"error": "Doctor not found in the database. Token not available."}
        doctor_id = valid_doctor.id

    patient = PatientInput(
        patient_name=data.patient_name,
        disease_name=data.disease_name,
        duration=data.duration,
        symptoms=data.symptoms,
        previous_treatment=f"{data.previous_treatment or ''}[EMAIL:{current_user.email}]",
        appointment_date=parsed_date
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    # 2. Token logic check
    count = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == parsed_date
    ).count()

    if count >= MAX_TOKENS:
        return {"error": "No slots available"}

    # Return patient_id to proceed to payment
    return {
        "message": "Patient info saved, proceed to payment",
        "patient_input_id": patient.id,
        "token": count + 1
    }
@router.get("/doctor-appointments/me")
def get_doctor_appointments(db: Session = Depends(get_db), current_user: User = Depends(require_role("doctor"))):

    data = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id
    ).all()

    result = []

    for appt in data:
        patient = db.query(PatientInput).filter(
            PatientInput.id == appt.patient_input_id
        ).first()

        result.append({
            "appointment_id": appt.id,
            "patient_id": patient.id,
            "token": appt.token_number,
            "patient_name": patient.patient_name if patient else "Unknown",
            "disease": patient.disease_name if patient else "N/A",
            "symptoms": patient.symptoms if patient else "N/A",
            "status": appt.status,
            "ai_response": getattr(appt, 'ai_response', None) # If model has ai_response
        })

    return result
@router.put("/appointments/{appointment_id}/status")
def update_status(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("doctor"))):

    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appt:
        return {"error": "Appointment not found"}

    # toggle logic
    appt.status = "treated" if appt.status != "treated" else "pending"

    db.commit()

    return {"status": appt.status}

@router.post("/appointments/{appointment_id}/send-prescription")
def send_prescription(appointment_id: int, req: PrescriptionRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role("doctor"))):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.doctor_id == current_user.id).first()
    if not appt:
        return {"error": "Appointment not found"}
        
    patient = db.query(PatientInput).filter(PatientInput.id == appt.patient_input_id).first()
    doctor = db.query(DoctorInput).filter(DoctorInput.doctor_id == current_user.id).first()
    
    # Extract email from previous_treatment hack
    patient_email = "testuser@gmail.com" # fallback
    if patient and patient.previous_treatment and "[EMAIL:" in patient.previous_treatment:
        patient_email = patient.previous_treatment.split("[EMAIL:")[1].split("]")[0]
    
    # Send email asynchronously
    clinic_name = "City Care Clinic"
    doctor_name = doctor.name if doctor else "Doctor"
    
    email_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #28a745;">Treatment Completed</h2>
        <p>We are happy to treat you! You will get better soon, be happy & smile 😊</p>
        <hr/>
        <h3>Treatment Details:</h3>
        <p><strong>Doctor Name:</strong> {doctor_name}</p>
        <p><strong>Clinic Name:</strong> {clinic_name}</p>
        <p><strong>Contact:</strong> +91-9876543210</p>
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 15px;">
            <h4>Prescription / Notes:</h4>
            <p style="white-space: pre-wrap;">{req.notes}</p>
        </div>
    </div>
    """
    
    threading.Thread(target=send_email, args=(
        patient_email,
        "Your Treatment Prescription",
        email_content
    )).start()
    
    return {"message": f"Prescription sent to {patient_email}"}