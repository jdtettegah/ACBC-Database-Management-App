import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
  } from "recharts";
  import "./PastorReports.css";
import AdminGenerateReport from "../../components/AdminGenerateReport";
  
  const stats = [
    { label: "Total Members", value: 482 },
    { label: "Avg Attendance", value: "78%" },
    { label: "Growth Rate", value: "+6.4%" },
    { label: "Monthly Giving", value: "GH₵ 42,000" },
  ];
  
  const attendanceTrend = [
    { month: "Jan", attendance: 310 },
    { month: "Feb", attendance: 340 },
    { month: "Mar", attendance: 370 },
    { month: "Apr", attendance: 395 },
  ];
  
  const membershipGrowth = [
    { year: "2022", members: 390 },
    { year: "2023", members: 430 },
    { year: "2024", members: 460 },
    { year: "2025", members: 482 },
  ];
  
  const ministryData = [
    { ministry: "Choir", count: 64 },
    { ministry: "Ushering", count: 58 },
    { ministry: "Media", count: 22 },
    { ministry: "Children", count: 71 },
  ];
  
  function PastorReports() {
    return (
      <div className="pastor-reports">
  
        <h2>Church Reports Overview</h2>
        
  
        {/* STATS */}
        <div className="report-stats">
          {stats.map((item, index) => (
            <div className="stats-card" key={index}>
              <h4>{item.label}</h4>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
        
        
  
        {/* FILTER */}
        <div className="report-filter">
          <select>
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
  
          <select>
            <option>All Services</option>
            <option>Sunday Service</option>
            <option>Midweek</option>
          </select>

          <div>
          <div className="action-btn"><AdminGenerateReport/></div>
        </div>
        </div>
  
        {/* CHARTS */}
        <div className="report-charts">
  
          {/* ATTENDANCE */}
          <div className="chart-box">
            <h3>Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
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
  
          {/* MEMBERSHIP */}
          <div className="chart-box">
            <h3>Membership Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={membershipGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="members" fill="#4d4dea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
  
        </div>
  
        {/* MINISTRY */}
        <div className="ministry-summary">
          <h3>Ministry Participation</h3>
  
          <table>
            <thead>
              <tr>
                <th>Ministry</th>
                <th>Active Members</th>
              </tr>
            </thead>
            <tbody>
              {ministryData.map((m, index) => (
                <tr key={index}>
                  <td>{m.ministry}</td>
                  <td>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
      </div>
    );
  }
  
  export default PastorReports;
  