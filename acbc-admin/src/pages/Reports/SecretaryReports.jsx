import ReportCards from "../../components/ReportCards";
import AttendanceChart from "../../components/AttendanceChart";
import ServiceChart from "../../components/ServiceChart"
import ReportsTable from "../../components/ReportsTable"
import "./SecretaryReports.css"
import AdminGenerateReport from "../../components/AdminGenerateReport";
import SecretaryGenerateReport from "../../components/SecretaryGenerateReports";


function SecretaryReports() {
    return (
        <div className="reports-page">
        {/* HEADER */}
        <div className="reports-header">
          <h2>Reports</h2>
          <div className="report-filters">
          <input type="date" />
          <input type="date" />
          <select>
            <option>All Services</option>
            <option>Sunday Service</option>
            <option>Bible Study</option>
          </select>
          
        </div>
          <div className="action-btn"><SecretaryGenerateReport/></div>
        </div>
        {/* Filters */}
        

        
  
        {/* Summary Cards */}
        <div className="reports-stats">
         <ReportCards />
        </div>
  
        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">Attendance Trend</div>
          <div className="chart-card">Attendance by Service</div>
          <AttendanceChart />
          <ServiceChart />
        </div>
  
        {/* Table */}
        <div className="report-table">
            <ReportsTable />
        </div>
      </div>
    );
  }
  
  export default SecretaryReports;
  