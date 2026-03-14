import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Search, Users,
    MessageCircle, Bell, User, Zap, LogOut, Plus, BookOpen, Shield, Settings
} from "lucide-react";
import { useAuth } from "../context/useAuth.js";
import { useNotifications } from "../context/useNotifications.js";

const navGroups = [
    {
        label: "Main",
        items: [
            { label: "Feed", to: "/dashboard", icon: LayoutDashboard },
            { label: "Explore", to: "/explore", icon: Search },
        ],
    },
    {
        label: "Social",
        items: [
            { label: "Communities", to: "/communities", icon: Users },
            { label: "Messages", to: "/messages", icon: MessageCircle, badge: true },
            { label: "Notifications", to: "/notifications", icon: Bell, notif: true },
        ],
    },
    {
        label: "You",
        items: [
            { label: "Profile", to: "/profile", icon: User },
            { label: "Settings", to: "/settings", icon: Settings },
        ],
    },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();

    const avatarUrl = user?.profilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=0a66c2&color=fff&bold=true&size=64`;

    return (
        <aside
            className="flex flex-col w-full h-full rounded-2xl overflow-hidden"
            style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            {/* ── Brand ── */}
            <div
                className="px-4 pt-5 pb-4"
                style={{
                    borderBottom: "1px solid var(--border)",
                    background: "linear-gradient(145deg, rgba(20,115,230,0.1) 0%, rgba(255,138,0,0.08) 100%)"
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)" }}
                    >
                        <Zap size={17} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p
                            className="text-[16px] leading-tight"
                            style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-main)" }}
                        >
                            StudentHub
                        </p>
                        <p className="text-[12px]" style={{ color: "var(--text-sub)" }}>Community Platform</p>
                    </div>
                </div>
            </div>

            {/* ── Quick create ── */}
            <div className="px-3 pt-3 pb-2">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="btn-primary w-full"
                >
                    <Plus size={14} strokeWidth={2.5} /> New Post
                </button>
            </div>

            {/* ── Nav groups ── */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-3">
                        <p className="section-title px-3 pt-3 pb-2">{group.label}</p>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to === "/profile" && user?.username ? `/profile/${user.username}` : item.to}
                                className={({ isActive }) =>
                                    `sidebar-item mb-0.5 ${isActive ? "active" : ""}`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-150"
                                            style={
                                                isActive
                                                    ? { background: "var(--primary-subtle)", color: "var(--primary)" }
                                                    : { color: "var(--text-muted)" }
                                            }
                                        >
                                            <item.icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                                        </span>
                                        <span className="flex-1 text-[14px]">{item.label}</span>
                                        {item.notif && unreadCount > 0 && (
                                            <span
                                                className="shrink-0 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[12px] font-bold"
                                                style={{ background: "var(--error)", color: "white" }}
                                            >
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}

                {/* Admin link — visible to admins only */}
                {user?.role === "admin" && (
                    <div className="mb-3">
                        <p className="section-title px-3 pt-3 pb-2">Admin</p>
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `sidebar-item mb-0.5 ${isActive ? "active" : ""}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-150"
                                        style={isActive
                                            ? { background: "var(--primary-subtle)", color: "var(--primary)" }
                                            : { color: "var(--text-muted)" }}
                                    >
                                        <Shield size={15} strokeWidth={isActive ? 2.5 : 2} />
                                    </span>
                                    <span className="flex-1 text-[14px]">Admin Panel</span>
                                </>
                            )}
                        </NavLink>
                    </div>
                )}
            </nav>

            {/* ── User card ── */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer group transition-all duration-150"
                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                    onClick={() => navigate(`/profile/${user?.username}`)}
                >
                    <div className="relative shrink-0">
                        <img
                            src={avatarUrl}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                        <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
                            style={{ background: "var(--success)", border: "2px solid var(--surface-elevated)" }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold leading-tight truncate" style={{ color: "var(--text-main)" }}>
                            {user?.name || user?.username || "Student"}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                            @{user?.username || "you"}
                        </p>
                    </div>
                    <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-150 shrink-0"
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
