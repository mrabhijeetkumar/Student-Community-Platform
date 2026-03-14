import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/useAuth.js";

const AppShell = lazy(() => import("./components/layout/AppShell"));
const Community = lazy(() => import("./pages/Community"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const Login = lazy(() => import("./pages/Login"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword")); const Settings = lazy(() => import('./pages/Settings'));
function RouteLoader() {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading platform...</div>;
}

// Logged-out users only — if already logged in, redirect based on role
function PublicOnlyRoute({ children }) {
    const { isAuthenticated, isBootstrapping, user } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (isAuthenticated) {
        return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
    }

    return children;
}

// Admin-only login page — if already logged in as admin, go to /admin
function AdminPublicRoute({ children }) {
    const { isAuthenticated, isBootstrapping, user } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (isAuthenticated && user?.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

// Admin-only standalone route (no AppShell)
function AdminRoute({ children }) {
    const { user, isBootstrapping } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

// Student route — admin ko normal dashboard nahi dekhne dena
function StudentRoute({ children }) {
    const { user, isBootstrapping } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (user?.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

export default function App() {
    return (
        <Suspense fallback={<RouteLoader />}>
            <Routes>
                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                <Route path="/admin/login" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
                <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

                {/* ── Admin standalone dashboard ── */}
                <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

                {/* ── Student community platform ── */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/explore" element={<StudentRoute><Explore /></StudentRoute>} />
                        <Route path="/community" element={<Navigate to="/communities" replace />} />
                        <Route path="/communities" element={<StudentRoute><Community /></StudentRoute>} />
                        <Route path="/profile/:username?" element={<Profile />} />
                        <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
                        <Route path="/notifications" element={<StudentRoute><Notifications /></StudentRoute>} />
                        <Route path="/messages" element={<StudentRoute><Messages /></StudentRoute>} />
                        <Route path="/settings" element={<StudentRoute><Settings /></StudentRoute>} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
