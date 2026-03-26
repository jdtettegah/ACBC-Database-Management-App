import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  
  import "../pages/Reports/SecretaryReports.css"
  
  const data = [
    { date: "Jan 1", attendance: 120 },
    { date: "Jan 8", attendance: 180 },
    { date: "Jan 15", attendance: 230 },
    { date: "Jan 22", attendance: 200 },
  ];
  
  const AttendanceChart = () => {
    return (
      <div className="chart-card">
        <h3>Attendance Trend</h3>
  
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="attendance"
              strokeWidth={3}
              stroke="#4d4dea"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default AttendanceChart;
  