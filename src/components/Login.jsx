import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import loginImage from "../assets/login_image.png";

// ✅ SUPABASE
import { supabase } from "../supabase";

function Login({ setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    /* ===== BASIC VALIDATION ===== */
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    /* ===== SUPABASE LOGIN ===== */
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message + " ❌");
      return;
    }

    const user = data?.user;
    const session = data?.session;

    if (!user || !session) {
      alert("Login failed, try again ❌");
      return;
    }

    /* ===== OPTIONAL EMAIL CONFIRM CHECK ===== */
    if (!user.email_confirmed_at) {
      alert("Please verify your email first 📧");
      return;
    }

    /* ===== SAVE CURRENT USER ===== */
    const currentUser = {
      uid: user.id,
      email: user.email,
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    setUser(currentUser);

    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      {/* LEFT IMAGE */}
      <div
        className="login-left"
        style={{ backgroundImage: `url(${loginImage})` }}
      />

      {/* RIGHT FORM */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">LOGIN</h2>

          <input
            className="login-input"
            type="email"
            placeholder="User Email"
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

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p
            style={{ cursor: "pointer", color: "#4a7ef3", marginTop: "10px" }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>

          <div className="signup-text">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign Up</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
