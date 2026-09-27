import { NavLink, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Wallet,
  Landmark,
  HeartHandshake,
  FileText,
  Building2,
  ChevronDown,
  Church,
  UserRound,
  UsersRound,
  Baby,
} from "lucide-react";

import { useState, useEffect } from "react";

import acbclogo from "../assets/acbc-logo.png";
import "./sidebar.css";
import usePWAInstall from "../hooks/usePWAInstall";

function Sidebar() {
  const { install, isInstallable } = usePWAInstall();

  const location = useLocation();

  /*
  ============================================================
  USER / ROLE
  ============================================================
  */

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  /*
  ============================================================
  FINANCE STATE
  ============================================================
  */

  // Check if the current page is inside Finance
  const isFinancePage = location.pathname.startsWith(
    "/dashboard/finance"
  );

  const [financeOpen, setFinanceOpen] = useState(isFinancePage);

  /*
  ============================================================
  KEEP FINANCE OPEN WHEN INSIDE FINANCE
  ============================================================
  */

  useEffect(() => {
    if (isFinancePage) {
      setFinanceOpen(true);
    }
  }, [isFinancePage]);

  /*
  ============================================================
  PWA
  ============================================================
  */

  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches;

    if (installed) {
      console.log("Running as installed app");
    }
  }, []);

  useEffect(() => {
    const handleAppInstalled = () => {
      console.log("ACBC installed");
      alert("Thank you for installing ACBC!");
    };

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  /*
  ============================================================
  FINANCE SUBMENU
  ============================================================
  */

  const financeLinks = [
    {
      name: "Main Church",
      path: "/dashboard/finance/main-church",
      icon: <Church size={17} />,
    },
    {
      name: "Men",
      path: "/dashboard/finance/men",
      icon: <UserRound size={17} />,
    },
    {
      name: "Youth",
      path: "/dashboard/finance/youth",
      icon: <UsersRound size={17} />,
    },
    {
      name: "Women",
      path: "/dashboard/finance/women",
      icon: <UserRound size={17} />,
    },
    {
      name: "Children",
      path: "/dashboard/finance/children",
      icon: <Baby size={17} />,
    },
  ];

  /*
  ============================================================
  NORMAL MENU ITEMS BY ROLE
  ============================================================
  */

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
        isFinance: true,
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
        isFinance: true,
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
        isFinance: true,
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

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="sidebar">

      {/* ================= LOGO ================= */}

      <div className="sidebar-header">
        <Link to="/dashboard">
          <img
            src={acbclogo}
            alt="ACBC Logo"
            id="acbc-sidebar-logo"
          />
        </Link>
      </div>

      {/* ================= NAVIGATION ================= */}

      <nav>
        {links.map((link) => {

          /*
          ======================================================
          FINANCE MENU
          ======================================================
          */

          if (link.isFinance) {
            return (
              <div
                key={link.name}
                className="finance-menu"
              >

                {/* Finance button */}

                <button
                  type="button"
                  className={`finance-toggle ${
                    isFinancePage || financeOpen
                      ? "finance-open"
                      : ""
                  }`}
                  onClick={() =>
                    setFinanceOpen((prev) => !prev)
                  }
                >
                  <span className="nav-icon">
                    {link.icon}
                  </span>

                  <span className="finance-title">
                    Finance
                  </span>

                  <ChevronDown
                    size={18}
                    className={`finance-chevron ${
                      financeOpen ? "rotate" : ""
                    }`}
                  />
                </button>

                {/* Finance submenu */}

                {financeOpen && (
                  <div className="finance-submenu">
                    {financeLinks.map((financeLink) => (
                      <NavLink
                        key={financeLink.name}
                        to={financeLink.path}
                        className={({ isActive }) =>
                          `finance-sub-link ${
                            isActive ? "active" : ""
                          }`
                        }
                      >
                        <span className="sub-icon">
                          {financeLink.icon}
                        </span>

                        <span>
                          {financeLink.name}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                )}

              </div>
            );
          }

          /*
          ======================================================
          NORMAL MENU ITEM
          ======================================================
          */

          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === "/dashboard"}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <span className="nav-icon">
                {link.icon}
              </span>

              <span>
                {link.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* ================= PWA INSTALL ================= */}

      {isInstallable && (
        <button
          onClick={install}
          className="install-btn"
        >
          📱 Install ACBC App
        </button>
      )}

    </div>
  );
}

export default Sidebar;
