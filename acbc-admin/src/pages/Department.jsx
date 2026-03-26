import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "./dashboards/AdminDashboard";
import PastorDashboard from "./dashboards/PastorDashboard";
import SecretaryDashboard from "./dashboards/SecretaryDashboard";
import FinanceDashboard from "./dashboards/FinanceDashboard";
import AdminFinance from "./Finance/AdminFinance";
import PastorFinance from "./Finance/PastorFinance";
import FinancialSecretaryFinance from "./Finance/FinancialSecretaryFinance";
import AdminDepartment from "./Department/AdminDepartment";
import PastorDepartments from "./Department/PastorDepartment";
import SecretaryDepartments from "./Department/SecretaryDepartment";

function Department() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminDepartment />;
      break;

    case "Pastor":
      Page = <PastorDepartments />;
      break;

    case "General Secretary":
      Page = <SecretaryDepartments />;
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

export default Department;
