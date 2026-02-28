import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession, onAuthStateChange } from "./mongodb";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setLoading(false);

    const { subscription } = onAuthStateChange((_event, latestSession) => {
      setSession(latestSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  const validUser = Boolean(session?.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!validUser ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!validUser ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!validUser ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={validUser ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={validUser ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
