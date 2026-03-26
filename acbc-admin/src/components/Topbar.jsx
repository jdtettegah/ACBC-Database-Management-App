import "./Topbar.css";
import { useState } from "react";

function Topbar({ toggleSidebar }) {
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <header className="topbar">
      <div className="topbarFirstLine">
        <div className="topbarAddress">
          <p>Welcome back, Johnson</p>

          <button className="hamburger" onClick={toggleSidebar}>
            ☰
          </button>
        </div>

        <input type="text" placeholder="Search..." />

        <div className="topbar-actions">

          <span>🔔</span>

          {/* Settings Icon */}
          <div className="settings-wrapper">
            <span onClick={() => setOpenSettings(!openSettings)}>
              ⚙️
            </span>

            {/* Dropdown */}
            {openSettings && (
              <div className="settings-menu">

                <p>👤 Profile</p>
                <p>🔒 Change Password</p>
                <p>🌗 Theme</p>
                <p>⚙️ Preferences</p>

                <hr />

                <p className="logout">🚪 Logout</p>

              </div>
            )}
          </div>

        </div>
      </div>

      <div className="topbarSecondLine">
        <p>Dashboard</p>
      </div>
    </header>
  );
}

export default Topbar;
