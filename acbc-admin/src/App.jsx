import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Attendance from "./pages/Attendance"
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

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        {/* PROTECTED DASHBOARD ROUTES */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/members"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={["Admin", "General Secretary", "Pastor"]}>
                <Members />
              </RoleProtectedRoute>
            </ProtectedRoute>
         }
        />


        <Route
          path="/dashboard/attendance"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={["Admin", "General Secretary", "Pastor"]}>
                <Attendance />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        <Route
          path="/dashboard/finance"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={["Admin", "Financial Secretary", "Pastor"]}>
                <Finance />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />


        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={["Admin", "Pastor", "General Secretary", "Financial Secretary"]}>
                <Reports />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />

        <Route
          path="/dashboard/meetings"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={[ "General Secretary"]}>
                <Meetings />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />

        <Route
          path="/dashboard/tithe"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={ ["Admin", "Pastor", "General Secretary", "Financial Secretary"]}>
                <Tithe />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />

        <Route
          path="/dashboard/welfare"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={ ["Admin", "Pastor", "Financial Secretary"]}>
                <Welfare />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />

        <Route
          path="/dashboard/department"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={[ "Admin","General Secretary", "Pastor"]}>
                <Department />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />

        <Route
          path="/dashboard/welfare/history/:id"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={["Admin", "Pastor", "General Secretary", "Financial Secretary"]}>
                <WelfareHistoryModal />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
