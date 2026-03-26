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
    { month: "Jan", income: 6200, expense: 4300 },
    { month: "Feb", income: 7100, expense: 4800 },
    { month: "Mar", income: 6800, expense: 5100 },
    { month: "Apr", income: 8200, expense: 5900 },
  ];
  
  const FinanceTrendChart = () => {
    return (
      <div className="chart-card">
        <h3>Income vs Expenses</h3>
  
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="income" strokeWidth={3} stroke="#4d4dea" />
            <Line type="monotone" dataKey="expense" strokeWidth={3} stroke="red" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default FinanceTrendChart;
  