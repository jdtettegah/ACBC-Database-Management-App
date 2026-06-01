import { useEffect, useState } from "react";
import AdminGenerateReport from "../../components/AdminGenerateReport";
import "./AdminReports.css";

import { getAllReports, deleteReport, clearReports } from "../../services/api";
import { FileText } from "lucide-react";

function AdminReports() {

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadReports = async () => {

    try {

      const data = await getAllReports();
      setReports(data);

    } catch (err) {

      console.error(err);
      alert("Failed to load reports");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
  
    try {
      await deleteReport(id);
      loadReports();
    } catch {
      alert("Failed to delete report");
    }
  };
  
  const handleClearAll = async () => {
    if (!window.confirm("Clear ALL report history? This cannot be undone!")) return;
  
    try {
      await clearReports();
      loadReports();
    } catch {
      alert("Failed to clear reports");
    }
  };

  return (

    <div className="report-page">

      <div className="report-header">

        <div className="report-title">
          <span className="report-title-icon"><FileText /></span>
          <span className="report-title-text">Reports</span>
        </div>

        <div className="report-action-btn">
          <AdminGenerateReport refreshReports={loadReports} />
        </div>

      </div>


      <div className="report-stats">

        <div className="report-stats-card">
          <h3>Total Reports</h3>
          <p>{reports.length}</p>
        </div>

        <div className="report-stats-card">
          <h3>This Month</h3>
          <p>
            {reports.filter(r => {

              const today = new Date();
              const reportDate = new Date(r.created_at);

              return (
                reportDate.getMonth() === today.getMonth() &&
                reportDate.getFullYear() === today.getFullYear()
              );

            }).length}
          </p>
        </div>

        <div className="report-stats-card">
          <h3>Pending</h3>
          <p>{reports.filter(r => r.status === "Pending").length}</p>
        </div>

      </div>

      <div className="report-clear-div">
        <button
          className="report-clear-btn"
          onClick={handleClearAll}
        >
          Clear History
        </button>

      </div>


      <div className="report-table-wrapper">

        {loading ? (

          <p>Loading reports...</p>

        ) : (

          <table className="report-table">

            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {reports.length === 0 ? (

                <tr>
                  <td colSpan="6">No reports found</td>
                </tr>

              ) : (

                reports.map(report => (

                  <tr key={report.id}>

                  
                    <td>{report.title}</td>
                    <td>{report.category}</td>
                    <td>{report.period}</td>

                    <td
                      className={
                        report.status === "Generated"
                          ? "status generated"
                          : "status pending"
                      }
                    >
                      {report.status}
                    </td>

                    <td>
                      <div className="report-action-group">

                        <button
                          className="report-view-btn"
                          onClick={() => setSelectedReport(report)}
                        >
                          View
                        </button>

                        <button
                          className="report-delete-btn"
                          onClick={() => handleDelete(report.id)}
                        >
                          Delete
                        </button>

                      </div>
                    </td>
                  </tr>

                ))

              )}

            </tbody>

          </table>

        )}

      </div>


      {selectedReport && (

        <AdminGenerateReport
          existingReport={selectedReport}
          onClose={() => setSelectedReport(null)}
        />

      )}

    </div>

  );
}

export default AdminReports;