import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
// NOTE: Hum same image use kar rahe hain, lekin CSS usse full screen background bana dega
import loginImage from "../assets/login_image.png";
import { supabase } from "../supabase";

// Icons Import (Make sure to run: npm install react-icons)
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
    // Background Image is now applied to the main container
    <div className="login-page" style={{ backgroundImage: `url(${loginImage})` }}>

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

        {/* Email Input with Icon */}
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

        {/* Password Input with Icon */}
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