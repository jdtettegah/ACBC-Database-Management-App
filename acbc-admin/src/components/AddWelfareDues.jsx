import { useEffect, useState } from "react";
import {
  getWelfareEvents,
  getWelfareEventMembersFull,
  saveBulkWelfare,
  getLoggedInUser
} from "../services/api";

import "./AddWelfareDues.css";
import { Wallet } from "lucide-react";

function AddWelfareDues({ onSaved }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [members, setMembers] = useState([]);

  const [amounts, setAmounts] = useState({});
  const [methods, setMethods] = useState({});
  const [refs, setRefs] = useState({});

  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = getLoggedInUser();

  /* ================= LOAD EVENTS ================= */
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getWelfareEvents();

      // ✅ ONLY DUES EVENTS
      const dues = data.filter(
        (e) => e.event_type?.toUpperCase() === "DUES"
      );

      setEvents(dues);

      if (dues.length > 0) {
        setSelectedEvent(dues[0].id);
        loadMembers(dues[0].id);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load events");
    }
  };

  /* ================= LOAD MEMBERS ================= */
  const loadMembers = async (eventId) => {
    try {
      const data = await getWelfareEventMembersFull(eventId);

      console.log("DUES MEMBERS:", data);

      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load members");
    }
  };

  /* ================= HANDLERS ================= */
  const handleAmount = (id, value) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleMethod = (id, value) => {
    setMethods((prev) => ({ ...prev, [id]: value }));

    if (value === "Cash") {
      setRefs((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleRef = (id, value) => {
    setRefs((prev) => ({ ...prev, [id]: value }));
  };

  const handleEventChange = async (eventId) => {
    setSelectedEvent(eventId);
    setMembers([]);
    await loadMembers(eventId);
  };

  /* ================= SAVE ================= */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!date) return alert("Select date");

    const payments = [];

    for (let m of members) {
      const amt = amounts[m.event_member_id];

      if (amt && amt > 0) {
        const method = methods[m.event_member_id] || "Cash";
        const ref =
          method === "Momo" ? refs[m.event_member_id] : null;

        if (method === "Momo" && !ref) {
          return alert(
            `Reference required for ${m.first_name}`
          );
        }

        payments.push({
          event_member_id: m.event_member_id,
          amount: Number(amt),
          payment_method: method,
          payment_reference: ref
        });
      }
    }

    if (!payments.length) {
      return alert("No payments entered");
    }

    try {
      setLoading(true);

      const res = await saveBulkWelfare({
        date_paid: date,
        recorded_by: user.id,
        payments
      });

      alert(`Saved ${res.count} payments`);

      setOpen(false);
      setAmounts({});
      setMethods({});
      setRefs({});
      setDate("");

      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save");
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
      {/* OPEN BUTTON */}
      <button
        className="add-welfareDues-button"
        onClick={() => setOpen(true)}
      >
        <Wallet size={18} />
         Record Monthly Dues
      </button>

      {open && (
        <div className="welfareDues-modal-overlay" onClick={() => setOpen(false)}>
          <div className="welfareDues-page tithe-container" onClick={(e) => e.stopPropagation()}>

            {/* HEADER */}
            <div className="welfareDues-header">
              <h2>Monthly Welfare Dues</h2>
              <p>Select month and record contributions</p>
            </div>

            {/* EVENT SELECT */}
            <div className="welfareDues-form-group full-width">
              <label>Select Month</label>
              <select
                value={selectedEvent}
                onChange={(e) =>
                  handleEventChange(e.target.value)
                }
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_name}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div className="welfareDues-form-group full-width">
              <label>Date Paid</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* TABLE */}
            <form onSubmit={handleSave}>
              <div className="welfareDues-table-wrapper full-width">
                <table className="welfareDues-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Expected</th>
                      <th>Paid</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>

                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center" }}>
                          No members assigned
                        </td>
                      </tr>
                    ) : (
                      members.map((m, i) => (
                        <tr key={m.event_member_id}>
                          <td>{i + 1}</td>

                          <td>
                            {m.first_name} {m.last_name}
                          </td>

                          <td>{m.expected_amount}</td>

                          <td>{m.total_paid}</td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              value={
                                amounts[m.event_member_id] || ""
                              }
                              onChange={(e) =>
                                handleAmount(
                                  m.event_member_id,
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <select
                              value={
                                methods[m.event_member_id] ||
                                "Cash"
                              }
                              onChange={(e) =>
                                handleMethod(
                                  m.event_member_id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="Cash">
                                Cash
                              </option>
                              <option value="Momo">
                                Momo
                              </option>
                            </select>
                          </td>

                          <td>
                            {methods[m.event_member_id] ===
                              "Momo" && (
                              <input
                                type="text"
                                placeholder="Reference"
                                value={
                                  refs[m.event_member_id] ||
                                  ""
                                }
                                onChange={(e) =>
                                  handleRef(
                                    m.event_member_id,
                                    e.target.value
                                  )
                                }
                                required
                              />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ACTIONS */}
              <div className="welfareDues-actions">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" disabled={loading}>
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

export default AddWelfareDues;