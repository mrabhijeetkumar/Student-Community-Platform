import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const steps = [
    { num: 1, label: "Your details" },
    { num: 2, label: "Verify OTP" },
];

const perks = [
    { icon: ShieldCheck, color: "#10b981", label: "Verified identity", desc: "Only Gmail accounts accepted — no disposable domains." },
    { icon: Zap, color: "#6366f1", label: "Instant access", desc: "Complete OTP verification and unlock the full platform." },
    { icon: Star, color: "#f59e0b", label: "Community access", desc: "Post, collaborate, and join student communities instantly." },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Register() {
    const navigate = useNavigate();
    const { requestOtp, register } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
    const [feedback, setFeedback] = useState({ tone: "warning", text: "" });
    const [previewOtp, setPreviewOtp] = useState("");
    const [otpRequested, setOtpRequested] = useState(false);
    const [loading, setLoading] = useState(false);

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

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">

            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="floating-orb -right-32 -top-20 h-[500px] w-[500px]"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22), transparent)" }} />
                <div className="floating-orb -left-20 bottom-0 h-[400px] w-[400px]"
                    style={{ background: "radial-gradient(circle, rgba(34,211,238,0.14), transparent)" }} />
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
            </div>

            <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">

                {/* ── Left brand panel ─────────────────────── */}
                <motion.div {...fade(0)} className="card-surface relative overflow-hidden p-8 lg:p-10">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-3xl"
                        style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.11) 0%, transparent 100%)" }} />

                    <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-6"
                        style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)", color: "#67e8f9" }}>
                        Verified onboarding
                    </span>

                    <h1 className="display-title text-[1.9rem] font-bold leading-tight text-white">
                        Create a trusted<br />
                        <span style={{ background: "linear-gradient(90deg,#22d3ee,#818cf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                            student profile.
                        </span>
                    </h1>
                    <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--text-sub)" }}>
                        Gmail OTP verification keeps the network genuine. Disposable email domains are blocked.
                    </p>

                    {/* Steps */}
                    <div className="mt-7 space-y-2.5">
                        {steps.map((s, i) => (
                            <motion.div key={s.num}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + i * 0.08 }}
                                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                                style={{
                                    background: (otpRequested ? s.num <= 2 : s.num === 1) ? "rgba(99,102,241,0.10)" : "rgba(255,255,255,0.03)",
                                    border: (otpRequested ? s.num <= 2 : s.num === 1) ? "1px solid rgba(99,102,241,0.22)" : "1px solid var(--border)",
                                }}>
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                                    style={{
                                        background: (otpRequested && s.num === 1) ? "#10b981" : ((!otpRequested && s.num === 1) || (otpRequested && s.num === 2)) ? "var(--primary)" : "var(--surface-soft)",
                                        color: "white",
                                    }}>
                                    {otpRequested && s.num === 1 ? <CheckCircle size={14} /> : s.num}
                                </div>
                                <p className="text-[13px] font-medium" style={{ color: "var(--text-main)" }}>{s.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Perks */}
                    <div className="mt-7 space-y-3">
                        {perks.map(({ icon: Icon, color, label, desc }) => (
                            <div key={label} className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                                    style={{ background: `${color}18` }}>
                                    <Icon size={14} style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{label}</p>
                                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Right form panel ─────────────────────── */}
                <motion.div {...fade(0.12)} className="card-floating relative overflow-hidden" style={{ padding: "2rem 1.75rem" }}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-3xl"
                        style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.09) 0%, transparent 100%)" }} />

                    {/* Step indicator */}
                    <div className="mb-5 flex items-center gap-3">
                        {steps.map((s, i) => (
                            <div key={s.num} className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-all duration-300"
                                    style={{
                                        background: (otpRequested && s.num === 1) ? "#10b981" : ((!otpRequested && s.num === 1) || (otpRequested && s.num === 2)) ? "var(--primary)" : "var(--surface-soft)",
                                        color: "white",
                                    }}>
                                    {otpRequested && s.num === 1 ? <CheckCircle size={13} /> : s.num}
                                </div>
                                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                                {i < steps.length - 1 && (
                                    <div className="h-px w-8 mx-1 transition-all duration-300"
                                        style={{ background: otpRequested ? "var(--primary)" : "var(--border)" }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <span className="section-title">Register</span>
                    <h2 className="display-title mt-2 text-[22px] font-bold" style={{ color: "var(--text-main)" }}>
                        {otpRequested ? "Enter your OTP" : "Create your account"}
                    </h2>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--text-sub)" }}>
                        {otpRequested
                            ? `OTP sent to ${form.email}. Check your inbox.`
                            : "Use a Gmail address and a strong password."}
                    </p>

                    <form onSubmit={otpRequested ? handleRegister : handleRequestOtp} className="mt-5 space-y-4">
                        <Notification tone={feedback.tone} message={feedback.text} />

                        <AnimatePresence mode="wait">
                            {!otpRequested ? (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>
                                            <User size={12} /> Full name
                                        </label>
                                        <input className="input" placeholder="Your full name"
                                            value={form.name} onChange={updateField("name")} required />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>
                                            <Mail size={12} /> Gmail address
                                        </label>
                                        <input className="input" type="email" placeholder="name@gmail.com"
                                            value={form.email} onChange={updateField("email")} required />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>
                                            <Lock size={12} /> Password
                                        </label>
                                        <input className="input" type="password" placeholder="Minimum 8 characters"
                                            value={form.password} onChange={updateField("password")} required />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>
                                            <ShieldCheck size={12} /> 6-digit OTP
                                        </label>
                                        <input className="input text-center text-[18px] font-bold tracking-[0.4em]"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            pattern="[0-9]{6}"
                                            placeholder="• • • • • •"
                                            maxLength={6}
                                            value={form.otp}
                                            onChange={updateOtp}
                                            required />
                                    </div>
                                    {previewOtp && (
                                        <Notification tone="info" title="Local preview OTP" message={previewOtp} />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button type="submit" className="btn-primary w-full" disabled={loading}>
                            {loading ? "Processing…" : otpRequested
                                ? <><ShieldCheck size={14} /><span>Verify &amp; Create account</span></>
                                : <><span>Send OTP</span><ArrowRight size={14} /></>}
                        </button>
                    </form>

                    {otpRequested && (
                        <button type="button" className="btn-secondary mt-3 w-full text-[13px]" onClick={resetOtp}>
                            ← Edit registration details
                        </button>
                    )}

                    <p className="mt-5 text-[13px]" style={{ color: "var(--text-sub)" }}>
                        Already have an account?{" "}
                        <Link className="font-semibold" style={{ color: "var(--accent)" }} to="/login">
                            Sign in →
                        </Link>
                    </p>
                </motion.div>

            </div>
        </main>
    );
}
