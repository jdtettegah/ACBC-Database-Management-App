import "./AdminMember.css";
import AddMember from "../../components/AddMember";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import AddUser from "../../components/AddUser";
import { Eye, FileSpreadsheet, Pencil, Trash2, Users } from "lucide-react";

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
  
    // Force YYYY-MM-DD only
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
      m.auxiliary_group || "",
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

  /* ================= EDIT FUNCTIONS ================= */

  const openEdit = (member) => {

    setEditingMember(member);

    setEditForm({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      other_names: member.other_names || "",
      gender: member.gender || "",
      phone: member.phone || "",
      date_joined: member.date_joined,
      email: member.email || "",
      address: member.address || "",
      baptized: member.baptized ? 1 : 0,
      auxiliary_group: member.auxiliary_group || "",
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

      && (groupFilter === "" || m.auxiliary_group === groupFilter)

      && ageMatch
    );

  });

  /* ================= STATS ================= */

  const total = members.length;

  const active =
    members.filter(m => m.membership_status === "Active").length;

  const inactive = total - active;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setViewingMember(null);
        setEditingMember(null);
        setDeletingMember(null);
      }
    };
  
    window.addEventListener("keydown", handleEsc);
  
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  /* ================= UI ================= */

  return (

    <div className="members-page">

      {/* HEADER */}

      <div className="members-header">

        <div className="member-title">
          <span className="member-title-icon"><Users /></span>
          <span className="member-title-text">Members</span>
        </div>

        <div className="member-header-buttons">
          <div className="member-action-btn">
            <AddMember onSuccess={loadMembers} />
          </div>

          <div className="member-action-btn">
            <AddUser />
          </div>
        </div>

      </div>

      {/* STATS */}

      <div className="members-stats">

        <div className="member-stats-card">
          <h3>Total</h3>
          <p>{total}</p>
        </div>

        <div className="member-stats-card">
          <h3>Active</h3>
          <p>{active}</p>
        </div>

        <div className="member-stats-card">
          <h3>Inactive</h3>
          <p>{inactive}</p>
        </div>

      </div>

      {error && <p className="error">{error}</p>}

      {loading && <p>Loading members...</p>}

      {!loading && (

        <div className="members-table-wrapper">

          {/* FILTER BAR */}

          <div className="member-filter-bar">

            <input
              type="text"
              placeholder="Search name, phone, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={baptizedFilter}
              onChange={(e) => setBaptizedFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">Baptized</option>
              <option value="0">Not Baptized</option>
            </select>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">All Groups</option>
              <option value="Youth">Youth</option>
              <option value="Men">Men</option>
              <option value="WMU">WMU</option>
            </select>

            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="">All Ages</option>
              <option value="under18">Under 18</option>
              <option value="18-35">18 - 35</option>
              <option value="36-60">36 - 60</option>
              <option value="60plus">60+</option>
            </select>


            <button className="member-export-btn" onClick={exportToCSV}>
            <FileSpreadsheet size={18} />
            Export
            </button>

          </div>

          {/* TABLE */}

          <table className="members-table">

            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredMembers.map(member => (

                <tr key={member.id}>

                  <td>{member.member_code}</td>

                  <td>
                    {member.first_name} {member.last_name}
                  </td>

                  <td
                    className={
                      member.membership_status === "Active"
                        ? "member-status active"
                        : "member-status inactive"
                    }
                  >
                    {member.membership_status}
                  </td>

                  <td>{member.phone || "-"}</td>

                  <td>

                    <button
                      className="member-view-btn"
                      onClick={() => setViewingMember(member)}
                    >
                      <Eye size={18} />
                      View
                    </button>

                    <button
                      className="member-edit-btn"
                      onClick={() => openEdit(member)}
                    >
                      <Pencil size={18} />
                      Edit
                    </button>

                    <button
                      className="member-delete-btn"
                      onClick={() => setDeletingMember(member)}
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* VIEW MODAL */}

      {viewingMember && (

        <div className="member-modal-overlay" onClick={() => setViewingMember(null)}>

          <div className="member-view-box" onClick={(e) => e.stopPropagation()}>

            <h3>Member Profile</h3>

            <p>
              <b>Code:</b>
              <span>{viewingMember.member_code}</span>
            </p>

            <p>
              <b>Name:</b> 
              <span>{viewingMember.first_name} {viewingMember.last_name} {viewingMember.other_names}</span>
            </p>

            <p>
              <b>Gender:</b> 
              <span>{viewingMember.gender}</span>
            </p>

            <p>
              <b>Age:</b>
              <span> {calculateAge(viewingMember.date_of_birth)}</span>
            </p>

            <p>
              <b>Phone:</b>
              <span> {viewingMember.phone}</span>
            </p>

            <p>
              <b>Email:</b> 
              <span>{viewingMember.email || "-"}</span>
            </p>

            <p>
              <b>Status:</b> 
              <span>{viewingMember.membership_status}</span>
            </p>

            <p>
              <b>Baptized:</b> 
              <span>{viewingMember.baptized ? "Yes" : "No"}</span>
            </p>

            <p>
              <b>Group:</b>
              <span> {viewingMember.auxiliary_group || "-"}</span>
            </p>

            <p>
              <b>Address:</b>
              <span> {viewingMember.address || "-"}</span>
            </p>

            <button
              className="member-cancel-btn"
              onClick={() => setViewingMember(null)}
            >
              Close
            </button>

          </div>

        </div>

      )}

      {/* EDIT MODAL */}

      {editingMember && (

        <div className="member-modal-overlay" onClick={() => setEditingMember(null)}>

          <div className="member-form-box" onClick={(e) => e.stopPropagation()}>

            <h3>Edit Member</h3>

            <form onSubmit={handleEditSubmit} className="member-edit-form">

              <div className="member-form-group">
                <label>First Name</label>
                <input
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Other Names</label>
                <input
                  name="other_names"
                  value={editForm.other_names}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="member-form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={editForm.date_of_birth}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Phone</label>
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Email</label>
                <input
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Address</label>
                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                />
              </div>

              <div className="member-form-group">
                <label>Baptized</label>
                <select
                  name="baptized"
                  value={editForm.baptized}
                  onChange={handleEditChange}
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </div>

              <div className="member-form-group">
                <label>Auxiliary Group</label>
                <select
                  name="Auxiliary_Group"
                  value={editForm.auxiliary_group}
                  onChange={handleEditChange}
                >
                  <option value="">None</option>
                  <option value="Youth">Youth</option>
                  <option value="Men">Men</option>
                  <option value="WMU">WMU</option>
                </select>
              </div>

              <div className="member-form-group">
                <label>Status</label>
                <select
                  name="membership_status"
                  value={editForm.membership_status}
                  onChange={handleEditChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="member-confirm-actions">

                <button
                  type="button"
                  className="member-cancel-btn"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="member-edit-button">
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {deletingMember && (

        <div className="member-modal-overlay"  onClick={() => setDeletingMember(null)}>

          <div className="member-confirm-box" onClick={(e) => e.stopPropagation()}>

            <h3>Delete Member</h3>

            <p>
              Are you sure you want to Remove <strong>{deletingMember.first_name} {deletingMember.last_name}</strong> ?
            </p>

            <div className="member-confirm-actions">

              <button
                className="member-cancel-btn"
                onClick={() => setDeletingMember(null)}
              >
                Cancel
              </button>

              <button
                className="member-delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminMembers;