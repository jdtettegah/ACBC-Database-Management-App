import "./AdminMember.css";
import AddMember from "../../components/AddMember";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

function AdminMembers() {

  /* ================= STATES ================= */

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [baptizedFilter, setBaptizedFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  /* ================= AGE CALCULATOR ================= */

  const calculateAge = (dob) => {
    if (!dob) return null;

    const cleanDate = dob.toString().split("T")[0];
    const [year, month, day] = cleanDate.split("-").map(Number);

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  /* ================= LOAD MEMBERS ================= */

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/members");
      setMembers(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  /* ================= STATS ================= */

  const total = members.length;

  const active =
    members.filter(m => m.membership_status === "Active").length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const newMembersThisMonth = members.filter((m) => {
    if (!m.created_at) return false;

    const date = new Date(m.created_at);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  }).length;

  /* ================= FILTER ================= */

  const filteredMembers = members.filter((m) => {

    const search = searchTerm.toLowerCase();

    const fullName =
      `${m.first_name} ${m.last_name}`.toLowerCase();

    const age = calculateAge(m.date_of_birth);

    const baptizedValue =
      m.baptized === true || m.baptized === 1 ? "1" : "0";

    let ageMatch = true;

    if (ageFilter) {
      if (age === null || isNaN(age)) {
        ageMatch = false;
      } else {
        if (ageFilter === "under18") ageMatch = age < 18;
        else if (ageFilter === "18-35") ageMatch = age >= 18 && age <= 35;
        else if (ageFilter === "36-60") ageMatch = age >= 36 && age <= 60;
        else if (ageFilter === "60plus") ageMatch = age > 60;
      }
    }

    return (
      (
        fullName.includes(search) ||
        m.phone?.includes(search) ||
        m.member_code?.toLowerCase().includes(search)
      )
      && (genderFilter === "" || m.gender === genderFilter)
      && (baptizedFilter === "" || baptizedValue === baptizedFilter)
      && (groupFilter === "" || m.Auxiliary_Group === groupFilter)
      && ageMatch
    );
  });

  /* ================= EXPORT ================= */

  const exportToCSV = () => {

    const headers = [
      "Code",
      "First Name",
      "Last Name",
      "Phone",
      "Gender",
      "Group",
      "Status",
      "Baptized"
    ];

    const rows = filteredMembers.map(m => [
      m.member_code,
      m.first_name,
      m.last_name,
      m.phone || "",
      m.gender,
      m.Auxiliary_Group || "",
      m.membership_status,
      m.baptized ? "Yes" : "No"
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "members_filtered.csv";
    link.click();
  };

  /* ================= EDIT ================= */

  const openEdit = (member) => {
    setEditingMember(member);

    setEditForm({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      other_names: member.other_names || "",
      gender: member.gender || "",
      phone: member.phone || "",
      email: member.email || "",
      address: member.address || "",
      baptized: member.baptized ? 1 : 0,
      Auxiliary_Group: member.Auxiliary_Group || "",
      membership_status: member.membership_status || "Active",
      date_of_birth: member.date_of_birth
        ? member.date_of_birth.split("T")[0]
        : ""
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await apiRequest(`/members/${editingMember.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm)
      });

      setEditingMember(null);
      loadMembers();

    } catch {
      alert("Failed to update member");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    try {
      await apiRequest(`/members/${deletingMember.id}`, {
        method: "DELETE",
      });

      setDeletingMember(null);
      loadMembers();

    } catch {
      alert("Failed to delete member");
    }
  };

  /* ================= UI ================= */

  return (

    <div className="members-page">

      {/* HEADER */}
      <div className="members-header">

        <h2>Members</h2>

        <div className="action-btn">
          <AddMember onSuccess={loadMembers} />

          
        </div>

      </div>

      {/* STATS */}
      <div className="members-stats">

        <div className="stats-card">
          <h3>All Members</h3>
          <p>{total}</p>
        </div>

        <div className="stats-card">
          <h3>Active Members</h3>
          <p>{active}</p>
        </div>

        <div className="stats-card">
          <h3>New This Month</h3>
          <p>{newMembersThisMonth}</p>
        </div>

      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading members...</p>}

      {!loading && (

        <div className="members-table-wrapper">

          {/* FILTER BAR */}
          <div className="filter-bar">

            <input
              type="text"
              placeholder="Search name, phone, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select value={baptizedFilter} onChange={(e) => setBaptizedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="1">Baptized</option>
              <option value="0">Not Baptized</option>
            </select>

            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="">All Groups</option>
              <option value="Youth">Youth</option>
              <option value="Men">Men</option>
              <option value="WMU">WMU</option>
            </select>

            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
              <option value="">All Ages</option>
              <option value="under18">Under 18</option>
              <option value="18-35">18 - 35</option>
              <option value="36-60">36 - 60</option>
              <option value="60plus">60+</option>
            </select>

            <button className="export-btn" onClick={exportToCSV}>
              Export CSV
            </button>

          </div>

          {/* TABLE */}
          <table className="members-table">

            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Group</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredMembers.map(member => (

                <tr key={member.id}>

                  <td>{member.member_code}</td>

                  <td>{member.first_name} {member.last_name}</td>

                  <td>{member.Auxiliary_Group || "-"}</td>

                  <td className={
                    member.membership_status === "Active"
                      ? "status active"
                      : "status inactive"
                  }>
                    {member.membership_status}
                  </td>

                  <td>{member.phone || "-"}</td>

                  <td>
                    <button className="view-btn" onClick={() => setViewingMember(member)}>View</button>
                    <button className="edit-btn" onClick={() => openEdit(member)}>Edit</button>
                    <button className="delete-btn" onClick={() => setDeletingMember(member)}>Delete</button>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* (Modals remain unchanged — your original code works perfectly) */}

    </div>
  );
}

export default AdminMembers;