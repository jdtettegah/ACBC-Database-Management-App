import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
  } from "recharts";
  import "./PastorFinance.css";
  
  const summary = {
    income: 125000,
    expense: 83000,
  };
  
  const monthlyFinance = [
    { month: "Jan", income: 20000, expense: 14000 },
    { month: "Feb", income: 18000, expense: 12000 },
    { month: "Mar", income: 23000, expense: 15000 },
    { month: "Apr", income: 21000, expense: 16000 },
  ];
  
  const givingBreakdown = [
    { name: "Tithe", value: 55 },
    { name: "Offering", value: 30 },
    { name: "Donations", value: 15 },
  ];
  
  const recentTransactions = [
    { date: "2026-01-18", type: "Offering", amount: 3200 },
    { date: "2026-01-17", type: "Tithe", amount: 5400 },
    { date: "2026-01-16", type: "Utility Bills", amount: -1800 },
  ];
  
  const COLORS = ["#4d4dea", "#2f2fd6", "#8884d8"];
  
  function PastorFinance() {
    const balance = summary.income - summary.expense;
  
    return (
      <div className="pastor-finance">
  
        <h2>Church Financial Overview</h2>
  
        {/* SUMMARY */}
        <div className="finance-summary">
          <div className="finance-card">
            <h4>Total Income</h4>
            <p className="positive">GH₵ {summary.income.toLocaleString()}</p>
          </div>
  
          <div className="finance-card">
            <h4>Total Expenses</h4>
            <p className="negative">GH₵ {summary.expense.toLocaleString()}</p>
          </div>
  
          <div className="finance-card">
            <h4>Balance</h4>
            <p className={balance >= 0 ? "positive" : "negative"}>
              GH₵ {balance.toLocaleString()}
            </p>
          </div>
        </div>
  
        {/* CHARTS */}
        <div className="finance-charts">
  
          {/* BAR CHART */}
          <div className="chart-box">
            <h3>Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyFinance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#4d4dea" />
                <Bar dataKey="expense" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
  
          {/* PIE CHART */}
          <div className="chart-box">
            <h3>Giving Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={givingBreakdown}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {givingBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
  
        </div>
  
        {/* TRANSACTIONS */}
        <div className="finance-table">
          <h3>Recent Transactions</h3>
  
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount (GH₵)</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, index) => (
                <tr key={index}>
                  <td>{tx.date}</td>
                  <td>{tx.type}</td>
                  <td className={tx.amount >= 0 ? "positive" : "negative"}>
                    {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
      </div>
    );
  }
  
  export default PastorFinance;
  