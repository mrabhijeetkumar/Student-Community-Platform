import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  const [session, setSession] = useState(null);
  const [validUser, setValidUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper: complete signup flow if user just returned from Google
  const completeSignupIfNeeded = async (sessionObj) => {
    try {
      const signupFlag = localStorage.getItem("signup_in_progress");
      if (!signupFlag || !sessionObj?.user) return false;

      const storedNameRaw = localStorage.getItem("signup_name");
      const storedGenderRaw = localStorage.getItem("signup_gender");
      const storedName = storedNameRaw || "";
      const storedGender = storedGenderRaw || "Male";

      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionObj.user.id)
        .maybeSingle();

      if (!existingUser) {
        const fallbackName =
          sessionObj.user.user_metadata?.full_name ||
          sessionObj.user.email?.split("@")[0] ||
          "User";
        const finalName = storedName || fallbackName;
        const avatar = sessionObj.user.user_metadata?.avatar_url || "";

        await supabase.from("users").insert({
          id: sessionObj.user.id,
          email: sessionObj.user.email,
          name: finalName,
          gender: storedGender,
          phone: "",
          theme: "Light",
          language: "Eng",
          notification: "Allow",
          photo: avatar
        });
      } else if (storedName || storedGender) {
        const updates = {};
        if (storedName) updates.name = storedName;
        if (storedGender) updates.gender = storedGender;
        await supabase
          .from("users")
          .update(updates)
          .eq("id", sessionObj.user.id);
      }

      localStorage.removeItem("signup_name");
      localStorage.removeItem("signup_gender");
      localStorage.removeItem("signup_in_progress");

      alert("Signup successful! Please login to continue.");
      await supabase.auth.signOut();
      setSession(null);
      setValidUser(false);
      window.location.href = "/login";
      return true;
    } catch (e) {
      console.error("Signup completion error", e);
      return false;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {

        // If this session is from signup, handle that flow first
        const handled = await completeSignupIfNeeded(session);
        if (handled) {
          setLoading(false);
          return;
        }

        // 🔐 Check if exists in users table
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (data) {
          setSession(session);
          setValidUser(true);
        } else {
          // ❌ Auth user but not signed up properly
          await supabase.auth.signOut();
          setSession(null);
          setValidUser(false);
        }

      } else {
        setSession(null);
        setValidUser(false);
      }

      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        if (session?.user) {
          const handled = await completeSignupIfNeeded(session);
          if (handled) return;

          const { data } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (data) {
            setSession(session);
            setValidUser(true);
          } else {
            await supabase.auth.signOut();
            setSession(null);
            setValidUser(false);
          }

        } else {
          setSession(null);
          setValidUser(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            !validUser ? <Login /> : <Navigate to="/dashboard" />
          }
        />

        {/* SIGNUP */}
        <Route
          path="/signup"
          element={
            !validUser ? <Signup /> : <Navigate to="/dashboard" />
          }
        />

        {/* FORGOT PASSWORD */}
        <Route
          path="/forgot-password"
          element={
            !validUser ? <ForgotPassword /> : <Navigate to="/dashboard" />
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            validUser ? <Dashboard /> : <Navigate to="/login" />
          }
        />

        {/* DEFAULT */}
        <Route
          path="*"
          element={<Navigate to={validUser ? "/dashboard" : "/login"} />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;