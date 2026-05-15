import { useState, useEffect } from "react";
import { recordWelfarePayment, getLoggedInUser } from "../services/api";
import "./AddWelfarePayment.css"

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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
  
    window.addEventListener("keydown", handleEsc);
  
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div className="welfarePayment-modal-overlay" onClick={onClose}>
      <div className="welfarePayment-modal"  onClick={(e) => e.stopPropagation()}>

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

          <div className="welfarePayment-modal-actions">
            <button type="button" onClick={onClose} className="welfarePayment-close-btn">
              Cancel
            </button>
            <button type="submit" className="welfarePayment-pay-btn">Pay</button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddWelfarePayment;