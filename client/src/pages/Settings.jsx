import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Check, Loader2, Shield, Bell, Moon, Sun, Palette, ChevronRight, AlertCircle, LogOut, User, KeyRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { changePassword } from "../services/api.js";
import useTheme from "../hooks/useTheme.js";

const SECTION_IDS = ["account", "security", "appearance", "notifications"];

export default function Settings() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [activeSection, setActiveSection] = useState("account");

    // Password change state
    const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
    const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState(false);

    const updatePw = (field) => (e) => {
        setPwError("");
        setPwForm((f) => ({ ...f, [field]: e.target.value }));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError("");
        if (pwForm.next.length < 8) { setPwError("New password must be at least 8 characters."); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
        setPwLoading(true);
        try {
            await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next }, token);
            setPwSuccess(true);
            setPwForm({ current: "", next: "", confirm: "" });
            setTimeout(() => setPwSuccess(false), 3500);
        } catch (err) {
            setPwError(err.message || "Failed to change password.");
        } finally {
            setPwLoading(false);
        }
    };

    const inputBase = {
        width: "100%",
        padding: "10px 14px 10px 40px",
        fontSize: 14,
        border: "1.5px solid var(--border)",
        borderRadius: 10,
        background: "var(--surface-soft)",
        outline: "none",
        color: "var(--text-main)",
        transition: "border-color 0.2s, box-shadow 0.2s",
    };

    const focusInput = (e) => {
        e.target.style.borderColor = "var(--primary)";
        e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)";
        e.target.style.background = "var(--surface-elevated)";
    };

    const blurInput = (e) => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
        e.target.style.background = "var(--surface-soft)";
    };

    const SECTIONS = [
        { id: "account", label: "Account", icon: User },
        { id: "security", label: "Security", icon: Shield },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "notifications", label: "Notifications", icon: Bell },
    ];

    const avatarUrl = user?.profilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=0a66c2&color=fff&bold=true&size=200`;

    return (
        <div className="mx-auto max-w-[820px]">
            <div className="mb-4">
                <h1 className="text-[22px] font-black display-title">Settings</h1>
                <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your account preferences</p>
            </div>

            <div className="flex gap-4">
                {/* ── SIDEBAR NAV ── */}
                <div className="hidden sm:block w-[200px] shrink-0">
                    <div className="card p-2 space-y-0.5">
                        {SECTIONS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 text-left"
                                style={activeSection === id
                                    ? { background: "var(--primary-subtle)", color: "var(--primary)", fontWeight: 700 }
                                    : { color: "var(--text-sub)" }
                                }
                                onMouseEnter={(e) => { if (activeSection !== id) e.currentTarget.style.background = "var(--surface-hover)"; }}
                                onMouseLeave={(e) => { if (activeSection !== id) e.currentTarget.style.background = "transparent"; }}
                            >
                                <Icon size={15} />
                                {label}
                                {activeSection === id && <ChevronRight size={13} className="ml-auto" />}
                            </button>
                        ))}
                        <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 4 }}>
                            <button
                                onClick={() => { logout(); navigate("/login"); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 text-left"
                                style={{ color: "var(--error)" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--error-bg)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                                <LogOut size={15} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CONTENT PANEL ── */}
                <div className="flex-1 min-w-0">
                    {/* Mobile tab strip */}
                    <div className="sm:hidden flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
                        {SECTIONS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold shrink-0 transition-all"
                                style={activeSection === id
                                    ? { background: "var(--primary)", color: "#fff" }
                                    : { background: "var(--surface-soft)", color: "var(--text-sub)", border: "1px solid var(--border)" }
                                }
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* ── ACCOUNT ── */}
                        {activeSection === "account" && (
                            <motion.div key="account"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-3"
                            >
                                <div className="card p-5">
                                    <h2 className="text-[15px] font-bold mb-4" style={{ color: "var(--text-main)" }}>Account Info</h2>
                                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                        <img src={avatarUrl} className="w-14 h-14 rounded-full object-cover shrink-0" alt={user?.name} />
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-bold truncate" style={{ color: "var(--text-main)" }}>{user?.name}</p>
                                            <p className="text-[13px] truncate" style={{ color: "var(--text-muted)" }}>@{user?.username}</p>
                                            {user?.email && <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-faint)" }}>{user.email}</p>}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/profile/${user?.username}`)}
                                            className="ml-auto shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                                            style={{ background: "var(--primary-subtle)", color: "var(--primary)", border: "1px solid rgba(10,102,194,0.2)" }}
                                        >
                                            Edit Profile
                                        </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Role", value: user?.role === "admin" ? "Administrator" : "Student" },
                                            { label: "College", value: user?.college || "Not set" },
                                            { label: "Username", value: `@${user?.username || "—"}` },
                                            { label: "Joined", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                                <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                                                <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-main)" }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── SECURITY ── */}
                        {activeSection === "security" && (
                            <motion.div key="security"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-3"
                            >
                                <div className="card p-5">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-subtle)" }}>
                                            <KeyRound size={14} style={{ color: "var(--primary)" }} />
                                        </div>
                                        <div>
                                            <h2 className="text-[15px] font-bold leading-tight" style={{ color: "var(--text-main)" }}>Change Password</h2>
                                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Keep your account secure with a strong password</p>
                                        </div>
                                    </div>

                                    {/* Success banner */}
                                    <AnimatePresence>
                                        {pwSuccess && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-[14px] font-medium"
                                                style={{ background: "var(--success-bg)", border: "1px solid rgba(5,118,66,0.22)", color: "var(--success)" }}
                                            >
                                                <Check size={14} /> Password changed successfully!
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        {[
                                            { field: "current", label: "Current Password", placeholder: "Enter your current password" },
                                            { field: "next", label: "New Password", placeholder: "Minimum 8 characters" },
                                            { field: "confirm", label: "Confirm New Password", placeholder: "Re-enter new password" },
                                        ].map(({ field, label, placeholder }) => (
                                            <div key={field}>
                                                <label className="block text-[13px] font-semibold mb-2" style={{ color: "var(--text-sub)" }}>{label}</label>
                                                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                    <Lock size={15} style={{ position: "absolute", left: 12, color: "var(--text-muted)", pointerEvents: "none" }} />
                                                    <input
                                                        type={pwShow[field] ? "text" : "password"}
                                                        placeholder={placeholder}
                                                        required
                                                        value={pwForm[field]}
                                                        onChange={updatePw(field)}
                                                        style={{ ...inputBase, paddingRight: 44 }}
                                                        onFocus={focusInput}
                                                        onBlur={blurInput}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPwShow((s) => ({ ...s, [field]: !s[field] }))}
                                                        style={{ position: "absolute", right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                                                    >
                                                        {pwShow[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {pwError && (
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[14px]"
                                                style={{ background: "var(--error-bg)", border: "1px solid rgba(204,16,22,0.2)", color: "var(--error)" }}>
                                                <AlertCircle size={13} /> {pwError}
                                            </div>
                                        )}

                                        {/* Password strength indicator */}
                                        {pwForm.next.length > 0 && (
                                            <div>
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4].map((i) => {
                                                        const strength = Math.min(4, Math.floor(
                                                            (pwForm.next.length >= 8 ? 1 : 0) +
                                                            (/[A-Z]/.test(pwForm.next) ? 1 : 0) +
                                                            (/[0-9]/.test(pwForm.next) ? 1 : 0) +
                                                            (/[^A-Za-z0-9]/.test(pwForm.next) ? 1 : 0)
                                                        ));
                                                        const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="flex-1 h-1 rounded-full transition-all duration-300"
                                                                style={{ background: i <= strength ? colors[strength - 1] : "var(--border)" }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                                    Use uppercase, numbers & symbols for a stronger password
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={pwLoading}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200"
                                            style={{
                                                background: pwLoading ? "var(--primary-subtle)" : "var(--primary)",
                                                color: pwLoading ? "var(--text-muted)" : "white",
                                                cursor: pwLoading ? "not-allowed" : "pointer",
                                                boxShadow: pwLoading ? "none" : "0 4px 12px var(--primary-glow)",
                                            }}
                                        >
                                            {pwLoading ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><Check size={14} /> Update Password</>}
                                        </button>
                                    </form>
                                </div>

                                {/* Security Tips */}
                                <div className="card p-5">
                                    <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-sub)" }}>Security Tips</h3>
                                    <div className="space-y-2">
                                        {[
                                            "Use a unique password not used on other sites",
                                            "Include uppercase letters, numbers and symbols",
                                            "Never share your password with anyone",
                                            "Change your password if you suspect it was compromised",
                                        ].map((tip) => (
                                            <div key={tip} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
                                                <Shield size={13} className="shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                                                {tip}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── APPEARANCE ── */}
                        {activeSection === "appearance" && (
                            <motion.div key="appearance"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="card p-5">
                                    <h2 className="text-[15px] font-bold mb-4" style={{ color: "var(--text-main)" }}>Appearance</h2>

                                    <div className="flex items-center justify-between p-4 rounded-xl mb-3" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                        <div className="flex items-center gap-3">
                                            {isDark ? <Moon size={18} style={{ color: "var(--primary)" }} /> : <Sun size={18} style={{ color: "#f59e0b" }} />}
                                            <div>
                                                <p className="text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>{isDark ? "Dark Mode" : "Light Mode"}</p>
                                                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                                                    {isDark ? "Easy on the eyes at night" : "Clean and bright interface"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
                                            style={{ background: isDark ? "var(--primary)" : "var(--border-hover)" }}
                                        >
                                            <span
                                                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm"
                                                style={{ left: isDark ? "calc(100% - 20px)" : "4px" }}
                                            />
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-sub)" }}>Theme Preview</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { name: "Light", active: !isDark, preview: "#f3f2ef", text: "#000", card: "#fff", accent: "#0a66c2" },
                                                { name: "Dark", active: isDark, preview: "#1b1f23", text: "rgba(255,255,255,0.9)", card: "#242a30", accent: "#378fe9" },
                                            ].map((t) => (
                                                <button
                                                    key={t.name}
                                                    onClick={() => { if (!t.active) toggleTheme(); }}
                                                    className="p-3 rounded-xl text-left transition-all"
                                                    style={{
                                                        background: t.preview, border: t.active ? `2px solid var(--primary)` : "2px solid transparent",
                                                        boxShadow: t.active ? "0 0 0 3px var(--primary-glow)" : "none"
                                                    }}
                                                >
                                                    <div className="h-8 rounded-lg mb-2" style={{ background: t.card, border: "1px solid rgba(0,0,0,0.08)" }}>
                                                        <div className="h-full px-2 flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
                                                            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(128,128,128,0.2)" }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[13px] font-semibold" style={{ color: t.text }}>{t.name}</span>
                                                        {t.active && <Check size={13} style={{ color: t.accent }} />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── NOTIFICATIONS ── */}
                        {activeSection === "notifications" && (
                            <motion.div key="notifications"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="card p-5">
                                    <h2 className="text-[15px] font-bold mb-4" style={{ color: "var(--text-main)" }}>Notification Preferences</h2>
                                    <div className="space-y-2">
                                        {[
                                            { label: "New followers", sub: "When someone follows you", defaultOn: true },
                                            { label: "Post likes", sub: "When someone likes your post", defaultOn: true },
                                            { label: "Post comments", sub: "When someone comments on your post", defaultOn: true },
                                            { label: "Community updates", sub: "Activity in communities you joined", defaultOn: false },
                                            { label: "Direct messages", sub: "When you receive a new message", defaultOn: true },
                                        ].map((pref) => (
                                            <NotifToggleRow key={pref.label} pref={pref} />
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[12px]" style={{ color: "var(--text-faint)" }}>
                                        * In-app notification preferences. Email notifications are not yet supported.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function NotifToggleRow({ pref }) {
    const [on, setOn] = useState(pref.defaultOn);
    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl transition-colors"
            style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-soft)"}
        >
            <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>{pref.label}</p>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{pref.sub}</p>
            </div>
            <button
                onClick={() => setOn((v) => !v)}
                className="relative w-10 h-5 rounded-full transition-all duration-300 shrink-0 ml-4"
                style={{ background: on ? "var(--primary)" : "var(--border-hover)" }}
            >
                <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm"
                    style={{ left: on ? "calc(100% - 18px)" : "2px" }}
                />
            </button>
        </div>
    );
}
