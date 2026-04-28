import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function PatientBooking() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [successToken, setSuccessToken] = useState(null);

  const [userEmail, setUserEmail] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [patientProfile, setPatientProfile] = useState({ name: "", contact: "" });

  const [form, setForm] = useState({
    patient_name: "",
    disease_name: "",
    duration: "",
    symptoms: "",
    previous_treatment: "",
    appointment_date: ""
  });

  useEffect(() => {
    fetchDoctors();

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.sub || "Patient");
      } catch (e) { }

      const savedProfile = localStorage.getItem("patientProfile");
      if (savedProfile) {
        setPatientProfile(JSON.parse(savedProfile));
      }
    }
  }, []);

  const savePatientProfile = () => {
    localStorage.setItem("patientProfile", JSON.stringify(patientProfile));
    setShowProfile(false);
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctor-profile/all");
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async () => {
    try {
      if (!form.patient_name || !form.disease_name || !form.duration || !form.symptoms || !form.appointment_date) {
        alert("Please fill in all required fields before booking a token.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to book an appointment! Please go to the Login page.");
        navigate("/login");
        return;
      }

      if (!bookingDoctor) return;

      // 1. Save patient data
      const bookRes = await API.post(`/book?doctor_id=${bookingDoctor.doctor_id}`, form);
      if (bookRes.data.error) {
        alert(bookRes.data.error);
        return;
      }

      const patientId = bookRes.data.patient_input_id;

      // 2. Create order using dynamic entry fees
      const amount = bookingDoctor.entry_fees || 500;
      const orderRes = await API.post(`/payment/create-order?amount=${amount}&appointment_id=${patientId}`);
      const { order_id } = orderRes.data;

      // 3. Load script
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load");
        return;
      }

      // 4. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: "INR",
        name: bookingDoctor.name || "Clinic Management",
        description: `Appointment Token Booking`,
        order_id: order_id,
        handler: async function (response) {
          // 5. Verify and Book
          const verifyData = {
            razorpay_order_id: order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            patient_data: {
              doctor_id: bookingDoctor.doctor_id,
              appointment_date: form.appointment_date,
              patient_id: patientId
            }
          };

          const verifyRes = await API.post("/payment/verify", verifyData);
          setSuccessToken(verifyRes.data);
          setBookingDoctor(null); // Close modal on success

          // Clear form
          setForm({
            patient_name: "", disease_name: "", duration: "", symptoms: "", previous_treatment: "", appointment_date: ""
          });
        },
        theme: { color: "#3399cc" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Flow failed");
    }
  };

  const handleDownloadReceipt = () => {
    if (!successToken) return;
    const details = successToken.details;
    const receiptContent = `
=========================================
          APPOINTMENT TOKEN
=========================================
Token Number    : #${successToken.token}
Date            : ${details.date}
-----------------------------------------
Patient Name    : ${details.patient_name}
Doctor Name     : ${details.doctor_name}
Amount Paid     : Rs. ${details.amount}
-----------------------------------------
Clinic Details  :
${details.clinic_name}
${details.clinic_address}
=========================================
Please show this token at the reception.
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Token_${successToken.token}_Receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "50px" }}>Loading available doctors...</div>;

  if (successToken) {
    const { token, details } = successToken;
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "auto", textAlign: "center" }}>
        <div style={{ background: "#d4edda", color: "#155724", padding: "20px", borderRadius: "10px", marginBottom: "30px", border: "1px solid #c3e6cb" }}>
          <h2 style={{ margin: "0 0 10px 0" }}>Payment Successful!</h2>
          <p style={{ margin: 0 }}>Your appointment has been confirmed.</p>
        </div>

        <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", textAlign: "left", border: "1px solid #eee" }}>
          <h3 style={{ textAlign: "center", margin: "0 0 20px 0", color: "#333", borderBottom: "2px dashed #ccc", paddingBottom: "15px" }}>Digital Token</h3>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "18px" }}>
            <span style={{ color: "#666" }}>Token Number:</span>
            <strong style={{ color: "#28a745", fontSize: "24px" }}>#{token}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "#666" }}>Date:</span>
            <strong>{details.date}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "#666" }}>Patient:</span>
            <strong>{details.patient_name}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ color: "#666" }}>Doctor:</span>
            <strong>{details.doctor_name}</strong>
          </div>

          <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
            <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>{details.clinic_name}</h4>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{details.clinic_address}</p>
          </div>

          <button
            onClick={handleDownloadReceipt}
            style={{ width: "100%", padding: "15px", background: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "30px" }}>
            Download Token Receipt
          </button>

          <button
            onClick={() => { setSuccessToken(null); navigate("/book"); }}
            style={{ width: "100%", padding: "15px", background: "transparent", color: "#007bff", border: "1px solid #007bff", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}>
            Book Another Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", margin: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center", marginBottom: "30px", padding: "10px 20px", background: "#f8f9fa", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h1 style={{ margin: 0, color: "#0056b3" }}>Welcome to Doctor Store!</h1>
        {userEmail && (
          <div
            onClick={() => setShowProfile(true)}
            style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#007bff", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}
            title="My Profile"
          >
            {userEmail.charAt(0).toUpperCase()}

          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
        {doctors.length === 0 ? (
          <p style={{ textAlign: "center", gridColumn: "1/-1" }}>No doctors currently available.</p>
        ) : (
          doctors.map(doc => (
            <div key={doc.id} style={{ border: "1px solid #eee", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#0056b3" }}>{doc.name || "Doctor Profile Not Set"}</h3>
                <p style={{ margin: "5px 0", color: "#555", fontSize: "14px" }}><strong>Specialty:</strong> {doc.specialization || "General"}</p>
                <p style={{ margin: "5px 0", color: "#555", fontSize: "14px" }}><strong>Hours:</strong> {doc.clinic_hours || "9:00 AM - 5:00 PM"}</p>
                <p style={{ margin: "15px 0 5px 0", color: "#28a745", fontWeight: "bold", fontSize: "18px" }}>₹{doc.entry_fees || 500}</p>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  style={{ flex: 1, padding: "10px", background: "#f8f9fa", color: "#333", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                  View Profile
                </button>
                <button
                  onClick={() => setBookingDoctor(doc)}
                  style={{ flex: 1, padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                  Book Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Profile Modal */}
      {selectedDoctor && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "450px", maxWidth: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <button onClick={() => setSelectedDoctor(null)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#888" }}>&times;</button>
            <h2 style={{ marginTop: 0, color: "#0056b3" }}>{selectedDoctor.name || "Doctor"}</h2>
            <hr style={{ borderTop: "1px solid #eee", marginBottom: "20px" }} />

            <p style={{ marginBottom: "10px" }}><strong style={{ display: "inline-block", width: "120px" }}>Designation:</strong> {selectedDoctor.designation || "N/A"}</p>
            <p style={{ marginBottom: "10px" }}><strong style={{ display: "inline-block", width: "120px" }}>Specialization:</strong> {selectedDoctor.specialization || "N/A"}</p>
            <p style={{ marginBottom: "10px" }}><strong style={{ display: "inline-block", width: "120px" }}>Education:</strong> {selectedDoctor.education_details || "N/A"}</p>
            <p style={{ marginBottom: "10px" }}><strong style={{ display: "inline-block", width: "120px" }}>Clinic Hours:</strong> {selectedDoctor.clinic_hours || "N/A"}</p>
            <p style={{ marginBottom: "10px" }}><strong style={{ display: "inline-block", width: "120px" }}>Entry Fees:</strong> <span style={{ color: "#28a745", fontWeight: "bold" }}>₹{selectedDoctor.entry_fees || 500}</span></p>

            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <button
                onClick={() => { setBookingDoctor(selectedDoctor); setSelectedDoctor(null); }}
                style={{ width: "100%", padding: "12px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
                Proceed to Book Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {bookingDoctor && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "450px", maxWidth: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setBookingDoctor(null)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#888" }}>&times;</button>

            <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#333" }}>Book Appointment</h2>
            <div style={{ background: "#f8f9fa", padding: "10px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #eee" }}>
              <p style={{ margin: "0 0 5px 0", color: "#555" }}>Booking with <strong>{bookingDoctor.name}</strong></p>
              <p style={{ margin: 0, color: "#28a745", fontWeight: "bold", fontSize: "18px" }}>Total: ₹{bookingDoctor.entry_fees || 500}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Patient Name" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
              <input placeholder="Disease" value={form.disease_name} onChange={(e) => setForm({ ...form, disease_name: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
              <input placeholder="Duration (e.g., 2 days)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
              <input placeholder="Symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
              <input placeholder="Previous Treatment (Optional)" value={form.previous_treatment} onChange={(e) => setForm({ ...form, previous_treatment: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
              <input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />

              <button onClick={handleSubmit} style={{ marginTop: "15px", padding: "12px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
                Pay ₹{bookingDoctor.entry_fees || 500} & Book Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile Modal */}
      {showProfile && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px", maxWidth: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <button onClick={() => setShowProfile(false)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#888" }}>&times;</button>

            <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333", textAlign: "center" }}>My Profile</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#555", fontWeight: "bold" }}>Email (Read Only)</label>
                <input value={userEmail} disabled style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", background: "#f8f9fa", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#555", fontWeight: "bold" }}>Full Name</label>
                <input
                  placeholder="Enter your name"
                  value={patientProfile.name}
                  onChange={(e) => setPatientProfile({ ...patientProfile, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#555", fontWeight: "bold" }}>Contact Details</label>
                <input
                  placeholder="Enter phone number"
                  value={patientProfile.contact}
                  onChange={(e) => setPatientProfile({ ...patientProfile, contact: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={savePatientProfile}
                style={{ marginTop: "15px", padding: "12px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}