import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  const [user, setUser] = useState(null);

  /* ================= LOAD USER SAFELY ================= */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Invalid user data in storage");
      localStorage.removeItem("currentUser");
      setUser(null);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* ================= LOGIN ================= */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login setUser={setUser} />
            )
          }
        />

        {/* ================= SIGNUP ================= */}
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/dashboard" /> : <Signup />
          }
        />

        {/* ================= FORGOT PASSWORD ================= */}
        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to="/dashboard" /> : <ForgotPassword />
          }
        />

        {/* ================= DASHBOARD (PROTECTED) ================= */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ================= DEFAULT ================= */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
