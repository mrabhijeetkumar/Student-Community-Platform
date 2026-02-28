import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { requestSignupVerification, verifySignupOtpAndCreateUser } from "../mongodb";

import emailjs from "emailjs-com";

const EMAILJS_SERVICE_ID = "service_e8keqwn";
const EMAILJS_TEMPLATE_ID = "template_uad296c";
const EMAILJS_PUBLIC_KEY = "r8lyrtF_urqaDjviD";

emailjs.init(EMAILJS_PUBLIC_KEY);

async function sendOtpEmail({ email, name, otp }) {
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        name: name,
        otp: otp,
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (error) {
    console.error("EmailJS Error:", error);
    throw new Error("Failed to send OTP email");
  }
}

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    setError("");

    const trimmedName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!trimmedName || !cleanEmail || !password || !gender) {
      setError("Please fill all fields");
      return;
    }

    if (!cleanEmail.endsWith("@gmail.com")) {
      setError("Only verified Google Gmail addresses (@gmail.com) are allowed");
      return;
    }

    try {
      setLoading(true);
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      await sendOtpEmail({
        email: cleanEmail,
        name: trimmedName,
        otp: otp,
      });

      await requestSignupVerification({ name: trimmedName, email: cleanEmail, password, gender, otpOverride: otp });
      setOtpSent(true);
    } catch (signupError) {
      setError(signupError.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    setError("");

    if (!otp.trim()) {
      setError("Please enter OTP sent to your Gmail");
      return;
    }

    try {
      setLoading(true);
      await verifySignupOtpAndCreateUser({ email, otp });
      alert("Email verified and account created successfully. Please login.");
      navigate("/login");
    } catch (verifyError) {
      setError(verifyError.message || "OTP verification failed");
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

        {otpSent && (
          <>
            <input
              className="login-input"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <p className="auth-subtext" style={{ marginBottom: 10 }}>
              Verification OTP has been sent to your Gmail. It expires in 10 minutes.
            </p>
          </>
        )}

        {!otpSent ? (
          <button className="login-btn" onClick={handleSendOtp} disabled={loading}>{loading ? "Sending OTP..." : "Send Verification OTP"}</button>
        ) : (
          <>
            <button className="login-btn" onClick={handleVerifyAndCreate} disabled={loading}>{loading ? "Verifying..." : "Verify OTP & Create Account"}</button>
            <button className="login-btn" style={{ marginTop: 10 }} onClick={handleSendOtp} disabled={loading}>
              {loading ? "Sending OTP..." : "Resend OTP"}
            </button>
          </>
        )}

        <div className="auth-switch-link">
          Already have an account? <span onClick={() => navigate("/login")}>Log in</span>
        </div>
      </div>
    </div>
  );
}

export default Signup;
