import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API")

def send_email(to_email: str, subject: str, html_content: str):
    if not resend.api_key:
        print("Resend API key not found. Email not sent.")
        return

    try:
        r = resend.Emails.send({
            "from": "Doctors Invitation <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        })
        print(f"Email sent successfully to {to_email}: {r}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
