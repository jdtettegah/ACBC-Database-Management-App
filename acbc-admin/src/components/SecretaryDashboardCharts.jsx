import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import "./DashboardCharts.css";

function SecretaryDashboardCharts() {
  // Sample data
  const attendanceData = [
    { week: "1", attendance: 120 },
    { week: "2", attendance: 150 },
    { week: "3", attendance: 100 },
    { week: "4", attendance: 170 }
  ];

  const incomeData = [
    { week: "Week 1", income: 2500 },
    { week: "Week 2", income: 3000 },
    { week: "Week 3", income: 2800 },
    { week: "Week 4", income: 3500 },
  ];

  return (
    <div className="dashboard-charts">
      {/* Attendance Chart */}
      <div className="chart-card">
        <h3>Attendance (This Month)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={attendanceData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="attendance" stroke="#4d4dea" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

 
      
    </div>
  );
}

export default SecretaryDashboardCharts;
