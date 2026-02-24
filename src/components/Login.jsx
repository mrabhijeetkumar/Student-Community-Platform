import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import loginImage from "../assets/login_image.png";
import { supabase } from "../supabase";
import { FcGoogle } from "react-icons/fc";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ================= CHECK SESSION ON LOAD ================= */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard");
      }
    };

    checkSession();

    // Listen for auth state changes (IMPORTANT)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate("/dashboard");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      await supabase.auth.signInWithOAuth({
        provider: "google"
      });

    } catch (error) {
      alert("Login failed ❌");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${loginImage})` }}
    >
      <div className="login-card">

        {/* Logo */}
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

        {/* Google Login Button */}
        <button
          className="login-btn"
          onClick={handleGoogleLogin}
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

        {/* Footer Links */}
        <div className="footer-links" style={{ justifyContent: "center" }}>
          <div
            className="create-acc"
            onClick={() => navigate("/signup")}
          >
            New here? <span>Create Account</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;