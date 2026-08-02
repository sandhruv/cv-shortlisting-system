import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import LpuLogin from "./pages/LpuLogin";
import LpuAdminDashboard from "./pages/LpuAdminDashboard";
import LpuFacultyDashboard from "./pages/LpuFacultyDashboard";
import LpuStudentDashboard from "./pages/LpuStudentDashboard";

function App() {
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
        <Route path="/lpu-admin" element={<LpuAdminDashboard />} />
        <Route path="/lpu-faculty" element={<LpuFacultyDashboard />} />
        <Route path="/lpu-student" element={<LpuStudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
