import FinanceCards from "../../components/FinanceCards";
import IncomeExpenseChart from "../../components/IncomeExpenseChart";
import IncomeCategoryChart from "../../components/IncomeCategoryChart";
import FinanceTable from "../../components/FinanceTable";
import "./FinanceDashboard.css";
import AddTransaction from "../../components/AddTransaction";

function FinanceDashboard() {
  return (
    <div className="finance-page">
      {/* HEADER */}
      <div className="finance-header">
        <h2>Finance Overview</h2>
        <button className="action-btn"><AddTransaction/></button>
      </div>

      {/* SUMMARY CARDS */}
      <FinanceCards />

      {/* CHARTS */}
      <div className="finance-charts">
        <IncomeExpenseChart />
        <IncomeCategoryChart />
      </div>

      {/* TABLE */}
      <FinanceTable />
    </div>
  );
}

export default FinanceDashboard;
