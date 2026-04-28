import { useEffect, useState } from "react";
import API from "../api/api";

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loadingAI, setLoadingAI] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(null);

  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "", designation: "", specialization: "", education_details: "", clinic_hours: "", entry_fees: 0
  });

  const [dailyTokens, setDailyTokens] = useState(10);
  const [isEditingTokens, setIsEditingTokens] = useState(false);
  const [patientNotes, setPatientNotes] = useState({});
  const [sentPrescriptions, setSentPrescriptions] = useState({});
  const [aiModalContent, setAiModalContent] = useState(null);

  const fetchPatients = async () => {
    try {
      const res = await API.get("/doctor-appointments/me");
      setPatients(res.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/doctor-profile/");
      if (res.data) {
        setProfile(res.data);
        setDailyTokens(res.data.tokens_available || 10);
        setProfileFormData({
          name: res.data.name || "",
          designation: res.data.designation || "",
          specialization: res.data.specialization || "",
          education_details: res.data.education_details || "",
          clinic_hours: res.data.clinic_hours || "",
          entry_fees: res.data.entry_fees || 0
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleProfileSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const payload = { ...profileFormData, tokens_available: dailyTokens };
      let res;
      if (profile && profile.id) {
        res = await API.put("/doctor-profile/", payload);
      } else {
        res = await API.post("/doctor-profile/", payload);
      }
      setProfile(res.data);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleDailyTokensSave = async () => {
    setIsEditingTokens(false);
    if (!profile) return;
    try {
      const payload = { ...profileFormData, tokens_available: Number(dailyTokens) };
      const res = await API.put("/doctor-profile/", payload);
      setProfile(res.data);
    } catch (error) {
      console.error("Error saving tokens:", error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: name === "entry_fees" ? Number(value) : value }));
  };

  useEffect(() => {
    fetchPatients();
    fetchProfile();
    const savedSent = localStorage.getItem("sentPrescriptions");
    if (savedSent) {
      try {
        setSentPrescriptions(JSON.parse(savedSent));
      } catch (e) { }
    }
  }, []);

  // 🔥 AI Generation
  const handleGenerateAI = async (patientId, index) => {
    try {
      setLoadingAI(index);
      const res = await API.post(`/ai/generate/${patientId}`);
      const updated = [...patients];
      updated[index].ai_response = res.data.ai_response;
      setPatients(updated);
      setAiModalContent(res.data.ai_response);
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("AI generation failed. Please try again.");
    } finally {
      setLoadingAI(null);
    }
  };

  // 🔥 Status Toggle
  const toggleStatus = async (appointmentId, index) => {
    try {
      setLoadingStatus(index);
      const res = await API.put(`/appointments/${appointmentId}/status`);
      const updated = [...patients];
      updated[index].status = res.data.status;
      setPatients(updated);
    } catch (error) {
      console.error("Status update failed:", error);
    } finally {
      setLoadingStatus(null);
    }
  };

  const handleSendEmail = async (patientIndex, appointmentId) => {
    const notes = patientNotes[patientIndex];
    if (!notes) {
      alert("Please enter prescription notes first.");
      return;
    }

    try {
      await API.post(`/appointments/${appointmentId}/send-prescription`, { notes });
      alert("Prescription sent to patient successfully!");

      // Remove from patientNotes to hide the textarea
      const newNotes = { ...patientNotes };
      delete newNotes[patientIndex];
      setPatientNotes(newNotes);

      const newSent = { ...sentPrescriptions, [appointmentId]: true };
      setSentPrescriptions(newSent);
      localStorage.setItem("sentPrescriptions", JSON.stringify(newSent));
    } catch (error) {
      console.error("Failed to send prescription:", error);
      alert("Failed to send prescription. Please try again.");
    }
  };

  const bookedTokens = patients.length;
  const treatedPatients = patients.filter(p => p.status === "treated").length;
  const pendingPatients = bookedTokens - treatedPatients;

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto", position: "relative" }}>

      {/* Header & Profile Icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>Hi, {profile?.name || "Doctor"}</h1>
        <div
          onClick={() => setShowProfileModal(true)}
          style={{
            width: "50px", height: "50px", borderRadius: "50%", background: "#007bff", color: "white",
            display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px",
            fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
          title="Edit Profile"
        >
          {profile?.name ? profile.name.charAt(0).toUpperCase() : "D"}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", background: "#f0f8ff", padding: "15px 25px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #cce5ff" }}>
        <div style={{ fontSize: "16px" }}>
          <strong>Total Tokens:</strong>{" "}
          {isEditingTokens ? (
            <input
              type="number"
              value={dailyTokens}
              onChange={(e) => setDailyTokens(e.target.value)}
              onBlur={handleDailyTokensSave}
              autoFocus
              style={{ width: "60px", padding: "4px" }}
            />
          ) : (
            <span
              onClick={() => setIsEditingTokens(true)}
              style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline" }}
              title="Click to edit"
            >
              {dailyTokens}
            </span>
          )}
        </div>
        <div style={{ fontSize: "16px" }}><strong>Booked:</strong> {bookedTokens}</div>
        <div style={{ fontSize: "16px" }}><strong>Available:</strong> <span style={{ color: "#28a745" }}>{Math.max(0, dailyTokens - bookedTokens)}</span></div>
        <div style={{ fontSize: "16px" }}><strong>Treated:</strong> <span style={{ color: "green" }}>{treatedPatients}</span></div>
        <div style={{ fontSize: "16px" }}><strong>Pending:</strong> <span style={{ color: "orange" }}>{pendingPatients}</span></div>
      </div>

      {/* Patient List */}
      <h2 style={{ marginBottom: "15px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Today's Patients</h2>

      {patients.length === 0 ? (
        <p>No patients available</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {patients.map((p, index) => (
            <div key={p.appointment_id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "10px", background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>

                {/* Patient Info */}
                <div style={{ flex: "1", minWidth: "150px" }}>
                  <strong style={{ fontSize: "18px" }}>#{p.token} {p.patient_name}</strong>
                  <div style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>Disease: {p.disease}</div>
                </div>

                {/* AI Description */}
                <div style={{ flex: "2", minWidth: "250px", fontSize: "14px", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #eee" }}>
                  <strong>AI Suggestion:</strong>{" "}
                  {p.ai_response ? (
                    <>
                      <span>{p.ai_response.length > 60 ? p.ai_response.substring(0, 60) + "..." : p.ai_response}</span>
                      <button
                        onClick={() => setAiModalContent(p.ai_response)}
                        style={{ marginLeft: "8px", padding: "2px 6px", fontSize: "11px", background: "transparent", color: "#007bff", border: "1px solid #007bff", borderRadius: "4px", cursor: "pointer" }}
                      >
                        View Full
                      </button>
                    </>
                  ) : (
                    <span style={{ color: "#888" }}>No description yet.</span>
                  )}
                  <button
                    onClick={() => handleGenerateAI(p.patient_id, index)}
                    disabled={loadingAI === index}
                    style={{ marginLeft: "10px", padding: "4px 8px", fontSize: "12px", background: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    {loadingAI === index ? "Generating..." : (p.ai_response ? "Regenerate" : "Generate")}
                  </button>
                </div>

                {/* Status Toggle & Allow Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ fontWeight: "bold", color: p.status === "treated" ? "green" : "orange" }}>
                    {p.status === "treated" ? <p style={{ margin: 0 }}>Treated</p> : <p style={{ margin: 0 }}>Untreated</p>}
                  </div>
                  <button
                    onClick={() => toggleStatus(p.appointment_id, index)}
                    disabled={loadingStatus === index || p.status === "treated"}
                    style={{
                      padding: "8px 16px",
                      background: p.status === "treated" ? "#ccc" : "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: p.status === "treated" ? "not-allowed" : "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    {loadingStatus === index ? "..." : (p.status === "treated" ? "Treated" : "Allow")}
                  </button>
                </div>
              </div>

              {/* Treatment Notes Section */}
              {p.status === "treated" && !sentPrescriptions[p.appointment_id] && (
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #ccc" }}>
                  <label style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "5px" }}>Treatment Notes / Prescription:</label>
                  <textarea
                    placeholder="Describe treatment details here to send to patient..."
                    value={patientNotes[index] || ""}
                    onChange={(e) => setPatientNotes({ ...patientNotes, [index]: e.target.value })}
                    style={{ width: "100%", height: "60px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  ></textarea>
                  <div style={{ textAlign: "right", marginTop: "8px" }}>
                    <button
                      onClick={() => handleSendEmail(index, p.appointment_id)}
                      style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Send to Patient Email
                    </button>
                  </div>
                </div>
              )}

              {p.status === "treated" && sentPrescriptions[p.appointment_id] && (
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #ccc", color: "#28a745", fontWeight: "bold" }}>
                  ✓ Prescription sent successfully.
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Profile Modal Overlay */}
      {showProfileModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "10px", width: "400px", maxWidth: "90%", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2 style={{ margin: 0 }}>Doctor Profile</h2>
              <button onClick={() => setShowProfileModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" name="name" value={profileFormData.name} onChange={handleProfileChange} placeholder="Name" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
              <input type="text" name="designation" value={profileFormData.designation} onChange={handleProfileChange} placeholder="Designation" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
              <input type="text" name="specialization" value={profileFormData.specialization} onChange={handleProfileChange} placeholder="Specialization" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
              <textarea name="education_details" value={profileFormData.education_details} onChange={handleProfileChange} placeholder="Education Details" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", height: "60px" }} />
              <input type="text" name="clinic_hours" value={profileFormData.clinic_hours} onChange={handleProfileChange} placeholder="Clinic Hours (e.g., 09:00 AM - 05:00 PM)" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
              <input type="number" name="entry_fees" value={profileFormData.entry_fees} onChange={handleProfileChange} placeholder="Entry Fees (₹)" style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
              <button type="button" onClick={handleProfileSave} style={{ padding: "12px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal Overlay */}
      {aiModalContent && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "600px", maxWidth: "90%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#17a2b8" }}>AI Analysis & Suggestion</h2>
              <button onClick={() => setAiModalContent(null)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#888", lineHeight: "1" }}>&times;</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "10px" }}>
              <p style={{ whiteSpace: "pre-wrap", color: "#333", fontSize: "15px", lineHeight: "1.6" }}>{aiModalContent}</p>
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setAiModalContent(null)}
                style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}