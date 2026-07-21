import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, GraduationCap, Users, MessageSquare, Shield, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const fadeUp = (i) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
});

export default function Login() {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
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
            await login({ ...form, role: "student" });
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setFeedback(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (cr) => {
        if (!cr.credential) { setFeedback("Google sign-in did not return a valid token."); return; }
        setLoading(true);
        try {
            await googleLogin(cr.credential);
            navigate("/dashboard", { replace: true });
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
        border: "1.5px solid var(--border)", borderRadius: 10,
        background: "var(--surface-soft)", outline: "none", color: "var(--text-main)",
        transition: "all 0.2s ease",
    };

    const iconStyle = {
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: "var(--text-muted)", pointerEvents: "none", transition: "color 0.2s",
    };

    const focusInput = (e) => {
        e.target.style.borderColor = "var(--primary)";
        e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)";
        e.target.style.background = "var(--surface-elevated)";
        const icon = e.target.parentElement.querySelector(".input-icon");
        if (icon) icon.style.color = "var(--primary)";
    };

    const blurInput = (e) => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
        e.target.style.background = "var(--surface-soft)";
        const icon = e.target.parentElement.querySelector(".input-icon");
        if (icon) icon.style.color = "var(--text-muted)";
    };

    return (
        <main style={{
            background: "linear-gradient(135deg, #ebf3ff 0%, #e2edff 45%, #f7f1e7 100%)",
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    display: "flex", width: "100%", maxWidth: 860, minHeight: 520,
                    borderRadius: 22, overflow: "hidden",
                    boxShadow: "var(--shadow-strong)",
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)"
                }}>

                {/* ── LEFT PANEL ── */}
                <div style={{
                    width: "44%", background: "linear-gradient(155deg, #0a223d 0%, #156dce 52%, #31a6ff 100%)",
                    padding: "44px 34px", display: "none", flexDirection: "column", justifyContent: "space-between",
                    color: "#fff", flexShrink: 0, position: "relative", overflow: "hidden"
                }}
                    className="lg:!flex">

                    {/* Decorative shapes */}
                    <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ position: "absolute", top: "40%", right: 20, width: 60, height: 60, borderRadius: 14, background: "rgba(255,255,255,0.04)", transform: "rotate(45deg)" }} />

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <motion.div {...fadeUp(0)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)"
                            }}>
                                <GraduationCap size={20} color="#fff" />
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>StudentHub</span>
                        </motion.div>

                        <motion.h1 {...fadeUp(1)} style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 12 }}>
                            Welcome<br />Back
                        </motion.h1>
                        <motion.p {...fadeUp(2)} style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, marginBottom: 30 }}>
                            Sign in to your student dashboard, communities, and real&#8209;time feed.
                        </motion.p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { icon: Users, text: "Student communities & groups" },
                                { icon: MessageSquare, text: "Real-time chat & notifications" },
                                { icon: Shield, text: "Secure role-based access" },
                            ].map(({ icon: Icon, text }, i) => (
                                <motion.div key={text} {...fadeUp(i + 3)}
                                    style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                                        background: "rgba(255,255,255,0.10)"
                                    }}>
                                        <Icon size={14} color="rgba(255,255,255,0.85)" />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>{text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>


                </div>

                {/* ── RIGHT FORM PANEL ── */}
                <div style={{ flex: 1, padding: "40px 38px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

                    {/* Mobile logo */}
                    <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                        <GraduationCap size={22} color="var(--primary)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>StudentHub</span>
                    </div>

                    <motion.div {...fadeUp(0)}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 2 }}>
                            Sign In
                        </h2>
                        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 22 }}>
                            Enter your credentials to continue
                        </p>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div {...fadeUp(1)} style={{
                        display: "flex", marginBottom: 24, borderRadius: 10,
                        background: "var(--surface-soft)", padding: 4
                    }}>
                        <Link to="/admin/login" style={{
                            flex: 1, textAlign: "center", padding: "9px 0", fontSize: 13, fontWeight: 600,
                            borderRadius: 8, color: "var(--text-muted)", background: "transparent",
                            textDecoration: "none", transition: "all 0.2s"
                        }}>
                            Admin
                        </Link>
                        <div style={{
                            flex: 1, textAlign: "center", padding: "9px 0", fontSize: 13, fontWeight: 600,
                            borderRadius: 8, color: "var(--primary)", background: "var(--surface-elevated)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)", cursor: "default"
                        }}>
                            Student
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <Notification tone="error" message={feedback} />

                        <motion.div {...fadeUp(2)}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Email</label>
                            <div style={inputWrap}>
                                <Mail size={16} style={iconStyle} className="input-icon" />
                                <input type="email" placeholder="you@gmail.com" required autoComplete="email"
                                    value={form.email} onChange={updateField("email")}
                                    style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                            </div>
                        </motion.div>

                        <motion.div {...fadeUp(3)}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sub)" }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
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
                                        color: "var(--text-muted)", display: "flex", transition: "color 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
                                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div {...fadeUp(4)}>
                            <button type="submit" disabled={loading}
                                style={{
                                    width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 700,
                                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
                                    color: "#fff", border: "none", borderRadius: 10,
                                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                                    boxShadow: "0 10px 20px rgba(20,115,230,0.26)",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = "0 12px 24px rgba(20,115,230,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 10px 20px rgba(20,115,230,0.26)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                {loading ? (
                                    <>
                                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                                        Signing in…
                                    </>
                                ) : (
                                    <>Sign In <ArrowRight size={16} /></>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    {/* Google OAuth */}
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                        <motion.div {...fadeUp(5)} style={{ marginTop: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 14px" }}>
                                <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
                                <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
                            </div>
                            <div style={{ borderRadius: 10, overflow: "hidden" }}>
                                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setFeedback("Google sign-in failed.")} />
                            </div>
                        </motion.div>
                    )}

                    {/* Footer */}
                    <motion.div {...fadeUp(6)} style={{ marginTop: 22, textAlign: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Don't have an account?{" "}</span>
                        <Link to="/register" style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
                            Register now
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </main>
    );
}
