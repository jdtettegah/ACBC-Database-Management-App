import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "./dashboards/AdminDashboard";
import PastorDashboard from "./dashboards/PastorDashboard";
import SecretaryDashboard from "./dashboards/SecretaryDashboard";
import FinanceDashboard from "./dashboards/FinanceDashboard";

function Dashboard() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminDashboard />;
      break;

    case "Pastor":
      Page = <PastorDashboard />;
      break;

    case "General Secretary":
      Page = <SecretaryDashboard />;
      break;

    case "Financial Secretary":
      Page = <FinanceDashboard />;
      break;

    default:
      Page = <h2>Unauthorized role</h2>;
  }

  return (
    <DashboardLayout>
      {Page}
    </DashboardLayout>
  );
}

export default Dashboard;
