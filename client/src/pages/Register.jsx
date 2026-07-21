import { motion } from "framer-motion";
import { CheckCircle2, Circle, Eye, EyeOff, GraduationCap, Lock, Mail, MessageSquare, Shield, Sparkles, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const fadeUp = (i) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
});

const PASSWORD_RULES = [
    { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
    { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
    { key: "number", label: "One number", test: (v) => /\d/.test(v) },
    { key: "special", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) }
];

function getPasswordScore(password) {
    return PASSWORD_RULES.reduce((score, rule) => score + (rule.test(password) ? 1 : 0), 0);
}

const STRENGTH_META = [
    { label: "Very weak", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#f59e0b" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#16a34a" },
    { label: "Very strong", color: "#0ea968" }
];

export default function Register() {
    const { requestVerification, resendVerification } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [feedback, setFeedback] = useState({ tone: "warning", text: "" });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [lastVerificationEmail, setLastVerificationEmail] = useState("");

    const updateField = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));
    const setMsg = (tone, text) => setFeedback({ tone, text });

    const passwordScore = useMemo(() => getPasswordScore(form.password), [form.password]);
    const strengthMeta = STRENGTH_META[passwordScore] || STRENGTH_META[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ tone: "warning", text: "" });
        setLoading(true);
        try {
            const res = await requestVerification({ name: form.name, email: form.email, password: form.password });
            setLastVerificationEmail(form.email);
            setMsg("success", res.message || "Verification link sent! Check your Gmail inbox.");
        } catch (err) {
            setMsg("error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!lastVerificationEmail || loading) return;
        setLoading(true);
        try {
            const res = await resendVerification({ email: lastVerificationEmail });
            setMsg("success", res.message || "Verification link resent. Please check your inbox.");
        } catch (err) {
            setMsg("error", err.message || "Could not resend verification email");
        } finally {
            setLoading(false);
        }
    };

    const inputWrap = { position: "relative", display: "flex", alignItems: "center" };
    const inputBase = {
        width: "100%", padding: "12px 14px 12px 42px", fontSize: 14,
        border: "1.5px solid var(--border)", borderRadius: 10,
        background: "var(--surface-soft)", outline: "none", color: "var(--text-main)",
        transition: "all 0.2s ease"
    };
    const iconStyle = {
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: "var(--text-muted)", pointerEvents: "none", transition: "color 0.2s"
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
                            Join the<br />Community
                        </motion.h1>
                        <motion.p {...fadeUp(2)} style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, marginBottom: 30 }}>
                            Create your account to connect with peers, join communities, and build your student network.
                        </motion.p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { icon: Users, text: "Student communities & groups" },
                                { icon: MessageSquare, text: "Real-time chat & notifications" },
                                { icon: Shield, text: "Secure, verified accounts only" },
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
                <div style={{ flex: 1, padding: "40px 38px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>

                    {/* Mobile logo */}
                    <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                        <GraduationCap size={22} color="var(--primary)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>StudentHub</span>
                    </div>

                    <motion.div {...fadeUp(0)}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 2 }}>
                            Create Account
                        </h2>
                        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 22, display: "flex", alignItems: "center", gap: 6 }}>
                            <Sparkles size={13} /> Account tabhi create hoga jab verification link click hoga.
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <Notification tone={feedback.tone} message={feedback.text} />

                        <motion.div {...fadeUp(1)}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Full name</label>
                            <div style={inputWrap}>
                                <User size={16} style={iconStyle} className="input-icon" />
                                <input required placeholder="Your full name" autoComplete="name"
                                    value={form.name} onChange={updateField("name")}
                                    style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                            </div>
                        </motion.div>

                        <motion.div {...fadeUp(2)}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Email</label>
                            <div style={inputWrap}>
                                <Mail size={16} style={iconStyle} className="input-icon" />
                                <input required type="email" placeholder="name@gmail.com" autoComplete="email"
                                    value={form.email} onChange={updateField("email")}
                                    style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                            </div>
                        </motion.div>

                        <motion.div {...fadeUp(3)}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Password</label>
                            <div style={inputWrap}>
                                <Lock size={16} style={iconStyle} className="input-icon" />
                                <input
                                    required
                                    type={showPass ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={updateField("password")}
                                    onFocus={(e) => { setPasswordTouched(true); focusInput(e); }}
                                    onBlur={blurInput}
                                    style={{ ...inputBase, paddingRight: 44 }}
                                />
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

                            {/* Password strength meter */}
                            {passwordTouched && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 10, overflow: "hidden" }}>
                                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                                        {PASSWORD_RULES.map((_, index) => (
                                            <span key={index} style={{
                                                flex: 1, height: 4, borderRadius: 999,
                                                background: index < passwordScore ? strengthMeta.color : "var(--border)",
                                                transition: "background 0.25s ease"
                                            }} />
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: strengthMeta.color, marginBottom: 8 }}>
                                        {form.password ? strengthMeta.label : "Enter a password"}
                                    </p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                                        {PASSWORD_RULES.map((rule) => {
                                            const passed = rule.test(form.password);
                                            return (
                                                <div key={rule.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    {passed
                                                        ? <CheckCircle2 size={13} color="#16a34a" />
                                                        : <Circle size={13} color="var(--text-faint, #94a3b8)" />}
                                                    <span style={{ fontSize: 11.5, color: passed ? "var(--text-sub)" : "var(--text-muted)" }}>
                                                        {rule.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
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
                                        Sending…
                                    </>
                                ) : "Send Verification Link"}
                            </button>
                        </motion.div>

                        {lastVerificationEmail ? (
                            <motion.button
                                {...fadeUp(5)}
                                type="button"
                                disabled={loading}
                                onClick={handleResend}
                                style={{
                                    width: "100%", padding: "10px 0", background: "transparent", color: "var(--primary)",
                                    border: "1px solid var(--border)", borderRadius: 10, fontWeight: 700, fontSize: 13.5,
                                    cursor: loading ? "not-allowed" : "pointer"
                                }}
                            >
                                Resend verification email
                            </motion.button>
                        ) : null}
                    </form>

                    <motion.div {...fadeUp(6)} style={{ marginTop: 20, textAlign: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Already have an account? </span>
                        <Link to="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>Sign in</Link>
                    </motion.div>
                </div>
            </motion.div>
        </main>
    );
}
