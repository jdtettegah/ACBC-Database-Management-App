import { useEffect, useState } from "react";
import {
  getWelfareExpenseTypes,
  addWelfareExpense,
  getMembers,
  getLoggedInUser
} from "../services/api";

import "./AddWelfareExpense.css";

function AddWelfareExpense({ onClose, onSaved }) {

  const [types, setTypes] = useState([]);
  const [members, setMembers] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    expense_type_id: "",
    beneficiary_member_id: "",
    date_spent: "",
  });

  const [loading, setLoading] = useState(false);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, membersRes] = await Promise.all([
        getWelfareExpenseTypes(),
        getMembers()
      ]);

      setTypes(typesRes);
      setMembers(membersRes);

    } catch (err) {
      console.error(err);
    }
  };

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const user = getLoggedInUser();

      await addWelfareExpense({
        ...form,
        amount: parseFloat(form.amount),
        recorded_by: user.id,
        approved_by: user.id
      });

      alert("✅ Expense recorded");

      onSaved && onSaved();
      onClose && onClose();

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ESC CLOSE ================= */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  /* ================= UI ================= */

  return (
    <div
      className="welfareExpense-modal-overlay"
      onClick={onClose} // ✅ CLICK OUTSIDE CLOSE
    >
      <div
        className="welfareExpense-modal-content"
        onClick={(e) => e.stopPropagation()} // ❌ Prevent inside click
      >

        <h2>Add Welfare Expense</h2>

        <form onSubmit={handleSubmit} className="welfareExpense-form-grid">

          <input
            type="text"
            name="title"
            placeholder="Expense Title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            required
          />

          <select
            name="expense_type_id"
            value={form.expense_type_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Expense Type</option>
            {types.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          <select
            name="beneficiary_member_id"
            value={form.beneficiary_member_id}
            onChange={handleChange}
          >
            <option value="">Select Beneficiary (optional)</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="date_spent"
            value={form.date_spent}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <div className="welfareExpense-form-action">

            <button
              type="button"
              className="welfareExpense-cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="welfareExpense-save-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Expense"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default AddWelfareExpense;