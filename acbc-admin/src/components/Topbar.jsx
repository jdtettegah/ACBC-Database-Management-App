import "./Topbar.css";
import { useState, useEffect, useRef } from "react";
import { getLoggedInUser } from "../services/api";
import {
  Menu,
  Bell,
  Search,
  User,
  Lock,
  Moon,
  Settings,
  LogOut
} from "lucide-react";

function Topbar({
  toggleSidebar,
  title = "Dashboard",
  onSearch
}) {
  const [openSettings, setOpenSettings] = useState(false);
  const [user, setUser] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const settingsRef = useRef(null); // ✅ NEW

  useEffect(() => {
    const u = getLoggedInUser();
    setUser(u);
  }, []);

  /* ================= CLOSE ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setOpenSettings(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") setOpenSettings(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    setOpenSettings(false); // ✅ close first
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  /* ================= SEARCH ================= */

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <header className="topbar">

      <div className="topbarFirstLine">

        {/* LEFT */}
        <div className="topbarAddress">

          <button className="hamburger" onClick={toggleSidebar}>
            <Menu size={22} />
          </button>

          <p>
            Welcome back,{" "}
            <strong>
              {user?.first_name || user?.username || "User"}
            </strong>
          </p>

        </div>

        {/* SEARCH */}
        <div className="topbar-search">
          <Search size={18} className="search-icon" />

          <input
            type="text"
            placeholder="Search members, reports..."
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>

        {/* RIGHT */}
        <div className="topbar-actions">

          {/* NOTIFICATIONS */}
          <div className="notification">
            <Bell size={20} />
            <span className="badge">3</span>
          </div>

          {/* SETTINGS */}
          <div className="settings-wrapper" ref={settingsRef}> {/* ✅ attach ref */}

            <div
              className="avatar"
              onClick={() => setOpenSettings(!openSettings)}
            >
              {user?.first_name?.charAt(0) || "U"}
            </div>

            {openSettings && (
              <div className="settings-menu">

                <p>
                  <User size={16} />
                  {user?.first_name} {user?.last_name}
                </p>

                <hr />

                <p onClick={() => setOpenSettings(false)}>
                  <Lock size={16} />
                  Change Password
                </p>

                <p onClick={() => setOpenSettings(false)}>
                  <Moon size={16} />
                  Theme
                </p>

                <p onClick={() => setOpenSettings(false)}>
                  <Settings size={16} />
                  Preferences
                </p>

                <hr />

                <p className="logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </p>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECOND LINE */}
      <div className="topbarSecondLine">
        <p>{title}</p>
      </div>

    </header>
  );
}

export default Topbar;