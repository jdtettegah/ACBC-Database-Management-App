import { apiRequest } from "../services/api";
import "./AddAttendance.css";
import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { createPortal } from "react-dom";

// 🔥 STORAGE KEY
const STORAGE_KEY = "attendance_draft";

function AddAttendance({ refresh }) {

  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);

  const [date, setDate] = useState("");
  const [service, setService] = useState("Sunday Service");

  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");

  const [visitorForm, setVisitorForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    invited_by: "",
    remarks: "",
  });

  // ======================
  // 🔥 LOCAL STORAGE HELPERS
  // ======================
  const saveDraft = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const loadDraft = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

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

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const code = m.member_code?.toLowerCase() || "";
    const search = memberSearch.toLowerCase();
  
    return (
      fullName.includes(search) ||
      code.includes(search)
    );
  });

  // ======================
  // OPEN MODAL → LOAD DRAFT
  // ======================
  useEffect(() => {
    if (open) {
      fetchMembers();

      const draft = loadDraft();
      setAttendance(draft);
    }
  }, [open]);

  // ======================
  // ESC CLOSE
  // ======================
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  // ======================
  // 🔥 WARN BEFORE LEAVING
  // ======================
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const draft = localStorage.getItem(STORAGE_KEY);
  
      if (draft && draft !== "{}") {
        e.preventDefault();
        e.returnValue = ""; // required for browser trigger
      }
    };
  
    window.addEventListener("beforeunload", handleBeforeUnload);
  
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ======================
  // Toggle attendance (SAVE TO STORAGE)
  // ======================
  const handleCheck = (id) => {
    setAttendance((prev) => {
      const updated = {
        ...prev,
        [id]: !prev[id],
      };

      saveDraft(updated); // 🔥 persist

      return updated;
    });
  };

  // ======================
  // 🔥 FINAL SAVE (ONLY PRESENT)
  // ======================
  const handleSubmit = async () => {

    if (!date) {
      alert("Select service date");
      return;
    }

    setLoading(true);

    try {

      const presentMembers = Object.keys(attendance)
        .filter(id => attendance[id])
        .map(id => ({
          member_id: Number(id),
          status: "Present"
        }));

      await apiRequest("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          service_date: date,
          service_type: service,
          recorded_by: 1,
          records: presentMembers // ✅ ONLY PRESENT
        }),
      });

      alert("Attendance finalized");

      clearDraft(); // 🔥 clear draft
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
      <button className="record-attendance-button" onClick={() => setOpen(true)}>
        <ClipboardCheck size={18} />
        Record Attendance
      </button>

      {open && createPortal(
        <div className="add-attendance-modal-overlay" onClick={() => setOpen(false)}>
          <div className="add-attendance-page" onClick={(e) => e.stopPropagation()}>

            {/* HEADER */}
            <div className="add-attendance-header">
              <h2>Record Attendance</h2>

              <div className="add-attendance-controls">

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
                </select>

              </div>
            </div>

            {/* VISITORS */}
            <div className="add-attendance-visitor-section">

              <h3>Add Visitor</h3>

              <div className="add-attendance-visitor-form">

                <input name="first_name" placeholder="First Name" value={visitorForm.first_name} onChange={handleVisitorChange} />
                <input name="last_name" placeholder="Last Name" value={visitorForm.last_name} onChange={handleVisitorChange} />
                <input name="phone" placeholder="Phone" value={visitorForm.phone} onChange={handleVisitorChange} />
                <input name="invited_by" placeholder="Invited By" value={visitorForm.invited_by} onChange={handleVisitorChange} />
                <input name="remarks" placeholder="Remarks" value={visitorForm.remarks} onChange={handleVisitorChange} />

                <button className="add-visitor-attendance" onClick={handleAddVisitor}>
                  Add Visitor
                </button>

              </div>
            </div>

            <div className="attendance-member-search">
              <input
                type="text"
                placeholder="Search member name or code..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            {/* MEMBERS TABLE */}
            <div className="add-attendance-table-wrapper">
              <table className="add-attendance-table">

                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Group</th>
                    <th>Present</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.member_code}</td>
                      <td>{member.first_name} {member.last_name}</td>
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

            {/* ACTIONS */}

            {Object.values(attendance).some(Boolean) && (
              <div className="attendance-warning">
                ⚠️ You have unsaved attendance. Please click "Save Attendance" before leaving.
              </div>
            )}
            <div className="add-attendance-actions">

              <button
                className="add-attendance-cancel-btn"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <button
                className="add-attendance-save-btn"
                onClick={handleSubmit}
              >
                {loading ? "Saving..." : "Save Attendance"}
              </button>

            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default AddAttendance;