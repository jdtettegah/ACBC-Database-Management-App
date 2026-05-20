import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ExpenseCategoryChart = ({ expenses = [] }) => {

  if (!Array.isArray(expenses)) {
    return <p>Loading chart...</p>;
  }

  const grouped = {};

  expenses.forEach((e) => {
    const key = e.category || "Other";
    grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
  });

  const data = Object.keys(grouped).map((key) => ({
    category: key,
    amount: grouped[key],
  }));

  const formatCategory = (name) => {
    if (name.length > 15) {
      return name.slice(0, 12) + "...";
    }
    return name;
  };

  return (
    <div className="chart-card">
      <h3>Expenses by Category</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category"  tickFormatter={formatCategory}/>
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#ff6b6b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseCategoryChart;