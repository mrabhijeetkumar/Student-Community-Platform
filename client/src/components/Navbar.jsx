import { BellIcon, MagnifyingGlassIcon, SparklesIcon, BoltIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api";
import NotificationPanel from "./NotificationPanel";
import ThemeToggle from "./ui/ThemeToggle";
import useTheme from "../hooks/useTheme";

const quickLinks = [
    { label: "Home", to: "/" },
    { label: "Explore", to: "/explore" },
    { label: "Messages", to: "/messages" }
];

export default function Navbar() {
    const { user, token } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        if (location.pathname === "/explore") {
            setSearchValue(searchParams.get("q") || "");
        }
    }, [location.pathname, searchParams]);

    useEffect(() => {
        let isMounted = true;

        const loadNotifications = async () => {
            try {
                const response = await getNotifications(token);
                if (!isMounted) {
                    return;
                }

                setNotifications(response.items || []);
                setUnreadCount(response.unreadCount || 0);
            } catch {
                if (isMounted) {
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }
        };

        loadNotifications();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleMarkRead = async (notificationId) => {
        const updatedNotification = await markNotificationRead(notificationId, token);
        setNotifications((currentNotifications) => currentNotifications.map((item) => (item._id === updatedNotification._id ? updatedNotification : item)));
        setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
    };

    const handleMarkAllRead = async () => {
        const response = await markAllNotificationsRead(token);
        setNotifications(response.items || []);
        setUnreadCount(response.unreadCount || 0);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const trimmedQuery = searchValue.trim();

        navigate(trimmedQuery ? `/explore?q=${encodeURIComponent(trimmedQuery)}` : "/explore");
    };

    const firstName = user?.name?.split(" ")[0] || "Student";
    const descriptor = user?.headline || user?.college || "Verified student member";

    return (
        <div className="card-surface sticky top-4 z-20 overflow-hidden p-5 lg:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-500/20 via-accent-400/10 to-transparent" />
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-center">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-100">
                            <SparklesIcon className="h-4 w-4" />
                            Campus network live
                        </span>
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
                            {descriptor}
                        </span>
                    </div>

                    <div>
                        <p className="section-title">Student Community Platform</p>
                        <h2 className="mt-2 max-w-2xl text-balance text-3xl font-bold leading-tight text-white sm:text-[2.2rem]">
                            Welcome back, {firstName}. Build with the people around you.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                            Track discussions, project momentum, and collaborators from one focused social workspace designed for students.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="card-subtle">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Notifications</p>
                            <p className="mt-1 text-sm font-semibold text-white">{unreadCount > 0 ? `${unreadCount} unread updates` : "Inbox is clear"}</p>
                        </div>
                        <div className="card-subtle">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Profile</p>
                            <p className="mt-1 text-sm font-semibold text-white">@{user?.username || "student"}</p>
                        </div>
                        <div className="card-subtle flex items-center gap-2">
                            <BoltIcon className="h-4 w-4 text-accent-300" />
                            <p className="text-sm font-semibold text-white">Live productivity mode</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 xl:justify-self-end xl:self-stretch xl:w-full xl:max-w-xl">
                    <form onSubmit={handleSearchSubmit} className="card-ghost flex items-center gap-3 px-4 py-3">
                        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-slate-400" />
                        <input
                            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Search people, colleges, skills, and topics"
                        />
                        <button type="submit" className="btn-primary px-4 py-2 text-sm">
                            Search
                        </button>
                    </form>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <nav className="flex flex-wrap items-center gap-2">
                            {quickLinks.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${isActive ? "border-white/20 bg-white text-slate-900 shadow-soft" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-accent-400/30 hover:text-white"}`}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                            <div className="relative">
                                <button type="button" className="icon-button relative" onClick={() => setOpen((currentState) => !currentState)}>
                                    <BellIcon className="h-5 w-5" />
                                    {unreadCount > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent-400" /> : null}
                                </button>
                                <NotificationPanel
                                    open={open}
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    onClose={() => setOpen(false)}
                                    onMarkRead={handleMarkRead}
                                    onMarkAllRead={handleMarkAllRead}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
