import { useEffect, useState } from "react";

import {
  getWelfareEvents,
  getWelfareEventMembersFull
} from "../../services/api";

import AddWelfareBulk from "../../components/AddWelfareDues";
import AddWelfarePayment from "../../components/AddWelfarePayment";
import CreateWelfareEvent from "../../components/createWelfareEvent"


import "./AdminWelfare.css";

function AdminWelfare() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  /* ================= LOAD EVENTS ================= */
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getWelfareEvents();

      setEvents(data);

      // ✅ Always pick latest event
      if (data.length > 0) {
        setSelectedEvent(data[0]);
        loadMembers(data[0].id);
      }

    } catch (err) {
      console.error(err);
      alert("Failed to load events");
    }

    setLoading(false);
  };

  /* ================= LOAD MEMBERS ================= */
  const loadMembers = async (eventId) => {
    try {
      const data = await getWelfareEventMembersFull(eventId);
      setMembers(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load members");
    }
  };

  /* ================= CHANGE EVENT ================= */
  const handleEventChange = (e) => {
    const id = e.target.value;
    const event = events.find(ev => ev.id == id);

    setSelectedEvent(event);
    loadMembers(id);
  };

  /* ================= FILTER ================= */
  const filteredMembers = members.filter(m => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  /* ================= STATS ================= */
  const totalExpected = members.reduce(
    (sum, m) => sum + Number(m.expected_amount || 0),
    0
  );

  const totalCollected = members.reduce(
    (sum, m) => sum + Number(m.total_paid || 0),
    0
  );

  const balance = totalExpected - totalCollected;

  const progress =
    totalExpected === 0
      ? 0
      : (totalCollected / totalExpected) * 100;

  if (loading) return <p className="loading">Loading welfare...</p>;

  return (
    <div className="finance-page">

      {/* HEADER */}
      <div className="finance-header">
        <h2>Welfare Management</h2>

        <div className="actions">
          <CreateWelfareEvent onCreated={loadEvents} />
          <AddWelfareBulk
            onSaved={() =>
              selectedEvent && loadMembers(selectedEvent.id)
            }
          />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="finance-controls">

        <select
          value={selectedEvent?.id || ""}
          onChange={handleEventChange}
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.event_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* STATS */}
      <div className="finance-stats">

        <div className="stats-card">
          <h4>Total Expected</h4>
          <p>GH₵ {totalExpected.toFixed(2)}</p>
        </div>

        <div className="stats-card green">
          <h4>Collected</h4>
          <p>GH₵ {totalCollected.toFixed(2)}</p>
        </div>

        <div className="stats-card red">
          <h4>Balance</h4>
          <p>GH₵ {balance.toFixed(2)}</p>
        </div>

      </div>

      {/* PROGRESS BAR */}
      <div className="progress-container">
        <div className="progress-label">
          {progress.toFixed(1)}% collected
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Expected</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredMembers.map(m => {
              const memberBalance =
                Number(m.expected_amount) -
                Number(m.total_paid);

              return (
                <tr key={m.event_member_id}>
                  <td>{m.first_name} {m.last_name}</td>

                  <td>GH₵ {Number(m.expected_amount).toFixed(2)}</td>

                  <td className="green-text">
                    GH₵ {Number(m.total_paid).toFixed(2)}
                  </td>

                  <td className="red-text">
                    GH₵ {memberBalance.toFixed(2)}
                  </td>

                  <td>
                    <span className={`status ${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="pay-btn"
                      disabled={m.status === "PAID"}
                      onClick={() => {
                        setSelectedMember(m);
                        setPaymentOpen(true);
                      }}
                    >
                      Pay
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {paymentOpen && (
        <AddWelfarePayment
          member={selectedMember}
          onClose={() => setPaymentOpen(false)}
          onSaved={() =>
            selectedEvent && loadMembers(selectedEvent.id)
          }
        />
      )}

    </div>
  );
}

export default AdminWelfare;