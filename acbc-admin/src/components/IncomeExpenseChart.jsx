import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const IncomeExpenseChart = ({ income = [], expenses = [] }) => {

  // Safety check (prevents crash)
  if (!Array.isArray(income) || !Array.isArray(expenses)) {
    return <p>Loading chart...</p>;
  }

  const monthly = {};

  /* ================= PROCESS INCOME ================= */
  income.forEach((i) => {
    if (!i.date_received) return;

    const month = new Date(i.date_received)
      .toLocaleString("default", { month: "short" });

    if (!monthly[month]) {
      monthly[month] = { month, income: 0, expense: 0 };
    }

    monthly[month].income += Number(i.amount || 0);
  });

  /* ================= PROCESS EXPENSES ================= */
  expenses.forEach((e) => {
    if (!e.date_spent) return;

    const month = new Date(e.date_spent)
      .toLocaleString("default", { month: "short" });

    if (!monthly[month]) {
      monthly[month] = { month, income: 0, expense: 0 };
    }

    monthly[month].expense += Number(e.amount || 0);
  });

  /* ================= ORDER MONTHS ================= */
  const monthOrder = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const data = monthOrder
    .map((month) => ({
      month,
      income: monthly[month]?.income || 0,
      expense: monthly[month]?.expense || 0
    }))
    // Show only months that actually have data
    .filter(d => d.income > 0 || d.expense > 0);

  /* ================= RENDER ================= */
  return (
    <div className="chart-card">
      <h3>Income vs Expenses</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />
          <YAxis />

          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="income"
            stroke="#4a4dea"
            strokeWidth={3}
            name="Income"
          />

          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ff6b6b"
            strokeWidth={3}
            name="Expense"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;