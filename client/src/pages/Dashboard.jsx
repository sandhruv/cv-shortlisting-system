import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api
      .get("/profile")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        alert("Please login first");
        window.location.href = "/";
      });
  }, []);

  return (
    <div className="p-8">
      <h1>Dashboard</h1>
      {user && (
        <div>
          <p>Welcome, {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
