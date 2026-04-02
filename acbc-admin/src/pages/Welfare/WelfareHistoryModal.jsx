import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getWelfarePaymentHistory } from "../../services/api";

function WelfareHistoryModal() {
  const { id } = useParams();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await getWelfarePaymentHistory(id);
    setHistory(data);
  };

  return (
    <div className="finance-page">

      <h2>Member Welfare History</h2>

      <table className="finance-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Expected</th> {/* ✅ ADDED */}
            <th>Paid</th>
            <th>Date</th>
            <th>Method</th>
            <th>Reference</th>
          </tr>
        </thead>

        <tbody>
          {history.map((h, i) => (
            <tr key={i}>
              <td>{h.event_name}</td>
              <td>GH₵ {Number(h.expected_amount).toFixed(2)}</td> {/* ✅ */}
              <td>GH₵ {h.amount}</td>
              <td>{h.date_paid?.slice(0,10)}</td>
              <td>{h.payment_method}</td>
              <td>{h.payment_reference || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default WelfareHistoryModal;