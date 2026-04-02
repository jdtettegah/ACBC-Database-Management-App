import "./AdminMember.css";
import AddMember from "../../components/AddMember";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import EditMember from "../../components/EditMember";

function AdminMembers() {

  /* ================= STATES ================= */

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [baptizedFilter, setBaptizedFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");


  /* ================= HELPERS ================= */

  // Accurate age calculator
  const calculateAge = (dob) => {
    if (!dob) return null;
  
    const [year, month, day] = dob.split("-").map(Number);
  
    const birth = new Date(year, month - 1, day); // local date, no timezone shift
    const today = new Date();
  
    let age = today.getFullYear() - birth.getFullYear();
  
    const monthDiff = today.getMonth() - birth.getMonth();
  
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
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

    /* SEARCH */

    const search = searchTerm.toLowerCase();

    const fullName =
      `${m.first_name} ${m.last_name}`.toLowerCase();


    /* AGE */

    const age = calculateAge(m.date_of_birth);


    /* BAPTIZED NORMALIZE */

    const baptizedValue =
      m.baptized === true || m.baptized === 1 ? "1" : "0";


    /* AGE FILTER */

    let ageMatch = true; // allow all by default

      if (ageFilter && ageFilter !== "all") {
        ageMatch = false;

        if (age !== null && !isNaN(age)) {

          if (ageFilter === "under18") ageMatch = age < 18;

          if (ageFilter === "18-35") ageMatch = age >= 18 && age <= 35;

          if (ageFilter === "36-60") ageMatch = age >= 36 && age <= 60;

          if (ageFilter === "60plus") ageMatch = age > 60;
        }
      }

  


    /* FINAL MATCH */

    return (

      /* SEARCH */
      (
        fullName.includes(search) ||
        m.phone?.includes(search) ||
        m.member_code?.toLowerCase().includes(search)
      )

      /* GENDER */
      && (genderFilter === "" || m.gender === genderFilter)

      /* BAPTIZED */
      && (baptizedFilter === "" || baptizedValue === baptizedFilter)

      /* GROUP */
      && (groupFilter === "" || m.Auxiliary_Group === groupFilter)

      /* AGE */
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

        <div className="attendance-table-header">Members</div>
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


      {/* ERROR */}

      {error && <p className="error">{error}</p>}


      {/* LOADING */}

      {loading && <p>Loading members...</p>}


      {/* TABLE */}

      {!loading && (

        <div className="members-table-wrapper">


          {/* FILTER BAR */}

          <div className="filter-bar">


            {/* SEARCH */}

            <input
              type="text"
              placeholder="Search name, phone, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />


            {/* GENDER */}

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>


            {/* BAPTIZED */}

            <select
              value={baptizedFilter}
              onChange={(e) => setBaptizedFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">Baptized</option>
              <option value="0">Not Baptized</option>
            </select>


            {/* GROUP */}

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">All Groups</option>
              <option value="Youth">Youth</option>
              <option value="Men">Men</option>
              <option value="WMU">WMU</option>
            </select>


            {/* AGE */}

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
                      onClick={() => setEditingMember(member)}
                    >
                      Edit
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


      {/* EDIT */}

      {editingMember && (

        <EditMember
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={loadMembers}
        />

      )}


      {/* DELETE */}

      {deletingMember && (

        <div className="modal-overlay">

          <div className="confirm-box">

            <h3>Delete Member</h3>

            <p>
              Delete{" "}
              <strong>
                {deletingMember.first_name}{" "}
                {deletingMember.last_name}
              </strong>
              ?
            </p>


            <div className="confirm-actions">

              <button
                className="cancel-btn"
                onClick={() => setDeletingMember(null)}
              >
                Cancel
              </button>

              

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminMembers;
