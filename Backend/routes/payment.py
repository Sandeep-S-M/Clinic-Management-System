import razorpay
import os
from dotenv import load_dotenv

load_dotenv()
from fastapi import APIRouter
from model.payment import Payment
from model.appointment import Appointment
from sqlalchemy.orm import Session
from dependencies.db import get_db
from fastapi import Depends
from datetime import datetime
from dependencies.auth import get_current_user
from model.user import User
from sqlalchemy import func
from model.doctor_input import DoctorInput
from model.patient_input import PatientInput
from utils.email import send_email
import threading

router = APIRouter(prefix="/payment")

client = razorpay.Client(auth=(
    os.getenv("RAZORPAY_KEY_ID"),
    os.getenv("RAZORPAY_KEY_SECRET")
))


@router.post("/create-order")
def create_order(amount: int, appointment_id: int, db: Session = Depends(get_db)):

    order = client.order.create({
        "amount": amount * 100,  # paise
        "currency": "INR",
        "payment_capture": 1
    })

    payment = Payment(
        appointment_id=appointment_id,
        amount=amount,
        status="created",
        razorpay_order_id=order["id"]
    )

    db.add(payment)
    db.commit()

    return {
        "order_id": order["id"],
        "amount": amount
    }
@router.post("/verify")
def verify_payment(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    order_id = data.get("razorpay_order_id")
    patient_data = data.get("patient_data")

    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == order_id
    ).first()

    if not payment:
        return {"error": "Payment not found"}

    payment.status = "success"

    try:
        parsed_date = datetime.strptime(patient_data["appointment_date"], "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format"}

    max_token = db.query(func.max(Appointment.token_number)).filter(
        Appointment.doctor_id == patient_data["doctor_id"],
        Appointment.appointment_date == parsed_date
    ).scalar()
    
    token_no = (max_token or 0) + 1

    # ✅ Create appointment AFTER payment
    appointment = Appointment(
        doctor_id=patient_data["doctor_id"],
        appointment_date=parsed_date,
        token_number=token_no,
        patient_input_id=patient_data["patient_id"]
    )

    db.add(appointment)
    db.commit()

    doctor = db.query(DoctorInput).filter(DoctorInput.doctor_id == patient_data["doctor_id"]).first()
    patient = db.query(PatientInput).filter(PatientInput.id == patient_data["patient_id"]).first()

    doctor_name = doctor.name if doctor else "Doctor"
    clinic_name = "City Care Clinic" # Default or fetched from config
    clinic_address = "123 Health Ave, Wellness City"
    
    email_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0056b3;">Appointment Confirmed!</h2>
        <p>Your payment of <strong>Rs. {payment.amount}</strong> was successful.</p>
        <hr/>
        <h3>Token Details:</h3>
        <p><strong>Token Number:</strong> <span style="font-size: 24px; color: #28a745;">#{token_no}</span></p>
        <p><strong>Date:</strong> {parsed_date}</p>
        <p><strong>Patient Name:</strong> {patient.patient_name if patient else "N/A"}</p>
        <p><strong>Consulting Doctor:</strong> {doctor_name}</p>
        <p><strong>Specialization:</strong> {doctor.specialization if doctor else "N/A"}</p>
        <hr/>
        <h3>Clinic Information:</h3>
        <p><strong>{clinic_name}</strong></p>
        <p>Address: {clinic_address}</p>
        <p>Please keep this email as proof of your token. Show this at the reception desk.</p>
    </div>
    """
    
    # Send email asynchronously
    threading.Thread(target=send_email, args=(
        current_user.email,
        f"Token #{token_no} - Appointment Confirmation",
        email_content
    )).start()

    return {
        "message": "Payment verified & appointment booked",
        "token": token_no,
        "details": {
            "doctor_name": doctor_name,
            "patient_name": patient.patient_name if patient else "N/A",
            "date": str(parsed_date),
            "amount": payment.amount,
            "clinic_name": clinic_name,
            "clinic_address": clinic_address
        }
    }