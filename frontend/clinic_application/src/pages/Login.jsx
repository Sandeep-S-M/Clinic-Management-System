import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
        const res = await API.post("/auth/login", { email, password });
        login(res.data);
        
        if (res.data.role === "doctor") {
            navigate("/doctor");
        } else if (res.data.role === "admin") {
            navigate("/admin");
        } else {
            navigate("/book");
        }
    } catch (err) {
        alert("Login failed " + err);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "90vh", backgroundColor: "#f0f4f8" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "100%", maxWidth: "380px", textAlign: "center" }}>
        <h2 style={{ color: "#333", margin: "0 0 10px 0" }}>Welcome Back!</h2>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "14px" }}>Please login to your account</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input 
            type="email"
            placeholder="Email Address" 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", outline: "none", fontSize: "15px", boxSizing: "border-box", background: "#fafafa" }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", outline: "none", fontSize: "15px", boxSizing: "border-box", background: "#fafafa" }}
          />

          <button 
            onClick={handleLogin}
            style={{ width: "100%", padding: "12px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px", transition: "0.2s" }}
            onMouseOver={(e) => e.target.style.background = "#0056b3"}
            onMouseOut={(e) => e.target.style.background = "#007bff"}
          >
            Login
          </button>
          
          <div style={{ marginTop: "15px", fontSize: "14px", color: "#555" }}>
            Don't have an account?{" "}
            <span 
              onClick={() => navigate("/register")} 
              style={{ color: "#007bff", cursor: "pointer", fontWeight: "bold" }}
            >
              Register here
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}