import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { resetPassword } from "../mongodb";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");

  const handleResetPassword = async () => {
    if (!email || !newPass) {
      alert("Please fill all fields");
      return;
    }

    try {
      await resetPassword({ email, newPassword: newPass });
      alert("Password reset successful. Please login.");
      navigate("/login");
    } catch (error) {
      alert(error.message || "Password reset failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">RESET PASSWORD</h2>
          <input className="login-input" type="email" placeholder="Registered Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="login-input" type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <button className="login-btn" onClick={handleResetPassword}>Reset Password</button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
