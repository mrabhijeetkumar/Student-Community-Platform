import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { registerUser } from "../mongodb";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    if (!name || !email || !password || !gender) {
      setError("Please fill all fields");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setError("Only verified Google Gmail addresses (@gmail.com) are allowed");
      return;
    }

    try {
      setLoading(true);
      await registerUser({ name, email, password, gender });
      alert("Signup successful! Please login.");
      navigate("/login");
    } catch (signupError) {
      setError(signupError.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-card auth-card signup-card">
        <h2 className="welcome-text">Create account</h2>
        <p className="auth-subtext">Join the network, share ideas, and collaborate smarter.</p>

        <input className="login-input" type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="login-input" type="email" placeholder="Google Gmail (example@gmail.com)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="login-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div className="signup-gender-row">
          <label><input type="radio" value="Male" checked={gender === "Male"} onChange={(e) => setGender(e.target.value)} /> Male</label>
          <label><input type="radio" value="Female" checked={gender === "Female"} onChange={(e) => setGender(e.target.value)} /> Female</label>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="login-btn" onClick={handleSignup} disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>

        <div className="auth-switch-link">
          Already have an account? <span onClick={() => navigate("/login")}>Log in</span>
        </div>
      </div>
    </div>
  );
}

export default Signup;
