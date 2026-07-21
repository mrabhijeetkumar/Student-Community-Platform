import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/socket.js";

export const createNotification = async ({
    userId,
    actorId = null,
    type,
    title,
    message,
    link = "",
    meta = {}
}) => {
    if (!userId) {
        return null;
    }

    if (actorId && userId.toString() === actorId.toString()) {
        return null;
    }

    const notification = await Notification.create({
        userId,
        actorId,
        type,
        title,
        message,
        link,
        meta
    });

    await notification.populate("actorId", "name username profilePhoto");
    emitToUser(userId, "notification:new", notification);

    return notification;
};