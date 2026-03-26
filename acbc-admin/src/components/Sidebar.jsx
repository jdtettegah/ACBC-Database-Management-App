import { NavLink, useLocation } from "react-router-dom";
import churchLogo from "../assets/church-logo.png";
import "./sidebar.css";

function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const location = useLocation();

  const menuByRole = {
    Admin: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Members", path: "/dashboard/members" },
      { name: "Attendance", path: "/dashboard/attendance" },
      { name: "Finance", path: "/dashboard/finance" },
      { name: "Reports", path: "/dashboard/reports" },
      { name: "Department", path: "/dashboard/department"},
    ],

    Pastor: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Members", path: "/dashboard/members" },
      { name: "Attendance", path: "/dashboard/attendance" },
      { name: "Finance", path: "/dashboard/finance" }, // view only
      { name: "Reports", path: "/dashboard/reports" },
      { name: "Department", path: "/dashboard/department"},
    ],

    "General Secretary": [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Members", path: "/dashboard/members" },
      { name: "Attendance", path: "/dashboard/attendance" },
      { name: "Meetings", path: "/dashboard/meetings" },
      { name: "Reports", path: "/dashboard/reports" },
      { name: "Department", path: "/dashboard/department"},
    ],

    "Financial Secretary": [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Finance", path: "/dashboard/finance" },
      { name: "Reports", path: "/dashboard/reports" },
    ],
  };

  const links = menuByRole[role] || [];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">acbcAdmin</h2>
        <img src={churchLogo} alt="ACBC Logo" id="acbc-sidebar-logo" />
      </div>

      <nav>
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === "/dashboard"} 
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
