import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" />; // or to a forbidden page
  }

  return children;
}