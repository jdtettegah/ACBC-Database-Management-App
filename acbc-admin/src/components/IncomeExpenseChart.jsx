import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  
  const data = [
    { month: "Jan", income: 4200, expense: 2800 },
    { month: "Feb", income: 5200, expense: 3100 },
    { month: "Mar", income: 4800, expense: 2900 },
    { month: "Apr", income: 6100, expense: 3500 },
  ];
  
  const IncomeExpenseChart = () => {
    return (
      <div className="chart-card">
        <h3>Income vs Expenses</h3>
  
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="income" strokeWidth={3} stroke="#4a4dea" />
            <Line type="monotone" dataKey="expense" strokeWidth={3} stroke="red" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default IncomeExpenseChart;
  