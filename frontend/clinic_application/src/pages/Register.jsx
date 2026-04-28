import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "patient"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Handle register
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");

      await API.post("/auth/register", form);

      alert("Registration successful ✅");

      // redirect to login
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px"
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Register</h2>

      {/* Username */}
      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      {/* Email */}
      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      {/* Password */}
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      {/* Role */}
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: "15px", padding: "8px" }}
      >
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>

      {/* Error */}
      {error && (
        <p style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </p>
      )}

      {/* Button */}
      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {loading ? "Registering..." : "Register"}
      </button>

      {/* Redirect */}
      <p style={{ marginTop: "10px" }}>
        Already have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          Login
        </span>
      </p>
    </div>
  );
}