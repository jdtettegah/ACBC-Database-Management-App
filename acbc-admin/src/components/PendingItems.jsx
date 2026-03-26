import "./PendingItems.css";

function PendingItems() {
  return (
    <div className="pending-items">
      <h3>Pending Items</h3>

      <ul className="pending-list">
        <li>
          <span>🧑 New member approval</span>
          <button>Review</button>
        </li>

        <li>
          <span>📊 Attendance not submitted (Youth)</span>
          <button>View</button>
        </li>

        <li>
          <span>💰 Expense awaiting approval</span>
          <button>Approve</button>
        </li>

        <li>
          <span>📄 Monthly report not generated</span>
          <button>Generate</button>
        </li>
      </ul>
    </div>
  );
}

export default PendingItems;
