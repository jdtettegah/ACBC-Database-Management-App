import { useEffect, useState } from "react";
import AddTransaction from "../../components/AddTransaction";
import IncomeExpenseChart from "../../components/IncomeExpenseChart";
import IncomeCategoryChart from "../../components/IncomeCategoryChart";
import { getIncome, getExpenses } from "../../services/api";
import { Wallet } from "lucide-react";

import "./FinancialSecretaryFinance.css";
import ExpenseCategoryChart from "../../components/ExpenseCategoryChart";

function PastorFinance() {

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      const incomeData = await getIncome();
      const expenseData = await getExpenses();

      setIncome(incomeData);
      setExpenses(expenseData);

    } catch (err) {
      console.error(err);
      alert("Failed to load finance data");
    }

    setLoading(false);
  };

  /* Merge Transactions */
  const transactions = [
    ...income.map((i) => ({
      id: `INC-${i.id}`,
      date: i.date_received,
      type: "Income",
      description: i.source_description || i.income_type,
      amount: i.amount,
      status: "Completed",
    })),
    ...expenses.map((e) => ({
      id: `EXP-${e.id}`,
      date: e.date_spent,
      type: "Expense",
      description: e.description || e.category,
      amount: e.amount,
      status: "Completed",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  /* Filters */
  const filteredTransactions = transactions.filter((tx) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.type.toLowerCase().includes(searchLower) ||
      tx.id.toLowerCase().includes(searchLower);

    const matchesType =
      typeFilter === "All" || tx.type === typeFilter;

    const matchesDate = dateFilter
      ? new Date(tx.date).toISOString().split("T")[0] === dateFilter
      : true;

    return matchesSearch && matchesType && matchesDate;
  });

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  if (loading) return <p style={{ padding: 20 }}>Loading finance...</p>;

  return (
    <div className="finance-page">

      {/* HEADER */}
      <div className="finance-header">
        <div className="finance-title">
          <span className="finance-title-icon"><Wallet /></span>
          <span className="finance-title-text">Financial Management</span>
        </div>

        <div className="finance-action-btn">
          <AddTransaction onSuccess={loadFinance} />
        </div>
      </div>

      {/* STATS */}
      <div className="finance-stats">
        <div className="finance-stats-card">
          <h3>Total Income</h3>
          <p>GH₵ {totalIncome.toFixed(2)}</p>
        </div>

        <div className="finance-stats-card">
          <h3>Total Expense</h3>
          <p>GH₵ {totalExpense.toFixed(2)}</p>
        </div>

        <div className="finance-stats-card">
          <h3>Balance</h3>
          <p>GH₵ {balance.toFixed(2)}</p>
        </div>
      </div>

      {/* CHARTS */}

      <div>
        <IncomeExpenseChart income={income} expenses={expenses} />
      </div>

      <div className="finance-charts">
        <IncomeCategoryChart income={income} />
        <ExpenseCategoryChart expenses={expenses} />
      </div>

      

      {/* FILTERS */}
      <div className="finance-controls">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No records
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td className={tx.type === "Income" ? "type income" : "type expense"}>
                    {tx.type}
                  </td>
                  <td>{tx.description}</td>
                  <td>GH₵ {Number(tx.amount).toFixed(2)}</td>
                  <td className="status completed">{tx.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default PastorFinance;