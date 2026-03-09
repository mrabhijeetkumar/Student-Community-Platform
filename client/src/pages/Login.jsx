import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { ShieldCheck, Zap, MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const highlights = [
    { icon: ShieldCheck, color: "#10b981", label: "Verified access", desc: "Gmail-only onboarding keeps the network trusted." },
    { icon: Zap, color: "#6366f1", label: "Smart feed", desc: "AI-curated content, trending posts, and following views." },
    { icon: MessageSquare, color: "#22d3ee", label: "Realtime DMs", desc: "Instant messaging and live notification system." },
];

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Login() {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);

    const updateField = (field) => (e) =>
        setForm((s) => ({ ...s, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form);
            navigate("/dashboard", { replace: true });
        }
        catch (err) { setFeedback(err.message); }
        finally { setLoading(false); }
    };

    const handleGoogleSuccess = async (cr) => {
        if (!cr.credential) { setFeedback("Google sign-in did not return a valid token."); return; }
        setLoading(true);
        try {
            await googleLogin(cr.credential);
            navigate("/dashboard", { replace: true });
        }
        catch (err) { setFeedback(err.message); }
        finally { setLoading(false); }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">

            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="floating-orb -left-32 -top-20 h-[520px] w-[520px]"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22), transparent)" }} />
                <div className="floating-orb -right-20 bottom-0 h-[400px] w-[400px]"
                    style={{ background: "radial-gradient(circle, rgba(34,211,238,0.15), transparent)" }} />
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
            </div>

            <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">

                {/* ── Left brand panel ─────────────────────── */}
                <motion.div {...fade(0)} className="card-surface relative overflow-hidden p-8 lg:p-10">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-3xl"
                        style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.13) 0%, transparent 100%)" }} />

                    {/* Eyebrow badges */}
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
                            style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}>
                            Campus OS
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}>
                            <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                            Live
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 className="display-title text-[2rem] font-bold leading-tight text-white lg:text-[2.5rem]">
                        A student network<br />
                        <span style={{ background: "linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                            built for builders.
                        </span>
                    </h1>
                    <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--text-sub)" }}>
                        Discover peer projects, collaborate in communities, and manage your student identity in one secure platform.
                    </p>

                    {/* Highlights */}
                    <div className="mt-7 space-y-3">
                        {highlights.map(({ icon: Icon, color, label, desc }) => (
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
                        style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.10) 0%, transparent 100%)" }} />

                    <span className="section-title">Sign in</span>
                    <h2 className="display-title mt-2 text-[22px] font-bold" style={{ color: "var(--text-main)" }}>
                        Access the platform
                    </h2>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--text-sub)" }}>
                        Use your verified student Gmail to continue.
                    </p>

                    {/* Feature pills */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {[
                            { label: "Secure", color: "#10b981" },
                            { label: "Fast onboarding", color: "#6366f1" },
                            { label: "Live network", color: "#22d3ee" },
                        ].map(({ label, color }) => (
                            <span key={label} className="rounded-xl px-3 py-1 text-[11px] font-medium"
                                style={{ background: `${color}14`, border: `1px solid ${color}28`, color }}>
                                {label}
                            </span>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <Notification tone="warning" message={feedback} />
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>Email</label>
                            <input className="input" type="email" placeholder="name@gmail.com"
                                value={form.email} onChange={updateField("email")} required />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>Password</label>
                            <input className="input" type="password" placeholder="Your password"
                                value={form.password} onChange={updateField("password")} required />
                        </div>
                        <button type="submit" className="btn-primary w-full" disabled={loading}>
                            {loading ? "Signing in…" : <><span>Sign in</span><ArrowRight size={14} /></>}
                        </button>
                    </form>

                    <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                        <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                        or continue with
                        <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                    </div>

                    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", padding: "4px" }}>
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setFeedback("Google sign-in failed.")} />
                        </div>
                    ) : (
                        <Notification tone="info" message="Google OAuth available after setting VITE_GOOGLE_CLIENT_ID." />
                    )}

                    <p className="mt-6 text-[13px]" style={{ color: "var(--text-sub)" }}>
                        No account?{" "}
                        <Link className="font-semibold" style={{ color: "var(--accent)" }} to="/register">
                            Create one →
                        </Link>
                    </p>
                </motion.div>

            </div>
        </main>
    );
}
