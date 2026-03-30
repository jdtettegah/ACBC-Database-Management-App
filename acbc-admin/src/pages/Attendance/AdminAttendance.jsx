import { useEffect, useState, useRef, useCallback } from "react";
import AddAttendance from "../../components/AddAttendance";
import "./AdminAttendance.css";
import { apiRequest } from "../../services/api";

function AdminAttendance() {

  const [attendance, setAttendance] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // ✅ NEW

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const observer = useRef();

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

    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const query = new URLSearchParams({
        page: pageNumber,
        limit: 50,
        search: debouncedSearch,
        type: typeFilter,
        service: serviceFilter,
        date: filterDate,
        status: statusFilter, // ✅ NEW
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

    setLoading(false);
    setLoadingMore(false);
  };

  // ======================
  // REFETCH ON FILTER CHANGE
  // ======================
  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [debouncedSearch, filterDate, typeFilter, serviceFilter, statusFilter]);

  // ======================
  // INFINITE SCROLL (FIXED)
  // ======================
  const lastRowRef = useCallback(node => {

    if (loadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (
        entries[0].isIntersecting &&
        page < pagination.totalPages
      ) {
        const nextPage = page + 1;

        setPage(prev => prev + 1); // ✅ FIXED
        fetchData(nextPage, true);
      }
    });

    if (node) observer.current.observe(node);

  }, [loadingMore, page, pagination]);

  // ======================
  // STATS
  // ======================
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const presentToday = attendance.filter(
    (a) =>
      a.service_date?.split("T")[0] === today &&
      a.status === "Present"
  ).length;

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
  // EXPORT FILTERED DATA (FROM BACKEND)
  // ======================
  const exportToCSV = async () => {
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        type: typeFilter,
        service: serviceFilter,
        date: filterDate,
        status: statusFilter,
        export: "true", // 👈 tell backend to return ALL filtered data
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

  // ======================
  // UI STATES
  // ======================
  if (loading) return <p className="loading">Loading attendance...</p>;

  if (error) {
    return (
      <div className="error-box">
        <p>{error}</p>
        <button onClick={() => fetchData(1)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="attendance-page">

      {/* HEADER */}
      <div className="attendance-header">
        <h2>Attendance</h2>

        <div className="action-btn">
          <AddAttendance refresh={() => fetchData(1)} />
          
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
          <h3>Avg Attendance</h3>
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

        {/* ✅ NEW STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>Present</option>
          <option>Absent</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="attendance-table-wrapper">

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Member Code</th>
              <th>Date</th>
              <th>Service</th>
              <th>Status</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>
            {attendance.map((row, index) => {

              if (attendance.length === index + 1) {
                return (
                  <tr ref={lastRowRef} key={row.id}>
                    <td>{row.first_name} {row.last_name}</td>
                    <td>{row.member_code}</td>
                    <td>{row.service_date?.split("T")[0]}</td>
                    <td>{row.service_type}</td>
                    <td>{row.status}</td>
                    <td>{row.type}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  <td>{row.first_name} {row.last_name}</td>
                  <td>{row.member_code}</td>
                  <td>{row.service_date?.split("T")[0]}</td>
                  <td>{row.service_type}</td>
                  <td>{row.status}</td>
                  <td>{row.type}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loadingMore && (
          <p className="loading-more">Loading more...</p>
        )}

      </div>

      <button className="export-btn" onClick={exportToCSV}>
            Export To Excel
          </button>

    </div>
  );
}

export default AdminAttendance;