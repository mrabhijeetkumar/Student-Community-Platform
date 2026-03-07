import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

const AppShell = lazy(() => import("./components/layout/AppShell"));
const Community = lazy(() => import("./pages/Community"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));

function RouteLoader() {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading platform...</div>;
}

function ProtectedRoute() {
    const { user, isBootstrapping } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

function PublicOnlyRoute({ children }) {
    const { user, isBootstrapping } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (user) {
        return <Navigate to="/" replace />;
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
                        <Route path="/" element={<Home />} />
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
