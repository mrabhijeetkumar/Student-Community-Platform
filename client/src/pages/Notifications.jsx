import { BellAlertIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Notification from "../components/Notification";
import PageTransition from "../components/ui/PageTransition";
import LoadingCard from "../components/ui/LoadingCard";
import PageHero from "../components/ui/PageHero";
import { useAuth } from "../context/AuthContext.jsx";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api";

export default function Notifications() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadNotifications = async () => {
            setLoading(true);
            try {
                const response = await getNotifications(token);
                if (isMounted) {
                    setNotifications(response.items || []);
                    setUnreadCount(response.unreadCount || 0);
                    setFeedback("");
                }
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadNotifications();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleMarkRead = async (notificationId) => {
        try {
            const updatedNotification = await markNotificationRead(notificationId, token);
            setNotifications((currentNotifications) => currentNotifications.map((item) => (item._id === updatedNotification._id ? updatedNotification : item)));
            setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await markAllNotificationsRead(token);
            setNotifications(response.items || []);
            setUnreadCount(response.unreadCount || 0);
            setFeedback("");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    return (
        <PageTransition className="space-y-6">
            <PageHero
                eyebrow="Notifications"
                title="Everything requiring your attention."
                description={`${unreadCount} unread events across follows, likes, comments, and messages.`}
                orbClassName="bg-amber-400/12"
                badges={(
                    <>
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                            <BellAlertIcon className="h-4 w-4" />
                            Attention queue
                        </span>
                        <span className="pill-tag">{notifications.length} total</span>
                    </>
                )}
                aside={(
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="stat-tile shadow-xl">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Unread</p>
                            <p className="display-title mt-2 text-2xl font-bold text-white">{unreadCount}</p>
                            <p className="mt-1 text-sm text-slate-400">Items requiring action</p>
                        </div>
                        <div className="stat-tile shadow-xl">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Read</p>
                            <p className="display-title mt-2 text-2xl font-bold text-white">{Math.max(0, notifications.length - unreadCount)}</p>
                            <p className="mt-1 text-sm text-slate-400">Already cleared</p>
                        </div>
                        <div className="card-ghost flex flex-col justify-between gap-3 p-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Action</p>
                                <p className="mt-2 text-sm text-slate-300">Clear the queue when you are caught up.</p>
                            </div>
                            <button type="button" className="btn-primary w-full" onClick={handleMarkAllRead}>
                                Mark all as read
                            </button>
                        </div>
                    </div>
                )}
            />

            <Notification tone="warning" message={feedback} />

            <div className="space-y-4">
                {loading ? Array.from({ length: 4 }).map((_, index) => <LoadingCard key={`notifications-loading-${index}`} lines={4} />) : null}
                {!loading && notifications.length === 0 ? <div className="card-surface p-6 text-sm text-slate-400">No notifications yet.</div> : null}
                {!loading && notifications.map((item) => (
                    <article key={item._id} className={`card-surface p-5 ${item.isRead ? "opacity-80" : "ring-1 ring-brand-500/30"}`}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-white">{item.title}</p>
                                    {item.isRead ? <span className="pill-tag">Read</span> : <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100"><CheckBadgeIcon className="h-4 w-4" /> New</span>}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
                                <p className="mt-3 text-xs uppercase tracking-wide text-accent-300">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                            {!item.isRead ? (
                                <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={() => handleMarkRead(item._id)}>
                                    Mark read
                                </button>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </PageTransition>
    );
}
