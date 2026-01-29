import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import signupImage from "../assets/login_image.png";

// 🔥 SUPABASE
import { supabase } from "../supabase";

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
    <div className="login-page">
      {/* LEFT IMAGE */}
      <div
        className="login-left"
        style={{ backgroundImage: `url(${signupImage})` }}
      />

      {/* RIGHT FORM */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">SIGN UP</h2>

          {/* NAME */}
         <div className="input-box">
  <input
    type="text"
    required
    placeholder=" "
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
  <label>Name</label>
</div>

<div className="input-box">
  <input
    type="email"
    required
    placeholder=" "
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <label>Email</label>
</div>

<div className="input-box">
  <input
    type="password"
    required
    placeholder=" "
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <label>Password</label>
</div>
<div className="gender-box">
  <label>
    <input
      type="radio"
      value="Male"
      checked={gender === "Male"}
      onChange={(e) => setGender(e.target.value)}
    /> Male
  </label>

  <label>
    <input
      type="radio"
      value="Female"
      checked={gender === "Female"}
      onChange={(e) => setGender(e.target.value)}
    /> Female
  </label>
</div>



          <button
            className="login-btn"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <div className="signup-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Log In</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
