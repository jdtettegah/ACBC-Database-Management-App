
import "../pages/Reports/SecretaryReports.css"
const ReportsTable = () => {
    const rows = [
      {
        date: "2026-01-14",
        service: "Sunday Service",
        attendance: 230,
        status: "Completed",
      },
      {
        date: "2026-01-17",
        service: "Bible Study",
        attendance: 85,
        status: "Completed",
      },
      {
        date: "2026-01-20",
        service: "Prayer Meeting",
        attendance: 120,
        status: "Completed",
      },
    ];
  
    return (
      <div className="report-table">
        <h3>Detailed Reports</h3>
  
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Service / Meeting</th>
              <th>Attendance</th>
              <th>Status</th>
            </tr>
          </thead>
  
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.date}</td>
                <td>{row.service}</td>
                <td>{row.attendance}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default ReportsTable;
  