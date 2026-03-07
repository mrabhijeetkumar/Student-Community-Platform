import { BellIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api";
import NotificationPanel from "./NotificationPanel";
import ThemeToggle from "./ui/ThemeToggle";
import useTheme from "../hooks/useTheme";

const quickLinks = [
    { label: "Home", to: "/" },
    { label: "Explore", to: "/explore" },
    { label: "Messages", to: "/messages" },
    { label: "Dashboard", to: "/dashboard" }
];

const routeMeta = [
    {
        test: (pathname) => pathname === "/",
        eyebrow: "Social Feed",
        title: "Command your student network",
        subtitle: "Move through discussions, momentum, and collaboration with a calmer product shell."
    },
    {
        test: (pathname) => pathname.startsWith("/explore"),
        eyebrow: "Discovery",
        title: "Explore talent, topics, and communities",
        subtitle: "Search the network, discover creators, and navigate emerging conversations faster."
    },
    {
        test: (pathname) => pathname.startsWith("/dashboard"),
        eyebrow: "Analytics",
        title: "Operational visibility for your profile",
        subtitle: "Track posts, growth, and activity from a cleaner dashboard view."
    },
    {
        test: (pathname) => pathname.startsWith("/messages"),
        eyebrow: "Inbox",
        title: "High-signal communication",
        subtitle: "Keep conversations focused with a layout built for quick context switching."
    },
    {
        test: (pathname) => pathname.startsWith("/notifications"),
        eyebrow: "Notifications",
        title: "Your latest network activity",
        subtitle: "Review follows, comments, likes, and direct updates without losing flow."
    },
    {
        test: (pathname) => pathname.startsWith("/communities"),
        eyebrow: "Communities",
        title: "Interest clusters with real momentum",
        subtitle: "Join focused groups, browse live feeds, and build inside active circles."
    },
    {
        test: (pathname) => pathname.startsWith("/profile"),
        eyebrow: "Profile",
        title: "Your public student identity",
        subtitle: "Show your work, your direction, and the network building around you."
    }
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
    const activeMeta = routeMeta.find((item) => item.test(location.pathname)) || {
        eyebrow: "Workspace",
        title: `Welcome back, ${firstName}`,
        subtitle: "A premium student collaboration surface built for discussions, identity, and momentum."
    };
    const profileTarget = user ? `/profile/${user.username}` : "/profile";
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || "S";

    return (
        <div className="card-surface sticky top-4 z-20 overflow-hidden px-4 py-4 lg:px-5 lg:py-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-brand-500/16 via-accent-400/8 to-transparent" />
            <div className="relative flex flex-col gap-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 xl:max-w-[30rem]">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-100">
                                <SparklesIcon className="h-4 w-4" />
                                {activeMeta.eyebrow}
                            </span>
                            <span className="card-subtle px-3 py-1.5 text-xs font-medium text-slate-300">
                                {unreadCount > 0 ? `${unreadCount} unread` : "Inbox clear"}
                            </span>
                            <span className="card-subtle px-3 py-1.5 text-xs font-medium text-slate-300">
                                {descriptor}
                            </span>
                        </div>

                        <h2 className="display-title text-balance text-2xl font-bold leading-tight text-white sm:text-[2rem]">
                            {activeMeta.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                            {activeMeta.subtitle}
                        </p>
                    </div>

                    <div className="w-full xl:max-w-[40rem]">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <form onSubmit={handleSearchSubmit} className="card-ghost min-w-0 flex flex-1 items-center gap-3 overflow-hidden px-4 py-3 shadow-xl">
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

                            <div className="flex flex-wrap items-center gap-2">
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
                                <Link to={profileTarget} className="card-subtle min-w-0 flex items-center gap-3 px-3 py-2">
                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 text-sm font-bold text-white">
                                        {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" /> : userInitial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{firstName}</p>
                                        <p className="truncate text-xs text-slate-400">@{user?.username || "student"}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

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

                    <div className="flex flex-wrap gap-2">
                        <div className="card-subtle px-3 py-2 text-sm text-slate-300">
                            <span className="text-slate-500">Mode</span>
                            <span className="ml-2 font-semibold text-white">Premium workspace</span>
                        </div>
                        <div className="card-subtle px-3 py-2 text-sm text-slate-300">
                            <span className="text-slate-500">Status</span>
                            <span className="ml-2 font-semibold text-white">All systems live</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
