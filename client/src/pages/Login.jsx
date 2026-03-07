import { GoogleLogin } from "@react-oauth/google";
import { BoltIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);

    const updateField = (field) => (event) => {
        setForm((currentState) => ({ ...currentState, [field]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            await login(form);
            navigate("/");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        if (!credentialResponse.credential) {
            setFeedback("Google sign-in did not return a valid token.");
            return;
        }

        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            navigate("/");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
            <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="card-surface p-8 lg:p-12">
                    <p className="section-title">Campus OS</p>
                    <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight text-white">A student network designed for opportunities, visibility, and collaboration.</h1>
                    <div className="hero-panel hero-grid relative mt-6 overflow-hidden px-5 py-5">
                        <div className="relative z-10">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Industry-grade product shell</p>
                            <p className="mt-2 text-sm text-slate-200">Polished gradients, premium glass cards, and conversion-focused authentication flow.</p>
                        </div>
                    </div>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Join with a verified Gmail account, discover peer projects, follow builders, and manage your student identity in one secure platform.</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <motion.div whileHover={{ y: -4 }} className="card-ghost p-5">
                            <ShieldCheckIcon className="h-7 w-7 text-brand-200" />
                            <p className="mt-4 text-lg font-bold text-white">Verified</p>
                            <p className="mt-2 text-sm text-slate-400">Gmail-only verified onboarding.</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }} className="card-ghost p-5">
                            <BoltIcon className="h-7 w-7 text-accent-300" />
                            <p className="mt-4 text-lg font-bold text-white">Smart Feed</p>
                            <p className="mt-2 text-sm text-slate-400">Latest, following, trending, and smart views.</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }} className="card-ghost p-5">
                            <ChatBubbleLeftRightIcon className="h-7 w-7 text-brand-200" />
                            <p className="mt-4 text-lg font-bold text-white">Realtime</p>
                            <p className="mt-2 text-sm text-slate-400">Notifications and direct messaging.</p>
                        </motion.div>
                    </div>
                </section>

                <section className="card-surface p-8 lg:p-10">
                    <p className="section-title">Sign in</p>
                    <h2 className="mt-3 text-3xl font-bold text-white">Access the platform</h2>
                    <p className="mt-2 text-sm text-slate-400">Use your verified student Gmail or continue with Google.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <Notification tone="warning" message={feedback} />
                        <input className="input-control" type="email" placeholder="name@gmail.com" value={form.email} onChange={updateField("email")} />
                        <input className="input-control" type="password" placeholder="Password" value={form.password} onChange={updateField("password")} />
                        <button type="submit" className="btn-primary w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <span className="h-px flex-1 bg-white/10" />
                        or continue with Google
                        <span className="h-px flex-1 bg-white/10" />
                    </div>

                    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                        <div className="overflow-hidden rounded-2xl border border-white/10 p-1">
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setFeedback("Google sign-in failed.")} />
                        </div>
                    ) : (
                        <Notification tone="info" message="Google OAuth is available after setting VITE_GOOGLE_CLIENT_ID in the client environment." />
                    )}

                    <p className="mt-6 text-sm text-slate-400">
                        Need an account? <Link className="font-semibold text-accent-300" to="/register">Create one with OTP verification</Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
