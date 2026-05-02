import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

function DepartmentChart({ departments = [] }) {

  const data = departments.map(d => ({
    name: d.name,
    members: d.member_count || 0
  }));

  // Define your alternating colors
  const colors = ["#4d4dea", "#82ca9d"]; // blue & green (you can change)

  return (
    <div className="chart-box">

      <h3>Department Member Distribution</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />

          <Bar dataKey="members">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}

export default DepartmentChart;