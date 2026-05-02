import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Wallet,
  Landmark,
  HeartHandshake,
  FileText,
  Building2,
} from "lucide-react";

import acbclogo from "../assets/acbc-logo.png";
import "./sidebar.css";



function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const menuByRole = {
    Admin: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Members",
        path: "/dashboard/members",
        icon: <Users size={20} />,
      },
      {
        name: "Attendance",
        path: "/dashboard/attendance",
        icon: <ClipboardCheck size={20} />,
      },
      {
        name: "Finance",
        path: "/dashboard/finance",
        icon: <Wallet size={20} />,
      },
      {
        name: "Tithe",
        path: "/dashboard/tithe",
        icon: <Landmark size={20} />,
      },
      {
        name: "Welfare",
        path: "/dashboard/welfare",
        icon: <HeartHandshake size={20} />,
      },
      {
        name: "Reports",
        path: "/dashboard/reports",
        icon: <FileText size={20} />,
      },
      {
        name: "Department",
        path: "/dashboard/department",
        icon: <Building2 size={20} />,
      },
    ],

    Pastor: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Members",
        path: "/dashboard/members",
        icon: <Users size={20} />,
      },
      {
        name: "Attendance",
        path: "/dashboard/attendance",
        icon: <ClipboardCheck size={20} />,
      },
      {
        name: "Finance",
        path: "/dashboard/finance",
        icon: <Wallet size={20} />,
      },
      {
        name: "Tithe",
        path: "/dashboard/tithe",
        icon: <Landmark size={20} />,
      },
      {
        name: "Welfare",
        path: "/dashboard/welfare",
        icon: <HeartHandshake size={20} />,
      },
      {
        name: "Reports",
        path: "/dashboard/reports",
        icon: <FileText size={20} />,
      },
      {
        name: "Department",
        path: "/dashboard/department",
        icon: <Building2 size={20} />,
      },
    ],

    "General Secretary": [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Members",
        path: "/dashboard/members",
        icon: <Users size={20} />,
      },
      {
        name: "Attendance",
        path: "/dashboard/attendance",
        icon: <ClipboardCheck size={20} />,
      },
      {
        name: "Tithe",
        path: "/dashboard/tithe",
        icon: <Landmark size={20} />,
      },
      {
        name: "Department",
        path: "/dashboard/department",
        icon: <Building2 size={20} />,
      },
      {
        name: "Reports",
        path: "/dashboard/reports",
        icon: <FileText size={20} />,
      },
    ],

    "Financial Secretary": [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Finance",
        path: "/dashboard/finance",
        icon: <Wallet size={20} />,
      },
      {
        name: "Tithe",
        path: "/dashboard/tithe",
        icon: <Landmark size={20} />,
      },
      {
        name: "Welfare",
        path: "/dashboard/welfare",
        icon: <HeartHandshake size={20} />,
      },
      {
        name: "Reports",
        path: "/dashboard/reports",
        icon: <FileText size={20} />,
      },
    ],
  };

  const links = menuByRole[role] || [];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
      <Link to="/dashboard">
        <img
          src={acbclogo}
          alt="ACBC Logo"
          id="acbc-sidebar-logo"
          style={{ cursor: "pointer" }}
        />
      </Link>
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
            <span className="nav-icon">{link.icon}</span>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;