from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base

class DoctorInput(Base):
    __tablename__ = "doctor_inputs"

    id = Column(Integer, primary_key=True)
    
    # Link to the User table for the doctor's authentication
    doctor_id = Column(Integer, ForeignKey("users.id"))
    
    # Static info
    name = Column(String)
    designation = Column(String)
    specialization = Column(String)
    education_details = Column(Text)

    # Daily editable inputs
    tokens_available = Column(Integer, default=10)
    clinic_hours = Column(String)  # e.g., "09:00 AM - 05:00 PM"
    entry_fees = Column(Float)  # Token + checkup fees

    # Relationship to user
    user = relationship("User", backref="doctor_profile")
