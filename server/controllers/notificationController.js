import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .populate("actorId", "name username profilePhoto")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            items: notifications,
            unreadCount: notifications.filter((notification) => !notification.isRead).length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate("actorId", "name username profilePhoto");

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                userId: req.user._id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        const notifications = await Notification.find({ userId: req.user._id })
            .populate("actorId", "name username profilePhoto")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            items: notifications,
            unreadCount: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
