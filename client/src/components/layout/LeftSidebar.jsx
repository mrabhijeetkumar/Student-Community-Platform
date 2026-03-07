import { Bell, LayoutDashboard, LogOut, MessageSquareMore, Newspaper, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const navItems = [
    { label: "Feed", to: "/", icon: Newspaper },
    { label: "Profile", to: "/profile", icon: UserCircle2 },
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Notifications", to: "/notifications", icon: Bell },
    { label: "Messages", to: "/messages", icon: MessageSquareMore }
];

export default function LeftSidebar() {
    const { user, logout } = useAuth();

    return (
        <aside className="card-surface hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col justify-between p-5 lg:flex">
            <div className="space-y-8">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Student Network</p>
                    <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Campus OS</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A unified student platform for discovery, collaboration, and professional growth.</p>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const profileTarget = item.to === "/profile" && user ? `/profile/${user.username}` : item.to;

                        return (
                            <NavLink
                                key={item.label}
                                to={profileTarget}
                                className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="space-y-4">
                <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/80">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user?.username}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-brand-600">{user?.college || "Student member"}</p>
                </div>
                <button type="button" onClick={logout} className="btn-secondary w-full gap-2">
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
