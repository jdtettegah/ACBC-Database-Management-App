import { useState } from "react";
import {useNavigate} from "react-router-dom";
import acbcLogo from "../assets/acbc-logo.png"; // put logo here
import "../styles/pages.css"
import { Eye, EyeOff } from "lucide-react";




function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        role: data.role,
        email: data.email,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name
      }));


      navigate("/dashboard");
      
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-brand-form">
        {/* LEFT BRAND SECTION */}
        <div className="auth-brand">
          <img src={acbcLogo} alt="ACBC Logo" id='acbc-logo'/>
          <h1>Acts Charismatic<br />Baptist Church</h1>
          <p>
            Building lives through the Word, faith, and the power of the Holy Spirit.
          </p>
        </div>

      {/* RIGHT LOGIN SECTION */}
        <div className="auth-form">
          <form onSubmit={handleSubmit}>
            <h2>Sign In</h2>

            {error && <div className="error-box">{error}</div>}

            <label>Email Address</label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
      

      <footer className="auth-footer">
            <p>
                © 2026 ACBC Management System · Powered by J-Tech Solutions
            </p>
      </footer>
    </div>
    
  );
}

export default Login;
