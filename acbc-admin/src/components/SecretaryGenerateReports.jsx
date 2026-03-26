import "./AdminGenerateReport.css";
import { useState } from "react";

function SecretaryGenerateReport() {
    const [reportType, setReportType] = useState("Members");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [open, setOpen] = useState(false);
    
    

    const handleGenerate = () => {
        const data = { reportType, startDate, endDate };
        console.log("Generating report:", data);
        
        
        alert(`${reportType} report generated successfully!`);
    };

    return (
        <>
        <div>
            <button className="add-attendance-button" onClick={() => setOpen(true)}>
            📝 Generate Report
            </button>
        </div>

        {open && (
            <div className="modal-overlay">
                <div className="generate-reports-page">

                    <div className="generate-reports-header">
                        <h2>Reports</h2>
                        <p>Generate Members & Attendance Reports</p>
                    </div>


                    <div className="generate-reports-filters">


                        <div className="filter-group">
                            <label>Report Type</label>
                            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <option>Members</option>
                                <option>Attendance</option>
                            </select>
                        </div>


                        <div className="filter-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>


                        <div className="filter-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>


                        <button className="generate-btn" onClick={handleGenerate}>
                        Generate Report
                        </button>


                    </div>


                    <div className="reports-previews">


                        <h3>{reportType} Report Preview</h3>


                        <div className="preview-cards">
                            <p><strong>From:</strong> {startDate || "Not selected"}</p>
                            <p><strong>To:</strong> {endDate || "Not selected"}</p>
                            <p><strong>Type:</strong> {reportType}</p>


                            <p className="preview-note">
                            This section will display summarized report data from the database.
                            </p>
                        </div>


                        <div className="report-actions">
                            <button className="cancel-btn" onClick={() => setOpen(false)}>Cancel</button>
                            <button className="export-btn">Export Excel</button>
                            <button className="dnload-btn">Download PDF</button>
                            
                        </div>


                    </div>


                </div>        
            </div>
            
                    

        )}
     </>
    )
}       

export default SecretaryGenerateReport;

