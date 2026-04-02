import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getWelfareEvents,
  getWelfareEventMembersFull,
  getWelfarePaymentHistory // ✅ ADD
} from "../../services/api";

import AddWelfareBulk from "../../components/AddWelfareDues";
import CreateWelfareEvent from "../../components/createWelfareEvent";
import AddWelfarePayment from "../../components/AddWelfarePayment";

import "./AdminWelfare.css";

function AdminWelfare() {

  const navigate = useNavigate();


  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  

  /* ================= LOAD EVENTS ================= */
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await getWelfareEvents();

    const sorted = data.sort((a, b) =>
      a.event_code.localeCompare(b.event_code)
    );

    setEvents(sorted);

    const currentMonth = new Date().getMonth() + 1;
    const currentCode = `${new Date().getFullYear()}-${String(currentMonth).padStart(2, "0")}`;

    const currentEvent = sorted.find(e =>
      e.event_code.includes(currentCode)
    );

    const selected = currentEvent || sorted[0];

    if (selected) {
      setSelectedEventId(selected.id);
      loadMembers(selected.id);
    }
  };

  const loadMembers = async (eventId) => {
    const data = await getWelfareEventMembersFull(eventId);
    setMembers(data);
  };

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedEventId(id);
    loadMembers(id);
  };

  /* ================= FILTER ================= */
  const filteredMembers = members.filter(m =>
    `${m.first_name} ${m.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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

  /* ================= EXPORT CSV ================= */
  const exportCSV = () => {
    const selectedEvent = events.find(e => e.id == selectedEventId);
  
    const title = selectedEvent
      ? `WELFARE DUES REPORT - ${selectedEvent.event_name.toUpperCase()}`
      : "WELFARE REPORT";
  
    const date = new Date().toLocaleDateString();
  
    const headers = ["Name", "Expected", "Paid", "Balance", "Status"];
  
    const rows = members.map(m => {
      const bal =
        Number(m.expected_amount) - Number(m.total_paid);
  
      return [
        `${m.first_name} ${m.last_name}`,
        m.expected_amount,
        m.total_paid,
        bal,
        m.status
      ];
    });
  
    const csvContent = [
      [title],
      [`Generated on: ${date}`],
      [], // empty line
      headers,
      ...rows
    ]
      .map(row => row.join(","))
      .join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv" });
  
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
  };

  /* ================= LOAD HISTORY ================= */
  const openHistory = async (member) => {
    try {
      const data = await getWelfarePaymentHistory(member.event_member_id);
      setHistoryData(data);
      setHistoryMember(member);
      setHistoryOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load history");
    }
  };

  return (
    <div className="finance-page">

      {/* HEADER */}
      <div className="finance-header">
        <h2>Welfare Management</h2>

        <div className="actions">
          <div className="action-btn">
            <CreateWelfareEvent onCreated={loadEvents} />
          </div>

          <div className="action-btn">
            <AddWelfareBulk onSaved={() => loadMembers(selectedEventId)} />
          </div>

          {/* ✅ EXPORT BUTTON */}
          
        </div>
      </div>

      {/* CONTROLS */}
      <div className="finance-controls">

        <select
          className="wide-select"
          value={selectedEventId}
          onChange={handleChange}
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.event_name}
            </option>
          ))}
        </select>

        <input
          className="wide-search"
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="export-btn" onClick={exportCSV}>
            📤 Export to Excel
        </button>
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
              const bal =
                Number(m.expected_amount) - Number(m.total_paid);

              return (
                <tr
                  key={m.event_member_id}
                  className={`row-${m.status.toLowerCase()}`}
                >
                  <td>{m.first_name} {m.last_name}</td>

                  <td>GH₵ {Number(m.expected_amount).toFixed(2)}</td>

                  <td className="green-text">
                    GH₵ {Number(m.total_paid).toFixed(2)}
                  </td>

                  <td className="red-text">
                    GH₵ {bal.toFixed(2)}
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

                    {/* ✅ HISTORY BUTTON */}
                    
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {paymentOpen && selectedMember && (
        <AddWelfarePayment
          member={selectedMember}
          onClose={() => setPaymentOpen(false)}
          onSaved={() => {
            loadMembers(selectedEventId);
            setPaymentOpen(false);
          }}
        />
      )}

     
      

    </div>
  );
}

export default AdminWelfare;