const FinanceTable = ({ editable = false }) => {
    const rows = [
      {
        date: "2026-01-14",
        type: "Income",
        category: "Tithe",
        amount: "₵1,200",
      },
      {
        date: "2026-01-16",
        type: "Expense",
        category: "Utilities",
        amount: "₵450",
      },
    ];
  
    return (
      <div className="finance-table">
        <h3>Recent Transactions</h3>
  
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              {editable && <th>Actions</th>}
            </tr>
          </thead>
  
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.category}</td>
                <td>{row.amount}</td>
  
                {editable && (
                  <td className="table-actions">
                    <button className="edit-btn">Edit</button>
                    <button className="delete-btn">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default FinanceTable;
  