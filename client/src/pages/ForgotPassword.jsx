import { motion, AnimatePresence } from "framer-motion";
import {
    Mail, ArrowRight, ArrowLeft, Lock, Eye, EyeOff,
    ShieldCheck, KeyRound, CheckCircle2, Sparkles, RefreshCw
} from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Notification from "../components/Notification";
import { forgotPassword, resetPassword } from "../services/api";

const stagger = (i) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
});

const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function ForgotPassword() {
    const [searchParams] = useSearchParams();
    const isAdmin = searchParams.get("role") === "admin";
    const backTo = isAdmin ? "/admin/login" : "/login";
    const backLabel = isAdmin ? "Admin Login" : "Student Login";

    const [step, setStep] = useState(1); // 1 = email, 2 = OTP + new password, 3 = success
    const [direction, setDirection] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewOtp, setPreviewOtp] = useState("");

    const goStep = (s) => {
        setDirection(s > step ? 1 : -1);
        setStep(s);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setFeedback("");
        setLoading(true);
        try {
            const res = await forgotPassword({ email, role: isAdmin ? "admin" : "student" });
            if (res.previewOtp) setPreviewOtp(res.previewOtp);
            goStep(2);
        } catch (err) {
            setFeedback(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setFeedback("");

        if (newPassword !== confirmPassword) {
            setFeedback("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            setFeedback("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ email, otp, newPassword, role: isAdmin ? "admin" : "student" });
            goStep(3);
        } catch (err) {
            setFeedback(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setFeedback("");
        setLoading(true);
        try {
            const res = await forgotPassword({ email, role: isAdmin ? "admin" : "student" });
            if (res.previewOtp) setPreviewOtp(res.previewOtp);
            setFeedback("");
            setOtp("");
        } catch (err) {
            setFeedback(err.message);
        } finally {
            setLoading(false);
        }
    };

    const accentGradient = isAdmin
        ? "linear-gradient(135deg, #0a66c2, #7c3aed)"
        : "linear-gradient(135deg, #0d72d8, #0a57a8)";

    const bgColor = isAdmin ? "#0a0e1a" : "var(--bg-base)";
    const cardBg = isAdmin ? "rgba(255,255,255,0.03)" : "var(--surface)";
    const cardBorder = isAdmin ? "rgba(255,255,255,0.08)" : "var(--border)";
    const textMain = isAdmin ? "#fff" : "var(--text-main)";
    const textSub = isAdmin ? "rgba(255,255,255,0.45)" : "var(--text-sub)";
    const textMuted = isAdmin ? "rgba(255,255,255,0.35)" : "var(--text-muted)";
    const textFaint = isAdmin ? "rgba(255,255,255,0.2)" : "var(--text-faint)";
    const inputBg = isAdmin ? "rgba(255,255,255,0.05)" : undefined;
    const inputBorder = isAdmin ? "1px solid rgba(255,255,255,0.1)" : undefined;
    const inputColor = isAdmin ? "#fff" : undefined;

    const inputClass = isAdmin
        ? "w-full rounded-xl py-3 text-[13px] outline-none transition-all focus:ring-2"
        : "input";
    const inputStyle = isAdmin
        ? { background: inputBg, border: inputBorder, color: inputColor, "--tw-ring-color": "rgba(10,102,194,0.4)" }
        : {};

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
            style={{ background: bgColor }}>

            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {isAdmin ? (
                    <>
                        <div className="absolute inset-0" style={{
                            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)",
                            backgroundSize: "32px 32px"
                        }} />
                        <div style={{ position: "absolute", top: "-15%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "rgba(10,102,194,0.12)", filter: "blur(120px)" }} />
                        <div style={{ position: "absolute", bottom: "-10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "rgba(124,58,237,0.1)", filter: "blur(100px)" }} />
                    </>
                ) : (
                    <>
                        <div style={{ position: "absolute", top: "-10%", left: "10%", width: 600, height: 600, borderRadius: "50%", background: "rgba(10,102,194,0.07)", filter: "blur(100px)" }} />
                        <div style={{ position: "absolute", bottom: "-5%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(55,143,233,0.06)", filter: "blur(90px)" }} />
                    </>
                )}
            </div>

            <div className="relative z-10 w-full max-w-md">

                {/* Top icon badge */}
                <motion.div {...stagger(0)} className="flex justify-center mb-6">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl"
                        style={{
                            background: accentGradient,
                            boxShadow: "0 8px 32px rgba(10,102,194,0.3)"
                        }}>
                        <KeyRound size={28} style={{ color: "#fff" }} />
                    </div>
                </motion.div>

                {/* Main card */}
                <motion.div {...stagger(1)}
                    className="rounded-3xl overflow-hidden"
                    style={{
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                        backdropFilter: isAdmin ? "blur(20px)" : undefined,
                        boxShadow: isAdmin
                            ? "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
                            : "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)"
                    }}>

                    {/* Top accent line */}
                    <div className="h-1" style={{ background: accentGradient }} />

                    <div className="px-7 pb-8 pt-7 sm:px-9">

                        {/* Step indicator */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300"
                                        style={{
                                            background: step >= s ? accentGradient : isAdmin ? "rgba(255,255,255,0.06)" : "var(--surface-soft)",
                                            color: step >= s ? "#fff" : textMuted,
                                            border: `1px solid ${step >= s ? "transparent" : isAdmin ? "rgba(255,255,255,0.1)" : "var(--border)"}`,
                                            boxShadow: step === s ? "0 2px 12px rgba(10,102,194,0.3)" : "none"
                                        }}>
                                        {step > s ? "✓" : s}
                                    </div>
                                    {s < 3 && (
                                        <div className="h-0.5 w-6 rounded-full transition-all duration-300"
                                            style={{ background: step > s ? (isAdmin ? "#0a66c2" : "var(--primary)") : isAdmin ? "rgba(255,255,255,0.08)" : "var(--border)" }} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait" custom={direction}>
                            {/* ── Step 1: Enter Email ── */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>

                                    <div className="mb-5 text-center">
                                        <h1 className="text-[20px] font-black mb-1" style={{ color: textMain, letterSpacing: "-0.02em" }}>
                                            Forgot Password?
                                        </h1>
                                        <p className="text-[13px]" style={{ color: textSub }}>
                                            Enter your email and we'll send you an OTP to reset your password
                                        </p>
                                    </div>

                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <Notification tone="warning" message={feedback} />

                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest"
                                                style={{ color: textMuted }}>Email address</label>
                                            <div className="relative">
                                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: textFaint }} />
                                                <input
                                                    className={`${inputClass} pl-10`}
                                                    style={inputStyle}
                                                    type="email"
                                                    placeholder="you@gmail.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    autoComplete="email"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="relative w-full overflow-hidden rounded-xl py-3 text-[14px] font-bold text-white transition-all hover:opacity-90"
                                            style={{ background: accentGradient, boxShadow: "0 4px 16px rgba(10,102,194,0.28)" }}>
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                        className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white/30 border-t-white" />
                                                    Sending OTP…
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Send Reset OTP
                                                    <ArrowRight size={14} />
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── Step 2: Enter OTP + New Password ── */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>

                                    <div className="mb-5 text-center">
                                        <h1 className="text-[20px] font-black mb-1" style={{ color: textMain, letterSpacing: "-0.02em" }}>
                                            Reset Password
                                        </h1>
                                        <p className="text-[13px]" style={{ color: textSub }}>
                                            Enter the OTP sent to <span className="font-semibold" style={{ color: textMain }}>{email}</span>
                                        </p>
                                    </div>

                                    {previewOtp && (
                                        <div className="mb-4 rounded-xl p-3 text-center"
                                            style={{ background: isAdmin ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.08)", border: `1px solid ${isAdmin ? "rgba(74,222,128,0.2)" : "rgba(74,222,128,0.15)"}` }}>
                                            <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#4ade80" }}>Dev Preview OTP</p>
                                            <p className="text-[20px] font-black tracking-[6px]" style={{ color: "#4ade80" }}>{previewOtp}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <Notification tone="warning" message={feedback} />

                                        {/* OTP */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest"
                                                style={{ color: textMuted }}>6-digit OTP</label>
                                            <div className="relative">
                                                <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: textFaint }} />
                                                <input
                                                    className={`${inputClass} pl-10 text-center tracking-[6px] font-bold`}
                                                    style={{ ...inputStyle, fontSize: "18px", letterSpacing: "6px" }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]{6}"
                                                    maxLength={6}
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest"
                                                style={{ color: textMuted }}>New Password</label>
                                            <div className="relative">
                                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: textFaint }} />
                                                <input
                                                    className={`${inputClass} pl-10 pr-12`}
                                                    style={inputStyle}
                                                    type={showPass ? "text" : "password"}
                                                    placeholder="Min 8 characters"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    minLength={8}
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass((s) => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                                    style={{ color: textMuted, background: isAdmin ? "rgba(255,255,255,0.05)" : "var(--surface-soft)" }}>
                                                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest"
                                                style={{ color: textMuted }}>Confirm Password</label>
                                            <div className="relative">
                                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: textFaint }} />
                                                <input
                                                    className={`${inputClass} pl-10`}
                                                    style={inputStyle}
                                                    type={showPass ? "text" : "password"}
                                                    placeholder="Re-enter password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    minLength={8}
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="relative w-full overflow-hidden rounded-xl py-3 text-[14px] font-bold text-white transition-all hover:opacity-90"
                                            style={{ background: accentGradient, boxShadow: "0 4px 16px rgba(10,102,194,0.28)" }}>
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                        className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white/30 border-t-white" />
                                                    Resetting…
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <KeyRound size={14} />
                                                    Reset Password
                                                </span>
                                            )}
                                        </button>

                                        {/* Resend & back */}
                                        <div className="flex items-center justify-between pt-1">
                                            <button type="button" onClick={() => { setFeedback(""); goStep(1); }}
                                                className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
                                                style={{ color: textMuted }}>
                                                <ArrowLeft size={12} /> Change email
                                            </button>
                                            <button type="button" onClick={handleResendOtp} disabled={loading}
                                                className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
                                                style={{ color: isAdmin ? "rgba(55,143,233,0.8)" : "var(--primary)" }}>
                                                <RefreshCw size={11} /> Resend OTP
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── Step 3: Success ── */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-center py-4">

                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                                        className="flex items-center justify-center mx-auto mb-5 h-16 w-16 rounded-full"
                                        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}>
                                        <CheckCircle2 size={32} style={{ color: "#4ade80" }} />
                                    </motion.div>

                                    <h2 className="text-[20px] font-black mb-2" style={{ color: textMain, letterSpacing: "-0.02em" }}>
                                        Password Reset!
                                    </h2>
                                    <p className="text-[13px] mb-6" style={{ color: textSub }}>
                                        Your password has been reset successfully. You can now sign in with your new password.
                                    </p>

                                    <Link
                                        to={backTo}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl py-3 px-8 text-[14px] font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: accentGradient, boxShadow: "0 4px 16px rgba(10,102,194,0.28)" }}>
                                        <Sparkles size={14} />
                                        Go to Login
                                        <ArrowRight size={14} />
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Back to login (step 1 & 2 only) */}
                        {step < 3 && (
                            <div className="mt-6 text-center">
                                <Link className="text-[13px] font-semibold transition-colors hover:underline"
                                    style={{ color: isAdmin ? "rgba(55,143,233,0.8)" : "var(--primary)" }}
                                    to={backTo}>
                                    ← Back to {backLabel}
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Bottom badges */}
                <motion.div {...stagger(8)} className="mt-5 flex items-center justify-center gap-5">
                    {[
                        { icon: ShieldCheck, text: "Secure Reset" },
                        { icon: KeyRound, text: "OTP Verified" },
                        { icon: Lock, text: "Encrypted" },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-1.5">
                            <Icon size={11} style={{ color: isAdmin ? "rgba(255,255,255,0.25)" : "var(--text-faint)" }} />
                            <span className="text-[10px] font-medium" style={{ color: isAdmin ? "rgba(255,255,255,0.3)" : "var(--text-muted)" }}>{text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </main>
    );
}
