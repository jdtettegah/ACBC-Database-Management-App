import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";

function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-sidebar">
          <Sidebar />
        </div>
        <div className="dashboard-main">
          <Topbar toggleSidebar={toggleSidebar} />
          <div className="dashboard-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
