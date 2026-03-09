import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Search, Users,
    MessageCircle, Bell, User, Zap, LogOut, Plus
} from "lucide-react";
import { useAuth } from "../context/useAuth.js";

const navGroups = [
    {
        label: "Discover",
        items: [
            { label: "Feed", to: "/dashboard", icon: LayoutDashboard },
            { label: "Explore", to: "/explore", icon: Search },
        ],
    },
    {
        label: "Community",
        items: [
            { label: "Communities", to: "/communities", icon: Users },
            { label: "Messages", to: "/messages", icon: MessageCircle },
            { label: "Alerts", to: "/notifications", icon: Bell },
        ],
    },
    {
        label: "Account",
        items: [
            { label: "Profile", to: "/profile", icon: User },
        ],
    },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <aside
            className="flex flex-col w-full h-full rounded-3xl overflow-hidden"
            style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
            }}
        >
            {/* ── Brand ── */}
            <div className="px-5 pt-5 pb-1">
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: "#6366f1" }}
                    >
                        <Zap size={16} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span
                        className="text-[15px] font-bold tracking-tight"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}
                    >
                        StudentHub
                    </span>
                </div>
            </div>

            {/* ── Quick create ── */}
            <div className="px-3 pb-3">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)", color: "var(--primary-light)" }}
                >
                    <Plus size={13} strokeWidth={2.5} /> New Post
                </button>
            </div>

            {/* ── Nav groups ── */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-2">
                        <p className="section-title px-2 pt-3 pb-1.5">{group.label}</p>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to === "/profile" && user?.username ? `/profile/${user.username}` : item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `sidebar-item ${isActive ? "active" : ""}`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-all duration-200"
                                            style={
                                                isActive
                                                    ? { background: "rgba(99,102,241,0.20)", color: "#a5b4fc" }
                                                    : { color: "var(--text-faint)" }
                                            }
                                        >
                                            <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                        </span>
                                        <span className="text-[13px] font-medium flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span
                                                className="shrink-0 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[9px] font-bold"
                                                style={{ background: "rgba(99,102,241,0.28)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.38)" }}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* ── User card ── */}
            <div
                className="mx-3 mb-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}
            >
                <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-all duration-200 hover:bg-white/5"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onClick={() => navigate(`/profile/${user?.username}`)}
                >
                    <div className="relative shrink-0">
                        <img
                            src={
                                user?.profilePhoto ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&bold=true&size=64`
                            }
                            className="w-8 h-8 rounded-full object-cover"
                            style={{ boxShadow: "0 0 0 2px rgba(99,102,241,0.40)" }}
                        />
                        <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400"
                            style={{ boxShadow: "0 0 0 2px #020817" }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight truncate">
                            {user?.name || user?.username || "Student"}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                            @{user?.username || "you"}
                        </p>
                    </div>
                    <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200"
                        style={{ color: "var(--text-muted)" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            logout?.();
                            navigate("/login");
                        }}
                        title="Sign out"
                    >
                        <LogOut size={13} />
                    </button>
                </div>
            </div>
        </aside>
    );
}