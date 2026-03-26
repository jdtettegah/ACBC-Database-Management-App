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
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Generate Financial Report</h3>

            <div className="modal-form">
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

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">
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
