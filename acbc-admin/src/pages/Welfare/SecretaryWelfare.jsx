import { useEffect, useState } from "react";

import {
  getWelfareEvents,
  getWelfareEventMembersFull,
  getWelfareSummary,
  getWelfareIncomeLedger,
  getWelfareExpenseLedger,
  getWelfareExpenseTypes
} from "../../services/api";

import AddWelfareBulk from "../../components/AddWelfareDues";
import CreateWelfareEvent from "../../components/createWelfareEvent";
import AddWelfarePayment from "../../components/AddWelfarePayment";
import AddWelfareExpense from "../../components/AddWelfareExpense";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./AdminWelfare.css";
import { CalendarPlus, FileSpreadsheet, FileText, HeartHandshake, Receipt } from "lucide-react";

function SecretaryWelfare() {

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useState("");

  const [activeTab, setActiveTab] = useState("members");

  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeType, setIncomeType] = useState("ALL");
  const [incomeYear, setIncomeYear] = useState(
    new Date().getFullYear().toString()
  );

  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseType, setExpenseType] = useState("ALL");
  const [expenseYear, setExpenseYear] = useState(
    new Date().getFullYear().toString()
  );

  const [incomeRecords, setIncomeRecords] = useState([]);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    today_expense: 0,
    balance: 0
  });

  const years = [
    ...new Set(
      events.map(ev =>
        new Date(ev.event_date).getFullYear()
      )
    )
  ].sort((a, b) => b - a);

  const filteredEvents = events.filter(
    ev =>
      new Date(ev.event_date).getFullYear().toString() === selectedYear
  );

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


    const currentYear = new Date().getFullYear().toString();
    setSelectedYear(currentYear);
  

    const sorted = data.sort((a, b) =>
      a.event_code.localeCompare(b.event_code)
    );

    setEvents(sorted);

    

    const availableYears = [
      ...new Set(
        sorted.map(ev =>
          new Date(ev.event_date).getFullYear().toString()
        )
      )
    ];

    const yearToUse = availableYears.includes(currentYear)
      ? currentYear
      : availableYears[0];

    setSelectedYear(yearToUse);

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

  const exportIncomeCSV = () => {
    const rows = filteredIncome.map((row) => [
      new Date(row.transaction_date).toLocaleDateString(),
      row.source,
      row.income_type,
      row.description,
      row.amount
    ]);
  
    const csvContent = [
      ["WELFARE INCOME REPORT"],
      [],
      ["Date", "Source", "Type", "Description", "Amount"],
      ...rows
    ]
      .map(r => r.join(","))
      .join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv" });
  
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Welfare_Income_Report.csv";
    link.click();
  };

  const exportExpenseCSV = () => {
    const rows = filteredExpenses.map((expense) => [
      new Date(expense.date_spent).toLocaleDateString(),
      expense.expense_type,
      expense.title,
      expense.beneficiary,
      expense.amount,
      expense.status
    ]);
  
    const csvContent = [
      ["WELFARE EXPENSE REPORT"],
      [],
      ["Date", "Type", "Title", "Beneficiary", "Amount", "Status"],
      ...rows
    ]
      .map(r => r.join(","))
      .join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv" });
  
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Welfare_Expense_Report.csv";
    link.click();
  };

 

  const exportPDF = () => {
    const doc = new jsPDF();

    const selectedEvent = events.find(e => e.id == selectedEventId);

    const title = selectedEvent
      ? `WELFARE DUES REPORT - ${selectedEvent.event_name.toUpperCase()}`
      : "WELFARE REPORT";

    doc.text(title, 14, 15);

    const tableData = members.map(m => {
      const bal = Number(m.expected_amount) - Number(m.total_paid);

      return [
        `${m.first_name} ${m.last_name}`,
        m.expected_amount,
        m.total_paid,
        bal,
        m.status
      ];
    });

    autoTable(doc, {
      startY: 20,
      head: [["Name", "Expected", "Paid", "Balance", "Status"]],
      body: tableData
    });

    doc.save(`${title}.pdf`);
  };

  const exportIncomePDF = () => {
    const doc = new jsPDF();
  
    doc.text("WELFARE INCOME REPORT", 14, 15);
  
    const tableData = filteredIncome.map((row) => [
      new Date(row.transaction_date).toLocaleDateString(),
      row.source,
      row.income_type,
      row.description,
      row.amount
    ]);
  
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Source", "Type", "Description", "Amount"]],
      body: tableData
    });
  
    doc.save("Welfare_Income_Report.pdf");
  };

  const exportExpensePDF = () => {
    const doc = new jsPDF();
  
    doc.text("WELFARE EXPENSE REPORT", 14, 15);
  
    const tableData = filteredExpenses.map((expense) => [
      new Date(expense.date_spent).toLocaleDateString(),
      expense.expense_type,
      expense.title,
      expense.beneficiary,
      expense.amount,
      expense.status
    ]);
  
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Type", "Title", "Beneficiary", "Amount", "Status"]],
      body: tableData
    });
  
    doc.save("Welfare_Expense_Report.pdf");
  };



  const handleYearChange = (e) => {
    const year = e.target.value;
  
    setSelectedYear(year);
  
    const firstEvent = events.find(
      ev =>
        new Date(ev.event_date).getFullYear().toString() === year
    );
  
    if (firstEvent) {
      setSelectedEventId(firstEvent.id);
      loadMembers(firstEvent.id);
    }
  };

  const currentYear = new Date().getFullYear();

  const availableYears = Array.from(
    { length: 5 },
    (_, i) => (currentYear - i).toString()
  );

  const loadIncomeLedger = async () => {
    try {
      const data = await getWelfareIncomeLedger();
      setIncomeRecords(data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const loadExpenseLedger = async () => {
    try {
      const data = await getWelfareExpenseLedger();
      setExpenseRecords(data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const loadExpenseTypes = async () => {
    try {
      const data = await getWelfareExpenseTypes();
      setExpenseTypes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "income") {
      loadIncomeLedger();
    }
  
    if (activeTab === "expenses") {
      loadExpenseLedger();
      loadExpenseTypes();
    }
  }, [activeTab]);

  const filteredIncome = incomeRecords.filter((row) => {
    const matchesSearch =
      row.source?.toLowerCase().includes(incomeSearch.toLowerCase()) ||
      row.description?.toLowerCase().includes(incomeSearch.toLowerCase());
  
    const matchesType =
      incomeType === "ALL" ||
      (incomeType === "DUES" && row.income_type === "Welfare Dues") ||
      (incomeType === "DIRECT" && row.income_type !== "Welfare Dues");
  
    const matchesYear =
      new Date(row.transaction_date).getFullYear().toString() === incomeYear;
  
    return matchesSearch && matchesType && matchesYear;
  });

  const filteredExpenses = expenseRecords.filter((expense) => {
    const matchesSearch =
      expense.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      expense.beneficiary?.toLowerCase().includes(expenseSearch.toLowerCase());
  
    const matchesType =
      expenseType === "ALL" ||
      expense.expense_type === expenseType;
  
    const matchesYear =
      new Date(expense.date_spent).getFullYear().toString() === expenseYear;
  
    return matchesSearch && matchesType && matchesYear;
  });



 

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

      <div className="welfare-tabs">

        <button
          className={`welfare-tab ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          <HeartHandshake size={16} />
          Dues/Contributions
        </button>

        <button
          className={`welfare-tab ${activeTab === "income" ? "active" : ""}`}
          onClick={() => setActiveTab("income")}
        >
          <FileText size={16} />
          Income
        </button>

        <button
          className={`welfare-tab ${activeTab === "expenses" ? "active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          <Receipt size={16} />
          Expenses
        </button>

      </div>

      {/* CONTROLS */}
      {activeTab === "members" && (
        <>
          <div className="welfare-controls">

            {/* Year Select */}

            <select
              className="wide-select"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Event Select */}

            <select
              className="wide-select"
              value={selectedEventId}
              onChange={handleChange}
            >
              {filteredEvents.map(ev => (
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

            <div className="attendance-export-actions">
              <button
                className="welfare-export-btn"
                onClick={exportCSV}
              >
                <FileSpreadsheet size={18} />
                Export Excel
              </button>

              <button
                className="welfare-pdf-btn"
                onClick={exportPDF}
              >
                <FileText size={18}/>
                Download PDF
              </button>
            </div>  
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

        </>  
        )}

        {activeTab === "income" && (
          <>
            <div className="welfare-controls">

              <select
                className="wide-select"
                value={incomeYear}
                onChange={(e) => setIncomeYear(e.target.value)}
              >
                {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
              </select>

              <select
                className="wide-select"
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value)}
              >
                <option value="ALL">All Income</option>
                <option value="DUES">Welfare Dues</option>
                <option value="DIRECT">Direct Income</option>
              </select>

              <input
                className="wide-search"
                placeholder="Search source..."
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
              />

              <div>
                <button onClick={exportIncomeCSV} className="welfare-export-btn">
                  <FileSpreadsheet size={18} /> Export Excel
                </button>
              </div>

              <div>
                <button onClick={exportIncomePDF}  className="welfare-pdf-btn">
                  <FileText size={18} /> Download PDF
                </button>
              </div>

            </div>

            <div className="welfare-table-wrapper">
              <table className="welfare-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIncome.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No income records found
                      </td>
                    </tr>
                  ) : (
                    filteredIncome.map((row) => (
                      <tr key={`${row.income_type}-${row.id}`}>
                        <td>
                          {new Date(row.transaction_date)
                            .toLocaleDateString()}
                        </td>

                        <td>{row.source}</td>

                        <td>
                          <span className={`income-badge ${
                            row.income_type === "Welfare Dues"
                              ? "dues"
                              : "direct"
                          }`}>
                            {row.income_type}
                          </span>
                        </td>

                        <td>{row.description}</td>

                        <td className="green-text">
                          GH₵ {Number(row.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
                            

          </>
        )}

      {activeTab === "expenses" && (
        <>
          <div className="welfare-controls">

          <select
            className="wide-select"
            value={expenseYear}
            onChange={(e) => setExpenseYear(e.target.value)}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            className="wide-select"
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
          >
            <option value="ALL">All Expense Types</option>
            <option value="FUNERAL">Funeral</option>
            <option value="MEDICAL">Medical</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          <input
            className="wide-search"
            placeholder="Search description..."
            value={expenseSearch}
            onChange={(e) => setExpenseSearch(e.target.value)}
          />

          <button onClick={exportExpenseCSV} className="welfare-export-btn">
            <FileSpreadsheet size={18} /> Export Excel
          </button>

          <button onClick={exportExpensePDF}  className="welfare-pdf-btn">
            <FileText size={18} /> Download PDF
          </button>

          </div> 


          
          <div className="welfare-table-wrapper">
            <table className="welfare-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Beneficiary</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        {new Date(expense.date_spent)
                          .toLocaleDateString()}
                      </td>

                      <td>{expense.expense_type}</td>

                      <td>{expense.title}</td>

                      <td>
                        {expense.beneficiary?.trim() || "-"}
                      </td>

                      <td className="red-text">
                        GH₵ {Number(expense.amount).toFixed(2)}
                      </td>

                      <td>
                        <span
                          className={`status ${expense.status.toLowerCase()}`}
                        >
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      

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

export default SecretaryWelfare;