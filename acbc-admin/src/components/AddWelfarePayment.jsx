import { useState } from "react";
import { recordWelfarePayment } from "../services/api";

function AddWelfarePayment({ member, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);

  if (!member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      await recordWelfarePayment({
        event_member_id: member.id,
        amount: Number(amount),
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        date_paid: new Date().toISOString().split("T")[0],
        recorded_by: JSON.parse(localStorage.getItem("user"))?.id
      });

      alert("Payment recorded successfully");

      onSaved();   // reload members
      onClose();   // close modal

    } catch (err) {
      console.error(err);
      alert("Failed to record payment");
    }

    setLoading(false);
  };

  const balance = member.expected_amount - member.total_paid;

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h3>Record Payment</h3>

        <p>
          <strong>{member.first_name} {member.last_name}</strong>
        </p>

        <p>Balance: GH₵ {balance.toFixed(2)}</p>

        <form onSubmit={handleSubmit}>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Momo">Momo</option>
            <option value="Card">Card</option>
          </select>

          <input
            type="text"
            placeholder="Reference (optional)"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />

          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Payment"}
            </button>

            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddWelfarePayment;