import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import loginImage from "../assets/login_image.png";

// ✅ SUPABASE
import { supabase } from "../supabase";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    /* ===== SUPABASE SIGN UP ===== */
    const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

console.log(data); // 👈 ESLint satisfied


    setLoading(false);

    if (error) {
      alert(error.message + " ❌");
      return;
    }

    alert("Signup successful ✅ Now login");
    navigate("/login");
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
          <h2 className="login-title">SIGN UP</h2>

          <input
            className="login-input"
            type="email"
            placeholder="Email"
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

          <button className="login-btn" onClick={handleSignup} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <div className="signup-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
