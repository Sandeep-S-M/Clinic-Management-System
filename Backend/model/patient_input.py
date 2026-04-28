from sqlalchemy import Column, Integer, String, Text, DateTime
import datetime
from sqlalchemy.orm import relationship
from database.base import Base

class PatientInput(Base):
    __tablename__ = "patient_inputs"

    id = Column(Integer, primary_key=True)
    patient_name = Column(String)
    disease_name = Column(String)

    duration = Column(Text)
    symptoms = Column(Text)
    appointment_date = Column(String)  # Storing YYYY-MM-DD
    previous_treatment = Column(Text)
    appointments = relationship("Appointment", backref="patient")