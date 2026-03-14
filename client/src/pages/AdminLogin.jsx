import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Shield, ShieldCheck, Terminal, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const fadeUp = (i) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
});

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const updateField = (field) => (e) =>
        setForm((s) => ({ ...s, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback("");
        setLoading(true);
        try {
            await login({ ...form, role: "admin" });
            navigate("/admin", { replace: true });
        } catch (err) {
            setFeedback(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputWrap = {
        position: "relative",
        display: "flex",
        alignItems: "center",
    };

    const inputBase = {
        width: "100%", padding: "12px 14px 12px 42px", fontSize: 14,
        border: "1.5px solid #e0e4ea", borderRadius: 10,
        background: "#f8fafc", outline: "none", color: "#1a1a2e",
        transition: "all 0.2s ease",
    };

    const iconStyle = {
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: "#94a3b8", pointerEvents: "none", transition: "color 0.2s",
    };

    const focusInput = (e) => {
        e.target.style.borderColor = "#2563eb";
        e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
        e.target.style.background = "#fff";
        const icon = e.target.parentElement.querySelector(".input-icon");
        if (icon) icon.style.color = "#2563eb";
    };

    const blurInput = (e) => {
        e.target.style.borderColor = "#e0e4ea";
        e.target.style.boxShadow = "none";
        e.target.style.background = "#f8fafc";
        const icon = e.target.parentElement.querySelector(".input-icon");
        if (icon) icon.style.color = "#94a3b8";
    };

    return (
        <main style={{
            background: "linear-gradient(135deg, #e8eef6 0%, #dfe6f0 50%, #e2e8f4 100%)",
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    display: "flex", width: "100%", maxWidth: 860, minHeight: 520,
                    borderRadius: 22, overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
                    background: "#fff"
                }}>

                {/* ── LEFT PANEL ── */}
                <div style={{
                    width: "44%", background: "linear-gradient(160deg, #0f2942 0%, #1a3a5c 40%, #1565C0 100%)",
                    padding: "44px 34px", display: "none", flexDirection: "column", justifyContent: "space-between",
                    color: "#fff", flexShrink: 0, position: "relative", overflow: "hidden"
                }}
                    className="lg:!flex">

                    {/* Decorative shapes */}
                    <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
                    <div style={{ position: "absolute", top: "45%", right: 15, width: 50, height: 50, borderRadius: 12, background: "rgba(255,255,255,0.04)", transform: "rotate(45deg)" }} />

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <motion.div {...fadeUp(0)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)"
                            }}>
                                <Shield size={20} color="#fff" />
                            </div>
                            <div>
                                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", display: "block" }}>Admin Portal</span>
                                <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 500 }}>Student Community Platform</span>
                            </div>
                        </motion.div>

                        <motion.h1 {...fadeUp(1)} style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 12 }}>
                            Admin<br />Command Center
                        </motion.h1>
                        <motion.p {...fadeUp(2)} style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75, marginBottom: 30 }}>
                            Manage users, content, and platform analytics from one dashboard.
                        </motion.p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { icon: ShieldCheck, text: "Authorized access only" },
                                { icon: Terminal, text: "Full platform control" },
                                { icon: Zap, text: "Real-time admin dashboard" },
                            ].map(({ icon: Icon, text }, i) => (
                                <motion.div key={text} {...fadeUp(i + 3)}
                                    style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                                        background: "rgba(255,255,255,0.08)"
                                    }}>
                                        <Icon size={14} color="rgba(255,255,255,0.8)" />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>{text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Security notice */}
                    <motion.div {...fadeUp(6)} style={{
                        position: "relative", zIndex: 1, marginTop: 24,
                        display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        <ShieldCheck size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.45 }}>
                            Restricted to authorized admins. Access attempts are logged.
                        </span>
                    </motion.div>
                </div>

                {/* ── RIGHT FORM PANEL ── */}
                <div style={{ flex: 1, padding: "40px 38px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

                    {/* Mobile logo */}
                    <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                        <Shield size={22} color="#1565C0" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Admin Portal</span>
                    </div>

                    <motion.div {...fadeUp(0)}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 2 }}>
                            Admin Sign In
                        </h2>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 22 }}>
                            Enter your admin credentials to continue
                        </p>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div {...fadeUp(1)} style={{
                        display: "flex", marginBottom: 24, borderRadius: 10,
                        background: "#f1f5f9", padding: 4
                    }}>
                        <div style={{
                            flex: 1, textAlign: "center", padding: "9px 0", fontSize: 13, fontWeight: 600,
                            borderRadius: 8, color: "#1565C0", background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)", cursor: "default"
                        }}>
                            Admin
                        </div>
                        <Link to="/login" style={{
                            flex: 1, textAlign: "center", padding: "9px 0", fontSize: 13, fontWeight: 600,
                            borderRadius: 8, color: "#64748b", background: "transparent",
                            textDecoration: "none", transition: "all 0.2s"
                        }}>
                            Student
                        </Link>
                    </motion.div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <Notification tone="warning" message={feedback} />

                        <motion.div {...fadeUp(2)}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 7 }}>Admin Email</label>
                            <div style={inputWrap}>
                                <Mail size={16} style={iconStyle} className="input-icon" />
                                <input type="email" placeholder="admin@example.com" required autoComplete="email"
                                    value={form.email} onChange={updateField("email")}
                                    style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                            </div>
                        </motion.div>

                        <motion.div {...fadeUp(3)}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Password</label>
                                <Link to="/forgot-password?role=admin" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                                    Forgot?
                                </Link>
                            </div>
                            <div style={inputWrap}>
                                <Lock size={16} style={iconStyle} className="input-icon" />
                                <input type={showPass ? "text" : "password"} placeholder="Enter your password" required autoComplete="current-password"
                                    value={form.password} onChange={updateField("password")}
                                    style={{ ...inputBase, paddingRight: 48 }} onFocus={focusInput} onBlur={blurInput} />
                                <button type="button" onClick={() => setShowPass((s) => !s)}
                                    style={{
                                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", cursor: "pointer", padding: 4,
                                        color: "#94a3b8", display: "flex", transition: "color 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = "#2563eb"}
                                    onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div {...fadeUp(4)}>
                            <button type="submit" disabled={loading}
                                style={{
                                    width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 700,
                                    background: "linear-gradient(135deg, #0f2942 0%, #1565C0 100%)",
                                    color: "#fff", border: "none", borderRadius: 10,
                                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                                    boxShadow: "0 4px 14px rgba(15,41,66,0.25)",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,41,66,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,41,66,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                {loading ? (
                                    <>
                                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                                        Authenticating…
                                    </>
                                ) : (
                                    <>Access Admin Panel <ArrowRight size={16} /></>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    {/* Footer */}
                    <motion.div {...fadeUp(5)} style={{ marginTop: 24, textAlign: "center" }}>
                        <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textDecoration: "none" }}>
                            ← Back to Student Login
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </main>
    );
}
