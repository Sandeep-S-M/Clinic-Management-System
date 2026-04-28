from pydantic import BaseModel

class PatientInput(BaseModel):
    patient_name: str
    disease_name: str

    duration: str  # how long suffering
    symptoms: str  # current condition
    previous_treatment: str  # medicines/history
    appointment_date: str # format YYYY-MM-DD