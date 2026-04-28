from sqlalchemy import Column, Integer, String, ForeignKey
from database.base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    amount = Column(Integer)
    status = Column(String)  # created / success / failed
    razorpay_order_id = Column(String)