import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { loginUser } from "../mongodb";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      alert("Only verified Google Gmail addresses (@gmail.com) are allowed");
      return;
    }

    try {
      setLoading(true);
      await loginUser({ email, password });
      navigate("/dashboard");
    } catch (error) {
      alert(error.message || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="welcome-text">Welcome Back</h2>

        <input
          className="login-input"
          type="email"
          placeholder="Google Gmail (example@gmail.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="footer-links" style={{ justifyContent: "space-between" }}>
          <div className="create-acc" onClick={() => navigate("/signup")}>New here? <span>Create Account</span></div>
          <div className="forgot-password" onClick={() => navigate("/forgot-password")}>Forgot Password?</div>
        </div>
      </div>
    </div>
  );
}

export default Login;
