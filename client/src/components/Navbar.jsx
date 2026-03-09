import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { useNotifications } from "../context/useNotifications.js";
import NotificationPanel from "./NotificationPanel.jsx";

const routeMeta = [
    { test: (p) => p === "/", title: "Home", sub: "What's happening today" },
    { test: (p) => p === "/dashboard", title: "Feed", sub: "Student community posts" },
    { test: (p) => p === "/explore", title: "Explore", sub: "Search students, communities, and trending posts" },
    { test: (p) => p.startsWith("/communities"), title: "Communities", sub: "Your circles" },
    { test: (p) => p === "/messages", title: "Messages", sub: "Conversations" },
    { test: (p) => p === "/notifications", title: "Notifications", sub: "Alerts & updates" },
    { test: (p) => p.startsWith("/profile"), title: "Profile", sub: "Your identity" },
];

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [panelOpen, setPanelOpen] = useState(false);

    const meta = routeMeta.find((m) => m.test(location.pathname));

    useEffect(() => {
        setPanelOpen(false);
    }, [location.pathname]);

    const handleNotificationClick = async (notification) => {
        if (!notification?.isRead) {
            try {
                await markAsRead(notification._id);
            } catch {
                return;
            }
        }

        setPanelOpen(false);

        if (notification?.link) {
            navigate(notification.link);
            return;
        }

        navigate("/notifications");
    };

    return (
        <header className="relative flex items-center gap-3 py-1 mb-2">
            {/* Page title */}
            <div className="min-w-0 flex-1">
                <h1
                    className="text-[22px] font-bold leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.04em" }}
                >
                    {meta?.title ?? ""}
                </h1>
                {meta?.sub && (
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {meta.sub}
                    </p>
                )}
            </div>

            {/* Search */}
            <div className="relative hidden sm:block">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                />
                <input
                    placeholder="Search students or communities"
                    className="input pl-9 pr-4 py-2 text-[13px] w-48 xl:w-60"
                    style={{ borderRadius: "12px" }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            navigate(`/explore?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
                            e.currentTarget.value = "";
                        }
                    }}
                />
            </div>

            {/* Notification bell */}
            <button
                className="icon-btn relative"
                onClick={() => setPanelOpen((open) => !open)}
                title="Notifications"
            >
                <Bell size={17} />
                {unreadCount > 0 ? (
                    <span className="badge absolute -top-1.5 -right-1.5" style={{ fontSize: "9px" }}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                ) : null}
            </button>

            <NotificationPanel
                open={panelOpen}
                notifications={notifications.slice(0, 6)}
                unreadCount={unreadCount}
                onClose={() => setPanelOpen(false)}
                onMarkRead={markAsRead}
                onMarkAllRead={markAllAsRead}
                onNotificationClick={handleNotificationClick}
                onOpenAll={() => {
                    setPanelOpen(false);
                    navigate("/notifications");
                }}
            />

            {/* Avatar */}
            <button
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 shrink-0"
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}
                onClick={() => navigate(`/profile/${user?.username}`)}
            >
                <img
                    src={
                        user?.profilePhoto ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&bold=true&size=64`
                    }
                    className="w-7 h-7 rounded-full object-cover"
                />
                <span className="hidden xl:block text-[12.5px] font-semibold max-w-[80px] truncate pr-1">
                    {user?.name?.split(" ")[0] || user?.username || "You"}
                </span>
            </button>
        </header>
    );
}