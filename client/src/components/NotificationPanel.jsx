import { BellIcon, CheckCircleIcon, ChatBubbleOvalLeftEllipsisIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

const iconByType = {
    like: HeartWrap,
    comment: ChatBubbleOvalLeftEllipsisIcon,
    follow: UserPlusIcon,
    message: ChatBubbleOvalLeftEllipsisIcon,
    system: BellIcon
};

function HeartWrap(props) {
    return <CheckCircleIcon {...props} />;
}

export default function NotificationPanel({
    open,
    notifications = [],
    unreadCount = 0,
    onClose,
    onMarkRead,
    onMarkAllRead,
    onNotificationClick,
    onOpenAll
}) {
    return (
        <AnimatePresence>
            {open ? (
                <>
                    <button type="button" aria-label="Close notifications" className="fixed inset-0 z-30 cursor-default bg-slate-950/50" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="card-surface absolute right-0 top-16 z-40 w-[min(26rem,calc(100vw-2rem))] overflow-hidden p-0"
                    >
                        <div className="flex items-center justify-between border-b border-[#355386] px-5 py-4">
                            <div>
                                <p className="display-title text-sm font-semibold text-white">Notifications</p>
                                <p className="text-xs text-[#8ea4c9]">{unreadCount} unread updates</p>
                            </div>
                            <button type="button" className="text-xs font-medium text-[#8dabff] transition hover:text-white" onClick={onMarkAllRead}>
                                Mark all read
                            </button>
                        </div>
                        <div className="scrollbar-subtle max-h-[26rem] space-y-3 overflow-y-auto px-4 py-4">
                            {notifications.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-[#355386] px-4 py-8 text-center text-sm text-[#8ea4c9]">
                                    No new notifications right now.
                                </div>
                            ) : notifications.map((item) => {
                                const Icon = iconByType[item.type] || BellIcon;

                                return (
                                    <motion.button
                                        key={item._id}
                                        whileHover={{ y: -2 }}
                                        type="button"
                                        onClick={() => onNotificationClick?.(item)}
                                        className={`flex w-full gap-3 rounded-3xl border px-4 py-4 text-left transition ${item.isRead ? "border-[#355386] bg-[#172844]" : "border-[#4f7cff] bg-[#1f365e]"}`}
                                    >
                                        <div className="mt-1 rounded-2xl bg-[#21314d] p-2 text-[#8dabff]">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-white">{item.title}</p>
                                            <p className="mt-1 text-sm text-[#bfcee8]">{item.message}</p>
                                            <p className="mt-2 text-xs text-[#8ea4c9]">{new Date(item.createdAt).toLocaleString()}</p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                        <div className="border-t border-[#355386] px-5 py-3">
                            <button
                                type="button"
                                className="w-full rounded-2xl border border-[#355386] bg-[#172844] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#21314d]"
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
