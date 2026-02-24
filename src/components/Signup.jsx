import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import signupImage from "../assets/login_image.png";
import { supabase } from "../supabase";

import { FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    if (!name || !gender) {
      alert("Please fill all fields ❌");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setLoading(false);
      alert(error.message + " ❌");
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${signupImage})` }}
    >
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

        {/* Gender Selection */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
            color: "white",
            justifyContent: "center",
          }}
        >
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              value="Male"
              checked={gender === "Male"}
              onChange={(e) => setGender(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            Male
          </label>

          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              value="Female"
              checked={gender === "Female"}
              onChange={(e) => setGender(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            Female
          </label>
        </div>

        {/* Google Signup Button */}
        <button
          className="login-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <FcGoogle size={20} />
          {loading ? "Redirecting..." : "Continue with Google"}
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