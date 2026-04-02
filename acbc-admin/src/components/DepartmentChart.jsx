import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
  } from "recharts";
  
  function DepartmentChart({ departments }) {
  
    const data = departments.map(d => ({
      name: d.name,
      members: d.member_count || 0
    }));
  
    return (
      <div className="chart-box">
  
        <h3>Department Member Distribution</h3>
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="members" />
          </BarChart>
        </ResponsiveContainer>
  
      </div>
    );
  }
  
  export default DepartmentChart;