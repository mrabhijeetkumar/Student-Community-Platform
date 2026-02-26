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
    <div className="auth-page">
      <div className="login-card auth-card">
        <h2 className="welcome-text">Welcome Back</h2>
        <p className="auth-subtext">Sign in to continue building with your student community.</p>

        <input
          className="login-input"
          type="email"
          
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder=" Enter password"
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
