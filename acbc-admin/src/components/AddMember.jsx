// AddMember.jsx
import "./AddMember.css";
import { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { UserPlus } from "lucide-react";
import { createPortal } from "react-dom";


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

    auxiliary_group: "",
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

        auxiliary_group: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add member ❌");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <button
        className="add-member-button"
        onClick={() => setOpen(true)}
      >
        <UserPlus size={18} />
        Add Member
      </button>

      {open && createPortal(
        <div className="add-member-modal-overlay" onClick={() => setOpen(false)}>
          <div className="add-member-page" onClick={(e) => e.stopPropagation()}>

            <div className="add-member-header">
              <h2>Add New Member</h2>
              <p>Fill in member details</p>
            </div>

            <form className="add-member-form" onSubmit={handleSubmit}>
              <div className="add-member-form-grid">

                {/* First Name */}
                <div className="add-member-form-group">
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
                <div className="add-member-form-group">
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
                <div className="add-member-form-group">
                  <label>Other Names</label>
                  <input
                    type="text"
                    name="other_names"
                    value={formData.other_names}
                    onChange={handleChange}
                  />
                </div>

                {/* Gender */}
                <div className="add-member-form-group">
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
                <div className="add-member-form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                {/* Phone */}
                <div className="add-member-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="add-member-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Status */}
                <div className="add-member-form-group">
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
                <div className="add-member-form-group">
                  <label>Date Joined</label>
                  <input
                    type="date"
                    name="date_joined"
                    value={formData.date_joined}
                    onChange={handleChange}
                    required
                  />
                </div>

               

                {/* Auxiliary Group */}
                <div className="add-member-form-group">
                  <label>Auxiliary Group</label>
                  <select
                    name="auxiliary_group"
                    value={formData.auxiliary_group}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Youth</option>
                    <option>Men</option>
                    <option>WMU</option>
                    <option>Children</option>
                  </select>
                </div>

                 {/* Baptized */}
                 <div className="baptised-check">
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

                {/* Address */}
                <div className="add-member-form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

              </div>

              {/* Buttons */}
              <div className="add-member-form-actions">
                <button
                  type="button"
                  className="add-member-cancel-btn"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-member-save-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Member"}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default AddMember;
