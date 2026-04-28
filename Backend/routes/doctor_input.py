from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from dependencies.db import get_db
from dependencies.auth import get_current_user, require_role
from model.user import User
from model.doctor_input import DoctorInput
from schemas.doctor_input import DoctorInputCreate, DoctorInputUpdate, DoctorInputResponse

from typing import List

router = APIRouter(prefix="/doctor-profile", tags=["Doctor Profile"])

@router.get("/all", response_model=List[DoctorInputResponse])
def get_all_doctors(db: Session = Depends(get_db)):
    return db.query(DoctorInput).all()

@router.get("/", response_model=DoctorInputResponse)
def get_doctor_profile(current_user: User = Depends(require_role("doctor")), db: Session = Depends(get_db)):
    profile = db.query(DoctorInput).filter(DoctorInput.doctor_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile

@router.post("/", response_model=DoctorInputResponse)
def create_doctor_profile(profile_in: DoctorInputCreate, current_user: User = Depends(require_role("doctor")), db: Session = Depends(get_db)):
    profile = db.query(DoctorInput).filter(DoctorInput.doctor_id == current_user.id).first()
    if profile:
        raise HTTPException(status_code=400, detail="Doctor profile already exists")
    
    new_profile = DoctorInput(
        doctor_id=current_user.id,
        name=profile_in.name,
        designation=profile_in.designation,
        specialization=profile_in.specialization,
        education_details=profile_in.education_details,
        tokens_available=profile_in.tokens_available,
        clinic_hours=profile_in.clinic_hours,
        entry_fees=profile_in.entry_fees
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.put("/", response_model=DoctorInputResponse)
def update_doctor_profile(profile_in: DoctorInputUpdate, current_user: User = Depends(require_role("doctor")), db: Session = Depends(get_db)):
    profile = db.query(DoctorInput).filter(DoctorInput.doctor_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    for key, value in profile_in.dict(exclude_unset=True).items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/{doctor_id}", response_model=DoctorInputResponse)
def get_doctor_profile_by_id(doctor_id: int, db: Session = Depends(get_db)):
    profile = db.query(DoctorInput).filter(DoctorInput.doctor_id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile
