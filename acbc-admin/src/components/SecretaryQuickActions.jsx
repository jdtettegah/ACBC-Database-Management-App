import "./QuickAction.css";
import AddMember from "./AddMember";
import AddAttendance from "./AddAttendance";
import AddTransaction from "./AddTransaction";
import AdminGenerateReport from "./AdminGenerateReport";
import SecretaryGenerateReport from "./SecretaryGenerateReports";

function SecretaryQuickActions() {
  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>

      <div className="quick-actions-grid">
       
        <div className="action-btn">
          <AddMember />
        </div>
        

        <div className="action-btn">
          <AddAttendance />
        </div>


        <div className="action-btn">
          <SecretaryGenerateReport/>
        </div>
      </div>
    </div>
  );
}

export default SecretaryQuickActions;
