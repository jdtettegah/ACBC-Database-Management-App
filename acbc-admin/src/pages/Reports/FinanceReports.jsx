import FinanceReportCards from "../../components/FinanceReportCards";
import FinanceTrendChart from "../../components/FinanceTrendChart";
import ExpenseCategoryChart from "../../components/ExpenseCategoryChart";
import FinanceReportsTable from "../../components/FinanceReportsTable";
import "./FinanceReports.css";
import GenerateReport from "./GenerateReport";

function FinanceReports() {
  return (
    <div className="finance-reports-page">
      {/* HEADER */}
      <div className="finance-reports-header">
        <h2>Finance Reports</h2>

        <div className="finance-report-filters">
          <input type="date" />
          <input type="date" />
          <select>
            <option>All Categories</option>
            <option>Tithes</option>
            <option>Offerings</option>
            <option>Utilities</option>
          </select>
        </div>

        <GenerateReport />
      </div>

      {/* SUMMARY */}
      <FinanceReportCards />

      {/* CHARTS */}
      <div className="finance-reports-charts">
        <FinanceTrendChart />
        <ExpenseCategoryChart />
      </div>

      {/* TABLE */}
      <FinanceReportsTable />
    </div>
  );
}

export default FinanceReports;
