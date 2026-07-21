import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyRegistration } = useAuth();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        const token = searchParams.get("token") || "";

        if (!token) {
            setStatus("error");
            setMessage("Verification token missing. Please register again.");
            return;
        }

        let mounted = true;

        const runVerification = async () => {
            try {
                await verifyRegistration({ token });
                if (!mounted) return;
                setStatus("success");
                setMessage("Email verified successfully. Redirecting to dashboard...");
                setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
            } catch (error) {
                if (!mounted) return;
                setStatus("error");
                setMessage(error.message || "Verification failed.");
            }
        };

        runVerification();
        return () => {
            mounted = false;
        };
    }, [navigate, searchParams, verifyRegistration]);

    return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 500, border: "1px solid var(--border)", borderRadius: 14, padding: 24, background: "var(--surface-elevated)" }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Email Verification</h1>
                <p style={{ color: status === "error" ? "#b91c1c" : "var(--text-sub)" }}>{message}</p>
                {status === "error" && (
                    <Link to="/register" style={{ display: "inline-block", marginTop: 16, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                        Back to Register
                    </Link>
                )}
            </div>
        </main>
    );
}
