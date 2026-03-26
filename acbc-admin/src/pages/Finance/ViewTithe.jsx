import { useEffect, useState } from "react";
import { getAllTithes } from "../../services/api";
import "./TithePage.css";

function ViewTithe({ open, onClose }) {
  const [tithes, setTithes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (open) loadTithes();
  }, [open]);

  const loadTithes = async () => {
    try {
      setLoading(true);

      const data = await getAllTithes();

      setTithes(data);
      setFiltered(data);

    } catch (err) {
      console.error("Failed to load tithes:", err);
      alert("Failed to load tithes");

    } finally {
      setLoading(false);
    }
  };

  /* Filter logic */
  useEffect(() => {
    let temp = [...tithes];
  
    /* Search filter */
    if (search.trim()) {
      const term = search.toLowerCase();
  
      temp = temp.filter(t =>
        `${t.first_name || ""} ${t.last_name || ""}`
          .toLowerCase()
          .includes(term) ||
  
        (t.member_code || "")
          .toLowerCase()
          .includes(term) ||
  
        (t.tithe_code || "")
          .toLowerCase()
          .includes(term) ||
  
        String(t.amount).includes(term)
      );
    }
  
    /* Date filter */
    if (dateFilter) {
      temp = temp.filter(t => {
        const dbDate = new Date(t.date_paid)
          .toISOString()
          .split("T")[0];
  
        return dbDate === dateFilter;
      });
    }
  
    setFiltered(temp);
  
  }, [search, dateFilter, tithes]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="transaction-page tithe-container">

        {/* Header */}
        <div className="transaction-header">
          <h2>View All Tithes</h2>
          <p>Search, filter and view all recorded tithes</p>
        </div>

        {/* Filters */}
        <div className="tithe-filters">

          <input
            type="text"
            placeholder="Search by name, code, tithe code"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />

          <button
            onClick={onClose}
            className="cancel-btn"
          >
            Close
          </button>

        </div>

        {/* Table */}
        <div className="tithe-table-wrapper">

          {loading ? (
            <p>Loading tithes...</p>

          ) : (
            <table className="tithe-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Member Name</th>
                  <th>Member Code</th>
                  <th>Tithe Code</th>
                  <th>Amount (GHS)</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                  <th>Date Paid</th>
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

                      <td>{Number(t.amount).toFixed(2)}</td>

                      <td>{t.payment_method}</td>

                      <td>{t.payment_reference || "-"}</td>

                      <td>
                        {new Date(t.date_paid).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>
          )}

        </div>

      </div>
    </div>
  );
}

export default ViewTithe;