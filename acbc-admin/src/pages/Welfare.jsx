import DashboardLayout from "../layouts/DashboardLayout";
import AdminWelfare from "./Welfare/AdminWelfare";
import FinanceWelfare from "./Welfare/FinanceWelfare";
import PastorWelfare from "./Welfare/PastorWelfare";

function Welfare() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminWelfare />;
      break;

    case "Pastor":
      Page = <PastorWelfare />;
      break;

    case "Financial Secretary":
      Page = <FinanceWelfare />;
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

export default Welfare;
