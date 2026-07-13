import axios from "axios";

const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const baseURL = isDevelopment ? "http://localhost:5000/api" : "/api";

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("🔑 Token being sent:", token ? "✅ present" : "❌ missing");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
