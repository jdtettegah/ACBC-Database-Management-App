import FinanceCards from "../../components/FinanceCards";
import IncomeExpenseChart from "../../components/IncomeExpenseChart";
import IncomeCategoryChart from "../../components/IncomeCategoryChart";
import FinanceTable from "../../components/FinanceTable";
import "./FinancialSecretaryFinance.css";
import AddTransaction from "../../components/AddTransaction";

function FinancialSecretaryFinance() {
  return (
    <div className="finance-page">
      {/* HEADER */}
      <div className="finance-header">
        <h2>Financial Secretary Dashboard</h2>
        <div className="action-btn">
          <AddTransaction/>
        </div>
      </div>

      {/* SUMMARY */}
      <FinanceCards />

      {/* CHARTS */}
      <div className="finance-charts">
        <IncomeExpenseChart />
        <IncomeCategoryChart />
      </div>

      {/* TABLE */}
      <FinanceTable editable />
    </div>
  );
}

export default FinancialSecretaryFinance;
