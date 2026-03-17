import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Notification from "../components/Notification";
import { useAuth } from "../context/useAuth.js";

const fadeUp = (i) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
});

export default function Register() {
    const { requestVerification } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [feedback, setFeedback] = useState({ tone: "warning", text: "" });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const updateField = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));
    const setMsg = (tone, text) => setFeedback({ tone, text });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await requestVerification({ name: form.name, email: form.email, password: form.password });
            setMsg("success", res.message || "Verification link sent! Check your Gmail inbox.");
        } catch (err) {
            setMsg("warning", err.message);
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

    return (
        <main style={{ background: "linear-gradient(135deg, #ebf3ff 0%, #e2edff 45%, #f7f1e7 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", width: "100%", maxWidth: 860, minHeight: 520, borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-strong)", background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
                <div style={{ width: "44%", background: "linear-gradient(155deg, #0a223d 0%, #156dce 52%, #31a6ff 100%)", padding: "44px 34px", display: "none", flexDirection: "column", justifyContent: "space-between", color: "#fff" }} className="lg:!flex">
                    <div>
                        <motion.div {...fadeUp(0)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                            <GraduationCap size={20} color="#fff" /><span style={{ fontSize: 16, fontWeight: 700 }}>StudentHub</span>
                        </motion.div>
                        <motion.h1 {...fadeUp(1)} style={{ fontSize: 30, fontWeight: 800 }}>Join the Community</motion.h1>
                    </div>
                </div>

                <div style={{ width: "100%", maxWidth: 500, padding: "40px 34px" }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Create Account</h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 18 }}>Account tabhi create hoga jab verification link click hoga.</p>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Notification tone={feedback.tone} message={feedback.text} />
                        <div style={inputWrap}><User size={16} style={iconStyle} /><input required placeholder="Full Name" value={form.name} onChange={updateField("name")} style={inputBase} /></div>
                        <div style={inputWrap}><Mail size={16} style={iconStyle} /><input required type="email" placeholder="name@gmail.com" value={form.email} onChange={updateField("email")} style={inputBase} /></div>
                        <div style={inputWrap}>
                            <Lock size={16} style={iconStyle} />
                            <input required type={showPass ? "text" : "password"} placeholder="Password" value={form.password} onChange={updateField("password")} style={{ ...inputBase, paddingRight: 44 }} />
                            <button type="button" onClick={() => setShowPass((s) => !s)} style={{ position: "absolute", right: 12, border: "none", background: "transparent" }}>{showPass ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                        </div>
                        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700 }}>
                            {loading ? "Processing..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>Send Verification Link <ArrowRight size={16} /></span>}
                        </button>
                    </form>
                    <div style={{ marginTop: 18 }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Already have an account? </span>
                        <Link to="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>Sign in</Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
