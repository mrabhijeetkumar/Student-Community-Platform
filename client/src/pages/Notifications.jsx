import { useEffect, useState } from "react";
import Notification from "../components/Notification";
import PageTransition from "../components/ui/PageTransition";
import LoadingCard from "../components/ui/LoadingCard";
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
            <div className="card-surface p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="section-title">Notifications</p>
                        <h2 className="mt-2 text-3xl font-bold text-white">Everything requiring your attention.</h2>
                        <p className="mt-2 text-sm text-slate-400">{unreadCount} unread events across follows, likes, comments, and messages.</p>
                    </div>
                    <button type="button" className="btn-primary" onClick={handleMarkAllRead}>
                        Mark all as read
                    </button>
                </div>
            </div>

            <Notification tone="warning" message={feedback} />

            <div className="space-y-4">
                {loading ? Array.from({ length: 4 }).map((_, index) => <LoadingCard key={`notifications-loading-${index}`} lines={4} />) : null}
                {!loading && notifications.length === 0 ? <div className="card-surface p-6 text-sm text-slate-400">No notifications yet.</div> : null}
                {!loading && notifications.map((item) => (
                    <article key={item._id} className={`card-surface p-5 ${item.isRead ? "opacity-80" : "ring-1 ring-brand-500/30"}`}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="font-semibold text-white">{item.title}</p>
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
