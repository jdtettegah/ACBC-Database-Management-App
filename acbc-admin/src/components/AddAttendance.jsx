import { apiRequest } from "../services/api";
import "./AddAttendance.css";
import { useEffect, useState } from "react";

function AddAttendance({ refresh }) {

  const [open, setOpen] = useState(false);

  const [members, setMembers] = useState([]);

  const [date, setDate] = useState("");
  const [service, setService] = useState("Sunday Service");

  const [attendance, setAttendance] = useState({});

  const [visitorForm, setVisitorForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    invited_by: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);

  // ======================
  // Fetch Members
  // ======================
  const fetchMembers = async () => {
    try {
      const data = await apiRequest("/members");
      setMembers(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load members");
    }
  };

  useEffect(() => {
    if (open) fetchMembers();
  }, [open]);

  // ======================
  // Toggle attendance
  // ======================
  const handleCheck = (id) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ======================
  // Save Member Attendance
  // ======================
  const handleSubmit = async () => {

    if (!date) {
      alert("Select service date");
      return;
    }

    setLoading(true);

    try {

      const records = members.map(member => ({
        member_id: member.id,
        status: attendance[member.id] ? "Present" : "Absent"
      }));
      
      await apiRequest("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          service_date: date,
          service_type: service,
          recorded_by: 1,
          records
        }),
      });


      alert("Attendance saved");

      setAttendance({});
      setOpen(false);
      refresh && refresh();

    } catch (err) {

      console.error(err);
      alert("Failed to save attendance");

    }

    setLoading(false);
  };

  // ======================
  // Visitor input
  // ======================
  const handleVisitorChange = (e) => {
    setVisitorForm({
      ...visitorForm,
      [e.target.name]: e.target.value,
    });
  };

  // ======================
  // Save visitor
  // ======================
  const handleAddVisitor = async () => {

    if (!date) {
      alert("Select service date");
      return;
    }

    try {

      await apiRequest("/visitors", {
        method: "POST",
        body: JSON.stringify({
          ...visitorForm,
          visit_date: date,
          service_type: service,
        }),
      });

      alert("Visitor recorded");

      setVisitorForm({
        first_name: "",
        last_name: "",
        phone: "",
        invited_by: "",
        remarks: "",
      });

    } catch (err) {

      console.error(err);
      alert("Failed to add visitor");

    }
  };

  return (
    <>
      <button className="add-attendance-button" onClick={() => setOpen(true)}>
        📝 Record Attendance
      </button>

      {open && (
        <div className="modal-overlay">
          <div className="attendance-page">

            <div className="attendance-header">

              <h2>Record Attendance</h2>

              <div className="attendance-controls">

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />

                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option>Sunday Service</option>
                  <option>Midweek Service</option>
                  <option>Youth Service</option>
                  <option>Prayer Meeting</option>
                </select>

              </div>

            </div>

            {/* MEMBERS TABLE */}

            <div className="attendance-table-wrapper">

              <table className="attendance-table">

                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Group</th>
                    <th>Present</th>
                  </tr>
                </thead>

                <tbody>

                  {members.map((member) => (

                    <tr key={member.id}>

                      <td>{member.member_code}</td>

                      <td>
                        {member.first_name} {member.last_name}
                      </td>

                      <td>{member.Auxiliary_Group}</td>

                      <td>
                        <input
                          type="checkbox"
                          checked={attendance[member.id] || false}
                          onChange={() => handleCheck(member.id)}
                        />
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* VISITOR FORM */}

            <div className="visitor-section">

              <h3>Add Visitor</h3>

              <div className="visitor-form">

                <input
                  name="first_name"
                  placeholder="First Name"
                  value={visitorForm.first_name}
                  onChange={handleVisitorChange}
                />

                <input
                  name="last_name"
                  placeholder="Last Name"
                  value={visitorForm.last_name}
                  onChange={handleVisitorChange}
                />

                <input
                  name="phone"
                  placeholder="Phone"
                  value={visitorForm.phone}
                  onChange={handleVisitorChange}
                />

                <input
                  name="invited_by"
                  placeholder="Invited By"
                  value={visitorForm.invited_by}
                  onChange={handleVisitorChange}
                />

                <input
                  name="remarks"
                  placeholder="Remarks"
                  value={visitorForm.remarks}
                  onChange={handleVisitorChange}
                />

                <button onClick={handleAddVisitor}>
                  Add Visitor
                </button>

              </div>

            </div>

            <div className="attendance-actions">

              <button className="cancel-btn" onClick={() => setOpen(false)}>
                Cancel
              </button>

              <button className="save-btn" onClick={handleSubmit}>
                {loading ? "Saving..." : "Save Attendance"}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default AddAttendance;