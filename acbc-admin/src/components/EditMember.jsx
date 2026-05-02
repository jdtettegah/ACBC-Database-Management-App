import "./AddMember.css";
import { useState } from "react";
import { apiRequest } from "../services/api";

function EditMember({ member, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    other_names: member.other_names || "",
    gender: member.gender,
    date_of_birth: member.date_of_birth?.split("T")[0] || "",
    phone: member.phone,
    email: member.email || "",
    address: member.address || "",
    membership_status: member.membership_status,
    date_joined: member.date_joined?.split("T")[0] || "",
    baptized: member.baptized ? "Yes" : "No",
    Auxiliary_Group: member.Auxiliary_Group || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...formData,
        baptized: formData.baptized === "Yes",
      };

      await apiRequest(`/members/${member.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      onSuccess();
      onClose();

    } catch (err) {
      setError(err.message || "Update failed");
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
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="add-member-page" onClick={(e) => e.stopPropagation()}>

        <div className="add-member-header">
          <h2>Edit Member</h2>
        </div>

        {error && <p className="error-text">{error}</p>}

        <form className="add-member-form" onSubmit={handleSubmit}>

          <div className="form-grid">

            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              required
            />

            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              required
            />

            <input
              name="other_names"
              value={formData.other_names}
              onChange={handleChange}
              placeholder="Other Names"
            />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
            />

            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone"
              required
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
            />

            <select
              name="membership_status"
              value={formData.membership_status}
              onChange={handleChange}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Transferred</option>
            </select>

            <input
              type="date"
              name="date_joined"
              value={formData.date_joined}
              onChange={handleChange}
              required
            />

            <select
              name="baptized"
              value={formData.baptized}
              onChange={handleChange}
            >
              <option>No</option>
              <option>Yes</option>
            </select>

            <input
              name="Auxiliary_Group"
              value={formData.Auxiliary_Group}
              onChange={handleChange}
              placeholder="Auxiliary Group"
            />

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
            />

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Update"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default EditMember;
