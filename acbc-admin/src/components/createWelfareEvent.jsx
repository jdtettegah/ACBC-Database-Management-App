import { useState, useEffect } from "react";
import {
  createWelfareEvent,
  assignMembersToWelfareEvent,
  getLoggedInUser,
  apiRequest
} from "../services/api";

import "./CreateWelfareEvent.css";
import { CalendarPlus } from "lucide-react";

function CreateWelfareEvent({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("DUES");

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [yearLoading, setYearLoading] = useState(false);

  const user = getLoggedInUser();

  const getCurrentMonthName = () => {
    const d = new Date();
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  /* ================= CREATE FULL YEAR ================= */
  const createFullYear = async () => {
    try {
      setYearLoading(true);

      const year = new Date().getFullYear();

      const res = await createWelfareEvent({
        event_type: "DUES",
        default_amount: Number(amount),
        created_by: user.id
      });

      if (!res.success) throw new Error();

      alert("✅ Full year dues created");
      setOpen(false);
      if (onCreated) onCreated();

    } catch {
      alert("❌ Failed to create yearly dues");
    }

    setYearLoading(false);
  };

  /* ================= CREATE SINGLE EVENT ================= */
  const handleCreate = async (e) => {
    e.preventDefault();
  
    try {
      setLoading(true);
  
      const eventName =
        type === "DUES"
          ? `${getCurrentMonthName()} Dues`
          : name;
  
      const res = await createWelfareEvent({
        event_name: eventName,
        event_type: type,
        default_amount: Number(amount),
        created_by: user.id
      });
  
      // ✅ SAFER CHECK
      if (!res || res.success !== true) {
        throw new Error(res?.message || "Creation failed");
      }
  
      alert("✅ Event created successfully");
  
      setOpen(false);
      setName("");
      setAmount("");
  
      if (onCreated) onCreated();
  
    } catch (err) {
      console.error("CREATE EVENT ERROR:", err);
      alert(err.message || "❌ Failed to create event");
    }
  
    setLoading(false);
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

  return (
    <>
      <button
        className="add-welfareEvent-button"
        onClick={() => setOpen(true)}
      >
        <CalendarPlus size={18} />
        Create Welfare Event
      </button>

      {open && (
        <div className="add-welfareEvent-modal-overlay" onClick={() => setOpen(false)}>
          <div className="add-welfareEvent-modal" onClick={(e) => e.stopPropagation()}>

            <h2>Create Welfare Event</h2>

            <form onSubmit={handleCreate}>

              {/* TYPE */}
              <div className="add-welfareEvent-form-group">
                <label>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="DUES">Monthly Dues</option>
                  <option value="SPECIAL">Special Contribution</option>
                </select>
              </div>

              {/* NAME */}
              {type === "SPECIAL" && (
                <div className="add-welfareEvent-form-group">
                  <label>Event Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              {/* AMOUNT */}
              <div className="add-welfareEvent-form-group">
                <label>Amount (GHS)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* INFO */}
              {type === "DUES" && (
                <p className="info-text">
                  This will create: <b>{getCurrentMonthName()} Dues</b>
                </p>
              )}

              {/* ACTIONS */}
              <div className="add-welfareEvent-modal-actions">
                <button
                  type="button"
                  className="add-welfareEvent-cancel-btn"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-welfareEvent-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Event"}
                </button>
              </div>

              {/* FULL YEAR BUTTON */}
              {type === "DUES" && (
                <button
                  type="button"
                  className="btn-year"
                  onClick={createFullYear}
                  disabled={yearLoading}
                >
                  {yearLoading
                    ? "Creating Year..."
                    : "📅 Create Full Year Dues"}
                </button>
              )}

            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateWelfareEvent;