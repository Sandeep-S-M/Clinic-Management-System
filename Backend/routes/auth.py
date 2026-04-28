from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database.connection import SessionLocal
from dependencies.db import get_db
from model.user import User
from schemas.user import UserCreate, UserLogin, Token
from utils.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.email import send_email
import threading

router = APIRouter(prefix="/auth")

@router.post("/register")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    # The current user.py model only has id, email, password, role. No username.
    new_user = User(
        email=user_in.email,
        password=hashed_password,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    threading.Thread(target=send_email, args=(
        user_in.email, 
        "Welcome to Digital Doctors Portal", 
        f"<h2>Registration Successful!</h2><p>thank you for registering digital doctors portal we are happy to have your presence in our portal</p>"
    )).start()
    
    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    threading.Thread(target=send_email, args=(
        user.email, 
        "Login Alert", 
        f"<h2>New Login Detected</h2><p>Your account was just logged into.</p>"
    )).start()
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}
