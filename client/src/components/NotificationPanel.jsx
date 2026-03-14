import { BellIcon, CheckCircleIcon, ChatBubbleOvalLeftEllipsisIcon, UserPlusIcon, HeartIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

const iconByType = {
    like: HeartIcon,
    comment: ChatBubbleOvalLeftEllipsisIcon,
    follow: UserPlusIcon,
    message: ChatBubbleOvalLeftEllipsisIcon,
    system: BellIcon
};

const iconColors = {
    like: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
    comment: { color: "#1473e6", bg: "rgba(20,115,230,0.12)" },
    follow: { color: "#0f8e72", bg: "rgba(15,142,114,0.12)" },
    message: { color: "#1688d8", bg: "rgba(22,136,216,0.12)" },
    system: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

function timeAgo(dateString) {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationPanel({
    open,
    notifications = [],
    unreadCount = 0,
    onClose,
    onMarkAllRead,
    onNotificationClick,
    onOpenAll
}) {
    return (
        <AnimatePresence>
            {open ? (
                <>
                    <button
                        type="button"
                        aria-label="Close notifications"
                        className="fixed inset-0 z-30 cursor-default"
                        style={{ background: "rgba(0,0,0,0.08)" }}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-16 z-40 w-[min(26rem,calc(100vw-2rem))] overflow-hidden"
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)"
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4"
                            style={{ borderBottom: "1px solid var(--border)" }}
                        >
                            <div>
                                <p className="text-[15px] font-bold" style={{ color: "var(--text-main)" }}>Notifications</p>
                                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-[13px] font-semibold transition-colors"
                                style={{ color: "var(--primary-light)" }}
                                onClick={onMarkAllRead}
                            >
                                Mark all read
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[26rem] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                            {notifications.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-3xl mb-3">🔔</p>
                                    <p className="text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>No new notifications</p>
                                    <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>You're all caught up right now.</p>
                                </div>
                            ) : (
                                <div className="px-3 py-3 space-y-1">
                                    {notifications.map((item) => {
                                        const Icon = iconByType[item.type] || BellIcon;
                                        const c = iconColors[item.type] || iconColors.system;
                                        const actor = item.actorId;
                                        const actorImg = actor?.profilePhoto ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(actor?.name || "U")}&background=1473e6&color=fff&bold=true&size=80`;

                                        return (
                                            <motion.button
                                                key={item._id}
                                                whileHover={{ backgroundColor: "var(--surface-hover)" }}
                                                type="button"
                                                onClick={() => onNotificationClick?.(item)}
                                                className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors relative"
                                                style={{
                                                    background: !item.isRead ? "var(--primary-subtle)" : "transparent",
                                                    border: `1px solid ${!item.isRead ? "rgba(99,102,241,0.18)" : "transparent"}`
                                                }}
                                            >
                                                {!item.isRead && (
                                                    <div
                                                        className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full"
                                                        style={{ background: "var(--primary)" }}
                                                    />
                                                )}
                                                <div className={`relative shrink-0 ${!item.isRead ? "ml-3" : ""}`}>
                                                    <img src={actorImg} className="w-9 h-9 rounded-full object-cover" alt="" />
                                                    <div
                                                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{ background: c.bg, border: "2px solid var(--surface)" }}
                                                    >
                                                        <Icon className="h-2.5 w-2.5" style={{ color: c.color }} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--text-main)" }}>
                                                        {actor?.name || "Someone"}
                                                    </p>
                                                    <p className="text-[13px] leading-snug mt-0.5" style={{ color: "var(--text-sub)" }}>
                                                        {item.message}
                                                    </p>
                                                    <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                                                        {timeAgo(item.createdAt)}
                                                    </p>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                            <button
                                type="button"
                                className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                                style={{
                                    background: "var(--surface-soft)",
                                    color: "var(--primary-light)",
                                    border: "1px solid var(--border)"
                                }}
                                onClick={onOpenAll}
                            >
                                View all notifications
                            </button>
                        </div>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
