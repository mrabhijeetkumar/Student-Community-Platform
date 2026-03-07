import {
    ArrowRightStartOnRectangleIcon,
    BellIcon,
    ChartBarSquareIcon,
    HomeIcon,
    InboxIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    UserGroupIcon,
    SparklesIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
    { label: "Home", to: "/", icon: HomeIcon },
    { label: "Explore", to: "/explore", icon: MagnifyingGlassIcon },
    { label: "Notifications", to: "/notifications", icon: BellIcon },
    { label: "Messages", to: "/messages", icon: InboxIcon },
    { label: "Communities", to: "/communities", icon: UserGroupIcon },
    { label: "Profile", to: "/profile", icon: UserCircleIcon },
    { label: "Dashboard", to: "/dashboard", icon: ChartBarSquareIcon }
];

export default function Sidebar() {
    const { user, logout } = useAuth();

    return (
        <aside className="hidden lg:block lg:w-[264px] lg:flex-none">
            <div className="card-surface sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-4">
                <div className="scrollbar-subtle min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-brand-500/20 via-white/[0.05] to-accent-400/10 p-5 shadow-2xl">
                        <p className="section-title">Campus OS</p>
                        <h1 className="display-title mt-3 text-[1.75rem] font-extrabold leading-tight text-white">Student social layer</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-300">A focused student workspace for identity, discussion, and collaboration.</p>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <Link to="/" className="floating-metric px-3 py-3 transition hover:-translate-y-0.5">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Focus</p>
                                <p className="mt-1 text-sm font-semibold text-white">Live feed</p>
                            </Link>
                            <Link to="/communities" className="floating-metric px-3 py-3 transition hover:-translate-y-0.5">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Connect</p>
                                <p className="mt-1 text-sm font-semibold text-white">Groups</p>
                            </Link>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const target = item.to === "/profile" && user ? `/profile/${user.username}` : item.to;

                            return (
                                <NavLink key={item.label} to={target}>
                                    {({ isActive }) => (
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${isActive ? "bg-brand-500/90 text-white shadow-glow" : "text-slate-300 hover:bg-white/[0.05] hover:text-white"}`}
                                        >
                                            <span className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition ${isActive ? "border-white/15 bg-white/10" : "border-white/10 bg-white/[0.03]"}`}>
                                                <Icon className="h-[18px] w-[18px]" />
                                            </span>
                                            {item.label}
                                        </motion.div>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="card-ghost overflow-hidden p-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-100">
                                <SparklesIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Daily momentum</p>
                                <p className="text-xs text-slate-400">Build, discuss, and keep your profile active.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                    <motion.div whileHover={{ y: -2 }} className="card-ghost overflow-hidden p-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 font-bold text-white">
                                {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" /> : user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                                <p className="truncate text-xs text-slate-400">@{user?.username}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">{user?.college || user?.headline || "Verified student member"}</p>
                    </motion.div>
                    <button type="button" onClick={logout} className="btn-secondary w-full gap-2 py-3">
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}
