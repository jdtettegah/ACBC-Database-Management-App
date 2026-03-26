// AddMember.jsx
import "./AddMember.css";
import { useState } from "react";
import { apiRequest } from "../services/api";

function AddMember({ onSuccess}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    other_names: "",

    gender: "",
    date_of_birth: "",

    phone: "",
    email: "",
    address: "",

    membership_status: "Active",
    date_joined: "",

    baptized: false,

    Auxiliary_Group: "",
  });

  /* Generate Member Code */
  const generateMemberCode = (first, last) => {
    const initials =
      first.charAt(0).toUpperCase() +
      last.charAt(0).toUpperCase();

    const random = Math.floor(1000 + Math.random() * 9000);

    return initials + random; // JS4567
  };

  /* Handle Input */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name) {
      alert("First name and Last name are required");
      return;
    }

    const member_code = generateMemberCode(
      formData.first_name,
      formData.last_name
    );

    const payload = {
      ...formData,
      member_code,
    };

    try {
      setLoading(true);

      await apiRequest("/members", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Member added successfully ✅");
      onSuccess();

      setOpen(false);

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        other_names: "",

        gender: "",
        date_of_birth: "",

        phone: "",
        email: "",
        address: "",

        membership_status: "Active",
        date_joined: "",

        baptized: false,

        Auxiliary_Group: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add member ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="add-attendance-button"
        onClick={() => setOpen(true)}
      >
        ➕ Add Member
      </button>

      {open && (
        <div className="modal-overlay">
          <div className="add-member-page">

            <div className="add-member-header">
              <h2>Add New Member</h2>
              <p>Fill in member details</p>
            </div>

            <form className="add-member-form" onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* First Name */}
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Other Names */}
                <div className="form-group">
                  <label>Other Names</label>
                  <input
                    type="text"
                    name="other_names"
                    value={formData.other_names}
                    onChange={handleChange}
                  />
                </div>

                {/* Gender */}
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                {/* DOB */}
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="membership_status"
                    value={formData.membership_status}
                    onChange={handleChange}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Transferred</option>
                  </select>
                </div>

                {/* Date Joined */}
                <div className="form-group">
                  <label>Date Joined</label>
                  <input
                    type="date"
                    name="date_joined"
                    value={formData.date_joined}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Baptized */}
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="baptized"
                      checked={formData.baptized}
                      onChange={handleChange}
                    />
                    Baptized
                  </label>
                </div>

                {/* Auxiliary Group */}
                <div className="form-group">
                  <label>Auxiliary Group</label>
                  <select
                    name="Auxiliary_Group"
                    value={formData.Auxiliary_Group}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Youth</option>
                    <option>Men</option>
                    <option>WMU</option>
                    <option>Children</option>
                  </select>
                </div>

                {/* Address */}
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

              </div>

              {/* Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Member"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddMember;
