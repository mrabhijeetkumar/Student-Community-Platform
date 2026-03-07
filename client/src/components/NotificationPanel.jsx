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

export default function NotificationPanel({ open, notifications = [], unreadCount = 0, onClose, onMarkRead, onMarkAllRead }) {
    return (
        <AnimatePresence>
            {open ? (
                <>
                    <button type="button" aria-label="Close notifications" className="fixed inset-0 z-30 cursor-default bg-slate-950/20" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="card-surface absolute right-0 top-16 z-40 w-[min(26rem,calc(100vw-2rem))] overflow-hidden p-0"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <p className="text-sm font-semibold text-white">Notifications</p>
                                <p className="text-xs text-slate-400">{unreadCount} unread updates</p>
                            </div>
                            <button type="button" className="text-xs font-medium text-accent-300 transition hover:text-accent-200" onClick={onMarkAllRead}>
                                Mark all read
                            </button>
                        </div>
                        <div className="scrollbar-subtle max-h-[26rem] space-y-3 overflow-y-auto px-4 py-4">
                            {notifications.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                                    No new notifications right now.
                                </div>
                            ) : notifications.map((item) => {
                                const Icon = iconByType[item.type] || BellIcon;

                                return (
                                    <motion.button
                                        key={item._id}
                                        whileHover={{ y: -2 }}
                                        type="button"
                                        onClick={() => onMarkRead(item._id)}
                                        className={`flex w-full gap-3 rounded-3xl border px-4 py-4 text-left transition ${item.isRead ? "border-white/8 bg-white/[0.03]" : "border-brand-400/30 bg-brand-500/10"}`}
                                    >
                                        <div className="mt-1 rounded-2xl bg-white/[0.06] p-2 text-accent-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-white">{item.title}</p>
                                            <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                                            <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
