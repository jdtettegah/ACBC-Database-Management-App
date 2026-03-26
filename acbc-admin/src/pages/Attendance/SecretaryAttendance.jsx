import { useEffect, useState } from "react";
import AddAttendance from "../../components/AddAttendance";
import "./AdminAttendance.css";
import { apiRequest } from "../../services/api";

function SecretaryAttendance() {

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberAttendance, setMemberAttendance] = useState([]);

  const [editOpen, setEditOpen] = useState(false);

  const [editData, setEditData] = useState({
    attendance_code: "",
    service_date: "",
    service_type: "",
    status: "",
  });
  // ==============================
  // Fetch Attendance
  // ==============================
  const fetchAttendance = async () => {
    try {
      const data = await apiRequest("/attendance");
  
      setAttendance(data);
      setLoading(false);
  
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load attendance");
      setLoading(false);
    }
  };

  // Load on page open
  useEffect(() => {
    fetchAttendance();
  }, []);

  // ==============================
  // Filters
  // ==============================
  const filteredAttendance = attendance.filter((att) => {

    const fullName =
      `${att.first_name} ${att.last_name}`.toLowerCase();

    const matchSearch = fullName.includes(search.toLowerCase());

    const matchDate = filterDate
      ? att.service_date.split("T")[0] === filterDate
      : true;

    return matchSearch && matchDate;
  });

  // ==============================
  // Stats
  // ==============================
  const today = new Date().toISOString().split("T")[0];

  const todayPresent = attendance.filter(
    (a) =>
      a.service_date?.split("T")[0] === today &&
      a.status === "Present"
  ).length;

  const pending = attendance.filter(
    (a) => a.status === "Pending"
  ).length;

  // ==============================
  // UI
  // ==============================
  if (loading) return <p>Loading attendance...</p>;
  if (error) return <p className="error">{error}</p>;

  const handleView = async (memberId) => {

    if (isNaN(memberId)) {
      alert("Invalid member ID");
      return;
    }
  
    try {
      const data = await apiRequest(`/attendance/member/${memberId}`);
  
      setMemberAttendance(data);
      setViewOpen(true);
  
    } catch (err) {
      console.error(err);
      alert("Failed to load attendance history");
    }
  };

  const openEdit = (attendance) => {
    setEditData({
      attendance_code: attendance.attendance_code,
      service_date: attendance.service_date.split("T")[0],
      service_type: attendance.service_type,
      status: attendance.status,
    });
  
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
  
    try {
      await apiRequest(`/attendance/${editData.attendance_code}`, {
        method: "PUT",
        body: JSON.stringify({
          service_date: editData.service_date,
          service_type: editData.service_type,
          status: editData.status,
        }),
      });
  
      alert("Attendance updated successfully");
  
      setEditOpen(false);
  
      fetchAttendance(); // Reload table
  
    } catch (err) {
      alert(err.message || "Update failed");
    }
  };

  return (
    <div className="attendance-page">

      {/* HEADER */}
      <div className="attendance-header">
        <h2>Attendance</h2>

        <div className="action-btn">
          <AddAttendance refresh={fetchAttendance} />
        </div>
      </div>

      {/* STATS */}
      <div className="attendance-stats">

        <div className="stats-card">
          <h3>Today</h3>
          <p>{todayPresent} Present</p>
        </div>

        <div className="stats-card">
          <h3>Total Records</h3>
          <p>{attendance.length}</p>
        </div>

        <div className="stats-card">
          <h3>Pending</h3>
          <p>{pending}</p>
        </div>

      </div>

      {/* CONTROLS */}
      <div className="attendance-controls">

        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            ) : (

              filteredAttendance.map((att) => (

                <tr key={att.id}>

                  <td>{att.attendance_code}</td>

                  <td>
                    {att.first_name} {att.last_name}
                  </td>

                  <td>{att.member_code}</td>

                  <td>
                    {att.service_date?.split("T")[0]}
                  </td>

                  <td>{att.service_type}</td>

                  <td
                    className={
                      att.status === "Present"
                        ? "status present"
                        : "status absent"
                    }
                  >
                    {att.status}
                  </td>

                  <td>
                    <button className="view-btn" onClick={() => handleView(att.member_id)}>View</button>
                    <button className="edit-btn" onClick={() => openEdit(att)}>Edit</button>
                  </td>

                </tr>
              ))

            )}

          </tbody>

        </table>

      </div>

      {viewOpen && (
          <div className="modal-overlay">

            <div className="view-box">
              <h3 className="view-title">Attendance History</h3>

              <div className="table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {memberAttendance.map((a) => (
                      <tr key={a.attendance_code}>
                        <td>{a.service_date.split("T")[0]}</td>
                        <td>{a.service_type}</td>
                        <td>
                          <span className={`status ${a.status.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="close-btn" onClick={() => setViewOpen(false)}>
                Close
              </button>   
            </div>

          </div>
        )}

        {editOpen && (
          <div className="modal-overlay">

            <div className="edit-box">

              <h3>Edit Attendance</h3>

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
                <input
                  type="text"
                  value={editData.service_type}
                  onChange={(e) =>
                    setEditData({ ...editData, service_type: e.target.value })
                  }
                  required
                />

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

                  <button type="submit" className="save-btn">
                    Save
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
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

export default SecretaryAttendance;