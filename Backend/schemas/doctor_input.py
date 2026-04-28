from pydantic import BaseModel
from typing import Optional

class DoctorInputBase(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    education_details: Optional[str] = None
    tokens_available: Optional[int] = 10
    clinic_hours: Optional[str] = None
    entry_fees: Optional[float] = None

class DoctorInputCreate(DoctorInputBase):
    pass

class DoctorInputUpdate(DoctorInputBase):
    pass

class DoctorInputResponse(DoctorInputBase):
    id: int
    doctor_id: int

    class Config:
        from_attributes = True
