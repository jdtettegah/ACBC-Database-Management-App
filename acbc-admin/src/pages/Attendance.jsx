import DashboardLayout from "../layouts/DashboardLayout";
import AdminAttendance from "./Attendance/AdminAttendance";
import PastorAttendance from "./Attendance/PastorAttendance";
import SecretaryAttendance from "./Attendance/SecretaryAttendance";

function Attendance() {
  // Correct way to read role
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let Page;

  switch (role) {
    case "Admin":
      Page = <AdminAttendance />;
      break;

    case "Pastor":
      Page = <PastorAttendance />;
      break;

    case "General Secretary":
      Page = <SecretaryAttendance />;
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

export default Attendance;
