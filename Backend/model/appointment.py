from sqlalchemy import Column, Integer, String, Date,ForeignKey
from database.base import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer)
    patient_name = Column(String)
    appointment_date = Column(Date)
    token_number = Column(Integer)
    status = Column(String, default="pending")  
    patient_input_id = Column(Integer, ForeignKey("patient_inputs.id"))