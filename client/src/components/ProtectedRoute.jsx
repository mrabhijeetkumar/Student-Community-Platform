import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function RouteLoader() {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading platform...</div>;
}

export default function ProtectedRoute() {
    const location = useLocation();
    const { isAuthenticated, isBootstrapping } = useAuth();

    if (isBootstrapping) {
        return <RouteLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}