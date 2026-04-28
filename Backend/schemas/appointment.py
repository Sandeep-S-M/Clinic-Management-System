from pydantic import BaseModel
from datetime import date

class AppointmentCreate(BaseModel):
    doctor_id: int
    patient_name: str
    appointment_date: date