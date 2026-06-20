import { useEffect, useState, useRef, useCallback } from "react";
import AddAttendance from "../../components/AddAttendance";
import "./AdminAttendance.css";
import { apiRequest, updateAttendance, getAttendanceStats } from "../../services/api";
import SecretaryDashboardCharts from "../../components/SecretaryDashboardCharts";
import { ClipboardCheck, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// 🔥 SAME KEY AS AddAttendance
const STORAGE_KEY = "attendance_draft";

function SecretaryAttendance() {

  const [attendance, setAttendance] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [filterDate, setFilterDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // 🔥 NEW: LIVE DRAFT STATE
  const [liveDraft, setLiveDraft] = useState({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAttendanceStats();
        setStats(data);
      } catch (err) {
        console.error("Stats error:", err);
      }
    };

    fetchStats();
  }, []);

  const observer = useRef();

  // ======================
  // 🔥 LOAD DRAFT (AND WATCH FOR CHANGES)
  // ======================
  useEffect(() => {

    const loadDraft = () => {
      const draft = localStorage.getItem(STORAGE_KEY);
      setLiveDraft(draft ? JSON.parse(draft) : {});
    };

    loadDraft();

    // 🔥 listen for changes across tabs/components
    window.addEventListener("storage", loadDraft);

    // 🔥 polling fallback (important for same-tab updates)
    const interval = setInterval(loadDraft, 1000);

    return () => {
      window.removeEventListener("storage", loadDraft);
      clearInterval(interval);
    };

  }, []);

  // ======================
  // DEBOUNCE SEARCH
  // ======================
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(delay);
  }, [search]);

  // ======================
  // FETCH DATA
  // ======================
  const fetchData = async (pageNumber = 1, append = false) => {

    if (initialLoading) {
      setUpdating(false);
    } else if (pageNumber === 1) {
      setUpdating(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const query = new URLSearchParams({
        page: pageNumber,
        limit: 50,
        search: debouncedSearch,
        type: typeFilter,
        service: serviceFilter,
        date: filterDate,
        status: statusFilter,
      });

      const res = await apiRequest(`/attendance?${query}`);

      if (append) {
        setAttendance(prev => [...prev, ...res.data]);
      } else {
        setAttendance(res.data);
      }

      setPagination(res.pagination);

    } catch (err) {
      console.error(err);
      setError("Failed to load records");
    }

    setInitialLoading(false);
    setUpdating(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [debouncedSearch, filterDate, typeFilter, serviceFilter, statusFilter]);

  // ======================
  // INFINITE SCROLL
  // ======================
  const lastRowRef = useCallback(node => {

    if (loadingMore) return;

    if (loadingMore || attendance.length === 0) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (
        entries[0].isIntersecting &&
        page < pagination.totalPages
      ) {
        const nextPage = page + 1;

        setPage(prev => prev + 1);
        fetchData(nextPage, true);
      }
    });

    if (node) observer.current.observe(node);

  }, [loadingMore, page, pagination]);

  // ======================
  // 🔥 STATS (UPDATED)
  // ======================
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 🔥 LIVE PRESENT COUNT
  const livePresentCount = Object.values(liveDraft).filter(Boolean).length;

  // 🔥 DB COUNT (fallback)
  const dbPresentToday = attendance.filter(
    (a) =>
      a.service_date?.split("T")[0] === today &&
      a.status === "Present"
  ).length;

  // 🔥 FINAL VALUE (priority: LIVE > DB)
  const presentToday = livePresentCount > 0
    ? livePresentCount
    : dbPresentToday;

  const visitorsToday = attendance.filter(
    (a) =>
      a.type === "Visitor" &&
      a.service_date?.split("T")[0] === today
  ).length;

  const visitorsThisMonth = attendance.filter((a) => {
    const date = new Date(a.service_date);
    return (
      a.type === "Visitor" &&
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

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAttendanceStats();
      setStats(data);
    };
  
    fetchStats();
  
    const interval = setInterval(fetchStats, 10000); // every 10s
  
    return () => clearInterval(interval);
  }, []);

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
  // EXPORT (UNCHANGED)
  // ======================
  const exportToCSV = async () => {
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        type: typeFilter,
        service: serviceFilter,
        date: filterDate,
        status: statusFilter,
        export: "true",
      });

      const res = await apiRequest(`/attendance?${query}`);

      const data = res.data;

      const headers = [
        "Code", "Name", "Member Code",
        "Date", "Service", "Status", "Type"
      ];

      const rows = data.map(row => [
        row.attendance_code,
        `${row.first_name} ${row.last_name}`,
        row.member_code,
        row.service_date?.split("T")[0],
        row.service_type,
        row.status,
        row.type
      ]);

      let csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...rows].map(e => e.join(",")).join("\n");

      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = "attendance_filtered.csv";
      link.click();

    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const exportToPDF = async () => {
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        type: typeFilter,
        service: serviceFilter,
        date: filterDate,
        status: statusFilter,
        export: "true",
      });
  
      const res = await apiRequest(`/attendance?${query}`);
  
      const data = res.data;
  
      const doc = new jsPDF();
  
      doc.setFontSize(16);
      doc.text("Attendance Report", 14, 15);
  
      const tableRows = data.map((row) => [
        row.attendance_code,
        `${row.first_name} ${row.last_name}`,
        row.member_code,
        row.service_date?.split("T")[0],
        row.service_type,
        row.status,
        row.type,
      ]);
  
      autoTable(doc, {
        head: [[
          "Code",
          "Name",
          "Member Code",
          "Date",
          "Service",
          "Status",
          "Type",
        ]],
        body: tableRows,
        startY: 25,
        styles: {
          fontSize: 8,
        },
      });
  
      doc.save("attendance_filtered.pdf");
  
    } catch (err) {
      console.error("PDF export failed", err);
    }
  };

  if (initialLoading) {
    return (
      <div className="skeleton-container">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-row"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <p>{error}</p>
        <button onClick={() => fetchData(1)}>Retry</button>
      </div>
    );
  }

  // ======================
// UPDATE ATTENDANCE
// ======================
  const handleUpdateAttendance = async (row) => {

    const newStatus =
      row.status === "Present"
        ? "Absent"
        : "Present";

    try {

      await updateAttendance(row.attendance_code, {
        service_date: row.service_date?.split("T")[0],
        service_type: row.service_type,
        status: newStatus,
      });

      // instant UI update
      setAttendance(prev =>
        prev.map(item =>
          item.attendance_code === row.attendance_code
            ? { ...item, status: newStatus }
            : item
        )
      );

    } catch (err) {
      console.error(err);
      alert("Failed to update attendance");
    }
  };

  return (
    <div className="m-attendance-page fade-in">

      {/* HEADER */}
      <div className="attendance-header">
        <div className="attendance-table-header">
          <span className="attendance-title-icon"><ClipboardCheck size={25}/></span>
          <span className="attendance-title-text">Attendance</span>
        </div>

        <div className="attendance-action-btn">
          <AddAttendance refresh={() => fetchData(1)} />
        </div>
      </div>

      {/* 🔥 UPDATED STATS */}
      <div className="attendance-members-stats">

      <div className="attendance-stats-card">
        <h3>Present Today</h3>
        <p>{stats.presentToday || 0}</p>
      </div>

      <div className="attendance-stats-card">
        <h3>Visitors Today</h3>
        <p>{stats.visitorsToday || 0}</p>
      </div>

      <div className="attendance-stats-card">
        <h3>Visitors This Month</h3>
        <p>{stats.visitorsThisMonth || 0}</p>
      </div>

      <div className="attendance-stats-card">
        <h3>Avg Attendance</h3>
        <p>{stats.averageAttendance || 0}</p>
      </div>

      </div>

      <SecretaryDashboardCharts />

      {/* TABLE + rest unchanged */}

      <div className="attendance-table-header">Attendance Table</div>

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

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="members">Member</option>
          <option value="visitors">Visitors</option>
        </select>

        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
          <option>All</option>
          <option>Sunday Service</option>
          <option>Midweek Service</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Present</option>
          <option>Absent</option>
        </select>

        <div className="attendance-export-actions">

          <button
            className="attendance-export-btn"
            onClick={exportToCSV}
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>

          <button
            className="attendance-export-btn pdf"
            onClick={exportToPDF}
          >
            <FileText size={18} />
            Download PDF
          </button>

        </div>
      </div>

     

      {/* ✅ SMOOTH UPDATE INDICATOR */}
      {updating && <p className="updating">Updating...</p>}

      {/* TABLE */}
      <div className="attendance-table-wrapper fade-in">

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Member Code</th>
              <th>Date</th>
              <th>Service</th>
              <th>Status</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="7" className="attendance-empty">
                  No attendance recorded for {filterDate}
                </td>
              </tr>
            ) : (
              attendance.map((row, index) => {

                const statusClass =
                  row.status === "Present"
                    ? "status present"
                    : row.status === "Absent"
                    ? "status absent"
                    : "";

                if (attendance.length === index + 1) {
                  return (
                    <tr ref={lastRowRef} key={row.id}>
                      <td>{row.first_name} {row.last_name}</td>
                      <td>{row.member_code}</td>
                      <td>{row.service_date?.split("T")[0]}</td>
                      <td>{row.service_type}</td>

                      <td className={statusClass}>
                        {row.status}
                      </td>

                      <td>{row.type}</td>

                      <td>
                        {row.type === "members" && (
                          <button
                            className="attendance-edit-btn"
                            onClick={() => handleUpdateAttendance(row)}
                          >
                            Mark {row.status === "Present"
                              ? "Absent"
                              : "Present"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id}>
                    <td>{row.first_name} {row.last_name}</td>
                    <td>{row.member_code}</td>
                    <td>{row.service_date?.split("T")[0]}</td>
                    <td>{row.service_type}</td>

                    <td className={statusClass}>
                      {row.status}
                    </td>

                    <td>{row.type}</td>

                    <td>
                      {row.type === "members" && (
                        <button
                          className="attendance-edit-btn"
                          onClick={() => handleUpdateAttendance(row)}
                        >
                          Mark {row.status === "Present"
                            ? "Absent"
                            : "Present"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {loadingMore && (
          <p className="loading-more">Loading more...</p>
        )}

      </div>

    </div>
  );
}

export default SecretaryAttendance;