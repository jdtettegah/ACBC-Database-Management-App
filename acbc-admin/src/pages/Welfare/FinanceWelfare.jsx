import { useEffect, useState } from "react";

import {
  getWelfareEvents,
  getWelfareEventMembersFull,
  getWelfareSummary
} from "../../services/api";

import AddWelfareBulk from "../../components/AddWelfareDues";
import CreateWelfareEvent from "../../components/createWelfareEvent";
import AddWelfarePayment from "../../components/AddWelfarePayment";
import AddWelfareExpense from "../../components/AddWelfareExpense";

import "./AdminWelfare.css";
import { FileSpreadsheet, Receipt, HeartHandshake } from "lucide-react";

function FinanceWelfare() {

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    today_expense: 0,
    balance: 0
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    loadEvents();
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await getWelfareSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

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

  const duesBalance = totalExpected - totalCollected;

  /* ================= EXPORT ================= */

  const exportCSV = () => {
    const selectedEvent = events.find(e => e.id == selectedEventId);

    const title = selectedEvent
      ? `WELFARE DUES REPORT - ${selectedEvent.event_name.toUpperCase()}`
      : "WELFARE REPORT";

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
      [],
      ["Name", "Expected", "Paid", "Balance", "Status"],
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

  /* ================= UI ================= */

  return (
    <div className="welfare-page">

      {/* HEADER */}
      <div className="welfare-header">
        <div className="welfare-title">
          <span className="welfare-title-icon"><HeartHandshake /></span>
          <span className="welfare-title-text">Welfare Management</span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="welfare-buttons-grid">
        <div className="welfare-button"><CreateWelfareEvent onCreated={loadEvents} /></div>

        <div className="welfare-button"><AddWelfareBulk onSaved={() => loadMembers(selectedEventId)} /></div>

        <div className="welfare-button">
          <button
            className="add-welfare-button"
            onClick={() => setExpenseOpen(true)}
          >
            <Receipt size={18} />
            Add Expense
          </button>
        </div>
      </div>

      {/* GLOBAL STATS */}
      <div className="welfare-stats">

        <div className="welfare-stats-card">
          <h4>Total Welfare Income</h4>
          <p>GH₵ {Number(summary.total_income).toFixed(2)}</p>
        </div>

        <div className="welfare-stats-card">
          <h4>Total Expense</h4>
          <p>GH₵ {Number(summary.total_expense).toFixed(2)}</p>
        </div>

        <div className="welfare-stats-card">
          <h4>Welfare Balance</h4>
          <p>GH₵ {Number(summary.balance).toFixed(2)}</p>
        </div>

      </div>

      {/* CONTROLS */}
      <div className="welfare-controls">

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

        <button className="welfare-export-btn" onClick={exportCSV}>
          <FileSpreadsheet size={18} />
          Export
        </button>

      </div>

      {/* EVENT STATS */}
      <div className="welfare-stats">

        <div className="welfare-stats-card">
          <h4>Event Expected</h4>
          <p>GH₵ {totalExpected.toFixed(2)}</p>
        </div>

        <div className="welfare-stats-card">
          <h4>Event Collected</h4>
          <p>GH₵ {totalCollected.toFixed(2)}</p>
        </div>

        <div className="welfare-stats-card">
          <h4>Event Balance</h4>
          <p>GH₵ {duesBalance.toFixed(2)}</p>
        </div>

      </div>

      {/* TABLE */}
      {/* TABLE */}
      <div className="welfare-table-wrapper">
        <table className="welfare-table">
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
            loadSummary();
            setPaymentOpen(false);
          }}
        />
      )}

      {/* EXPENSE MODAL */}
      {expenseOpen && (
        <AddWelfareExpense
          onClose={() => setExpenseOpen(false)}
          onSaved={() => {
            loadSummary();
            setExpenseOpen(false);
          }}
        />
      )}

    </div>
  );
}

export default FinanceWelfare;