import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import JobDetail from "./pages/JobDetail";
import LpuLogin from "./pages/LpuLogin";
import LpuAdminDashboard from "./pages/LpuAdminDashboard";
import LpuFacultyDashboard from "./pages/LpuFacultyDashboard";
import LpuStudentDashboard from "./pages/LpuStudentDashboard";
import TestCompilerPage from "./pages/TestCompilerPage";
import AiInterviewRoom from "./components/AiInterviewRoom";

function App() {
  useEffect(() => {
    const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const healthUrl = isDevelopment
      ? "http://localhost:5000/api/health"
      : `${window.location.protocol}//${window.location.hostname}/api/health`;

    const pingServer = () => {
      fetch(healthUrl, { cache: "no-store" }).catch(() => {});
    };

    pingServer();
    const intervalId = window.setInterval(pingServer, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lpu-login" element={<LpuLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/lpu-admin" element={<LpuAdminDashboard />} />
        <Route path="/lpu-faculty" element={<LpuFacultyDashboard />} />
        <Route path="/lpu-student" element={<LpuStudentDashboard />} />
        <Route path="/test-compiler" element={<TestCompilerPage />} />
        <Route path="/ai-interview/:interviewId" element={<AiInterviewRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
