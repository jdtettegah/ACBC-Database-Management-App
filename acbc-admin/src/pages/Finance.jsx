import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "./dashboards/AdminDashboard";
import PastorDashboard from "./dashboards/PastorDashboard";
import SecretaryDashboard from "./dashboards/SecretaryDashboard";
import FinanceDashboard from "./dashboards/FinanceDashboard";
import AdminFinance from "./Finance/AdminFinance";
import PastorFinance from "./Finance/PastorFinance";
import FinancialSecretaryFinance from "./Finance/FinancialSecretaryFinance";

function Finance() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminFinance />;
      break;

    case "Pastor":
      Page = <PastorFinance />;
      break;

    case "Financial Secretary":
      Page = <FinancialSecretaryFinance />;
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

export default Finance;
