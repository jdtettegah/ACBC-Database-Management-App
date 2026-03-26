import { useEffect, useState } from "react";
import AddAttendance from "../../components/AddAttendance";
import "./AdminAttendance.css";
import { apiRequest } from "../../services/api";

function AdminAttendance() {

  const [attendance, setAttendance] = useState([]);
  const [visitors, setVisitors] = useState([]);

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SUCCESS MESSAGE
  const [successMessage, setSuccessMessage] = useState("");

  // EDIT
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [editData, setEditData] = useState({
    attendance_code: "",
    service_date: "",
    service_type: "",
    status: "",
  });

  // ======================
  // FETCH DATA
  // ======================
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const att = await apiRequest("/attendance");
      const vis = await apiRequest("/visitors");

      setAttendance(att || []);
      setVisitors(vis || []);

    } catch (err) {
      console.error(err);
      setError("Failed to load records. Please try again.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ======================
  // DATE HELPERS
  // ======================
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // ======================
  // STATS
  // ======================
  const presentToday = attendance.filter(
    (a) =>
      a.service_date?.split("T")[0] === today &&
      a.status === "Present"
  ).length;

  const visitorsToday = visitors.filter(
    (v) => v.visit_date?.split("T")[0] === today
  ).length;

  const visitorsThisMonth = visitors.filter((v) => {
    const date = new Date(v.visit_date);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  }).length;

  const attendanceThisMonth = attendance.filter((a) => {
    const date = new Date(a.service_date);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const attendanceByDay = {};

  attendanceThisMonth.forEach((a) => {
    const day = a.service_date.split("T")[0];
    if (!attendanceByDay[day]) attendanceByDay[day] = 0;
    attendanceByDay[day]++;
  });

  const daysCount = Object.keys(attendanceByDay).length;

  const averageAttendance =
    daysCount > 0
      ? Math.round(
          Object.values(attendanceByDay).reduce((a, b) => a + b, 0) / daysCount
        )
      : 0;

  // ======================
  // COMBINE + SORT
  // ======================
  const combined = [

    ...attendance.map((a) => ({
      ...a,
      type: "Member",
    })),

    ...visitors.map((v) => ({
      id: `visitor-${v.id}`,
      attendance_code: "VISITOR",
      first_name: v.first_name,
      last_name: v.last_name,
      member_code: "Visitor",
      service_date: v.visit_date,
      service_type: v.service_type,
      status: "Visitor",
      type: "Visitor",
    })),

  ].sort(
    (a, b) =>
      new Date(b.service_date || 0) - new Date(a.service_date || 0)
  );

  // ======================
  // FILTERS
  // ======================
  const filtered = combined.filter((row) => {

    const name = `${row.first_name || ""} ${row.last_name || ""}`.toLowerCase();

    const matchSearch = name.includes(search.toLowerCase());

    const matchDate = filterDate
      ? row.service_date?.split("T")[0] === filterDate
      : true;

    const matchType =
      typeFilter === "All" || row.type === typeFilter;

    const matchService =
      serviceFilter === "All" ||
      row.service_type === serviceFilter;

    return matchSearch && matchDate && matchType && matchService;

  });

  // ======================
  // EDIT HANDLERS
  // ======================
  const openEdit = (row) => {
    if (row.type !== "Member") return;

    setEditData({
      attendance_code: row.attendance_code,
      service_date: row.service_date?.split("T")[0],
      service_type: row.service_type,
      status: row.status,
    });

    setEditError("");
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      await apiRequest(`/attendance/${editData.attendance_code}`, {
        method: "PUT",
        body: JSON.stringify({
          service_date: editData.service_date,
          service_type: editData.service_type,
          status: editData.status,
        }),
      });

      setEditOpen(false);
      setSuccessMessage("Attendance updated successfully!");

      fetchData();

      // Auto-clear success message
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error(err);
      setEditError("Update failed. Please try again.");
    }

    setEditLoading(false);
  };

  // ======================
  // UI STATES
  // ======================
  if (loading) {
    return <p className="loading">Loading attendance...</p>;
  }

  if (error) {
    return (
      <div className="error-box">
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="attendance-page">

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="success-box">
          {successMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="attendance-header">
        <h2>Attendance</h2>

        <div className="action-btn">
          <AddAttendance refresh={fetchData} />
        </div>
      </div>

      {/* STATS */}
      <div className="members-stats">

        <div className="stats-card">
          <h3>Present Today</h3>
          <p>{presentToday}</p>
        </div>

        <div className="stats-card">
          <h3>Visitors Today</h3>
          <p>{visitorsToday}</p>
        </div>

        <div className="stats-card">
          <h3>Visitors This Month</h3>
          <p>{visitorsThisMonth}</p>
        </div>

        <div className="stats-card">
          <h3>Avg Attendance (Month)</h3>
          <p>{averageAttendance}</p>
        </div>

      </div>

      {/* FILTERS */}
      <div className="attendance-controls">

        <input
          type="text"
          placeholder="Search name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option>All</option>
          <option>Member</option>
          <option>Visitor</option>
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
        >
          <option>All</option>
          <option>Sunday Service</option>
          <option>Midweek Service</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="attendance-table-wrapper">

        <table className="attendance-table">

          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Member Code</th>
              <th>Date</th>
              <th>Service</th>
              <th>Status</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No records
                </td>
              </tr>
            ) : (

              filtered.map((row) => (

                <tr key={row.id}>

                  <td>{row.attendance_code}</td>

                  <td>{row.first_name} {row.last_name}</td>

                  <td>{row.member_code}</td>

                  <td>{row.service_date?.split("T")[0]}</td>

                  <td>{row.service_type}</td>

                  <td>{row.status}</td>

                  <td>{row.type}</td>

                  <td>
                    {row.type === "Member" && (
                      <button
                        className="edit-btn"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                    )}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="modal-overlay">

          <div className="edit-box">

            <h3>Edit Attendance</h3>

            {editError && (
              <p className="error-text">{editError}</p>
            )}

            <form onSubmit={handleEditSubmit}>

              <label>Date</label>
              <input
                type="date"
                value={editData.service_date}
                onChange={(e) =>
                  setEditData({ ...editData, service_date: e.target.value })
                }
                required
              />

              <label>Service</label>
              <select
                value={editData.service_type}
                onChange={(e) =>
                  setEditData({ ...editData, service_type: e.target.value })
                }
                required
              >
                <option value="">Select Service</option>
                <option value="Sunday Service">Sunday Service</option>
                <option value="Midweek Service">Midweek Service</option>
              </select>

              <label>Status</label>
              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                required
              >
                <option value="">Select</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>

              <div className="form-actions">

                <button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminAttendance;