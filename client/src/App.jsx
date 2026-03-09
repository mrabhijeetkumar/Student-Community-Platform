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

function RouteLoader() {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading platform...</div>;
}

function PublicOnlyRoute({ children }) {
    const { isAuthenticated, isBootstrapping } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default function App() {
    return (
        <Suspense fallback={<RouteLoader />}>
            <Routes>
                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/community" element={<Navigate to="/communities" replace />} />
                        <Route path="/communities" element={<Community />} />
                        <Route path="/profile/:username?" element={<Profile />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/messages" element={<Messages />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
