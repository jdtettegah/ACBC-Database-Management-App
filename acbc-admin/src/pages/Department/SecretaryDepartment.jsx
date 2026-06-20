import { useEffect, useState } from "react";
import {
  getDepartments,
  createDepartment,
  assignMemberToDepartment,
  getDepartmentMembers,
  removeMemberFromDepartment,
  getMembers
} from "../../services/api";

import DepartmentChart from "../../components/DepartmentChart";
import "./AdminDepartment.css";
import { Building2, CalendarPlus } from "lucide-react";

function SecretaryDepartments() {

  /* ================= STATES ================= */

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

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
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      setError("Failed to load departments");
    }
  };

  const loadAllMembers = async () => {
    try {
      const data = await getMembers();
      setAllMembers(data);
    } catch {
      setError("Failed to load members");
    }
  };

  const loadDepartmentMembers = async (departmentId) => {
    try {
      const data = await getDepartmentMembers(departmentId);
      setMembers(data);
    } catch {
      setError("Failed to load department members");
    }
  };

  useEffect(() => {
    Promise.all([loadDepartments(), loadAllMembers()])
      .finally(() => setLoading(false));
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
      await createDepartment({
        name: deptName,
        description: deptDesc
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
      await assignMemberToDepartment({
        member_id: selectedMember.id,
        member_code: selectedMember.member_code,
        department_id: selectedDept.id
      });

      setSelectedMember(null);
      loadDepartmentMembers(selectedDept.id);
      loadDepartments(); // update counts

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
      await removeMemberFromDepartment(id);

      loadDepartmentMembers(selectedDept.id);
      loadDepartments(); // update counts

    } catch {
      alert("Failed to remove");
    } finally {
      setRemoving(false);
    }
  };


  /* ================= DATA ================= */

  const unassignedMembers = allMembers.filter(
    m => !members.some(mem => mem.member_code === m.member_code)
  );

  const totalDepartments = departments.length;

  const totalAssigned = departments.reduce(
    (acc, d) => acc + (d.member_count || 0), 0
  );

  const unassignedCount = allMembers.length - totalAssigned;

  const largestDept = departments.reduce((max, d) => {
    return (d.member_count || 0) > (max?.member_count || 0)
      ? d
      : max;
  }, null);


  /* ================= UI ================= */

  if (loading) return <p>Loading...</p>;

  return (
    <div className="departments-page">

      {/* HEADER */}
      <div className="departments-header">
        <div className="department-title">
          <span className="department-title-icon"><Building2 /></span>
          <span className="department-title-text">Departments</span>
        </div>

        <div className="department-action-btn">
          <button className="add-department-button"
            
            onClick={() => setShowForm(true)}
          >
            <Building2 size={18} />
            Add Department
          </button>
          </div>
      </div>

      {error && <p className="error">{error}</p>}


      {/* STATS */}
      <div className="department-stats-cards">

        <div className="department-stats-card">
          <h3>Total Departments</h3>
          <p>{totalDepartments}</p>
        </div>

        <div className="department-stats-card">
          <h3>Total Members</h3>
          <p>{totalAssigned}</p>
        </div>


        <div className="department-stats-card">
          <h3>Largest Dept</h3>
          <p>{largestDept?.name || "-"}</p>
        </div>

      </div>

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
            placeholder="Description"
            value={deptDesc}
            onChange={(e) => setDeptDesc(e.target.value)}
          />

          <div className="department-form-actions">
            <button className="department-save-btn" onClick={handleCreateDepartment}>
              Save
            </button>

            <button className="department-cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>

        </div>
      )}


      {/* CHART */}
      <DepartmentChart departments={departments} />


      {/* FORM */}
      


      {/* MAIN */}
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
              {d.name} ({d.member_count || 0})
            </div>
          ))}

        </div>


        {/* RIGHT */}
        <div className="department-panel">

          {selectedDept ? (
            <>
              <h3>{selectedDept.name}</h3>

              {/* ASSIGN */}
              <div className="department-assign-box">

                <select
                  value={selectedMember?.member_code || ""}
                  onChange={(e) => {
                    const mem = unassignedMembers.find(
                      m => m.member_code === e.target.value
                    );
                    setSelectedMember(mem);
                  }}
                >
                  <option value="">Select Member</option>

                  {unassignedMembers.map(m => (
                    <option key={m.id} value={m.member_code}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>

                <button onClick={handleAssign}>
                  {assigning ? "Assigning..." : "Assign"}
                </button>

              </div>


              {/* TABLE */}
              <table className="dept-table">

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {members.map(m => (
                    <tr key={m.id}>

                      <td>
                        {m.first_name} {m.last_name} {m.other_names}
                      </td>

                      <td>{m.phone || "-"}</td>

                      <td>
                        <button
                          className="department-delete-btn"
                          onClick={() => handleRemove(m.member_department_id)}
                        >
                          {removing ? "Removing..." : "Remove"}
                        </button>
                      </td>

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

export default SecretaryDepartments;