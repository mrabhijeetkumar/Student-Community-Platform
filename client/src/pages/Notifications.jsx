import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Bell, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/useNotifications.js";

const cfg = {
    like: { icon: Heart, color: "#f43f5e", bg: "rgba(244,63,94,0.12)", verb: "liked your post" },
    comment: { icon: MessageCircle, color: "#1473e6", bg: "rgba(20,115,230,0.12)", verb: "commented on your post" },
    follow: { icon: UserPlus, color: "#0f8e72", bg: "rgba(15,142,114,0.12)", verb: "started following you" },
    message: { icon: MessageCircle, color: "#1688d8", bg: "rgba(22,136,216,0.12)", verb: "sent you a message" },
    system: { icon: Bell, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", verb: "sent a notification" },
};

const FILTERS = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "like", label: "Likes" },
    { id: "follow", label: "Follows" },
    { id: "comment", label: "Comments" },
];

const GROUPS = ["Today", "Earlier"];

function getGroup(dateString) {
    if (!dateString) return "Earlier";
    const diff = Date.now() - new Date(dateString).getTime();
    return diff < 24 * 60 * 60 * 1000 ? "Today" : "Earlier";
}

function timeAgo(dateString) {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

export default function Notifications() {
    const navigate = useNavigate();
    const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [activeFilter, setFilter] = useState("all");

    const filtered = notifications.filter((n) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "unread") return !n.isRead;
        return n.type === activeFilter;
    });

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await markAsRead(notification._id);
            } catch {
                return;
            }
        }

        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[22px] font-black display-title">
                        Notifications
                    </h2>
                    {unreadCount > 0 && (
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {unreadCount} unread alert{unreadCount > 1 ? "s" : ""}
                        </p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 text-[14px] px-3 py-2 rounded-xl transition-all duration-200"
                        style={{ color: "var(--primary-light)", background: "rgba(20,115,230,0.1)", border: "1px solid rgba(20,115,230,0.22)" }}
                    >
                        <Check size={12} /> Mark all read
                    </button>
                )}
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200"
                        style={
                            activeFilter === f.id
                                ? { background: "var(--primary-subtle)", border: "1px solid rgba(20,115,230,0.35)", color: "var(--primary-light)" }
                                : { background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                        }
                    >
                        {f.label}
                        {f.id === "unread" && unreadCount > 0 && (
                            <span className="ml-0.5 rounded-full font-bold text-[11px] px-1.5 py-0.5" style={{ background: "var(--primary)", color: "white" }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 size={22} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="card rounded-2xl p-12 text-center">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="text-[15px] font-semibold" style={{ color: "var(--text-main)" }}>All caught up!</p>
                    <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
                        No {activeFilter === "all" ? "" : activeFilter + " "}notifications right now.
                    </p>
                </div>
            )}

            <AnimatePresence>
                {!loading && GROUPS.map((group) => {
                    const items = filtered.filter((n) => getGroup(n.createdAt) === group);
                    if (!items.length) return null;
                    return (
                        <div key={group} className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] px-1 mb-2" style={{ color: "var(--text-muted)" }}>
                                {group}
                            </p>
                            {items.map((n, i) => {
                                const type = cfg[n.type] ? n.type : "system";
                                const c = cfg[type];
                                const Icon = c.icon;
                                const actor = n.actorId;
                                const actorImg = actor?.profilePhoto ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(actor?.name || "U")}&background=1473e6&color=fff&bold=true&size=80`;
                                return (
                                    <motion.div
                                        key={n._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16, scale: 0.96 }}
                                        transition={{ delay: i * 0.04, duration: 0.18 }}
                                        className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200 group relative cursor-pointer"
                                        style={{
                                            background: !n.isRead ? "var(--primary-subtle)" : "var(--surface)",
                                            border: `1px solid ${!n.isRead ? "rgba(20,115,230,0.24)" : "var(--border)"}`,
                                        }}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute top-[18px] left-3.5 w-2 h-2 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                                        )}
                                        <div className={`relative shrink-0 ${!n.isRead ? "ml-4" : ""}`}>
                                            <img src={actorImg} className="w-10 h-10 rounded-full object-cover" alt="" />
                                            <div
                                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: c.bg, border: "2px solid var(--surface)" }}
                                            >
                                                <Icon size={10} style={{ color: c.color }} fill={type === "like" ? c.color : "none"} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] leading-relaxed">
                                                <span className="font-semibold" style={{ color: "var(--text-main)" }}>{actor?.name || "Someone"}</span>{" "}
                                                <span style={{ color: "var(--text-sub)" }}>{n.message || c.verb}</span>
                                            </p>
                                            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>{timeAgo(n.createdAt)} ago</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
