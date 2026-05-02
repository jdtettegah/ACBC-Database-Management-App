import "./QuickAction.css";
import AddMember from "./AddMember";
import AddAttendance from "./AddAttendance";
import AddTransaction from "./AddTransaction";
import AdminGenerateReport from "./AdminGenerateReport";
import AddUser from "./AddUser";
import { Zap } from "lucide-react";

function QuickActions() {
  return (
    <div className="quick-actions">
      <div className="quick-action-dashboard-header">
        <span className="quick-header-icon">
          <Zap size={20} />
        </span>
        <span>Quick Actions</span>
      </div>

      <div className="quick-actions-grid">
       
        <div className="action-btn">
          <AddMember />
        </div>
        

        <div className="action-btn">
          <AddAttendance />
        </div>

        

        <div className="action-btn">
           <AddTransaction />
        </div>

        <div className="action-btn">
          <AdminGenerateReport/>
        </div>
      </div>
    </div>
  );
}

export default QuickActions;
