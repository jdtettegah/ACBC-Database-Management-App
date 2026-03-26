import { useState } from "react";
import "./PastorMemberTable.css";

function PastorMemberTable({ members }) {

  /* ================= STATE ================= */

  const [selectedMember, setSelectedMember] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [baptizedFilter, setBaptizedFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");


  /* ================= HELPERS ================= */

  // Accurate age calculator
  const calculateAge = (dob) => {

    if (!dob) return null;

    let birth;

    // ISO string
    if (typeof dob === "string") {
      birth = new Date(dob);
    } else {
      return null;
    }

    if (isNaN(birth.getTime())) return null;

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

    let ageMatch = true;

    if (ageFilter) {

      if (age === null) ageMatch = false;

      else {

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


  /* ================= UI ================= */

  return (
    <div className="pastor-members-page">


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
      <div className="table-wrapper">

        <table className="members-table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Aux Group</th>
              <th>Phone</th>
              <th>View</th>
            </tr>
          </thead>


          <tbody>

            {filteredMembers.map((member) => (

              <tr key={member.id}>

                <td>
                  {member.first_name} {member.last_name}
                </td>

                <td>{member.Auxiliary_Group}</td>

                <td>{member.phone}</td>

                <td>
                  <button
                    className="view-button"
                    onClick={() => setSelectedMember(member)}
                  >
                    View
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      {/* MODAL */}
      {selectedMember && (

        <div className="modal-overlay">

          <div className="view-box">

            <h3>Member Details</h3>

            <p>
              <strong>Name:</strong>{" "}
              {selectedMember.first_name}{" "}
              {selectedMember.last_name}
            </p>

            <p>
              <strong>Gender:</strong>{" "}
              {selectedMember.gender}
            </p>

            <p>
              <strong>Aux Group:</strong>{" "}
              {selectedMember.Auxiliary_Group}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {selectedMember.phone}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {selectedMember.email}
            </p>

            <p>
              <strong>Joined:</strong>{" "}
              {selectedMember.date_joined}
            </p>

            <button
              onClick={() => setSelectedMember(null)}
              className="cancel-btn"
            >
              Close
            </button>

          </div>
        </div>

      )}

    </div>
  );
}

export default PastorMemberTable;
