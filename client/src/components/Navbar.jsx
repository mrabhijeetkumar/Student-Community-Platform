import { useEffect, useRef, useState } from "react";
import { Search, Bell, X, ChevronDown, Pencil, LogOut, User, Settings, Loader2, Check, BookOpen, Link2, Sun, Moon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { useNotifications } from "../context/useNotifications.js";
import useTheme from "../hooks/useTheme.js";
import NotificationPanel from "./NotificationPanel.jsx";
import { updateMyProfile } from "../services/api.js";
import { motion, AnimatePresence } from "framer-motion";

const routeMeta = {
    "/dashboard": { title: "Feed", sub: "What's happening today" },
    "/explore": { title: "Explore", sub: "Find students & communities" },
    "/communities": { title: "Communities", sub: "Your circles" },
    "/messages": { title: "Messages", sub: "Conversations" },
    "/notifications": { title: "Notifications", sub: "Alerts & updates" },
    "/settings": { title: "Settings", sub: "Manage your account" },
};

const PRONOUNS_OPTIONS = ["", "He/Him", "She/Her", "They/Them", "He/They", "She/They", "Prefer not to say"];

function EditIntroModal({ user, token, updateUser, onClose }) {
    const [form, setForm] = useState({
        firstName: user?.name?.split(" ")[0] || "",
        lastName: user?.name?.split(" ").slice(1).join(" ") || "",
        pronouns: "",
        headline: user?.headline || "",
        college: user?.college || "",
        bio: user?.bio || "",
        linkedin: user?.socialLinks?.linkedin || "",
        github: user?.socialLinks?.github || "",
        twitter: user?.socialLinks?.twitter || "",
        portfolio: user?.socialLinks?.portfolio || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    const setValue = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async () => {
        if (!form.firstName.trim()) { setError("First name is required."); return; }
        setSaving(true);
        setError("");
        try {
            const payload = {
                name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" "),
                headline: form.headline.trim(),
                college: form.college.trim(),
                bio: form.bio.trim(),
                socialLinks: {
                    linkedin: form.linkedin.trim(),
                    github: form.github.trim(),
                    twitter: form.twitter.trim(),
                    portfolio: form.portfolio.trim(),
                },
            };
            const updated = await updateMyProfile(payload, token);
            updateUser({ ...(user || {}), ...updated });
            setSaved(true);
            setTimeout(onClose, 900);
        } catch (err) {
            setError(err.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-[560px] rounded-2xl overflow-hidden flex flex-col"
                style={{ background: "var(--surface-elevated)", maxHeight: "88vh", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="text-[20px] font-bold" style={{ color: "var(--text-main)", letterSpacing: "-0.01em" }}>Edit intro</h2>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors" style={{ color: "var(--text-muted)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6" style={{ scrollbarWidth: "none" }}>

                    {/* Basic info */}
                    <section>
                        <p className="text-[16px] font-bold mb-4" style={{ color: "var(--text-main)" }}>Basic info</p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>
                                    First name <span style={{ color: "var(--error)" }}>*</span>
                                </label>
                                <input
                                    className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                                    style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", background: "var(--surface-soft)" }}
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                    value={form.firstName}
                                    onChange={e => setValue("firstName", e.target.value)}
                                    placeholder="First name"
                                    maxLength={50}
                                />
                                <p className="text-right text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>{form.firstName.length}/50</p>
                            </div>
                            <div>
                                <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>Last name</label>
                                <input
                                    className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                                    style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", background: "var(--surface-soft)" }}
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                    value={form.lastName}
                                    onChange={e => setValue("lastName", e.target.value)}
                                    placeholder="Last name"
                                    maxLength={50}
                                />
                                <p className="text-right text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>{form.lastName.length}/50</p>
                            </div>
                        </div>

                        {/* Pronouns */}
                        <div className="mb-4">
                            <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>Pronouns</label>
                            <p className="text-[12px] mb-2" style={{ color: "var(--text-muted)" }}>Let others know how to refer to you.</p>
                            <div className="relative">
                                <select
                                    className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none appearance-none transition-all"
                                    style={{ border: "1.5px solid var(--border)", color: form.pronouns ? "var(--text-main)" : "var(--text-muted)", background: "var(--surface-soft)", cursor: "pointer" }}
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                    value={form.pronouns}
                                    onChange={e => setValue("pronouns", e.target.value)}
                                >
                                    <option value="">Select pronouns</option>
                                    {PRONOUNS_OPTIONS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                            </div>
                        </div>

                        {/* Headline */}
                        <div>
                            <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>
                                Headline <span style={{ color: "var(--error)" }}>*</span>
                            </label>
                            <textarea
                                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition-all leading-relaxed"
                                style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", background: "var(--surface-soft)", minHeight: "72px" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                value={form.headline}
                                onChange={e => setValue("headline", e.target.value)}
                                placeholder="B.Tech CSE | Aspiring Software Developer…"
                                maxLength={220}
                            />
                            <p className="text-right text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>{form.headline.length}/220</p>
                        </div>
                    </section>

                    {/* Education */}
                    <section style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                        <p className="text-[16px] font-bold mb-4" style={{ color: "var(--text-main)" }}>Education</p>
                        <div>
                            <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>School</label>
                            <input
                                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                                style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", background: "var(--surface-soft)" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                value={form.college}
                                onChange={e => setValue("college", e.target.value)}
                                placeholder="University or college name"
                            />
                        </div>
                    </section>

                    {/* Bio */}
                    <section style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                        <p className="text-[16px] font-bold mb-4" style={{ color: "var(--text-main)" }}>About</p>
                        <div>
                            <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>Bio</label>
                            <textarea
                                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition-all leading-relaxed"
                                style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", background: "var(--surface-soft)", minHeight: "88px" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                value={form.bio}
                                onChange={e => setValue("bio", e.target.value)}
                                placeholder="Write a short bio about yourself…"
                                maxLength={300}
                            />
                            <p className="text-right text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>{form.bio.length}/300</p>
                        </div>
                    </section>

                    {/* Contact info */}
                    <section style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                        <p className="text-[16px] font-bold mb-4" style={{ color: "var(--text-main)" }}>Contact info</p>
                        <div className="space-y-3">
                            {[
                                { key: "linkedin", label: "LinkedIn URL", placeholder: "linkedin.com/in/yourname", icon: <Link2 size={14} /> },
                                { key: "github", label: "GitHub URL", placeholder: "github.com/yourname", icon: <Link2 size={14} /> },
                                { key: "twitter", label: "Twitter / X", placeholder: "twitter.com/yourname", icon: <Link2 size={14} /> },
                                { key: "portfolio", label: "Portfolio Website", placeholder: "yourportfolio.com", icon: <Link2 size={14} /> },
                            ].map(({ key, label, placeholder, icon }) => (
                                <div key={key}>
                                    <label className="block text-[14px] font-semibold mb-1.5" style={{ color: "var(--text-sub)" }}>{label}</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3" style={{ color: "var(--text-muted)" }}>{icon}</span>
                                        <input
                                            className="w-full pl-8 pr-3 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                                            style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", background: "var(--surface-soft)" }}
                                            onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                                            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                                            value={form[key]}
                                            onChange={e => setValue(key, e.target.value)}
                                            placeholder={placeholder}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                    {error ? (
                        <p className="text-[13px]" style={{ color: "var(--error)" }}>{error}</p>
                    ) : <span />}
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[15px] font-bold transition-all"
                        style={saved
                            ? { background: "var(--success)", color: "#fff" }
                            : saving
                                ? { background: "var(--primary)", color: "#fff", opacity: 0.7 }
                                : { background: "var(--primary)", color: "#fff" }
                        }
                        onMouseEnter={e => { if (!saving && !saved) e.currentTarget.style.filter = "brightness(1.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
                    >
                        {saved ? <><Check size={16} /> Saved!</> : saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : "Save"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [panelOpen, setPanelOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const [meOpen, setMeOpen] = useState(false);
    const [editIntroOpen, setEditIntroOpen] = useState(false);
    const searchRef = useRef(null);
    const meRef = useRef(null);

    const pathname = location.pathname;
    const isProfile = pathname.startsWith("/profile");
    const meta = isProfile
        ? { title: "Profile", sub: "Your identity" }
        : routeMeta[pathname] || { title: "", sub: "" };

    const profilePath = user?.username ? `/profile/${user.username}` : "/profile";

    const avatarUrl = user?.profilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=0a66c2&color=fff&bold=true&size=64`;

    const searchBg = "var(--surface-soft)";
    const searchBorder = "var(--border)";
    const searchFocusBg = "var(--surface-elevated)";
    const searchColor = "var(--text-main)";

    useEffect(() => { setPanelOpen(false); setMeOpen(false); }, [location.pathname]);

    // Close Me dropdown on outside click
    useEffect(() => {
        if (!meOpen) return;
        const handler = (e) => {
            if (meRef.current && !meRef.current.contains(e.target)) setMeOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [meOpen]);

    const handleNotificationClick = async (notification) => {
        if (!notification?.isRead) {
            try { await markAsRead(notification._id); } catch { return; }
        }
        setPanelOpen(false);
        navigate(notification?.link || "/notifications");
    };

    const handleSearch = (e) => {
        if (e.key === "Enter" && searchVal.trim()) {
            navigate(`/explore?q=${encodeURIComponent(searchVal.trim())}`);
            setSearchVal("");
            searchRef.current?.blur();
        }
        if (e.key === "Escape") {
            setSearchVal("");
            searchRef.current?.blur();
        }
    };

    return (
        <>
            <header
                className="glass-surface sticky top-3 z-20 mb-4 flex items-center gap-2 rounded-2xl px-3 py-2 sm:px-4"
                style={{ boxShadow: "var(--shadow-soft)" }}
            >
                {/* Page title */}
                <div className="min-w-0 flex-1">
                    <h1
                        className="text-[20px] font-bold leading-tight"
                        style={{ fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-main)" }}
                    >
                        {meta.title}
                    </h1>
                    {meta.sub && (
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {meta.sub}
                        </p>
                    )}
                </div>

                {/* LinkedIn-style Search */}
                <div className="relative hidden sm:flex items-center">
                    <Search size={16} className="absolute left-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                    <input
                        ref={searchRef}
                        placeholder="Search people, posts, communities…"
                        value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                        onKeyDown={handleSearch}
                        className="text-[14px] outline-none transition-all"
                        style={{
                            width: "min(340px, 36vw)",
                            paddingLeft: "2.5rem",
                            paddingRight: searchVal ? "2.25rem" : "1rem",
                            paddingTop: "0.55rem",
                            paddingBottom: "0.55rem",
                            borderRadius: "9999px",
                            background: searchBg,
                            border: `1.25px solid ${searchBorder}`,
                            color: searchColor,
                        }}
                        onFocus={e => { e.target.style.background = searchFocusBg; e.target.style.border = "1.25px solid var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
                        onBlur={e => { e.target.style.background = searchBg; e.target.style.border = `1.25px solid ${searchBorder}`; e.target.style.boxShadow = "none"; }}
                    />
                    {searchVal && (
                        <button
                            className="absolute right-3 flex items-center justify-center"
                            style={{ color: "var(--text-muted)" }}
                            onClick={() => setSearchVal("")}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className="topbar-btn flex flex-col items-center gap-0.5 px-2 py-1.5"
                >
                    {isDark
                        ? <Sun size={21} strokeWidth={1.8} style={{ color: "var(--text-sub)" }} />
                        : <Moon size={20} strokeWidth={1.8} style={{ color: "var(--text-sub)" }} />
                    }
                    <span className="hidden text-[12px] font-semibold md:block" style={{ color: "var(--text-sub)" }}>
                        {isDark ? "Light" : "Dark"}
                    </span>
                </button>

                {/* Notification bell */}
                <div className="relative">
                    <button
                        className="topbar-btn flex flex-col items-center gap-0.5 px-2 py-1.5"
                        onClick={() => setPanelOpen((v) => !v)}
                        title="Notifications"
                    >
                        <div className="relative">
                            <Bell size={22} strokeWidth={1.8} style={{ color: "var(--text-sub)" }} />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] rounded-full flex items-center justify-center text-[11px] font-bold"
                                    style={{ background: "var(--error)", color: "white", padding: "0 3px" }}
                                >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="hidden text-[12px] font-semibold md:block" style={{ color: "var(--text-sub)" }}>Notifications</span>
                    </button>

                    <NotificationPanel
                        open={panelOpen}
                        notifications={notifications.slice(0, 6)}
                        unreadCount={unreadCount}
                        onClose={() => setPanelOpen(false)}
                        onMarkRead={markAsRead}
                        onMarkAllRead={markAllAsRead}
                        onNotificationClick={handleNotificationClick}
                        onOpenAll={() => { setPanelOpen(false); navigate("/notifications"); }}
                    />
                </div>

                {/* Me button (LinkedIn style) */}
                <div className="relative shrink-0" ref={meRef}>
                    <button
                        onClick={() => setMeOpen(v => !v)}
                        className="topbar-btn flex flex-col items-center gap-0.5 px-2 py-1.5"
                    >
                        <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                        <span className="flex items-center gap-0.5 text-[13px] font-semibold" style={{ color: "var(--text-sub)" }}>
                            Me <ChevronDown size={13} strokeWidth={2.5} />
                        </span>
                    </button>

                    {/* Me Dropdown */}
                    <AnimatePresence>
                        {meOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                transition={{ duration: 0.14 }}
                                className="absolute right-0 top-full mt-1.5 z-[200] rounded-xl overflow-hidden"
                                style={{
                                    width: "280px",
                                    background: "var(--surface-elevated)",
                                    border: "1px solid var(--border)",
                                    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.50)" : "0 8px 32px rgba(0,0,0,0.18)",
                                }}
                            >
                                {/* Profile card */}
                                <div className="px-4 pt-4 pb-3">
                                    <div className="flex items-start gap-3">
                                        <img src={avatarUrl} className="w-14 h-14 rounded-full object-cover shrink-0" alt="" />
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--text-main)" }}>
                                                {user?.name || "Student"}
                                            </p>
                                            {user?.headline && (
                                                <p className="text-[12px] mt-0.5 leading-snug line-clamp-2" style={{ color: "var(--text-sub)" }}>
                                                    {user.headline}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {/* View profile button */}
                                    <button
                                        onClick={() => { setMeOpen(false); navigate(profilePath); }}
                                        className="mt-3 w-full py-1.5 rounded-full text-[14px] font-semibold transition-all"
                                        style={{ border: "1.5px solid var(--primary)", color: "var(--primary)", background: "transparent" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--primary-subtle)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        View profile
                                    </button>
                                </div>

                                {/* Account section */}
                                <div style={{ borderTop: "1px solid var(--border)" }}>
                                    <p className="px-4 pt-3 pb-1.5 text-[14px] font-bold" style={{ color: "var(--text-main)" }}>Account</p>
                                    <button
                                        onClick={() => { setMeOpen(false); setEditIntroOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left transition-colors"
                                        style={{ color: "var(--text-sub)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <Pencil size={15} style={{ color: "var(--text-muted)" }} />
                                        Edit intro
                                    </button>
                                    <button
                                        onClick={() => { setMeOpen(false); navigate("/settings"); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left transition-colors"
                                        style={{ color: "var(--text-sub)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <User size={15} style={{ color: "var(--text-muted)" }} />
                                        Settings &amp; Privacy
                                    </button>
                                </div>

                                {/* Manage section */}
                                <div style={{ borderTop: "1px solid var(--border)" }}>
                                    <p className="px-4 pt-3 pb-1.5 text-[14px] font-bold" style={{ color: "var(--text-main)" }}>Manage</p>
                                    <button
                                        onClick={() => { setMeOpen(false); navigate(profilePath); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left transition-colors"
                                        style={{ color: "var(--text-sub)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <BookOpen size={15} style={{ color: "var(--text-muted)" }} />
                                        Posts &amp; Activity
                                    </button>
                                </div>

                                {/* Sign out */}
                                <div style={{ borderTop: "1px solid var(--border)" }}>
                                    <button
                                        onClick={() => { setMeOpen(false); logout(); navigate("/login"); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-left transition-colors"
                                        style={{ color: "var(--text-sub)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <LogOut size={15} style={{ color: "var(--text-muted)" }} />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Edit Intro Modal */}
            <AnimatePresence>
                {editIntroOpen && (
                    <EditIntroModal
                        user={user}
                        token={token}
                        updateUser={updateUser}
                        onClose={() => setEditIntroOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

