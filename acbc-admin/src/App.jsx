import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Attendance from "./pages/Attendance";
import ProtectedRoute from "./components/ProtectedRoute";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Meetings from "./pages/Meetings";
import Department from "./pages/Department";
import Welfare from "./pages/Welfare";
import Tithe from "./pages/Tithe";
import WelfareHistoryModal from "./pages/Welfare/WelfareHistoryModal";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            DEFAULT
        ===================================================== */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =====================================================
            DASHBOARD
        ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            MEMBERS
        ===================================================== */}

        <Route
          path="/dashboard/members"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "General Secretary",
                  "Pastor"
                ]}
              >
                <Members />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ATTENDANCE
        ===================================================== */}

        <Route
          path="/dashboard/attendance"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "General Secretary",
                  "Pastor"
                ]}
              >
                <Attendance />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


              {/* =====================================================
            FINANCE
        ===================================================== */}

        {/* General Finance */}

        <Route
          path="/dashboard/finance"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Financial Secretary",
                  "Pastor"
                ]}
              >
                <Finance />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            MAIN CHURCH
        ===================================================== */}

        <Route
          path="/dashboard/finance/main-church"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Financial Secretary",
                  "Pastor"
                ]}
              >
                <Finance
                  fundCode="MAIN"
                  fundName="Main Church"
                />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            MEN
        ===================================================== */}

        <Route
          path="/dashboard/finance/men"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Financial Secretary",
                  "Pastor"
                ]}
              >
                <Finance
                  fundCode="MEN"
                  fundName="Men"
                />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            YOUTH
        ===================================================== */}

        <Route
          path="/dashboard/finance/youth"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Financial Secretary",
                  "Pastor"
                ]}
              >
                <Finance
                  fundCode="YOUTH"
                  fundName="Youth"
                />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            WOMEN / WMU
        ===================================================== */}

        <Route
          path="/dashboard/finance/women"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Financial Secretary",
                  "Pastor"
                ]}
              >
                <Finance
                  fundCode="WOMEN"
                  fundName="Women"
                />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            CHILDREN
        ===================================================== */}

        <Route
          path="/dashboard/finance/children"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Financial Secretary",
                  "Pastor"
                ]}
              >
                <Finance
                  fundCode="CHILDREN"
                  fundName="Children"
                />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

              

        {/* =====================================================
            REPORTS
        ===================================================== */}

        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Pastor",
                  "General Secretary",
                  "Financial Secretary"
                ]}
              >
                <Reports />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            MEETINGS
        ===================================================== */}

        <Route
          path="/dashboard/meetings"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "General Secretary"
                ]}
              >
                <Meetings />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            TITHE
        ===================================================== */}

        <Route
          path="/dashboard/tithe"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Pastor",
                  "General Secretary",
                  "Financial Secretary"
                ]}
              >
                <Tithe />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            WELFARE
        ===================================================== */}

        <Route
          path="/dashboard/welfare"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Pastor",
                  "Financial Secretary"
                ]}
              >
                <Welfare />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            DEPARTMENT
        ===================================================== */}

        <Route
          path="/dashboard/department"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "General Secretary",
                  "Pastor"
                ]}
              >
                <Department />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            WELFARE HISTORY
        ===================================================== */}

        <Route
          path="/dashboard/welfare/history/:id"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Pastor",
                  "General Secretary",
                  "Financial Secretary"
                ]}
              >
                <WelfareHistoryModal />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            CATCH ALL
        ===================================================== */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;