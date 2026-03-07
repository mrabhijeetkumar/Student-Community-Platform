import { EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
    const navigate = useNavigate();
    const { requestOtp, register } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
    const [feedback, setFeedback] = useState("");
    const [previewOtp, setPreviewOtp] = useState("");
    const [otpRequested, setOtpRequested] = useState(false);
    const [loading, setLoading] = useState(false);

    const updateField = (field) => (event) => {
        setForm((currentState) => ({ ...currentState, [field]: event.target.value }));
    };

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await requestOtp({ name: form.name, email: form.email, password: form.password });
            setOtpRequested(true);
            setPreviewOtp(response.previewOtp || "");
            setFeedback(response.message || "OTP sent successfully.");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            await register({ email: form.email, otp: form.otp });
            navigate("/");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
            <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="card-surface p-8 lg:p-10">
                    <p className="section-title">Verified onboarding</p>
                    <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white">Create a trusted student profile with Gmail OTP verification.</h1>
                    <div className="hero-panel hero-grid relative mt-6 overflow-hidden px-5 py-5">
                        <div className="relative z-10">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Secure onboarding funnel</p>
                            <p className="mt-2 text-sm text-slate-200">Enterprise-like trust cues with a high-clarity multi-step registration experience.</p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                        <p>Only Gmail accounts are accepted. Disposable inbox domains are blocked before registration is completed.</p>
                        <p>Your profile unlocks feed access, follows, threaded comments, direct messages, and dashboards after verification.</p>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <motion.div whileHover={{ y: -4 }} className="card-ghost p-5">
                            <EnvelopeIcon className="h-7 w-7 text-accent-300" />
                            <p className="mt-4 text-sm font-semibold text-white">Step 1</p>
                            <p className="mt-2 text-sm text-slate-400">Submit your name, Gmail, and password.</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }} className="card-ghost p-5">
                            <ShieldCheckIcon className="h-7 w-7 text-brand-200" />
                            <p className="mt-4 text-sm font-semibold text-white">Step 2</p>
                            <p className="mt-2 text-sm text-slate-400">Receive the one-time password in your inbox.</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }} className="card-ghost p-5">
                            <LockClosedIcon className="h-7 w-7 text-accent-300" />
                            <p className="mt-4 text-sm font-semibold text-white">Step 3</p>
                            <p className="mt-2 text-sm text-slate-400">Verify and unlock the full platform instantly.</p>
                        </motion.div>
                    </div>
                </section>

                <section className="card-surface p-8 lg:p-10">
                    <p className="section-title">Register</p>
                    <h2 className="mt-3 text-3xl font-bold text-white">Start with a verified Gmail</h2>
                    <p className="mt-2 text-sm text-slate-400">Use a strong password. OTP expires after 10 minutes.</p>

                    <form onSubmit={otpRequested ? handleRegister : handleRequestOtp} className="mt-8 space-y-4">
                        <Notification tone={otpRequested ? "success" : "warning"} message={feedback} />
                        <input className="input-control" placeholder="Full name" value={form.name} onChange={updateField("name")} disabled={otpRequested} />
                        <input className="input-control" type="email" placeholder="name@gmail.com" value={form.email} onChange={updateField("email")} disabled={otpRequested} />
                        <input className="input-control" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={updateField("password")} disabled={otpRequested} />

                        {otpRequested ? (
                            <>
                                <input className="input-control" placeholder="Enter 6-digit OTP" value={form.otp} onChange={updateField("otp")} />
                                {previewOtp ? <Notification tone="info" title="Local preview OTP" message={previewOtp} /> : null}
                            </>
                        ) : null}

                        <button type="submit" className="btn-primary w-full" disabled={loading}>
                            {loading ? "Processing..." : otpRequested ? "Verify OTP and create account" : "Send OTP"}
                        </button>
                    </form>

                    {otpRequested ? (
                        <button type="button" className="btn-secondary mt-4 w-full" onClick={() => { setOtpRequested(false); setFeedback(""); setForm((currentState) => ({ ...currentState, otp: "" })); }}>
                            Edit registration details
                        </button>
                    ) : null}

                    <p className="mt-6 text-sm text-slate-400">
                        Already registered? <Link className="font-semibold text-accent-300" to="/login">Go to sign in</Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
