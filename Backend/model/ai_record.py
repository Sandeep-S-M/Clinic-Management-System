from sqlalchemy import Column, Integer, Text, ForeignKey
from database.base import Base

class AIRecord(Base):
    __tablename__ = "ai_records"

    id = Column(Integer, primary_key=True)
    patient_input_id = Column(Integer, ForeignKey("patient_inputs.id"))
    ai_response = Column(Text)