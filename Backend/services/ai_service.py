import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

def generate_treatment(patient):
    prompt = f"""
    You are a medical assistant. Provide a structured analysis based on this patient data.

    Patient Name: {patient.patient_name}
    Disease: {patient.disease_name}
    Duration: {patient.duration}
    Symptoms: {patient.symptoms}
    Previous Treatment: {patient.previous_treatment}

    Please provide exactly:
    1. Possible condition
    2. Suggested treatment
    3. Precautions
    """

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        with httpx.Client() as client:
            response = client.post(API_URL, json=payload, timeout=30.0)
            response.raise_for_status()
            
            data = response.json()
            if "candidates" in data and len(data["candidates"]) > 0:
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return str(data)
            
    except httpx.HTTPStatusError as e:
        error_msg = e.response.text
        if "403" in str(e) or "API_KEY_INVALID" in error_msg:
            return (
                "⚠️ AI Generation Failed: Invalid or Missing Gemini API Key.\n\n"
                "Please check your `.env` file and ensure `GEMINI_API_KEY` is correctly set and active."
            )
        return f"⚠️ AI Service API Error: {error_msg}"
    except Exception as e:
        return f"⚠️ AI Service Error: {str(e)}"