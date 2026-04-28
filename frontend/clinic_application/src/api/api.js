import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000"
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Token invalid or expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // Redirect to login if needed: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;