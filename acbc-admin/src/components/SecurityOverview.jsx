import "./SecurityOverview.css";

function SecurityOverview() {
  return (
    <div className="security-overview">
      <h3>Security Overview</h3>

      <div className="security-item">
        <span>Last Login</span>
        <strong>Today, 9:42 AM</strong>
      </div>

      <div className="security-item">
        <span>Active Sessions</span>
        <strong>1</strong>
      </div>

      <div className="security-item status-safe">
        <span>Status</span>
        <strong>Secure</strong>
      </div>

      <button className="security-btn">View Login History</button>
    </div>
  );
}

export default SecurityOverview;
