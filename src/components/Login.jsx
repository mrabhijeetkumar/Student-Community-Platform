import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import loginImage from "../assets/login_image.png";
import { supabase } from "../supabase";
// import { FcGoogle } from "react-icons/fc";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ================= CHECK SESSION & AUTH LISTENER ================= */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingUser) {
          alert("Please signup first ❌");
          await supabase.auth.signOut();
          return;
        }

        window.location.href = "/dashboard";
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!existingUser) {
            alert("Account not found. Please signup first ❌");
            await supabase.auth.signOut();
            return;
          }

          window.location.href = "/dashboard";
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Google login removed. Only allow login for registered users.

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${loginImage})` }}
    >
      <div className="login-card">
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

        <div style={{ margin: '20px 0', color: '#fff', textAlign: 'center' }}>
          Please <b>Create Account</b> first to login.<br />
          Only registered users can login.
        </div>

        <div className="footer-links" style={{ justifyContent: "center" }}>
          <div className="create-acc" onClick={() => navigate("/signup")}>
            New here? <span>Create Account</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;