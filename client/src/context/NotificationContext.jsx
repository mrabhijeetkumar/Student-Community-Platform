import { createContext, useEffect, useState } from "react";
import { useAuth } from "./useAuth.js";
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from "../services/api.js";
import {
    connectSocket,
    disconnectSocket,
    subscribeToSocketEvent
} from "../services/socket.js";

const NotificationContext = createContext(null);

function mergeNotifications(currentItems, incomingItem) {
    const nextItems = [incomingItem, ...currentItems.filter((item) => item._id !== incomingItem._id)];
    return nextItems.slice(0, 50);
}

export function NotificationProvider({ children }) {
    const { token, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token || !isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadNotifications = async () => {
            setLoading(true);

            try {
                const response = await getNotifications(token);

                if (!isMounted) {
                    return;
                }

                setNotifications(response.items ?? []);
                setUnreadCount(response.unreadCount ?? 0);
            } catch {
                if (!isMounted) {
                    return;
                }

                setNotifications([]);
                setUnreadCount(0);
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
    }, [isAuthenticated, token]);

    useEffect(() => {
        if (!token || !isAuthenticated) {
            return;
        }

        const socket = connectSocket(token, "notifications");

        if (!socket) {
            return;
        }

        const unsubscribeNew = subscribeToSocketEvent("notification:new", (notification) => {
            setNotifications((currentItems) => mergeNotifications(currentItems, notification));
            setUnreadCount((currentCount) => currentCount + (notification?.isRead ? 0 : 1));
        });

        // Re-sync count from server after any reconnect (handles offline/tab-switch gaps)
        const handleReconnect = () => {
            getNotifications(token)
                .then((response) => {
                    setNotifications(response.items ?? []);
                    setUnreadCount(response.unreadCount ?? 0);
                })
                .catch(() => { });
        };
        socket.on("connect", handleReconnect);

        return () => {
            unsubscribeNew();
            socket.off("connect", handleReconnect);
            disconnectSocket("notifications");
        };
    }, [isAuthenticated, token]);

    const refreshNotifications = async () => {
        if (!token || !isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return { items: [], unreadCount: 0 };
        }

        setLoading(true);

        try {
            const response = await getNotifications(token);
            setNotifications(response.items ?? []);
            setUnreadCount(response.unreadCount ?? 0);
            return response;
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        const existingNotification = notifications.find((item) => item._id === notificationId);

        if (!existingNotification || existingNotification.isRead) {
            return existingNotification ?? null;
        }

        setNotifications((currentItems) => currentItems.map((item) => (
            item._id === notificationId
                ? { ...item, isRead: true, readAt: new Date().toISOString() }
                : item
        )));
        setUnreadCount((currentCount) => Math.max(0, currentCount - 1));

        try {
            const updatedNotification = await markNotificationRead(notificationId, token);
            setNotifications((currentItems) => currentItems.map((item) => (
                item._id === notificationId ? updatedNotification : item
            )));
            return updatedNotification;
        } catch (error) {
            setNotifications((currentItems) => currentItems.map((item) => (
                item._id === notificationId ? existingNotification : item
            )));
            setUnreadCount((currentCount) => currentCount + 1);
            throw error;
        }
    };

    const markAllAsRead = async () => {
        const previousNotifications = notifications;
        const hadUnread = previousNotifications.some((item) => !item.isRead);

        if (!hadUnread) {
            return { items: previousNotifications, unreadCount };
        }

        const readAt = new Date().toISOString();
        setNotifications((currentItems) => currentItems.map((item) => (
            item.isRead ? item : { ...item, isRead: true, readAt }
        )));
        setUnreadCount(0);

        try {
            const response = await markAllNotificationsRead(token);
            setNotifications(response.items ?? []);
            setUnreadCount(response.unreadCount ?? 0);
            return response;
        } catch (error) {
            setNotifications(previousNotifications);
            setUnreadCount(previousNotifications.filter((item) => !item.isRead).length);
            throw error;
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                refreshNotifications,
                markAsRead,
                markAllAsRead
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export { NotificationContext };