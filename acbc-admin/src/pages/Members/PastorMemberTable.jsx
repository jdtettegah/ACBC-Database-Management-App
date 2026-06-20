import { useState, useEffect } from "react";
import "./PastorMemberTable.css";
import { FileSpreadsheet, FileText } from "lucide-react";

function PastorMemberTable({ members }) {

  /* ================= STATE ================= */

  const [viewingMember, setViewingMember] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [baptizedFilter, setBaptizedFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  /* ================= HELPERS ================= */

  const calculateAge = (dob) => {
    if (!dob) return null;

    const birth = new Date(dob);
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

  /* ================= EXPORT CSV ================= */

  const exportToCSV = () => {

    const headers = ["Code", "Name", "Phone", "Status"];

    const rows = filteredMembers.map(m => [
      m.member_code,
      `${m.first_name} ${m.last_name}`,
      m.phone || "",
      m.membership_status
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "members.csv";
    link.click();
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
      if (age === null) ageMatch = false;
      else {
        if (ageFilter === "under18") ageMatch = age < 18;
        if (ageFilter === "18-35") ageMatch = age >= 18 && age <= 35;
        if (ageFilter === "36-60") ageMatch = age >= 36 && age <= 60;
        if (ageFilter === "60plus") ageMatch = age > 60;
      }
    }

    return (
      (
        fullName.includes(search) ||
        m.phone?.includes(search) ||
        m.member_code?.toLowerCase().includes(search)
      ) &&
      (genderFilter === "" || m.gender === genderFilter) &&
      (baptizedFilter === "" || baptizedValue === baptizedFilter) &&
      (groupFilter === "" || m.auxiliary_group === groupFilter) &&
      ageMatch
    );
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text("Church Members Report", 14, 15);
  
    const tableColumn = [
      "Code",
      "First Name",
      "Last Name",
      "Phone",
      "Gender",
      "Group",
      "Status",
      "Baptized",
    ];
  
    const tableRows = filteredMembers.map((m) => [
      m.member_code,
      m.first_name,
      m.last_name,
      m.phone || "",
      m.gender,
      m.auxiliary_group || "",
      m.membership_status,
      m.baptized ? "Yes" : "No",
    ]);
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
  
    doc.save("members_filtered.pdf");
  };


  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setViewingMember(null);
        
      }
    };
  
    window.addEventListener("keydown", handleEsc);
  
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  /* ================= UI ================= */

  return (
    <div className="pastor-members-page">

      {/* FILTER BAR */}
      <div className="member-filter-bar">

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

        <button className="member-export-btn" onClick={exportToCSV}>
        <FileSpreadsheet size={18} />
        Export
        </button>

        <button
          className="member-export-btn pdf"
          onClick={exportToPDF}
        >
          <FileText size={18} />
          Download PDF
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

              <td className={
                member.membership_status === "Active"
                  ? "status active"
                  : "status inactive"
              }>
                {member.membership_status}
              </td>

              <td>{member.phone || "-"}</td>

              <td>
                <button
                  className="member-view-btn"
                  onClick={() => setViewingMember(member)}
                >
                  View
                </button>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* MODAL */}
      {viewingMember && (
        <div className="member-modal-overlay"  onClick={() => setViewingMember(null)}>

          <div className="member-view-box" onClick={(e) => e.stopPropagation()} >

            <h3>Member Profile</h3>

            <p><b>Code:</b> {viewingMember.member_code}</p>
            <p><b>Name:</b> {viewingMember.first_name} {viewingMember.last_name} {viewingMember.other_names}</p>
            <p><b>Gender:</b> {viewingMember.gender}</p>
            <p><b>Age:</b> {calculateAge(viewingMember.date_of_birth)}</p>
            <p><b>Phone:</b> {viewingMember.phone}</p>
            <p><b>Email:</b> {viewingMember.email || "-"}</p>
            <p><b>Status:</b> {viewingMember.membership_status}</p>
            <p><b>Baptized:</b> {viewingMember.baptized ? "Yes" : "No"}</p>
            <p><b>Group:</b> {viewingMember.auxiliary_group || "-"}</p>
            <p><b>Address:</b> {viewingMember.address || "-"}</p>

            <button
              className="member-cancel-btn"
              onClick={() => setViewingMember(null)}
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