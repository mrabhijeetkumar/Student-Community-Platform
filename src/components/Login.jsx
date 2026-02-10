import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import loginImage from "../assets/login_image.png";
import { supabase } from "../supabase";

// Icons
import { FiMail, FiLock } from "react-icons/fi";

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

    if (error) {
      setLoading(false);
      alert(error.message + " ❌");
      return;
    }

    const authUser = data?.user;
    const session = data?.session;

    if (!authUser || !session) {
      setLoading(false);
      alert("Login failed, try again ❌");
      return;
    }

    /* ===== LOAD USER PROFILE FROM USERS TABLE ===== */
    const { data: profileData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    /* ===== SAVE CURRENT USER ===== */
    const currentUser = {
      uid: authUser.id,
      email: authUser.email,
      name: profileData?.name || "",
      photo: profileData?.photo || "",
      phone: profileData?.phone || "",
      gender: profileData?.gender || "Male",
      theme: profileData?.theme || "Light",
      language: profileData?.language || "Eng",
      notification: profileData?.notification || "Allow",
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    setUser(currentUser);

    setLoading(false);

    navigate("/dashboard");
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${loginImage})` }}
    >
      {/* Centered Glass Card */}
      <div className="login-card">
        {/* Animated Logo */}
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
          </svg>
          <div className="brand-text">
            <span>Student Community</span> <br />
            <span>Platform</span>
          </div>
        </div>

        <h2 className="welcome-text">Welcome Back</h2>

        {/* Email Input */}
        <div className="input-box">
          <input
            className="login-input"
            type="email"
            placeholder="University Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FiMail className="input-icon" />
        </div>

        {/* Password Input */}
        <div className="input-box">
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FiLock className="input-icon" />
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="footer-links">
          <span
            className="forgot-pass"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </span>

          <div className="create-acc" onClick={() => navigate("/signup")}>
            New here? <span>Create Account</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
