import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import "./PastorAttendance.css";
import { apiRequest } from "../../services/api";

function PastorAttendance() {

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ==============================
  // Fetch Attendance
  // ==============================
  const fetchAttendance = async () => {
    try {
      const data = await apiRequest("/attendance");

      setAttendance(data);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // ==============================
  // Filter By Date
  // ==============================
  const dailyAttendance = attendance.filter(
    (a) =>
      a.service_date?.split("T")[0] === selectedDate &&
      a.status === "Present"
  );

  // ==============================
  // Group By Service
  // ==============================
  const serviceSummary = {};

  dailyAttendance.forEach((a) => {
    if (!serviceSummary[a.service_type]) {
      serviceSummary[a.service_type] = 0;
    }

    serviceSummary[a.service_type]++;
  });

  const dailyData = Object.keys(serviceSummary).map((key) => ({
    service: key,
    count: serviceSummary[key],
  }));

  // ==============================
  // Totals
  // ==============================
  const total = dailyAttendance.length;
  const servicesHeld = dailyData.length;

  // ==============================
  // Weekly Trend (Last 4 Weeks)
  // ==============================
  const getWeekData = () => {
    const weeks = {};

    attendance.forEach((a) => {
      if (a.status !== "Present") return;

      const date = new Date(a.service_date);

      const week = `Week ${Math.ceil(date.getDate() / 7)}`;

      if (!weeks[week]) weeks[week] = 0;

      weeks[week]++;
    });

    return Object.keys(weeks).map((w) => ({
      week: w,
      count: weeks[w],
    }));
  };

  const weeklyData = getWeekData();

  // ==============================
  // Chart: By Service (All Time)
  // ==============================
  const serviceChartData = {};

  attendance.forEach((a) => {
    if (a.status !== "Present") return;

    if (!serviceChartData[a.service_type]) {
      serviceChartData[a.service_type] = 0;
    }

    serviceChartData[a.service_type]++;
  });

  const barData = Object.keys(serviceChartData).map((key) => ({
    service: key,
    count: serviceChartData[key],
  }));

  // ==============================
  // UI
  // ==============================
  if (loading) return <p>Loading attendance...</p>;

  return (
    <div className="pastor-attendance">

      <h2>Attendance Overview</h2>

      {/* DATE FILTER */}
      <div className="date-filter">
        <label>View attendance for:</label>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* SUMMARY */}
      <div className="attendance-summary">

        <div className="attendance-card">
          <h4>Total Attendance</h4>
          <p>{total || "--"}</p>
        </div>

        <div className="attendance-card">
          <h4>Services Held</h4>
          <p>{servicesHeld}</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="attendance-table">

        <h3>Service Breakdown</h3>

        {dailyData.length === 0 ? (
          <p>No attendance recorded for this date.</p>
        ) : (

          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Attendance</th>
              </tr>
            </thead>

            <tbody>
              {dailyData.map((row, index) => (
                <tr key={index}>
                  <td>{row.service}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

        )}

      </div>

      {/* CHARTS */}
      <div className="attendance-charts">

        {/* LINE */}
        <div className="chart-box">

          <h3>Weekly Attendance Trend</h3>

          <ResponsiveContainer width="100%" height={280}>

            <LineChart data={weeklyData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="week" />

              <YAxis />

              <Tooltip />

              <Line
                dataKey="count"
                stroke="#4d4dea"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        {/* BAR */}
        <div className="chart-box">

          <h3>Attendance by Service</h3>

          <ResponsiveContainer width="100%" height={280}>

            <BarChart data={barData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="service" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="count" fill="#2f2fd6" />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

export default PastorAttendance;