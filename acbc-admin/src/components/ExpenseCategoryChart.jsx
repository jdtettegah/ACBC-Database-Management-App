import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  
  const data = [
    { category: "Utilities", amount: 8400 },
    { category: "Maintenance", amount: 5200 },
    { category: "Outreach", amount: 6900 },
    { category: "Administration", amount: 4300 },
  ];
  
  const ExpenseCategoryChart = () => {
    return (
      <div className="chart-card">
        <h3>Expenses by Category</h3>
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#4d4dea" />
          </BarChart >
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default ExpenseCategoryChart;
  