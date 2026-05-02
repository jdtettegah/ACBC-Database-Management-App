import { useState, useEffect } from "react";
import { apiRequest, getRoles } from "../services/api";
import "./AddUser.css";
import { UserCog } from "lucide-react";

function AddUser({ onClose, refresh }) {

  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    first_name: "",
    last_name: "",
    role_id: ""
  });

  const [loading, setLoading] = useState(false);

  /* ================= LOAD ROLES ================= */

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getRoles();
        setRoles(data);
      } catch (err) {
        alert("Failed to load roles");
      }
    };

    loadRoles();
  }, []);

  /* ================= FORM ================= */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await apiRequest("/auth/create-user", {
        method: "POST",
        body: JSON.stringify(form)
      });

      alert("User created successfully");

      if (refresh) refresh();
      if (onClose) onClose();

    } catch (err) {
      alert(err.message);
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
            className="add-user-button"
            onClick={() => setOpen(true)}
            >
            <UserCog size={18} />
            Add User
        </button>

        {open && (
            <div className="add-user-modal-overlay" onClick={() => setOpen(false)}>

                <div className="add-user-box" onClick={(e) => e.stopPropagation()}>

                    <h3>Add New User</h3>

                    <input name="first_name" placeholder="First Name" onChange={handleChange} />
                    <input name="last_name" placeholder="Last Name" onChange={handleChange} />
                    <input name="username" placeholder="Username" onChange={handleChange} />
                    <input name="email" placeholder="Email" onChange={handleChange} />
                    <input name="password" placeholder="Password" onChange={handleChange} />

                    {/* 🔥 ROLE SELECT */}
                    <select name="role_id" onChange={handleChange} value={form.role_id}>
                    <option value="">Select Role</option>

                    {roles.map(role => (
                        <option key={role.id} value={role.id}>
                        {role.name}
                        </option>
                    ))}

                    </select>

                    <button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Create User"}
                    </button>

                    <button className="add-user-cancel-btn" onClick={() => setOpen(false)}>
                    Cancel
                    </button>

                </div>

            </div>

        )}
    </>
  );
}

export default AddUser;