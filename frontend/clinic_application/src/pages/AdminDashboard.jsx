import { useEffect, useState } from "react";
import API from "../api/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get("/admin/stats").then((res) => setStats(res.data));
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>

      {stats && (
        <>
          <p>Total Users: {stats.users}</p>
          <p>Total Revenue: ₹{stats.revenue}</p>
        </>
      )}
    </div>
  );
}