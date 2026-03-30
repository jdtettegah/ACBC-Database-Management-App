import DashboardLayout from "../layouts/DashboardLayout";
import AdminTithe from "./Tithe/AdminTithe";

function Tithe() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminTithe />;
      break;

    case "Pastor":
      Page = <PastorTithe />;
      break;

    case "Financial Secretary":
      Page = <FinanceTithe />;
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

export default Tithe;
