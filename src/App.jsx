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
  const [signupInProgress, setSignupInProgress] = useState(false);

  useEffect(() => {
    // Check if we are returning from Google after signup
    try {
      const flag = localStorage.getItem("signup_in_progress");
      setSignupInProgress(!!flag);
    } catch (e) {
      setSignupInProgress(false);
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {

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
            // If signup is in progress (came from /signup Google OAuth), always show Signup
            signupInProgress || !validUser ? <Signup /> : <Navigate to="/dashboard" />
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