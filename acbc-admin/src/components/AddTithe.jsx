import { useEffect, useState } from "react";
import { getMembers } from "../services/api";
import { saveBulkTithe } from "../services/api";
import "./AddTithe.css";
import { getLoggedInUser } from "../services/api";

function AddTithe({ onSaved }) {
  const [members, setMembers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState({});
  const [paymentReference, setPaymentReference] = useState({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = getLoggedInUser();

  /* Load Members */
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data);
    } catch {
      alert("Failed to load members");
    }
  };

  /* Handle Amount */
  const handleAmount = (id, value) => {
    setAmounts(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handlePaymentMethod = (id, value) => {
    setPaymentMethod(prev => ({
      ...prev,
      [id]: value
    }));
    // Reset reference if switching to Cash
    if (value === "Cash") {
      setPaymentReference(prev => ({
        ...prev,
        [id]: ""
      }));
    }
  };

  const handlePaymentReference = (id, value) => {
    setPaymentReference(prev => ({
      ...prev,
      [id]: value
    }));
  };

  /* Save Tithes */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!date) return alert("Select date");

    const tithes = [];

    for (let m of members) {
      const amt = amounts[m.id];
      if (amt && amt > 0) {
        const method = paymentMethod[m.id] || "Cash";
        const reference = method === "Momo" ? paymentReference[m.id] : null;

        if (method === "Momo" && !reference) {
          return alert(`Payment reference required for ${m.first_name} ${m.last_name}`);
        }

        tithes.push({
          member_id: m.id,
          member_code: m.member_code,
          amount: parseFloat(amt),
          payment_method: method,
          payment_reference: reference
        });
      }
    }

    if (!tithes.length) return alert("No tithe entered");

    try {
      setLoading(true);

      const res = await saveBulkTithe({
        date_paid: date,
        recorded_by: user.id,
        tithes
      });

      alert(`Saved ${res.count} tithes`);

      setOpen(false);
      setAmounts({});
      setPaymentMethod({});
      setPaymentReference({});
      setDate("");

      if (onSaved) onSaved();
    } catch (err) {
      alert(err.message || "Failed to save tithes");
    }

    setLoading(false);
  };

  return (
    <>
      {/* OPEN BUTTON */}
      <button
        className="add-attendance-button"
        onClick={() => setOpen(true)}
      >
        💰 Record Tithe
      </button>

      {open && (
        <div className="modal-overlay">
          <div className="transaction-page tithe-container">

            {/* HEADER */}
            <div className="transaction-header">
              <h2>Record Tithe</h2>
              <p>Enter weekly or daily tithe contributions</p>
            </div>

            {/* FORM */}
            <form
              className="transaction-form tithe-form"
              onSubmit={handleSave}
            >
              {/* DATE */}
              <div className="form-group full-width">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* MEMBERS TABLE */}
              <div className="tithe-table-wrapper full-width">
                <table className="tithe-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Member ID</th>
                      <th>Amount (GHS)</th>
                      <th>Payment Method</th>
                      <th>Reference (if Momo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr key={m.id}>
                        <td>{i + 1}</td>
                        <td>{m.first_name} {m.last_name}</td>
                        <td>{m.member_code}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={amounts[m.id] || ""}
                            onChange={e => handleAmount(m.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            value={paymentMethod[m.id] || "Cash"}
                            onChange={e => handlePaymentMethod(m.id, e.target.value)}
                          >
                            <option value="Cash">Cash</option>
                            <option value="Momo">Momo</option>
                          </select>
                        </td>
                        <td>
                          {paymentMethod[m.id] === "Momo" && (
                            <input
                              type="text"
                              placeholder="Reference"
                              value={paymentReference[m.id] || ""}
                              onChange={e => handlePaymentReference(m.id, e.target.value)}
                              required
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTION BUTTONS */}
              <div className="transaction-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddTithe;