import DashboardLayout from "../layouts/DashboardLayout";
import AdminMembers from "./Members/AdminMembers";
import PastorMember from "./Members/PastorMember";
import SecretaryMembers from "./Members/SecretaryMembers";
import { getLoggedInUser } from "../services/api";

function Members() {
  // Correct way to read role
  const user = getLoggedInUser();
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminMembers />;
      break;

    case "Pastor":
      Page = <PastorMember />;
      break;

    case "General Secretary":
      Page = <SecretaryMembers />;
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

export default Members;
