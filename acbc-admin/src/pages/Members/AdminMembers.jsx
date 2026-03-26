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

  /* ================= EDIT FUNCTIONS ================= */

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

  /* ================= STATS ================= */

  const total = members.length;

  const active =
    members.filter(m => m.membership_status === "Active").length;

  const inactive = total - active;

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
          <h3>Total</h3>
          <p>{total}</p>
        </div>

        <div className="stats-card">
          <h3>Active</h3>
          <p>{active}</p>
        </div>

        <div className="stats-card">
          <h3>Inactive</h3>
          <p>{inactive}</p>
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
                        ? "status active"
                        : "status inactive"
                    }
                  >
                    {member.membership_status}
                  </td>

                  <td>{member.phone || "-"}</td>

                  <td>

                    <button
                      className="view-btn"
                      onClick={() => setViewingMember(member)}
                    >
                      View
                    </button>

                    <button
                      className="edit-btn"
                      onClick={() => openEdit(member)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => setDeletingMember(member)}
                    >
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

        <div className="modal-overlay">

          <div className="view-box">

            <h3>Member Profile</h3>

            <p><b>Code:</b> {viewingMember.member_code}</p>

            <p><b>Name:</b> {viewingMember.first_name} {viewingMember.last_name} {viewingMember.other_names}</p>

            <p><b>Gender:</b> {viewingMember.gender}</p>

            <p><b>Age:</b> {calculateAge(viewingMember.date_of_birth)}</p>

            <p><b>Phone:</b> {viewingMember.phone}</p>

            <p><b>Email:</b> {viewingMember.email || "-"}</p>

            <p><b>Status:</b> {viewingMember.membership_status}</p>

            <p><b>Baptized:</b> {viewingMember.baptized ? "Yes" : "No"}</p>

            <p><b>Group:</b> {viewingMember.Auxiliary_Group || "-"}</p>

            <p><b>Address:</b> {viewingMember.address || "-"}</p>

            <button
              className="cancel-btn"
              onClick={() => setViewingMember(null)}
            >
              Close
            </button>

          </div>

        </div>

      )}

      {/* EDIT MODAL */}

      {editingMember && (

        <div className="modal-overlay">

          <div className="form-box">

            <h3>Edit Member</h3>

            <form onSubmit={handleEditSubmit} className="edit-form">

              <div className="form-group">
                <label>First Name</label>
                <input
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Other Names</label>
                <input
                  name="other_names"
                  value={editForm.other_names}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={editForm.date_of_birth}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
                <label>Auxiliary Group</label>
                <select
                  name="Auxiliary_Group"
                  value={editForm.Auxiliary_Group}
                  onChange={handleEditChange}
                >
                  <option value="">None</option>
                  <option value="Youth">Youth</option>
                  <option value="Men">Men</option>
                  <option value="WMU">WMU</option>
                </select>
              </div>

              <div className="form-group">
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

              <div className="confirm-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="edit-btn">
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {deletingMember && (

        <div className="modal-overlay">

          <div className="confirm-box">

            <h3>Delete Member</h3>

            <p>
              Delete <strong>{deletingMember.first_name} {deletingMember.last_name}</strong> ?
            </p>

            <div className="confirm-actions">

              <button
                className="cancel-btn"
                onClick={() => setDeletingMember(null)}
              >
                Cancel
              </button>

              <button
                className="delete-btn"
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