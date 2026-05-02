import { useState } from "react";
import { addVisitor } from "../services/api";

function AddVisitor({ refresh }) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    visit_date: "",
    service_type: "Sunday Service",
    invited_by: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name || !form.last_name || !form.visit_date) {
      alert("Fill required fields");
      return;
    }

    try {
      setLoading(true);

      await addVisitor(form);

      alert("Visitor saved");

      setForm({
        first_name: "",
        last_name: "",
        phone: "",
        visit_date: "",
        service_type: "Sunday Service",
        invited_by: "",
        remarks: "",
      });

      setOpen(false);

      if (refresh) refresh();
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="add-visitor-button">
        ➕ Add Visitor
      </button>

      {open && (
        <div className="add-visitor-modal-overlay">
          <div className="add-visitor-edit-box">

            <h3>Add Visitor</h3>

            <form onSubmit={handleSubmit}>

              <input
                name="first_name"
                placeholder="First Name"
                value={form.first_name}
                onChange={handleChange}
                required
              />

              <input
                name="last_name"
                placeholder="Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
              />

              <input
                type="date"
                name="visit_date"
                value={form.visit_date}
                onChange={handleChange}
                required
              />

              <select
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
              >
                <option>Sunday Service</option>
                <option>Midweek Service</option>
                <option>Prayer Meeting</option>
              </select>

              <input
                name="invited_by"
                placeholder="Invited By"
                value={form.invited_by}
                onChange={handleChange}
              />

              <textarea
                name="remarks"
                placeholder="Remarks"
                value={form.remarks}
                onChange={handleChange}
              />

              <div className="add-visitor-form-actions">

                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>

                <button type="button" onClick={() => setOpen(false)}>
                  Cancel
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddVisitor;