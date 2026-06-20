import { useEffect, useState } from "react";
import { getAllTithes, updateTithe, deleteTithe } from "../../services/api";
import AddTithe from "../../components/AddTithe";
import "./AdminTithe.css";
import { FileSpreadsheet, Landmark, FileText } from "lucide-react";
import { saveBulkTithe } from "../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function PastorTithe() {
  const [tithes, setTithes] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);

  const [editingTithe, setEditingTithe] = useState(null);
  const [editForm, setEditForm] = useState({});

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadTithes();
  }, []);

  const loadTithes = async () => {
    try {
      setLoading(true);

      const data = await getAllTithes();

      setTithes(data);
      setFiltered(data);

    } catch (err) {
      console.error(err);
      alert("Failed to load tithes");
    }

    setLoading(false);
  };

  /* ================= FILTER ================= */

  useEffect(() => {
    let temp = [...tithes];

    if (search.trim()) {
      const term = search.toLowerCase();

      temp = temp.filter(t =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(term) ||
        t.member_code?.toLowerCase().includes(term) ||
        t.tithe_code?.toLowerCase().includes(term) ||
        String(t.amount).includes(term)
      );
    }

    if (dateFilter) {
      temp = temp.filter(t =>
        new Date(t.date_paid).toISOString().split("T")[0] === dateFilter
      );
    }

    setFiltered(temp);

  }, [search, dateFilter, tithes]);

  /* ================= STATS ================= */

  const totalTithe = tithes.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const todayTithes = tithes.filter(
    t => new Date(t.date_paid).toISOString().split("T")[0] === today
  );

  const todayTotal = todayTithes.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const membersToday = new Set(
    todayTithes.map(t => t.member_id)
  ).size;

  /* ================= EXPORT ================= */

  const exportToExcel = () => {

    if (filtered.length === 0) {
      return alert("No data to export");
    }
  
    const headers = [
      "Name",
      "Member Code",
      "Tithe Code",
      "Amount",
      "Method",
      "Reference",
      "Date"
    ];
  
    const rows = filtered.map(t => [
      `${t.first_name} ${t.last_name}`,
      t.member_code,
      t.tithe_code,
      t.amount,
      t.payment_method,
      t.payment_reference || "",
      new Date(t.date_paid).toLocaleDateString()
    ]);
  
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");
  
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "tithe-report.csv";
    link.click();
  };

  const exportToPDF = () => {

    if (filtered.length === 0) {
      return alert("No data to export");
    }
  
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text("Tithe Report", 14, 15);
  
    // Total amount
    const totalAmount = filtered.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
  
    doc.setFontSize(11);
    doc.text(`Total Records: ${filtered.length}`, 14, 25);
    doc.text(`Total Amount: GH₵ ${totalAmount.toFixed(2)}`, 14, 32);
  
    autoTable(doc, {
      startY: 40,
      head: [[
        "Name",
        "Member Code",
        "Tithe Code",
        "Amount",
        "Method",
        "Reference",
        "Date"
      ]],
      body: filtered.map(t => [
        `${t.first_name} ${t.last_name}`,
        t.member_code,
        t.tithe_code,
        `GH₵ ${Number(t.amount).toFixed(2)}`,
        t.payment_method,
        t.payment_reference || "",
        new Date(t.date_paid).toLocaleDateString()
      ]),
      styles: {
        fontSize: 8,
      },
    });
  
    doc.save("tithe-report.pdf");
  };

  /* ================= UI ================= */

  if (loading) {
    return <p style={{ padding: 20 }}>Loading tithes...</p>;
  }

  const openEdit = (t) => {
    setEditingTithe(t);
  
    setEditForm({
      amount: t.amount,
      payment_method: t.payment_method || "",
      payment_reference: t.payment_reference || "",
      date_paid: t.date_paid,
    });
  };
  
  const handleDelete = async (t) => {
    if (!window.confirm("Delete this tithe?")) return;
  
    try {
      await deleteTithe(t.id);
      loadTithes();
    } catch {
      alert("Delete failed");
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
  
    try {
      await updateTithe(editingTithe.id, editForm);
  
      setEditingTithe(null);
      loadTithes();
  
    } catch {
      alert("Update failed");
    }
  };



  return (
    <div className="tithe-page">

      {/* HEADER */}
      <div className="tithe-header">
        <div className="tithe-title">
          <span className="tithe-title-icon"><Landmark /></span>
          <span className="tithe-title-text">Tithe Management</span>
        </div>

        <div className="tithe-action-btns">
         

        </div>
      </div>

      {/* STATS */}
      <div className="tithe-stats">

        <div className="tithe-stats-card">
          <h3>Total Tithe</h3>
          <p>GH₵ {totalTithe.toFixed(2)}</p>
        </div>

        <div className="tithe-stats-card">
          <h3>Tithe Today</h3>
          <p>GH₵ {todayTotal.toFixed(2)}</p>
        </div>

        <div className="tithe-stats-card">
          <h3>Members Today</h3>
          <p>{membersToday}</p>
        </div>

      </div>

      {/* FILTERS */}
      <div className="tithe-controls">

        <input
          type="text"
          placeholder="Search name, code, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="tithe-search"
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <button
          onClick={() => setDateFilter(today)}
          className="tithe-today-btn"
        >
          Today
        </button>

        <button
          onClick={() => setDateFilter("")}
          className="tithe-show-all-btn"
        >
          Show All
        </button>

        <div className="tithe-export-actions">

          <button
            className="tithe-export-btn"
            onClick={exportToExcel}
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>

          <button
            className="tithe-export-btn pdf"
            onClick={exportToPDF}
          >
            <FileText size={18} />
            Download PDF
          </button>

        </div>

      </div>

      

      {/* TABLE */}
      <div className="tithe-table-wrapper">

        <table className="tithe-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Member Code</th>
              <th>Tithe Code</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>

            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No tithes found
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <tr key={t.id}>

                  <td>{i + 1}</td>

                  <td>
                    {t.first_name} {t.last_name}
                  </td>

                  <td>{t.member_code}</td>

                  <td>{t.tithe_code}</td>

                  <td>GH₵ {Number(t.amount).toFixed(2)}</td>

                  <td>{t.payment_method}</td>

                  <td>{t.payment_reference || "-"}</td>

                  <td>
                    {new Date(t.date_paid).toLocaleDateString()}
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {editingTithe && (
        <div
          className="tithe-modal-overlay"
          onClick={() => setEditingTithe(null)}
        >
          <div
            className="tithe-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Tithe</h3>

            <form onSubmit={handleEditSubmit}>

              <input
                type="number"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
              />

              <input
                placeholder="Payment Method"
                value={editForm.payment_method}
                onChange={(e) =>
                  setEditForm({ ...editForm, payment_method: e.target.value })
                }
              />

              <input
                placeholder="Reference"
                value={editForm.payment_reference}
                onChange={(e) =>
                  setEditForm({ ...editForm, payment_reference: e.target.value })
                }
              />

              <input
                type="date"
                value={editForm.date_paid?.split("T")[0]}
                onChange={(e) =>
                  setEditForm({ ...editForm, date_paid: e.target.value })
                }
              />

              <button className="tithe-save-btn">Save</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default PastorTithe;