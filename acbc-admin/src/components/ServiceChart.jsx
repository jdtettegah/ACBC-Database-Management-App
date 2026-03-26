import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";

  import "../pages/Reports/SecretaryReports.css"
  
  const data = [
    { service: "Sunday Service", attendance: 520 },
    { service: "Bible Study", attendance: 240 },
    { service: "Prayer Meeting", attendance: 180 },
    { service: "Youth Service", attendance: 305 },
  ];
  
  const ServiceChart = () => {
    return (
      <div className="chart-card">
        <h3>Attendance by Service</h3>
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="service" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="attendance" fill="#4d4dea" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default ServiceChart;
  