import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import signupImage from "../assets/login_image.png"; // Using same background
import { supabase } from "../supabase";

// Icons
import { FiUser, FiMail, FiLock } from "react-icons/fi";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // ✅ VALIDATION
    if (!name || !email || !password || !gender) {
      alert("Please fill all fields ❌");
      return;
    }

    setLoading(true);

    // 1️⃣ SUPABASE AUTH SIGNUP
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message + " ❌");
      return;
    }

    const user = data.user;

    // 2️⃣ INSERT INTO USERS TABLE
    const { error: profileError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      name: name,
      gender: gender,
      phone: "",
      photo: "",
    });

    setLoading(false);

    if (profileError) {
      alert("Profile creation failed ❌");
      return;
    }

    alert("Signup successful ✅");
    navigate("/login");
  };

  return (
    <div className="login-page" style={{ backgroundImage: `url(${signupImage})` }}>

      <div className="login-card">

        <h2 className="welcome-text">Join Community</h2>

        {/* Name Input */}
        <div className="input-box">
          <input
            className="login-input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FiUser className="input-icon" />
        </div>

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
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FiLock className="input-icon" />
        </div>

        {/* Gender Selection (Styled for Glass Theme) */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", color: "white", justifyContent: "center" }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              value="Male"
              checked={gender === "Male"}
              onChange={(e) => setGender(e.target.value)}
              style={{ marginRight: "8px" }}
            /> Male
          </label>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              value="Female"
              checked={gender === "Female"}
              onChange={(e) => setGender(e.target.value)}
              style={{ marginRight: "8px" }}
            /> Female
          </label>
        </div>

        <button
          className="login-btn"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <div className="footer-links" style={{ justifyContent: "center" }}>
          <div className="create-acc" onClick={() => navigate("/login")}>
            Already have an account? <span>Log In</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Signup;