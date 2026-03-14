import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, ShieldCheck, Zap, CheckCircle, ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const fadeUp = (i) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
});

export default function Register() {
    const navigate = useNavigate();
    const { requestOtp, register } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
    const [feedback, setFeedback] = useState({ tone: "warning", text: "" });
    const [previewOtp, setPreviewOtp] = useState("");
    const [otpRequested, setOtpRequested] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const updateField = (field) => (e) =>
        setForm((s) => ({ ...s, [field]: e.target.value }));

    const updateOtp = (e) => {
        const nextOtp = e.target.value.replace(/\D/g, "").slice(0, 6);
        setForm((s) => ({ ...s, otp: nextOtp }));
    };

    const setMsg = (tone, text) => setFeedback({ tone, text });

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await requestOtp({ name: form.name, email: form.email, password: form.password });
            setOtpRequested(true);
            setPreviewOtp(res.previewOtp || "");
            setMsg("success", res.message || "OTP sent! Check your inbox.");
        } catch (err) { setMsg("warning", err.message); }
        finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({ email: form.email, otp: form.otp });
            navigate("/dashboard", { replace: true });
        }
        catch (err) { setMsg("warning", err.message); }
        finally { setLoading(false); }
    };

    const resetOtp = () => {
        setOtpRequested(false);
        setMsg("warning", "");
        setForm((s) => ({ ...s, otp: "" }));
    };

    const inputWrap = { position: "relative", display: "flex", alignItems: "center" };

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

    const steps = [
        { num: 1, label: "Your details" },
        { num: 2, label: "Verify OTP" },
    ];

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
                    <div style={{ position: "absolute", top: "55%", right: 20, width: 60, height: 60, borderRadius: 14, background: "rgba(255,255,255,0.04)", transform: "rotate(45deg)" }} />

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
                        <motion.p {...fadeUp(2)} style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, marginBottom: 28 }}>
                            Create your verified student profile and unlock everything.
                        </motion.p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { icon: ShieldCheck, text: "Gmail-only verification" },
                                { icon: Zap, text: "Instant platform access" },
                                { icon: Star, text: "Free forever" },
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

                    {/* Step indicator on left panel */}
                    <motion.div {...fadeUp(6)} style={{
                        position: "relative", zIndex: 1, marginTop: 24,
                        display: "flex", flexDirection: "column", gap: 10
                    }}>
                        {steps.map((s) => {
                            const isDone = otpRequested && s.num === 1;
                            const isActive = (!otpRequested && s.num === 1) || (otpRequested && s.num === 2);
                            return (
                                <div key={s.num} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 14px", borderRadius: 10,
                                    background: isActive || isDone ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${isActive || isDone ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                                    transition: "all 0.3s ease"
                                }}>
                                    <span style={{
                                        width: 26, height: 26, borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 12, fontWeight: 700,
                                        background: isDone ? "#10b981" : isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                                        color: "#fff", transition: "all 0.3s"
                                    }}>
                                        {isDone ? <CheckCircle size={14} /> : s.num}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                                    {isDone && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: "rgba(16,185,129,0.25)", color: "#4ade80", padding: "2px 8px", borderRadius: 20 }}>Done</span>}
                                    {isActive && !isDone && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", padding: "2px 8px", borderRadius: 20 }}>Current</span>}
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* ── RIGHT FORM PANEL ── */}
                <div style={{ flex: 1, padding: "36px 38px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

                    {/* Mobile logo */}
                    <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                        <GraduationCap size={22} color="var(--primary)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>StudentHub</span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={otpRequested ? "otp-head" : "reg-head"}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 2 }}>
                                {otpRequested ? "Verify Your Email" : "Create Account"}
                            </h2>
                            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 22 }}>
                                {otpRequested ? `OTP sent to ${form.email}` : "Use a Gmail address to get started"}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Mobile step pills */}
                    <div className="lg:hidden" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                        {steps.map((s, i) => {
                            const isDone = otpRequested && s.num === 1;
                            const isActive = (!otpRequested && s.num === 1) || (otpRequested && s.num === 2);
                            return (
                                <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        background: isActive ? "var(--primary)" : isDone ? "var(--success-bg)" : "var(--surface-soft)",
                                        color: isActive ? "#fff" : isDone ? "var(--success)" : "var(--text-muted)",
                                        border: isDone ? "1px solid rgba(19,138,92,0.25)" : "1px solid transparent"
                                    }}>
                                        <span style={{
                                            width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 10, fontWeight: 700,
                                            background: isActive ? "rgba(255,255,255,0.2)" : isDone ? "var(--success)" : "var(--border)",
                                            color: isActive || isDone ? "#fff" : "#94a3b8"
                                        }}>
                                            {isDone ? "✓" : s.num}
                                        </span>
                                        {s.label}
                                    </div>
                                    {i === 0 && <div style={{ width: 16, height: 2, borderRadius: 1, background: otpRequested ? "var(--success)" : "var(--border)" }} />}
                                </div>
                            );
                        })}
                    </div>

                    <form onSubmit={otpRequested ? handleRegister : handleRequestOtp}
                        style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Notification tone={feedback.tone} message={feedback.text} />

                        <AnimatePresence mode="wait">
                            {!otpRequested ? (
                                <motion.div key="step1" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Full Name</label>
                                        <div style={inputWrap}>
                                            <User size={16} style={iconStyle} className="input-icon" />
                                            <input placeholder="Your full name" required value={form.name} onChange={updateField("name")}
                                                style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Gmail Address</label>
                                        <div style={inputWrap}>
                                            <Mail size={16} style={iconStyle} className="input-icon" />
                                            <input type="email" placeholder="name@gmail.com" required value={form.email} onChange={updateField("email")}
                                                style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>Password</label>
                                        <div style={inputWrap}>
                                            <Lock size={16} style={iconStyle} className="input-icon" />
                                            <input type={showPass ? "text" : "password"} placeholder="Minimum 8 characters" required
                                                value={form.password} onChange={updateField("password")}
                                                style={{ ...inputBase, paddingRight: 48 }} onFocus={focusInput} onBlur={blurInput} />
                                            <button type="button" onClick={() => setShowPass(s => !s)}
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
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-sub)", marginBottom: 7 }}>6-digit OTP Code</label>
                                        <input
                                            type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
                                            placeholder="• • • • • •" maxLength={6}
                                            value={form.otp} onChange={updateOtp} required
                                            style={{
                                                width: "100%", padding: "14px", fontSize: 24, fontWeight: 800,
                                                textAlign: "center", letterSpacing: "0.4em",
                                                border: "1.5px solid var(--border)", borderRadius: 10,
                                                background: "var(--surface-soft)", outline: "none", color: "var(--text-main)",
                                                transition: "all 0.2s"
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; e.target.style.background = "var(--surface-elevated)"; }}
                                            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--surface-soft)"; }} />
                                        <p style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                                            Check your Gmail inbox. Expires in 10 minutes.
                                        </p>
                                    </div>
                                    {previewOtp && <Notification tone="info" title="Local preview OTP" message={previewOtp} />}
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                                    Processing…
                                </>
                            ) : otpRequested ? (
                                <><ShieldCheck size={16} /> Verify & Create Account</>
                            ) : (
                                <>Send Verification OTP <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    {otpRequested && (
                        <button type="button" onClick={resetOtp}
                            style={{
                                width: "100%", marginTop: 10, padding: "10px 0", fontSize: 13, fontWeight: 600,
                                background: "var(--surface-soft)", color: "var(--text-sub)", border: "1.5px solid var(--border)", borderRadius: 10,
                                cursor: "pointer", transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-soft)"; }}>
                            ← Edit registration details
                        </button>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: 22, textAlign: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Already have an account?{" "}</span>
                        <Link to="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
