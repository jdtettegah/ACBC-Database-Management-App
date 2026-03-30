import { useEffect, useState } from "react";
import { getAllTithes } from "../../services/api";
import AddTithe from "../../components/AddTithe";
import "./AdminTithe.css";

function AdminTithe() {
  const [tithes, setTithes] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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

  const today = new Date().toISOString().split("T")[0];

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

    const exportData = filtered.map(t => ({
      Name: `${t.first_name} ${t.last_name}`,
      MemberCode: t.member_code,
      TitheCode: t.tithe_code,
      Amount: t.amount,
      Method: t.payment_method,
      Reference: t.payment_reference || "",
      Date: new Date(t.date_paid).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tithes");

    XLSX.writeFile(workbook, "tithe-report.xlsx");
  };

  /* ================= UI ================= */

  if (loading) {
    return <p style={{ padding: 20 }}>Loading tithes...</p>;
  }

  return (
    <div className="finance-page">

      {/* HEADER */}
      <div className="finance-header">
        <h2>Tithe</h2>

        <div className="action-btns">

          <div className="action-btn">
            <AddTithe onSaved={loadTithes} />
          </div>

         

        </div>
      </div>

      {/* STATS */}
      <div className="finance-stats">

        <div className="stats-card">
          <h3>Total Tithe</h3>
          <p>GH₵ {totalTithe.toFixed(2)}</p>
        </div>

        <div className="stats-card">
          <h3>Tithe Today</h3>
          <p>GH₵ {todayTotal.toFixed(2)}</p>
        </div>

        <div className="stats-card">
          <h3>Members Today</h3>
          <p>{membersToday}</p>
        </div>

      </div>

      {/* FILTERS */}
      <div className="finance-controls">

        <input
          type="text"
          placeholder="Search name, code, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <div className="export-btn">
            <button
              onClick={exportToExcel}
            >
              Export Excel
            </button>
        </div>

      </div>

      

      {/* TABLE */}
      <div className="finance-table-wrapper">

        <table className="finance-table">

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

    </div>
  );
}

export default AdminTithe;