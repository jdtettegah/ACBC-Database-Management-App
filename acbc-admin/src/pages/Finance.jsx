import DashboardLayout from "../layouts/DashboardLayout";

import AdminFinance from "./Finance/AdminFinance";
import PastorFinance from "./Finance/PastorFinance";
import FinancialSecretaryFinance from "./Finance/FinancialSecretaryFinance";

import MainChurchAddTransaction from "../components/mainChurchAddTransaction";
import YouthAddTransaction from "../components/youthAddTransaction";
import WMUAddTransaction from "../components/wmuAddTransaction";
import MenAddTransaction from "../components/menAddTransaction";
import ChildrenAddTransaction from "../components/childrenAddTransaction.jsx";

function Finance({ fundCode, fundName }) {
  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  let AddTransactionComponent;

    switch (fundCode) {
      case "MAIN":
        AddTransactionComponent = MainChurchAddTransaction;
        break;

      case "YOUTH":
        AddTransactionComponent = YouthAddTransaction;
        break;

      case "MEN":
        AddTransactionComponent = MenAddTransaction;
        break;

      case "WMU":
        AddTransactionComponent = WMUAddTransaction;
        break;

      case "CHILDREN":
        AddTransactionComponent = ChildrenAddTransaction;
        break;

      default:
        AddTransactionComponent = null;
    }


  let Page;

  switch (role) {
    case "Admin":
      Page = (
        <AdminFinance
          fundCode={fundCode}
          fundName={fundName}
          AddTransactionComponent={AddTransactionComponent}
        />
      );
      break;

    case "Pastor":
      Page = (
        <PastorFinance
          fundCode={fundCode}
          fundName={fundName}
        />
      );
      break;

    case "Financial Secretary":
      Page = (
        <FinancialSecretaryFinance
          fundCode={fundCode}
          fundName={fundName}
        />
      );
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