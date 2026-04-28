from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import appointment, ai, auth, payment, doctor_input
from database.base import Base
from database.connection import engine

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(appointment.router)
app.include_router(ai.router)
app.include_router(payment.router)
app.include_router(doctor_input.router)