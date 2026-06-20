import { useEffect, useState } from "react";
import {
  getIncome,
  getExpenses
} from "../../services/api";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  PiggyBank,
  Receipt,
  Coins
} from "lucide-react";

import IncomeExpenseChart from "../../components/IncomeExpenseChart";
import IncomeCategoryChart from "../../components/IncomeCategoryChart";
import ExpenseCategoryChart from "../../components/ExpenseCategoryChart";
import AddTransaction from "../../components/AddTransaction";
import UpcomingEvents from "../../components/UpcomingEvents";

import "./FinanceDashboard.css";

function FinanceDashboard() {
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

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
    } finally {
      setLoading(false);
    }
  };

  /* ================= TOTAL STATS ================= */

  const totalIncome = income.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const netBalance = totalIncome - totalExpense;

  /* ================= TODAY DATA ================= */

  const today = new Date().toISOString().split("T")[0];

  const todayIncome = income.filter(
    (item) => item.date_received?.split("T")[0] === today
  );

  const todayExpenses = expenses.filter(
    (item) => item.date_spent?.split("T")[0] === today
  );

  const todayIncomeTotal = todayIncome.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const todayExpenseTotal = todayExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const todayBalance = todayIncomeTotal - todayExpenseTotal;

  /* ================= INCOME BREAKDOWN (DYNAMIC) ================= */

  const incomeCategories = {};

  todayIncome.forEach((item) => {
    const type = item.income_type || "Other Contributions";

    if (!incomeCategories[type]) {
      incomeCategories[type] = 0;
    }

    incomeCategories[type] += Number(item.amount);
  });

  const todayIncomeBreakdown = Object.keys(incomeCategories).map((type) => ({
    type,
    amount: incomeCategories[type],
  }));

  /* ================= EXPENSE BREAKDOWN ================= */

  const expenseCategories = {};

  todayExpenses.forEach((expense) => {
    const category = expense.category || "Other Expenses";

    if (!expenseCategories[category]) {
      expenseCategories[category] = 0;
    }

    expenseCategories[category] += Number(expense.amount);
  });

  const todayExpenseBreakdown = Object.keys(expenseCategories).map(
    (category) => ({
      category,
      amount: expenseCategories[category],
    })
  );

  /* ================= INCOME COLOR MAPPER ================= */

  const getIncomeCardClass = (type) => {
    const normalized = type.toLowerCase();

    if (normalized.includes("tithe")) return "tithe";
    if (normalized.includes("offering") && normalized.includes("second"))
      return "second-offering";
    if (normalized.includes("offering")) return "offering";
    if (
      normalized.includes("special") ||
      normalized.includes("contribution")
    )
      return "other-contributions";

    return "offering";
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Loading dashboard...</p>;
  }

  return (
    <div className="finance-dashboard">

      {/* ================= HEADER ================= */}

      <div className="finance-dashboard-header">
        <div className="finance-title">
          <span className="finance-title-icon"><Wallet /></span>
          <span className="finance-title-text">Financial Management</span>
        </div>
      </div>

      {/* ================= TOP SUMMARY STATS ================= */}

      <div className="finance-stats-grid">
        <div className="finance-stats-card income">
          <div className="card-top">
            <span>Total Income</span>
            <TrendingUp size={20} />
          </div>
          <h2>GH₵ {totalIncome.toFixed(2)}</h2>
        </div>

        <div className="finance-stats-card expense">
          <div className="card-top">
            <span>Total Expense</span>
            <TrendingDown size={20} />
          </div>
          <h2>GH₵ {totalExpense.toFixed(2)}</h2>
        </div>

        <div className="finance-stats-card balance">
          <div className="card-top">
            <span>Net Balance</span>
            <Scale size={20} />
          </div>
          <h2>GH₵ {netBalance.toFixed(2)}</h2>
        </div>
      </div>

      <UpcomingEvents />

      <div className="charts-grid">
        <IncomeCategoryChart income={income} />
        <ExpenseCategoryChart expenses={expenses} />
      </div>

      {/* ================= TODAY'S INCOME ================= */}

      <div className="finance-today-summary">
        <div className="finance-dashboard-header">
          Today's Income
        </div>

        <div className="finance-todaySummary-grid">
          {todayIncomeBreakdown.length > 0 ? (
            todayIncomeBreakdown.map((item, index) => (
              <div
                key={index}
                className={`finance-todaySummary-card ${getIncomeCardClass(item.type)}`}
              >
                <div className="card-top">
                  <p>{item.type}</p>
                  <Coins size={18} />
                </div>
                <h2>GH₵ {item.amount.toFixed(2)}</h2>
              </div>
            ))
          ) : (
            <div className="finance-todaySummary-card offering">
              <p>No income recorded today</p>
              <h2>GH₵ 0.00</h2>
            </div>
          )}
        </div>
      </div>

      {/* ================= TODAY'S EXPENSES ================= */}

      <div className="finance-today-summary">
        <div className="finance-dashboard-header">
          Today's Expenses
        </div>

        <div className="finance-todaySummary-grid">
          {todayExpenseBreakdown.length > 0 ? (
            todayExpenseBreakdown.map((item, index) => (
              <div
                key={index}
                className="finance-todaySummary-card expense"
              >
                <div className="card-top">
                  <p>{item.category}</p>
                  <Receipt size={18} />
                </div>
                <h2>GH₵ {item.amount.toFixed(2)}</h2>
              </div>
            ))
          ) : (
            <div className="finance-todaySummary-card expense">
              <p>No expenses recorded today</p>
              <h2>GH₵ 0.00</h2>
            </div>
          )}
        </div>
      </div>

  

      {/* ================= TOP SUMMARY STATS ================= */}

      

      {/* ================= CHARTS ================= */}

      <div className="charts">
        <IncomeExpenseChart
          income={income}
          expenses={expenses}
        />
      </div>

   

    </div>
  );
}

export default FinanceDashboard;