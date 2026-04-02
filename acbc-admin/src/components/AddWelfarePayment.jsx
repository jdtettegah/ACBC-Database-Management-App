import { useState } from "react";
import { recordWelfarePayment, getLoggedInUser } from "../services/api";

function AddWelfarePayment({ member, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState("");

  const user = getLoggedInUser();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await recordWelfarePayment({
        event_member_id: member.event_member_id,
        amount: Number(amount),
        payment_method: method,
        payment_reference: method === "Momo" ? ref : null,
        date_paid: date,
        recorded_by: user.id
      });

      alert("✅ Payment successful");

      onClose();
      onSaved();

    } catch (err) {
      console.error(err);
      alert("❌ Payment failed");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="event-modal">

        <h3>Pay for {member.first_name}</h3>

        <form onSubmit={handleSubmit}>

          <input
            type="number"
            placeholder="Amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Momo">Momo</option>
          </select>

          {method === "Momo" && (
            <input
              type="text"
              placeholder="Reference"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              required
            />
          )}

          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Pay</button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddWelfarePayment;