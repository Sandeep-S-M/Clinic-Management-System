from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.patient_input import PatientInput as PatientSchema
from model.patient_input import PatientInput as PatientModel
from dependencies.db import get_db

router = APIRouter(prefix="/patient")

@router.post("/input")
def create_patient_input(data: PatientSchema, db: Session = Depends(get_db)):
    new_entry = PatientModel(
        patient_name=data.patient_name,
        disease_name=data.disease_name,
        duration=data.duration,
        symptoms=data.symptoms,
        previous_treatment=data.previous_treatment
    )

    db.add(new_entry)
    db.commit()

    return {"message": "Patient data saved"}