import { motion, AnimatePresence } from "framer-motion";
import {
    Users, FileText, MessageSquare, Heart, Bookmark, Shield, ShieldCheck,
    ShieldOff, Trash2, Search, RefreshCw, BarChart2, Globe, Bell,
    ChevronLeft, ChevronRight, AlertTriangle, Check, TrendingUp,
    Activity, UserPlus, Zap, Sun, Moon, User as UserIcon, Lock, Eye, EyeOff,
    Mail, GraduationCap, Calendar, Crown, Settings, LogOut, Sparkles,
    Ban, Star, StarOff, UserMinus, Hash
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from "recharts";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import useTheme from "../hooks/useTheme.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import {
    getAdminDashboard, getAdminUsers, getAdminPosts,
    getAdminComments, getAdminActivity, getAdminCommunities,
    setUserRole, deleteAdminUser, deleteAdminPost, deleteAdminComment,
    deleteAdminCommunity, toggleCommunityFeatured, toggleBanUser,
    updateMyProfile, changePassword
} from "../services/api.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function avatar(user) {
    if (!user) return `https://ui-avatars.com/api/?name=U&background=0a66c2&color=fff&bold=true&size=60`;
    return user.profilePhoto || user.photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || "U")}&background=0a66c2&color=fff&bold=true&size=60`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 800 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const end = Number(value) || 0;
        if (end === 0) { setCount(0); return; }
        let frame = 0;
        const steps = 30;
        const timer = setInterval(() => {
            frame++;
            setCount(Math.round((frame / steps) * end));
            if (frame >= steps) clearInterval(timer);
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <>{count.toLocaleString()}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable atoms
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "var(--primary)", sub, trend, gradient }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="group relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            style={{
                background: gradient || "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
            }}>
            {/* Glow effect */}
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-20 blur-xl transition-opacity group-hover:opacity-40"
                style={{ background: color }} />
            <div className="flex items-center justify-between relative z-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm" style={{ background: `${color}18`, backdropFilter: "blur(8px)" }}>
                    <Icon size={19} style={{ color }} />
                </div>
                {trend !== undefined && (
                    <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 flex items-center gap-1"
                        style={{ background: trend >= 0 ? "var(--success-bg)" : "var(--error-bg)", color: trend >= 0 ? "var(--success)" : "var(--error)" }}>
                        <TrendingUp size={10} />
                        {trend >= 0 ? "+" : ""}{trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[28px] font-black display-title leading-none" style={{ color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                    {value !== undefined && value !== null ? <AnimatedCounter value={value} /> : "—"}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold" style={{ color: "var(--text-sub)" }}>{label}</p>
                {sub && <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</p>}
            </div>
        </motion.div>
    );
}

function MiniBarChart({ data, colorFn }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.label}: ${d.value}`}>
                    <div className="w-full rounded-t-sm transition-all duration-500"
                        style={{ height: `${Math.max(4, (d.value / max) * 52)}px`, background: colorFn ? colorFn(d, i) : "var(--primary)", opacity: 0.8 }} />
                    <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}

function Pill({ children, color }) {
    return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: `${color}18`, color }}>
            {children}
        </span>
    );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 22, stiffness: 300 }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
                <div className="flex items-start gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "var(--error-bg)" }}>
                        <AlertTriangle size={18} style={{ color: "var(--error)" }} />
                    </div>
                    <p className="text-[14px] leading-relaxed pt-1.5" style={{ color: "var(--text-main)" }}>{message}</p>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors hover:opacity-80"
                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors hover:opacity-90"
                        style={{ background: "var(--error)", color: "#fff" }}>
                        Delete
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function Pagination({ page, pages, total, showing, onPrev, onNext }) {
    return (
        <div className="mt-4 flex items-center justify-between">
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Showing <b style={{ color: "var(--text-sub)" }}>{showing}</b> of <b style={{ color: "var(--text-sub)" }}>{total?.toLocaleString()}</b>
            </p>
            <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={onPrev}
                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:scale-105"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: page <= 1 ? "var(--text-faint)" : "var(--text-main)" }}>
                    <ChevronLeft size={14} />
                </button>
                <span className="text-[12px] font-semibold px-2 py-1 rounded-lg" style={{ color: "var(--text-sub)", background: "var(--surface-soft)" }}>
                    {page} / {pages || 1}
                </span>
                <button disabled={page >= pages} onClick={onNext}
                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:scale-105"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: page >= pages ? "var(--text-faint)" : "var(--text-main)" }}>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

function TableSearchBar({ value, onChange, onSearch, placeholder }) {
    return (
        <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none transition-all focus:ring-2"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-main)", "--tw-ring-color": "var(--primary-glow)" }}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
                />
            </div>
            <button onClick={() => onSearch(value)}
                className="rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: "var(--primary)", color: "#fff" }}>
                Search
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme toggle button
// ─────────────────────────────────────────────────────────────────────────────
function ThemeToggleButton({ theme, toggleTheme }) {
    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all hover:scale-[1.03]"
            style={{
                background: theme === "dark"
                    ? "linear-gradient(135deg, #1e1b4b, #312e81)"
                    : "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1px solid var(--border)",
                color: theme === "dark" ? "#e0e7ff" : "#92400e",
                boxShadow: theme === "dark"
                    ? "0 2px 12px rgba(99,102,241,0.2)"
                    : "0 2px 12px rgba(245,158,11,0.2)"
            }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <motion.div
                key={theme}
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
                {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            </motion.div>
            {theme === "dark" ? "Dark" : "Light"}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Profile Section
// ─────────────────────────────────────────────────────────────────────────────
function AdminProfileSection({ user, token, updateUser }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState("");
    const [profileErr, setProfileErr] = useState("");
    const [form, setForm] = useState({ name: "", bio: "", college: "", location: "" });

    // Password change
    const [showPwSection, setShowPwSection] = useState(false);
    const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState("");
    const [pwErr, setPwErr] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({ name: user.name || "", bio: user.bio || "", college: user.college || "", location: user.location || "" });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setProfileErr("");
        setProfileMsg("");
        try {
            const updated = await updateMyProfile(form, token);
            if (updateUser) updateUser(updated.user || updated);
            setProfileMsg("Profile updated successfully!");
            setEditing(false);
            setTimeout(() => setProfileMsg(""), 3000);
        } catch (err) {
            setProfileErr(err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPwErr("");
        setPwMsg("");
        if (!pwForm.currentPassword || !pwForm.newPassword) {
            setPwErr("All password fields are required");
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwErr("New password must be at least 6 characters");
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwErr("Passwords do not match");
            return;
        }
        setPwSaving(true);
        try {
            await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token);
            setPwMsg("Password changed successfully!");
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPwSection(false);
            setTimeout(() => setPwMsg(""), 3000);
        } catch (err) {
            setPwErr(err.message || "Failed to change password");
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Profile Header Card */}
            <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {/* Cover gradient */}
                <div className="h-36 relative" style={{ background: "linear-gradient(135deg, #0a66c2 0%, #1e1b4b 40%, #7c3aed 70%, #0891b2 100%)" }}>
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)" }} />
                    <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff" }}>
                        <Crown size={12} /> Super Admin
                    </div>
                </div>

                {/* Profile info */}
                <div className="relative px-6 pb-6" style={{ background: "var(--surface)" }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                        <div className="relative">
                            <img src={avatar(user)} alt={user?.name}
                                className="h-24 w-24 rounded-2xl object-cover border-4 shadow-xl"
                                style={{ borderColor: "var(--surface)" }} />
                            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg flex items-center justify-center shadow-md"
                                style={{ background: "var(--primary)", color: "#fff" }}>
                                <Shield size={13} />
                            </div>
                        </div>
                        <div className="flex-1 pt-2">
                            <h2 className="text-[22px] font-black" style={{ color: "var(--text-main)", letterSpacing: "-0.01em" }}>{user?.name}</h2>
                            <p className="text-[14px] font-medium" style={{ color: "var(--primary)" }}>@{user?.username}</p>
                            {user?.bio && <p className="text-[13px] mt-1" style={{ color: "var(--text-sub)" }}>{user.bio}</p>}
                        </div>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all hover:scale-[1.02]"
                            style={{
                                background: editing ? "var(--error-bg)" : "var(--primary-subtle)",
                                color: editing ? "var(--error)" : "var(--primary)",
                                border: `1px solid ${editing ? "rgba(204,16,22,0.2)" : "rgba(10,102,194,0.2)"}`
                            }}
                        >
                            {editing ? "Cancel" : <><Settings size={13} /> Edit Profile</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success / Error messages */}
            <AnimatePresence>
                {profileMsg && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold"
                        style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid rgba(5,118,66,0.15)" }}>
                        <Check size={14} /> {profileMsg}
                    </motion.div>
                )}
                {pwMsg && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold"
                        style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid rgba(5,118,66,0.15)" }}>
                        <Check size={14} /> {pwMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Profile Details */}
                <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--primary-subtle)" }}>
                            <UserIcon size={16} style={{ color: "var(--primary)" }} />
                        </div>
                        <h3 className="text-[15px] font-bold" style={{ color: "var(--text-main)" }}>Profile Details</h3>
                    </div>

                    {editing ? (
                        <div className="space-y-3.5">
                            {[
                                { key: "name", label: "Full Name", icon: UserIcon, placeholder: "Your name" },
                                { key: "bio", label: "Bio", icon: Sparkles, placeholder: "Short bio about yourself" },
                                { key: "college", label: "College", icon: GraduationCap, placeholder: "Your college" },
                                { key: "location", label: "Location", icon: Calendar, placeholder: "City, Country" },
                            ].map(({ key, label, icon: Ic, placeholder }) => (
                                <div key={key}>
                                    <label className="text-[12px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>{label}</label>
                                    <div className="relative">
                                        <Ic size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                        <input
                                            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all focus:ring-2"
                                            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)", "--tw-ring-color": "var(--primary-glow)" }}
                                            placeholder={placeholder}
                                            value={form[key]}
                                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}
                            {profileErr && <p className="text-[12px] font-medium" style={{ color: "var(--error)" }}>{profileErr}</p>}
                            <button onClick={handleSaveProfile} disabled={saving}
                                className="w-full rounded-xl py-2.5 text-[13px] font-semibold mt-1 transition-all hover:opacity-90"
                                style={{ background: "var(--primary)", color: "#fff" }}>
                                {saving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Save Changes"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[
                                { icon: Mail, label: "Email", value: user?.email },
                                { icon: UserIcon, label: "Username", value: `@${user?.username}` },
                                { icon: GraduationCap, label: "College", value: user?.college || "Not set" },
                                { icon: Calendar, label: "Member Since", value: formatDate(user?.createdAt) },
                                { icon: Shield, label: "Role", value: user?.role?.toUpperCase(), highlight: true },
                            ].map(({ icon: Ic, label, value, highlight }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                        style={{ background: highlight ? "var(--primary-subtle)" : "var(--surface-soft)" }}>
                                        <Ic size={14} style={{ color: highlight ? "var(--primary)" : "var(--text-muted)" }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-[13px] font-semibold truncate" style={{ color: highlight ? "var(--primary)" : "var(--text-main)" }}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Password Change + Quick Stats */}
                <div className="space-y-5">
                    <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--warning-bg)" }}>
                                    <Lock size={16} style={{ color: "var(--warning)" }} />
                                </div>
                                <h3 className="text-[15px] font-bold" style={{ color: "var(--text-main)" }}>Security</h3>
                            </div>
                            <button onClick={() => { setShowPwSection(!showPwSection); setPwErr(""); setPwMsg(""); }}
                                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                style={{ background: showPwSection ? "var(--error-bg)" : "var(--primary-subtle)", color: showPwSection ? "var(--error)" : "var(--primary)" }}>
                                {showPwSection ? "Cancel" : "Change Password"}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showPwSection ? (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden">
                                    {/* Current password */}
                                    <div>
                                        <label className="text-[12px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Current Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                            <input
                                                type={showCurrent ? "text" : "password"}
                                                className="w-full rounded-xl py-2.5 pl-9 pr-10 text-[13px] outline-none transition-all focus:ring-2"
                                                style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)", "--tw-ring-color": "var(--primary-glow)" }}
                                                placeholder="Enter current password"
                                                value={pwForm.currentPassword}
                                                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                            />
                                            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                                                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* New password */}
                                    <div>
                                        <label className="text-[12px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>New Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                            <input
                                                type={showNew ? "text" : "password"}
                                                className="w-full rounded-xl py-2.5 pl-9 pr-10 text-[13px] outline-none transition-all focus:ring-2"
                                                style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)", "--tw-ring-color": "var(--primary-glow)" }}
                                                placeholder="Enter new password (min 6 chars)"
                                                value={pwForm.newPassword}
                                                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                            />
                                            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                                                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Confirm password */}
                                    <div>
                                        <label className="text-[12px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                            <input
                                                type="password"
                                                className="w-full rounded-xl py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all focus:ring-2"
                                                style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)", "--tw-ring-color": "var(--primary-glow)" }}
                                                placeholder="Confirm new password"
                                                value={pwForm.confirmPassword}
                                                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {pwErr && <p className="text-[12px] font-medium" style={{ color: "var(--error)" }}>{pwErr}</p>}
                                    <button onClick={handleChangePassword} disabled={pwSaving}
                                        className="w-full rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:opacity-90"
                                        style={{ background: "var(--warning)", color: "#fff" }}>
                                        {pwSaving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Update Password"}
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-soft)" }}>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--success-bg)" }}>
                                        <Check size={14} style={{ color: "var(--success)" }} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>Password Protected</p>
                                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Click "Change Password" to update your password</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Account quick stats */}
                    <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(124,58,237,0.1)" }}>
                                <Zap size={16} style={{ color: "#7c3aed" }} />
                            </div>
                            <h3 className="text-[15px] font-bold" style={{ color: "var(--text-main)" }}>Account Info</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Posts", value: user?.postsCount ?? user?.posts ?? 0, color: "var(--primary)" },
                                { label: "Followers", value: user?.followersCount ?? user?.followers?.length ?? 0, color: "#7c3aed" },
                                { label: "Following", value: user?.followingCount ?? user?.following?.length ?? 0, color: "#0891b2" },
                                { label: "Status", value: user?.isVerified ? "Verified" : "Active", color: "var(--success)" },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface-soft)" }}>
                                    <p className="text-[18px] font-black" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
                                    <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "communities", label: "Communities", icon: Globe },
];

export default function AdminPanel() {
    const navigate = useNavigate();
    const { user, token, updateUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("overview");

    // Overview
    const [stats, setStats] = useState(null);
    const [chart, setChart] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Users tab
    const [users, setUsers] = useState([]);
    const [userTotal, setUserTotal] = useState(0);
    const [userPage, setUserPage] = useState(1);
    const [userPages, setUserPages] = useState(1);
    const [userSearch, setUserSearch] = useState("");
    const [userSearchInput, setUserSearchInput] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Posts tab
    const [posts, setPosts] = useState([]);
    const [postTotal, setPostTotal] = useState(0);
    const [postPage, setPostPage] = useState(1);
    const [postPages, setPostPages] = useState(1);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Comments tab
    const [comments, setComments] = useState([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [commentPage, setCommentPage] = useState(1);
    const [commentPages, setCommentPages] = useState(1);
    const [commentSearch, setCommentSearch] = useState("");
    const [commentSearchInput, setCommentSearchInput] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    // Activity tab
    const [activity, setActivity] = useState([]);
    const [activityTotal, setActivityTotal] = useState(0);
    const [activityPage, setActivityPage] = useState(1);
    const [activityPages, setActivityPages] = useState(1);
    const [loadingActivity, setLoadingActivity] = useState(false);

    // Communities tab
    const [communities, setCommunities] = useState([]);
    const [communityTotal, setCommunityTotal] = useState(0);
    const [communityPage, setCommunityPage] = useState(1);
    const [communityPages, setCommunityPages] = useState(1);
    const [communitySearch, setCommunitySearch] = useState("");
    const [communitySearchInput, setCommunitySearchInput] = useState("");
    const [loadingCommunities, setLoadingCommunities] = useState(false);
    const [featuredLoading, setFeaturedLoading] = useState(null);

    // Modals
    const [confirm, setConfirm] = useState(null); // { type: "user"|"post"|"comment"|"community", id, name }
    const [roleLoading, setRoleLoading] = useState(null); // userId being updated
    const [banLoading, setBanLoading] = useState(null); // userId for ban toggle
    const [toast, setToast] = useState("");

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    // Guard — admin only
    useEffect(() => {
        if (user && user.role !== "admin") {
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    // Load overview stats
    const loadStats = useCallback(async () => {
        if (!token) return;
        setLoadingStats(true);
        try {
            const data = await getAdminDashboard(token);
            setStats(data.stats);
            setChart(data.chart || []);
        } catch {
            // ignore
        } finally {
            setLoadingStats(false);
        }
    }, [token]);

    // Load users
    const loadUsers = useCallback(async (page = 1, q = "") => {
        if (!token) return;
        setLoadingUsers(true);
        try {
            const data = await getAdminUsers(token, { page, q, limit: 15 });
            setUsers(data.users);
            setUserTotal(data.total);
            setUserPage(data.page);
            setUserPages(data.pages);
        } catch {
            // ignore
        } finally {
            setLoadingUsers(false);
        }
    }, [token]);

    // Load posts
    const loadPosts = useCallback(async (page = 1) => {
        if (!token) return;
        setLoadingPosts(true);
        try {
            const data = await getAdminPosts(token, { page, limit: 15 });
            setPosts(data.posts);
            setPostTotal(data.total);
            setPostPage(data.page);
            setPostPages(data.pages);
        } catch {
            // ignore
        } finally {
            setLoadingPosts(false);
        }
    }, [token]);

    // Load comments
    const loadComments = useCallback(async (page = 1, q = "") => {
        if (!token) return;
        setLoadingComments(true);
        try {
            const data = await getAdminComments(token, { page, q, limit: 20 });
            setComments(data.comments);
            setCommentTotal(data.total);
            setCommentPage(data.page);
            setCommentPages(data.pages);
        } catch {
            // ignore
        } finally {
            setLoadingComments(false);
        }
    }, [token]);

    // Load activity
    const loadActivity = useCallback(async (page = 1) => {
        if (!token) return;
        setLoadingActivity(true);
        try {
            const data = await getAdminActivity(token, { page, limit: 30 });
            setActivity(data.events || data.activity || []);
            setActivityTotal(data.total || 0);
            setActivityPage(data.page || 1);
            setActivityPages(data.pages || 1);
        } catch {
            // ignore
        } finally {
            setLoadingActivity(false);
        }
    }, [token]);

    // Load communities
    const loadCommunities = useCallback(async (page = 1, q = "") => {
        if (!token) return;
        setLoadingCommunities(true);
        try {
            const data = await getAdminCommunities(token, { page, q, limit: 15 });
            setCommunities(data.communities);
            setCommunityTotal(data.total);
            setCommunityPage(data.page);
            setCommunityPages(data.pages);
        } catch {
            // ignore
        } finally {
            setLoadingCommunities(false);
        }
    }, [token]);

    useEffect(() => { loadStats(); }, [loadStats]);
    useEffect(() => { if (activeTab === "users") loadUsers(1, userSearch); }, [activeTab]); // eslint-disable-line
    useEffect(() => { if (activeTab === "posts") loadPosts(1); }, [activeTab]); // eslint-disable-line
    useEffect(() => { if (activeTab === "comments") loadComments(1, commentSearch); }, [activeTab]); // eslint-disable-line
    useEffect(() => { if (activeTab === "activity") loadActivity(1); }, [activeTab]); // eslint-disable-line
    useEffect(() => { if (activeTab === "communities") loadCommunities(1, communitySearch); }, [activeTab]); // eslint-disable-line

    // Real-time socket updates for admin panel
    useEffect(() => {
        if (!token || !user?._id) return;
        const socket = connectSocket(token, "admin");
        if (!socket) return;

        const refresh = () => {
            loadStats();
            if (activeTab === "users") loadUsers(userPage, userSearch);
            if (activeTab === "posts") loadPosts(postPage);
            if (activeTab === "comments") loadComments(commentPage, commentSearch);
            if (activeTab === "activity") loadActivity(activityPage);
            if (activeTab === "communities") loadCommunities(communityPage, communitySearch);
        };

        socket.on("post:new", refresh);
        socket.on("post:updated", refresh);
        socket.on("post:deleted", refresh);
        socket.on("comment:new", refresh);
        socket.on("comment:deleted", refresh);

        return () => {
            socket.off("post:new", refresh);
            socket.off("post:updated", refresh);
            socket.off("post:deleted", refresh);
            socket.off("comment:new", refresh);
            socket.off("comment:deleted", refresh);
            disconnectSocket("admin");
        };
    }, [token, user?._id, activeTab, userPage, userSearch, postPage, commentPage, commentSearch, activityPage, communityPage, communitySearch]); // eslint-disable-line

    // Role toggle
    const handleRoleToggle = async (targetUser) => {
        const newRole = targetUser.role === "admin" ? "student" : "admin";
        setRoleLoading(targetUser._id);
        try {
            await setUserRole(targetUser._id, newRole, token);
            setUsers((prev) => prev.map((u) => u._id === targetUser._id ? { ...u, role: newRole } : u));
            showToast(`${targetUser.name} is now ${newRole}`);
        } catch (err) {
            showToast(err.message || "Failed to update role");
        } finally {
            setRoleLoading(null);
        }
    };

    // Delete user
    const handleDeleteUser = async () => {
        if (!confirm) return;
        try {
            await deleteAdminUser(confirm.id, token);
            setUsers((prev) => prev.filter((u) => u._id !== confirm.id));
            setUserTotal((t) => t - 1);
            showToast(`${confirm.name} deleted`);
        } catch (err) {
            showToast(err.message || "Failed to delete user");
        } finally {
            setConfirm(null);
        }
    };

    // Delete post
    const handleDeletePost = async () => {
        if (!confirm) return;
        try {
            await deleteAdminPost(confirm.id, token);
            setPosts((prev) => prev.filter((p) => p._id !== confirm.id));
            setPostTotal((t) => t - 1);
            showToast("Post deleted");
        } catch (err) {
            showToast(err.message || "Failed to delete post");
        } finally {
            setConfirm(null);
        }
    };

    // Delete comment
    const handleDeleteComment = async () => {
        if (!confirm) return;
        try {
            await deleteAdminComment(confirm.id, token);
            setComments((prev) => prev.filter((c) => c._id !== confirm.id));
            setCommentTotal((t) => t - 1);
            showToast("Comment deleted");
        } catch (err) {
            showToast(err.message || "Failed to delete comment");
        } finally {
            setConfirm(null);
        }
    };

    // Delete community
    const handleDeleteCommunity = async () => {
        if (!confirm) return;
        try {
            await deleteAdminCommunity(confirm.id, token);
            setCommunities((prev) => prev.filter((c) => c._id !== confirm.id));
            setCommunityTotal((t) => t - 1);
            showToast(`Community "${confirm.name}" deleted`);
        } catch (err) {
            showToast(err.message || "Failed to delete community");
        } finally {
            setConfirm(null);
        }
    };

    // Toggle featured
    const handleToggleFeatured = async (community) => {
        setFeaturedLoading(community._id);
        try {
            const data = await toggleCommunityFeatured(community._id, token);
            setCommunities((prev) => prev.map((c) => c._id === community._id ? { ...c, featured: data.featured } : c));
            showToast(data.message);
        } catch (err) {
            showToast(err.message || "Failed to toggle featured");
        } finally {
            setFeaturedLoading(null);
        }
    };

    // Ban/unban user
    const handleBanToggle = async (targetUser) => {
        setBanLoading(targetUser._id);
        try {
            const data = await toggleBanUser(targetUser._id, token);
            setUsers((prev) => prev.map((u) => u._id === targetUser._id ? { ...u, isBanned: data.user.isBanned } : u));
            showToast(data.message);
        } catch (err) {
            showToast(err.message || "Failed to update ban status");
        } finally {
            setBanLoading(null);
        }
    };

    const confirmHandler = {
        user: handleDeleteUser,
        post: handleDeletePost,
        comment: handleDeleteComment,
        community: handleDeleteCommunity,
    };

    if (!user) return null;

    return (
        <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
            <div className="mx-auto max-w-7xl px-2 pb-10 pt-6">
                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-[13px] font-semibold shadow-lg flex items-center gap-2"
                            style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid rgba(5,118,66,0.2)" }}
                        >
                            <Check size={14} />{toast}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Confirm modal */}
                <AnimatePresence>
                    {confirm && (
                        <ConfirmModal
                            message={
                                confirm.type === "user" ? `Delete account for "${confirm.name}"? All their posts, comments and data will be removed. This cannot be undone.` :
                                    confirm.type === "post" ? `Delete this post by "${confirm.name}"? All comments on it will also be removed.` :
                                        confirm.type === "community" ? `Delete community "${confirm.name}"? All posts and comments in it will also be removed. This cannot be undone.` :
                                            `Delete this comment by "${confirm.name}"?`
                            }
                            onConfirm={confirmHandler[confirm.type]}
                            onCancel={() => setConfirm(null)}
                        />
                    )}
                </AnimatePresence>

                {/* ── PREMIUM HEADER ── */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-2xl overflow-hidden mb-6"
                    style={{ border: "1px solid var(--border)" }}
                >
                    {/* Gradient background */}
                    <div className="relative px-6 py-5" style={{
                        background: theme === "dark"
                            ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 60%, #1e3a5f 100%)"
                            : "linear-gradient(135deg, #0a66c2 0%, #1e1b4b 35%, #4338ca 60%, #0891b2 100%)"
                    }}>
                        {/* Floating decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "#7c3aed" }} />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: "#0891b2" }} />

                        <div className="relative z-10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg"
                                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                                    <Shield size={22} style={{ color: "#fff" }} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-[22px] font-black text-white tracking-tight">Admin Command Center</h1>
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#e0e7ff" }}>
                                            <Sparkles size={10} /> PRO
                                        </span>
                                    </div>
                                    <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                                        Full platform control · Welcome back, <span className="font-semibold text-white">{user.name}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all hover:scale-[1.03]"
                                    style={{
                                        background: activeTab === "profile" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                                        backdropFilter: "blur(8px)", color: "#fff",
                                        border: activeTab === "profile" ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.15)"
                                    }}
                                    title="Admin Profile"
                                >
                                    <img src={avatar(user)} alt={user?.name} className="h-5 w-5 rounded-md object-cover" />
                                    Profile
                                </button>
                                <button
                                    onClick={() => {
                                        loadStats();
                                        if (activeTab === "users") loadUsers(userPage, userSearch);
                                        if (activeTab === "posts") loadPosts(postPage);
                                        if (activeTab === "comments") loadComments(commentPage, commentSearch);
                                        if (activeTab === "activity") loadActivity(activityPage);
                                        if (activeTab === "communities") loadCommunities(communityPage, communitySearch);
                                    }}
                                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all hover:scale-[1.03]"
                                    style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
                                >
                                    <RefreshCw size={13} /> Refresh
                                </button>
                                <button
                                    onClick={() => { logout(); navigate("/login"); }}
                                    className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all hover:scale-[1.03]"
                                    style={{ background: "rgba(229,72,77,0.2)", backdropFilter: "blur(8px)", color: "#fca5a5", border: "1px solid rgba(229,72,77,0.3)" }}
                                    title="Logout"
                                >
                                    <LogOut size={13} /> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── TAB BAR ── */}
                <div className="mb-6 rounded-2xl p-1.5 overflow-x-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div className="flex gap-1 min-w-max">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className="relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-[13px] font-semibold transition-all duration-200"
                                style={activeTab === id
                                    ? {
                                        background: "var(--primary)",
                                        color: "#fff",
                                        boxShadow: "0 4px 14px rgba(10,102,194,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                                    }
                                    : { background: "transparent", color: "var(--text-muted)" }}
                            >
                                <Icon size={14} />{label}
                                {activeTab === id && (
                                    <motion.div layoutId="activeTabIndicator" className="absolute inset-0 rounded-xl -z-10"
                                        style={{ background: "var(--primary)" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── OVERVIEW TAB ── */}
                <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            {loadingStats ? (
                                <div className="flex justify-center py-16">
                                    <RefreshCw size={22} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                </div>
                            ) : (
                                <>
                                    {/* Stat grid */}
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="var(--primary)" sub={`${stats?.verifiedUsers} verified`} />
                                        <StatCard icon={FileText} label="Total Posts" value={stats?.totalPosts} color="#7c3aed" />
                                        <StatCard icon={MessageSquare} label="Comments" value={stats?.totalComments} color="#0284c7" />
                                        <StatCard icon={Heart} label="Total Likes" value={stats?.totalLikes} color="#e11d48" />
                                        <StatCard icon={Globe} label="Communities" value={stats?.totalCommunities} color="var(--success)" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <StatCard icon={Bookmark} label="Total Saves" value={stats?.totalSaves} color="#f59e0b" />
                                        <StatCard icon={Bell} label="Notifications" value={stats?.totalNotifications} color="#8b5cf6" />
                                        <StatCard icon={MessageSquare} label="Messages Sent" value={stats?.totalMessages} color="#0891b2" />
                                        <StatCard icon={Shield} label="Admin Accounts" value={stats?.adminCount} color="#dc2626" sub={`${stats?.totalUsers - (stats?.adminCount || 0)} students`} />
                                    </div>

                                    {/* Engagement rate */}
                                    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: "var(--primary)" }} />
                                        <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--primary-subtle)" }}>
                                                    <TrendingUp size={16} style={{ color: "var(--primary)" }} />
                                                </div>
                                                <span className="text-[14px] font-bold" style={{ color: "var(--text-main)" }}>Platform Engagement Rate</span>
                                            </div>
                                            <span className="text-[22px] font-black display-title" style={{ color: "var(--primary)" }}>{stats?.engagementRate ?? "—"}</span>
                                        </div>
                                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                                            (Total posts + comments) ÷ Total users. Higher = more active community.
                                        </p>
                                    </div>

                                    {/* 7-day charts */}
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        {/* User signup growth — AreaChart */}
                                        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--success-bg)" }}>
                                                    <UserPlus size={14} style={{ color: "var(--success)" }} />
                                                </div>
                                                <span className="text-[13px] font-bold" style={{ color: "var(--text-main)" }}>User Signup Growth — 7 Days</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <AreaChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip
                                                        contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--text-main)" }}
                                                        labelStyle={{ color: "var(--text-sub)", fontWeight: 600 }}
                                                        cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                                                    />
                                                    <Area type="monotone" dataKey="users" name="New Users" stroke="var(--success)" strokeWidth={2} fill="url(#gradUsers)" dot={{ r: 3, fill: "var(--success)" }} activeDot={{ r: 5 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Posts & comments activity — BarChart */}
                                        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--primary-subtle)" }}>
                                                    <Activity size={14} style={{ color: "var(--primary)" }} />
                                                </div>
                                                <span className="text-[13px] font-bold" style={{ color: "var(--text-main)" }}>Posts & Comments Activity — 7 Days</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <BarChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10} barGap={3}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip
                                                        contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--text-main)" }}
                                                        labelStyle={{ color: "var(--text-sub)", fontWeight: 600 }}
                                                        cursor={{ fill: "var(--surface-hover)" }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
                                                    <Bar dataKey="posts" name="Posts" fill="var(--primary)" radius={[3, 3, 0, 0]} opacity={0.85} />
                                                    <Bar dataKey="comments" name="Comments" fill="#7c3aed" radius={[3, 3, 0, 0]} opacity={0.85} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ── USERS TAB ── */}
                    {activeTab === "users" && (
                        <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {/* Search bar */}
                            <div className="mb-4 flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                    <input
                                        className="w-full rounded-xl py-2.5 pl-9 pr-3 text-[13px] outline-none"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                        placeholder="Search by name, username, or email…"
                                        value={userSearchInput}
                                        onChange={(e) => setUserSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setUserSearch(userSearchInput);
                                                loadUsers(1, userSearchInput);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => { setUserSearch(userSearchInput); loadUsers(1, userSearchInput); }}
                                    className="rounded-xl px-4 py-2.5 text-[13px] font-semibold"
                                    style={{ background: "var(--primary)", color: "#fff" }}
                                >
                                    Search
                                </button>
                            </div>

                            <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {/* Table header */}
                                <div className="grid grid-cols-[2fr_1.5fr_0.8fr_0.6fr_0.6fr_0.6fr_1fr] gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
                                    style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface-soft)" }}>
                                    <span>User</span>
                                    <span>Email</span>
                                    <span>College</span>
                                    <span>Posts</span>
                                    <span>Followers</span>
                                    <span>Joined</span>
                                    <span>Actions</span>
                                </div>

                                {loadingUsers ? (
                                    <div className="flex justify-center py-12">
                                        <RefreshCw size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="py-12 text-center text-[14px]" style={{ color: "var(--text-muted)" }}>No users found.</div>
                                ) : (
                                    users.map((u) => (
                                        <div key={u._id} className="grid grid-cols-[2fr_1.5fr_0.8fr_0.6fr_0.6fr_0.6fr_1fr] gap-3 items-center px-4 py-3"
                                            style={{ borderBottom: "1px solid var(--border)" }}>
                                            {/* User info */}
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <img
                                                    src={u.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0a66c2&color=fff&bold=true&size=60`}
                                                    className="h-8 w-8 rounded-lg object-cover shrink-0"
                                                    alt={u.name}
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{u.name}</p>
                                                    <p className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                                                </div>
                                                {u.role === "admin" && (
                                                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                                        style={{ background: "rgba(10,102,194,0.12)", color: "var(--primary)" }}>
                                                        Admin
                                                    </span>
                                                )}
                                                {u.isBanned && (
                                                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                                        style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626" }}>
                                                        Banned
                                                    </span>
                                                )}
                                            </div>

                                            <p className="truncate text-[12px]" style={{ color: "var(--text-sub)" }}>{u.email}</p>
                                            <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{u.college || "—"}</p>
                                            <p className="text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{u.posts}</p>
                                            <p className="text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{u.followers}</p>
                                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{timeAgo(u.createdAt)}</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleRoleToggle(u)}
                                                    disabled={roleLoading === u._id}
                                                    title={u.role === "admin" ? "Revoke admin" : "Grant admin"}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                                    style={u.role === "admin"
                                                        ? { background: "rgba(10,102,194,0.10)", color: "var(--primary)" }
                                                        : { background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                                >
                                                    {roleLoading === u._id
                                                        ? <RefreshCw size={11} className="animate-spin" />
                                                        : u.role === "admin" ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => handleBanToggle(u)}
                                                    disabled={banLoading === u._id}
                                                    title={u.isBanned ? "Unban user" : "Ban user"}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                                    style={u.isBanned
                                                        ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                                                        : { background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                                >
                                                    {banLoading === u._id
                                                        ? <RefreshCw size={11} className="animate-spin" />
                                                        : <Ban size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => setConfirm({ type: "user", id: u._id, name: u.name })}
                                                    title="Delete user"
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                                    style={{ background: "rgba(204,16,22,0.08)", color: "var(--error)" }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                                    Showing {users.length} of {userTotal} users
                                </p>
                                <div className="flex items-center gap-2">
                                    <button disabled={userPage <= 1} onClick={() => loadUsers(userPage - 1, userSearch)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: userPage <= 1 ? "var(--text-faint)" : "var(--text-main)" }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-sub)" }}>
                                        {userPage} / {userPages}
                                    </span>
                                    <button disabled={userPage >= userPages} onClick={() => loadUsers(userPage + 1, userSearch)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: userPage >= userPages ? "var(--text-faint)" : "var(--text-main)" }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── ACTIVITY TAB ── */}
                    {activeTab === "activity" && (
                        <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {/* Header */}
                                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                                    <div className="flex items-center gap-2">
                                        <Activity size={15} style={{ color: "var(--primary)" }} />
                                        <span className="text-[14px] font-bold" style={{ color: "var(--text-main)" }}>Live Platform Activity</span>
                                    </div>
                                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{activityTotal.toLocaleString()} events total</span>
                                </div>

                                {loadingActivity ? (
                                    <div className="flex justify-center py-16">
                                        <RefreshCw size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                    </div>
                                ) : activity.length === 0 ? (
                                    <div className="py-14 text-center" style={{ color: "var(--text-muted)" }}>No activity yet.</div>
                                ) : (
                                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                                        {activity.map((ev, i) => {
                                            const typeMap = {
                                                signup: { label: "Signed up", color: "var(--success)", bg: "var(--success-bg)" },
                                                post: { label: "Posted", color: "var(--primary)", bg: "var(--primary-subtle)" },
                                                comment: { label: "Commented", color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
                                                like: { label: "Liked a post", color: "#e11d48", bg: "rgba(225,29,72,0.10)" },
                                                join: { label: "Joined community", color: "var(--success)", bg: "var(--success-bg)" },
                                                message: { label: "Sent a message", color: "#0891b2", bg: "rgba(8,145,178,0.10)" },
                                            };
                                            const t = typeMap[ev.type] || { label: ev.type, color: "var(--text-sub)", bg: "var(--surface-soft)" };
                                            // For signup events data is flat; for post/comment it's under ev.author
                                            const actor = ev.type === "signup"
                                                ? { name: ev.name, username: ev.username, profilePhoto: ev.photo }
                                                : ev.author;
                                            const snippet = ev.type === "post" ? ev.content
                                                : ev.type === "comment" ? ev.text
                                                    : null;
                                            return (
                                                <div key={ev.id || i} className="flex items-center gap-4 px-5 py-3">
                                                    <img src={avatar(actor)} className="h-8 w-8 rounded-full object-cover shrink-0" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
                                                            <span className="font-semibold">{actor?.name || actor?.username || "Unknown"}</span>
                                                            {" "}
                                                            <span style={{ color: "var(--text-sub)" }}>{t.label}</span>
                                                        </p>
                                                        {snippet && (
                                                            <p className="truncate text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{snippet}</p>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                                        style={{ background: t.bg, color: t.color }}>
                                                        {t.label}
                                                    </span>
                                                    <span className="shrink-0 text-[11px] w-16 text-right" style={{ color: "var(--text-faint)" }}>{timeAgo(ev.createdAt)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <Pagination
                                page={activityPage} pages={activityPages}
                                total={activityTotal} showing={activity.length}
                                onPrev={() => loadActivity(activityPage - 1)}
                                onNext={() => loadActivity(activityPage + 1)}
                            />
                        </motion.div>
                    )}

                    {/* ── POSTS TAB ── */}
                    {activeTab === "posts" && (
                        <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <div className="grid grid-cols-[2.5fr_1.2fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr_0.6fr] gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
                                    style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface-soft)" }}>
                                    <span>Content</span>
                                    <span>Author</span>
                                    <span>Likes</span>
                                    <span>Comments</span>
                                    <span>Saves</span>
                                    <span>Downvotes</span>
                                    <span>Posted</span>
                                    <span>Actions</span>
                                </div>

                                {loadingPosts ? (
                                    <div className="flex justify-center py-12">
                                        <RefreshCw size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="py-12 text-center text-[14px]" style={{ color: "var(--text-muted)" }}>No posts yet.</div>
                                ) : (
                                    posts.map((post) => (
                                        <div key={post._id} className="grid grid-cols-[2.5fr_1.2fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr_0.6fr] gap-3 items-center px-4 py-3"
                                            style={{ borderBottom: "1px solid var(--border)" }}>
                                            {/* Content */}
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px]" style={{ color: "var(--text-main)" }}>
                                                    {post.content || <em style={{ color: "var(--text-faint)" }}>Image/media only</em>}
                                                </p>
                                                {post.tags?.length > 0 && (
                                                    <p className="truncate text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                        {post.tags.map((t) => `#${t}`).join(" ")}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Author */}
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <img
                                                    src={post.author?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || "U")}&background=0a66c2&color=fff&bold=true&size=40`}
                                                    className="h-6 w-6 rounded-md object-cover shrink-0"
                                                    alt={post.author?.name}
                                                />
                                                <span className="truncate text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>@{post.author?.username}</span>
                                            </div>

                                            <p className="text-[13px] font-semibold" style={{ color: "#e11d48" }}>{post.likes}</p>
                                            <p className="text-[13px] font-semibold" style={{ color: "#0284c7" }}>{post.commentsCount}</p>
                                            <p className="text-[13px] font-semibold" style={{ color: "#f59e0b" }}>{post.saves}</p>
                                            <p className="text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>{post.downvotes}</p>
                                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{timeAgo(post.createdAt)}</p>

                                            <button
                                                onClick={() => setConfirm({ type: "post", id: post._id, name: post.author?.name || "Unknown" })}
                                                title="Delete post"
                                                className="flex h-7 w-7 items-center justify-center rounded-lg"
                                                style={{ background: "rgba(204,16,22,0.08)", color: "var(--error)" }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                                    Showing {posts.length} of {postTotal} posts
                                </p>
                                <div className="flex items-center gap-2">
                                    <button disabled={postPage <= 1} onClick={() => loadPosts(postPage - 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: postPage <= 1 ? "var(--text-faint)" : "var(--text-main)" }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-sub)" }}>
                                        {postPage} / {postPages}
                                    </span>
                                    <button disabled={postPage >= postPages} onClick={() => loadPosts(postPage + 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: postPage >= postPages ? "var(--text-faint)" : "var(--text-main)" }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* ── COMMENTS TAB ── */}
                    {activeTab === "comments" && (
                        <motion.div key="comments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <TableSearchBar
                                value={commentSearchInput}
                                onChange={setCommentSearchInput}
                                onSearch={(q) => { setCommentSearch(q); loadComments(1, q); }}
                                placeholder="Search comments by content or author…"
                            />

                            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {/* Table header */}
                                <div className="grid grid-cols-[3fr_1.2fr_1.4fr_0.6fr_0.5fr] gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
                                    style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface-soft)" }}>
                                    <span>Comment</span>
                                    <span>Author</span>
                                    <span>On Post</span>
                                    <span>Posted</span>
                                    <span>Delete</span>
                                </div>

                                {loadingComments ? (
                                    <div className="flex justify-center py-12">
                                        <RefreshCw size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="py-12 text-center text-[14px]" style={{ color: "var(--text-muted)" }}>No comments found.</div>
                                ) : (
                                    comments.map((c) => (
                                        <div key={c._id} className="grid grid-cols-[3fr_1.2fr_1.4fr_0.6fr_0.5fr] gap-3 items-center px-4 py-3"
                                            style={{ borderBottom: "1px solid var(--border)" }}>
                                            {/* Comment text */}
                                            <p className="truncate text-[13px]" style={{ color: "var(--text-main)" }}>
                                                {c.content || c.text || <em style={{ color: "var(--text-faint)" }}>Empty</em>}
                                            </p>

                                            {/* Author */}
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <img src={avatar(c.author)} className="h-6 w-6 rounded-full object-cover shrink-0" alt="" />
                                                <span className="truncate text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>
                                                    @{c.author?.username || "unknown"}
                                                </span>
                                            </div>

                                            {/* Post snippet */}
                                            <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>
                                                {c.postSnip || "—"}
                                            </p>

                                            <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{timeAgo(c.createdAt)}</p>

                                            <button
                                                onClick={() => setConfirm({ type: "comment", id: c._id, name: c.author?.name || "Unknown" })}
                                                title="Delete comment"
                                                className="flex h-7 w-7 items-center justify-center rounded-lg"
                                                style={{ background: "rgba(204,16,22,0.08)", color: "var(--error)" }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Pagination
                                page={commentPage} pages={commentPages}
                                total={commentTotal} showing={comments.length}
                                onPrev={() => loadComments(commentPage - 1, commentSearch)}
                                onNext={() => loadComments(commentPage + 1, commentSearch)}
                            />
                        </motion.div>
                    )}

                    {/* ── COMMUNITIES TAB ── */}
                    {activeTab === "communities" && (
                        <motion.div key="communities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {/* Search bar */}
                            <div className="mb-4 flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                                    <input
                                        className="w-full rounded-xl py-2.5 pl-9 pr-3 text-[13px] outline-none"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                        placeholder="Search by name, slug, or category…"
                                        value={communitySearchInput}
                                        onChange={(e) => setCommunitySearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setCommunitySearch(communitySearchInput);
                                                loadCommunities(1, communitySearchInput);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => { setCommunitySearch(communitySearchInput); loadCommunities(1, communitySearchInput); }}
                                    className="rounded-xl px-4 py-2.5 text-[13px] font-semibold"
                                    style={{ background: "var(--primary)", color: "#fff" }}
                                >
                                    Search
                                </button>
                            </div>

                            <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {/* Table header */}
                                <div className="grid grid-cols-[2fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_1fr] gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
                                    style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface-soft)" }}>
                                    <span>Community</span>
                                    <span>Category</span>
                                    <span>Members</span>
                                    <span>Posts</span>
                                    <span>Featured</span>
                                    <span>Created</span>
                                    <span>Actions</span>
                                </div>

                                {loadingCommunities ? (
                                    <div className="flex justify-center py-12">
                                        <RefreshCw size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                    </div>
                                ) : communities.length === 0 ? (
                                    <div className="py-12 text-center text-[14px]" style={{ color: "var(--text-muted)" }}>No communities found.</div>
                                ) : (
                                    communities.map((c) => (
                                        <div key={c._id} className="grid grid-cols-[2fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_1fr] gap-3 items-center px-4 py-3"
                                            style={{ borderBottom: "1px solid var(--border)" }}>
                                            {/* Community info */}
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{c.name}</p>
                                                <p className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>/{c.slug}</p>
                                            </div>

                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold w-fit"
                                                style={{ background: "var(--primary-subtle)", color: "var(--primary)" }}>
                                                {c.category}
                                            </span>

                                            <p className="text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{c.membersCount}</p>
                                            <p className="text-[13px] font-semibold" style={{ color: "var(--text-main)" }}>{c.postsCount}</p>

                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold w-fit"
                                                style={c.featured
                                                    ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                                                    : { background: "var(--surface-soft)", color: "var(--text-muted)" }}>
                                                {c.featured ? "Featured" : "Normal"}
                                            </span>

                                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{timeAgo(c.createdAt)}</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleToggleFeatured(c)}
                                                    disabled={featuredLoading === c._id}
                                                    title={c.featured ? "Remove from featured" : "Mark as featured"}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                                    style={c.featured
                                                        ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                                                        : { background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                                >
                                                    {featuredLoading === c._id
                                                        ? <RefreshCw size={11} className="animate-spin" />
                                                        : c.featured ? <StarOff size={13} /> : <Star size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => setConfirm({ type: "community", id: c._id, name: c.name })}
                                                    title="Delete community"
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                                    style={{ background: "rgba(204,16,22,0.08)", color: "var(--error)" }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                                    Showing {communities.length} of {communityTotal} communities
                                </p>
                                <div className="flex items-center gap-2">
                                    <button disabled={communityPage <= 1} onClick={() => loadCommunities(communityPage - 1, communitySearch)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: communityPage <= 1 ? "var(--text-faint)" : "var(--text-main)" }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-sub)" }}>
                                        {communityPage} / {communityPages}
                                    </span>
                                    <button disabled={communityPage >= communityPages} onClick={() => loadCommunities(communityPage + 1, communitySearch)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: communityPage >= communityPages ? "var(--text-faint)" : "var(--text-main)" }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PROFILE TAB ── */}
                    {activeTab === "profile" && (
                        <AdminProfileSection user={user} token={token} updateUser={updateUser} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
