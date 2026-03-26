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
    { category: "Tithes", amount: 18000 },
    { category: "Offerings", amount: 12500 },
    { category: "Donations", amount: 8200 },
    { category: "Projects", amount: 6500 },
  ];
  
  const IncomeCategoryChart = () => {
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
  