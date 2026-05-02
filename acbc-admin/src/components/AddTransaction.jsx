import "./AddTransaction.css";
import { useState, useEffect } from "react";

import {
  addIncome,
  addExpenditure,
  getApprovers
} from "../services/api";

import { getLoggedInUser } from "../services/api";
import { HandCoins } from "lucide-react";
import { createPortal } from "react-dom";


function AddTransaction({ onSaved }) {

  /* ================= STATES ================= */

  const [type, setType] = useState("Income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  // Will hold selected user_id
  const [approvedBy, setApprovedBy] = useState("");

  // Will hold approvers from DB
  const [approvers, setApprovers] = useState([]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingApprovers, setLoadingApprovers] = useState(false);

  const user = getLoggedInUser();



  /* ================= LOAD APPROVERS ================= */

  useEffect(() => {

    const loadApprovers = async () => {

      try {

        setLoadingApprovers(true);

        const data = await getApprovers();

        setApprovers(data);

      } catch (err) {

        console.error("Failed to load approvers:", err);

        alert("Failed to load approvers");

      } finally {

        setLoadingApprovers(false);

      }
    };

    loadApprovers();

  }, []);



  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    /* Basic validation */
    if (!amount || !date) {
      return alert("Amount and date are required");
    }

    if (type === "Expense" && !approvedBy) {
      return alert("Please select who approved this expense");
    }

    try {

      setLoading(true);


      /* ====== INCOME ====== */
      if (type === "Income") {

        await addIncome({
          income_type: category,
          amount,
          source_description: description,
          date_received: date,
          recorded_by: user.id
        });

      }


      /* ====== EXPENSE ====== */
      else {

        await addExpenditure({
          category,
          amount,
          description,

          // Send user_id
          approved_by: approvedBy,

          recorded_by: user.id,
          date_spent: date,
        });

      }

      alert("Transaction saved successfully ✅");


      /* Close modal */
      setOpen(false);

      if (onSaved) onSaved();


      /* Reset form */
      setType("Income");
      setCategory("");
      setAmount("");
      setDate("");
      setDescription("");
      setApprovedBy("");


    } catch (err) {

      console.error("Save error:", err);

      alert(err.message || "Failed to save transaction");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
  
    if (open) {
      window.addEventListener("keydown", handleEsc);
    }
  
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);



  /* ================= UI ================= */

  return (
    <>
      {/* OPEN BUTTON */}
      <button
        className="add-transaction-button"
        onClick={() => setOpen(true)}
      >
        <HandCoins size={18}/>
        Add Transaction
      </button>


      {/* MODAL */}
      {open && createPortal(

        <div className="add-transaction-modal-overlay" onClick={() => setOpen(false)}>

          <div className="add-transaction-page" onClick={(e) => e.stopPropagation()}>

            {/* HEADER */}
            <div className="add-transaction-header">
              <h2>Add Transaction</h2>
              <p>Record Church Income or Expense</p>
            </div>


            {/* FORM */}
            <form
              className="add-transaction-form"
              onSubmit={handleSubmit}
            >

              {/* TYPE */}
              <div className="add-transaction-form-group">
                <label>Transaction Type</label>

                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>


              {/* CATEGORY */}
              <div className="add-transaction-form-group">
                <label>Category</label>

                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Offering, Fuel, Maintenance"
                  required
                />
              </div>


              {/* AMOUNT */}
              <div className="add-transaction-form-group">
                <label>Amount (GHS)</label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>


              {/* DATE */}
              <div className="add-transaction-form-group">
                <label>Date</label>

                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>



              {/* APPROVED BY (ONLY FOR EXPENSE) */}
              {type === "Expense" && (

                <div className="add-transaction-form-group">
                  <label>Approved By</label>

                  <select
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    required
                    disabled={loadingApprovers}
                  >
                    <option value="">
                      {loadingApprovers
                        ? "Loading approvers..."
                        : "-- Select Approver --"}
                    </option>

                    {approvers.map(a => (
                      <option
                        key={a.user_id}
                        value={a.user_id}
                      >
                         {a.role_name}
                      </option>
                    ))}

                  </select>
                </div>

              )}



              {/* DESCRIPTION */}
              <div className="add-transaction-form-group full-width">
                <label>Description</label>

                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>



              {/* ACTION BUTTONS */}
              <div className="add-transaction-actions">

                <button
                  type="button"
                  className="add-transaction-cancel-btn"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-transaction-save-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>

              </div>

            </form>

          </div>

        </div>,
        document.body

      )}

    </>
  );
}

export default AddTransaction;