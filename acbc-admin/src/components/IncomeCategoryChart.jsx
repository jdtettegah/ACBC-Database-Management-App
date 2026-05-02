import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const IncomeCategoryChart = ({ income = [] }) => {

  if (!Array.isArray(income)) {
    return <p>Loading chart...</p>;
  }

  const grouped = {};

  income.forEach((i) => {
    const key = i.income_type || "Other";
    grouped[key] = (grouped[key] || 0) + Number(i.amount || 0);
  });

  const data = Object.keys(grouped).map((key) => ({
    category: key,
    amount: grouped[key],
  }));

  return (
    <div className="chart-card">
      <h3>Income by Category</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#4d4dea" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeCategoryChart;