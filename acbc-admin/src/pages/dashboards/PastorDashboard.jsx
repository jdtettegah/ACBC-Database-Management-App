import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import "./PastorDashboard.css";
import CalendarWidget from "../../components/CalendarWidget";

const attendanceData = [
  { month: "Jan", attendance: 180 },
  { month: "Feb", attendance: 195 },
  { month: "Mar", attendance: 210 },
  { month: "Apr", attendance: 225 },
  { month: "May", attendance: 240 },
];

const serviceData = [
  { service: "Sunday", count: 220 },
  { service: "Midweek", count: 130 },
];

function PastorDashboard() {
  return (
    <div className="pastor-dashboard">

      <h2 className="dashboard-title">Pastor Overview</h2>

      {/* SUMMARY CARDS */}
      <div className="pastor-cards">
        <div className="pastor-card">
          <h4>Total Members</h4>
          <p>320</p>
        </div>
        <div className="pastor-card">
          <h4>Avg Attendance</h4>
          <p>210</p>
        </div>
        <div className="pastor-card">
          <h4>Growth Rate</h4>
          <p>+8%</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="pastor-charts">

        {/* Attendance Trend */}
        <div className="chart-box">
          <h3>Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#4d4dea"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Breakdown */}
        <div className="chart-box">
          <h3>Service Attendance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2f2fd6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <CalendarWidget />
    </div>
    
  );
}

export default PastorDashboard;
