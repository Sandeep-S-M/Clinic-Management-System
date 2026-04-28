# Clinic Management System 🏥

A full-stack web application designed to streamline clinic workflows. This project handles patient token booking, secure payments, automated email notifications, and includes a small AI-powered symptom analysis tool to assist doctors. 

I built this project to demonstrate my practical understanding of end-to-end full-stack development and how to integrate external APIs (Payments, Email, AI) into a real-world application.

## Features

- **Role-Based Authentication**: Secure JWT-based login for Patients, Doctors, and Admins.
- **Token Booking Flow**: Patients can view available doctors and book consultation tokens.
- **Payment Integration**: Payment processing via Razorpay before an appointment token is confirmed.
- **AI Diagnostics Assistant**: Doctors can optionally generate possible conditions and treatment suggestions based on a patient's reported symptoms using the Google Gemini API.
- **Automated Notifications**: Background email delivery for user registration, token receipts, and post-treatment prescriptions via Resend.
- **Doctor Dashboard**: Simple dashboard to track pending, current, and treated patients.

## Tech Stack

**Frontend:**
- **React.js (Vite)**: For building the user interface.
- **React Router**: For managing navigation.
- **CSS**: Custom styling with responsive flexbox layouts.

**Backend:**
- **FastAPI**: Python backend chosen for its speed and native async support.
- **SQLite & SQLAlchemy**: Relational database modeling using Python's standard ORM.
- **JWT Authentication**: Secure token generation using `python-jose`.
- **Google Gemini API**: Direct REST API integration via `httpx` for the AI assistant.
- **Razorpay API**: For handling payments.
- **Resend API**: For dispatching transactional emails.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sandeep-S-M/Clinic-Management-System.git
   ```

2. **Backend Setup:**
   ```bash
   cd Backend
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
   *Create a `.env` file in the `Backend` directory:*
   ```env
   GEMINI_API_KEY=your_gemini_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RESEND_API=your_resend_key
   ```
   *Start the FastAPI server:*
   ```bash
   uvicorn main:app --reload
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend/clinic_application
   npm install
   ```
   *Create a `.env` file in the `frontend/clinic_application` directory:*
   ```env
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```
   *Start the Vite development server:*
   ```bash
   npm run dev
   ```

## Development Learnings

During the development of this project, I gained hands-on experience dealing with several interesting challenges:
- **API Versioning Issues:** While integrating Google Gemini, I encountered version conflicts with their Python SDK. I learned to bypass the SDK by implementing a direct HTTP POST request to their `generativelanguage` REST API endpoint using `httpx`, which provided much better stability.
- **Concurrency & State:** I implemented `func.max()` queries in SQLAlchemy to prevent duplicate appointment tokens from being generated if multiple users attempt to book simultaneously.
- **Background Tasks:** Instead of blocking the server response while waiting for the email API, I utilized Python threading to handle post-payment and prescription emails asynchronously, keeping the frontend UI snappy.

---
*Built by Sandeep S M as a portfolio project.*
