import { useEffect, useState } from "react";
import { getActivities } from "../services/api";
import "./RecentActivity.css"

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (err) {
      console.error("Activity error:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "member": return "👤";
      case "tithe": return "🙏";
      case "income": return "💰";
      case "expense": return "📉";
      case "event": return "📅";
      default: return "📌";
    }
  };

  return (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
  
      {activities.length === 0 ? (
        <p>No recent activity</p>
      ) : (
        <div className="activity-list">
          {activities.map((item) => (
            <div key={item.id} className="activity-item">
              <div className="activity-text">
                <span>{getIcon(item.activity_type)}</span>
                <span>{item.description}</span>
              </div>
  
              <small className="activity-time">
                {new Date(item.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;