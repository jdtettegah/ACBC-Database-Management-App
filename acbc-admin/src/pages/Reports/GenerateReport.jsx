import { useState } from "react";
import "./FinanceReports.css";

const GenerateReport = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="generate-report-bar">
        <button className="generate-btn" onClick={() => setOpen(true)}>
          Generate Report
        </button>
      </div>

      {open && (
        <div className="generate-report-modal-overlay">
          <div className="generate-report-modal-card">
            <h3>Generate Financial Report</h3>

            <div className="generate-report-modal-form">
              <label>From Date</label>
              <input type="date" />

              <label>To Date</label>
              <input type="date" />

              <label>Report Type</label>
              <select>
                <option>Income Report</option>
                <option>Expense Report</option>
                <option>Full Financial Report</option>
              </select>
            </div>

            <div className="generate-report-modal-actions">
              <button className="generate-report-btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="generate-report-btn-primary">
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GenerateReport;
