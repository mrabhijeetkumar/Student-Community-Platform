import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { resetPassword } from "../mongodb";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !newPass) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email, newPassword: newPass });
      alert("Password reset successful. Please login.");
      navigate("/login");
    } catch (error) {
      alert(error.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-card auth-card">
        <h2 className="welcome-text">Reset Password</h2>
        <p className="auth-subtext">Secure your account with a fresh password and get back in.</p>

        <input className="login-input" type="email" placeholder="Registered Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="login-input" type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />

        <button className="login-btn" onClick={handleResetPassword} disabled={loading}>{loading ? "Updating..." : "Reset Password"}</button>

        <div className="auth-switch-link">
          Remembered your password? <span onClick={() => navigate("/login")}>Back to login</span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
