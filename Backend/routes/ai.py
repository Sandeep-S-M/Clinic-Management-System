from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from model.patient_input import PatientInput
from model.ai_record import AIRecord
from dependencies.db import get_db
from services.ai_service import generate_treatment
from dependencies.auth import require_role
from model.user import User

router = APIRouter(prefix="/ai")


@router.post("/generate/{patient_id}")
def generate_ai(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("doctor"))):

    patient = db.query(PatientInput).filter(
        PatientInput.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

   
    ai_text = generate_treatment(patient)

    record = AIRecord(
        patient_input_id=patient.id,
        ai_response=ai_text
    )

    db.add(record)
    db.commit()

    return {"ai_response": ai_text}