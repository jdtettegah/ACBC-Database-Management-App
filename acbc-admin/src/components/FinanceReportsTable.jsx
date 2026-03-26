import "./FinanceReportsTable.css";

const FinanceReportsTable = () => {
    const rows = [
      {
        date: "2026-01-12",
        type: "Income",
        category: "Tithes",
        amount: "₵1,500",
        recordedBy: "Financial Secretary",
      },
      {
        date: "2026-01-15",
        type: "Expense",
        category: "Utilities",
        amount: "₵620",
        recordedBy: "Financial Secretary",
      },
    ];
  
    return (
      <div className="finance-report-table">
        <h3>Detailed Finance Records</h3>
  
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Recorded By</th>
            </tr>
          </thead>
  
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.category}</td>
                <td>{row.amount}</td>
                <td>{row.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default FinanceReportsTable;
  