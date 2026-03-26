import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "./dashboards/AdminDashboard";
import PastorDashboard from "./dashboards/PastorDashboard";
import SecretaryDashboard from "./dashboards/SecretaryDashboard";
import FinanceDashboard from "./dashboards/FinanceDashboard";
import AdminFinance from "./Finance/AdminFinance";
import AdminReports from "./Reports/AdminReports";
import PastorReports from "./Reports/PastorReports";
import SecretaryReports from "./Reports/SecretaryReports";
import FinanceReports from "./Reports/FinanceReports";

function Reports() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminReports />;
      break;

    case "Pastor":
      Page = <PastorReports />;
      break;

    case "General Secretary":
      Page = <SecretaryReports />;
      break;

    case "Financial Secretary":
      Page = <FinanceReports />;
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

export default Reports;
