import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { supabase } from "../supabase";
import { FcGoogle } from "react-icons/fc";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= GOOGLE SIGNUP ================= */
  const handleGoogleSignup = async () => {
    setError("");
    if (!name || !gender) {
      setError("Please fill all fields");
      return;
    }
    // store values so they survive OAuth redirect
    localStorage.setItem("signup_name", name.trim());
    localStorage.setItem("signup_gender", gender);
    localStorage.setItem("signup_in_progress", "1");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/signup",
      },
    });
    if (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #2333a0 0%, #2d6cdf 100%)', borderRadius: 24, boxShadow: '0 8px 32px #0003', padding: 44, width: 420, maxWidth: '95vw', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid #2d6cdf' }}>
        <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 6, letterSpacing: 0.5, color: '#fff' }}>Create account</h2>
        <div style={{ color: '#e3e6f3', fontSize: 16, marginBottom: 4, textAlign: 'center', fontWeight: 500 }}>Join our 100% free student community.</div>
        <div style={{ color: '#ffeb3b', fontSize: 14, marginBottom: 24, textAlign: 'center', fontWeight: 600 }}>Fill all fields, then sign up with Google.</div>

        {/* Fields first */}
        <div style={{ width: '100%', marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, display: 'block', color: '#fff' }}>Name*</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            style={{ width: '100%', padding: '15px 14px', borderRadius: 12, border: '1.5px solid #2d6cdf', marginTop: 6, fontSize: 17, background: '#e3e6f3', fontWeight: 500, outline: 'none', boxShadow: '0 1px 6px #2333a033', color: '#2333a0' }}
          />
        </div>
        <div style={{ width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
          <label style={{ fontWeight: 600, fontSize: 17, color: '#fff' }}>Gender*</label>
          <div style={{ display: 'flex', gap: 22 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 500, fontSize: 16, color: '#e3e6f3' }}>
              <input type="radio" value="Male" checked={gender === "Male"} onChange={e => setGender(e.target.value)} style={{ marginRight: 10, accentColor: '#2d6cdf' }} /> Male
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 500, fontSize: 16, color: '#e3e6f3' }}>
              <input type="radio" value="Female" checked={gender === "Female"} onChange={e => setGender(e.target.value)} style={{ marginRight: 10, accentColor: '#e91e63' }} /> Female
            </label>
          </div>
        </div>
        {error && <div style={{ color: '#ff5252', marginBottom: 16, fontSize: 16, fontWeight: 700, textAlign: 'center', background: '#fff', borderRadius: 8, padding: '8px 0' }}>{error}</div>}

        {/* Google signup button below fields */}
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          style={{
            width: '100%',
            background: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '16px 0',
            fontWeight: 700,
            fontSize: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 22,
            cursor: 'pointer',
            boxShadow: '0 2px 12px #2333a033',
            transition: 'background 0.2s',
            color: '#2333a0',
            letterSpacing: 0.2
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px #2333a033', marginRight: 10 }}>
            <FcGoogle size={26} />
          </span>
          Sign up with Google
        </button>
        <div style={{ color: '#e3e6f3', fontSize: 16, margin: '22px 0 0 0', textAlign: 'center', fontWeight: 500 }}>
          Already have an account?{' '}
          <span style={{ color: '#fff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Log in</span>
        </div>
      </div>
    </div>
  );
}

export default Signup;