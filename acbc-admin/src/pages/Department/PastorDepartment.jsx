import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import "./AdminDepartment.css";

function PastorDepartments() {

  /* ================= STATES ================= */

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedMember, setSelectedMember] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);


  /* ================= LOAD ================= */

  const loadDepartments = async () => {
    try {
      const data = await apiRequest("/departments");
      setDepartments(data);
    } catch {
      setError("Failed to load departments");
    }
  };


  const loadAllMembers = async () => {
    try {
      const data = await apiRequest("/members");
      setAllMembers(data);
    } catch {
      setError("Failed to load members");
    }
  };


  const loadDepartmentMembers = async (departmentId) => {
    try {
      const data = await apiRequest(
        `/member-departments/department/${departmentId}`
      );
      setMembers(data);
    } catch {
      setError("Failed to load department members");
    }
  };


  useEffect(() => {
    Promise.all([
      loadDepartments(),
      loadAllMembers()
    ]).finally(() => setLoading(false));
  }, []);


  /* ================= SELECT ================= */

  const handleSelectDept = (dept) => {
    setSelectedDept(dept);
    loadDepartmentMembers(dept.id);
  };


  /* ================= CREATE ================= */

  const handleCreateDepartment = async () => {

    if (!deptName.trim()) {
      alert("Department name is required");
      return;
    }

    try {

      await apiRequest("/departments", {
        method: "POST",
        body: JSON.stringify({
          name: deptName,
          description: deptDesc
        })
      });

      setDeptName("");
      setDeptDesc("");
      setShowForm(false);

      loadDepartments();

    } catch (err) {
      alert(err.message || "Failed to create department");
    }
  };


  /* ================= ASSIGN ================= */

  const handleAssign = async () => {

    if (!selectedMember || !selectedDept) return;

    setAssigning(true);

    try {

      await apiRequest("/member-departments", {
        method: "POST",
        body: JSON.stringify({
          member_id: selectedMember.id,  
          member_code: selectedMember.member_code,
          department_id: selectedDept.id
        })
      });

      setSelectedMember("");
      loadDepartmentMembers(selectedDept.id);

    } catch (err) {

      alert(err.message || "Assignment failed");

    } finally {

      setAssigning(false);

    }
  };


  /* ================= REMOVE ================= */

  const handleRemove = async (id) => {

    if (!window.confirm("Remove this member?")) return;

    setRemoving(true);

    try {

      await apiRequest(
        `/member-departments/${id}`,
        { method: "DELETE" }
      );

      loadDepartmentMembers(selectedDept.id);

    } catch {

      alert("Failed to remove");

    } finally {

      setRemoving(false);

    }
  };


  /* ================= FILTER ================= */

  const unassignedMembers = allMembers.filter(
    m => !members.some(mem => mem.member_code === m.member_code)
  );


  /* ================= UI ================= */

  if (loading) return <p>Loading...</p>;


  return (
    <div className="departments-page">


      {/* HEADER */}

      <div className="departments-header">

        <h2>Departments</h2>

        <button
          className="add-btn"
          onClick={() => setShowForm(true)}
        >
          + Add Department
        </button>

      </div>


      {error && <p className="error">{error}</p>}


      {/* CREATE FORM */}

      {showForm && (

        <div className="dept-form">

          <h3>New Department</h3>

          <input
            type="text"
            placeholder="Department name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
          />

          <textarea
            placeholder="Description (optional)"
            value={deptDesc}
            onChange={(e) => setDeptDesc(e.target.value)}
          />

          <div className="form-actions">

            <button
              className="save-btn"
              onClick={handleCreateDepartment}
            >
              Save
            </button>

            <button
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

          </div>

        </div>

      )}


      {/* MAIN LAYOUT */}

      <div className="departments-layout">


        {/* LEFT */}

        <div className="departments-list">

          <h3>All Departments</h3>

          {departments.map(d => (

            <div
              key={d.id}
              className={
                selectedDept?.id === d.id
                  ? "dept-item active"
                  : "dept-item"
              }
              onClick={() => handleSelectDept(d)}
            >
              {d.name}
            </div>

          ))}

        </div>


        {/* RIGHT */}

        <div className="department-panel">


          {selectedDept ? (

            <>

              <h3>{selectedDept.name}</h3>


              {/* ASSIGN */}

              <div className="assign-box">

                <select
                    value={selectedMember?.id || ""}
                    onChange={(e) => {
                        const mem = unassignedMembers.find(m => m.member_code === e.target.value);
                        setSelectedMember(mem);
                    }}
                    disabled={assigning}
                >
                        <option value="">Select Member</option>
                            {unassignedMembers.map(m => (
                                <option key={m.id} value={m.member_code}>
                            {m.first_name} {m.last_name} {m.other_names}
                        </option>
                        ))}
                </select>



                <button
                  onClick={handleAssign}
                  disabled={assigning}
                >
                  {assigning ? "Assigning..." : "Assign"}
                </button>

              </div>


              {/* TABLE */}

              <table className="dept-table">

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                  </tr>
                </thead>

                <tbody>

                  {members.map(m => (

                    <tr key={m.id}>

                      <td>
                        {m.first_name} {m.last_name} {m.other_names}
                      </td>

                      <td>{m.phone || "-"}</td>

                     

                    </tr>

                  ))}


                  {members.length === 0 && (
                    <tr>
                      <td colSpan="3">No members yet</td>
                    </tr>
                  )}

                </tbody>

              </table>

            </>

          ) : (

            <p>Select a department</p>

          )}

        </div>

      </div>

    </div>
  );
}

export default PastorDepartments;
