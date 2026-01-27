import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { useNavigate } from "react-router-dom";
import "../style.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");

  const resetPassword = () => {
    // basic validation
    if (!email || !newPass) {
      alert("Please fill all fields");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const index = users.findIndex((u) => u.email === email);
    if (index === -1) {
      alert("Email not found ❌");
      return;
    }

    // 🔐 hash new password
    users[index].password = CryptoJS.SHA256(newPass).toString();
    localStorage.setItem("users", JSON.stringify(users));

    alert("Password reset successful. Please login.");
    navigate("/login");
  };

  return (
    <div className="login-page">
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">RESET PASSWORD</h2>

          <input
            className="login-input"
            type="email"
            placeholder="Registered Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />

          <button className="login-btn" onClick={resetPassword}>
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
