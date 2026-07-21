import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { getAllowedOrigins } from "../config/security.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

let io;
const userConnectionCounts = new Map();
const presenceState = new Map();

const serializeDate = (value) => (value ? new Date(value).toISOString() : null);

function getPresencePayload(userId) {
    const presence = presenceState.get(String(userId));

    return {
        userId: String(userId),
        status: presence?.status || "offline",
        lastSeenAt: presence?.lastSeenAt || null
    };
}

function broadcastPresence(userId) {
    if (!io || !userId) {
        return;
    }

    io.to(`presence-watch:${userId}`).emit("presence:update", getPresencePayload(userId));
}

function updatePresence(userId, status, lastSeenAt = null) {
    presenceState.set(String(userId), {
        status,
        lastSeenAt: lastSeenAt ?? presenceState.get(String(userId))?.lastSeenAt ?? null
    });

    broadcastPresence(userId);
}

async function markDeliveredMessages(userId) {
    const undeliveredMessages = await Message.find(
        {
            recipient: userId,
            deliveredAt: null
        },
        { _id: 1, sender: 1 }
    );

    if (undeliveredMessages.length === 0) {
        return;
    }

    const deliveredAt = new Date();
    const messageIds = undeliveredMessages.map((message) => message._id);

    await Message.updateMany(
        { _id: { $in: messageIds } },
        { deliveredAt }
    );

    const bySender = new Map();

    for (const message of undeliveredMessages) {
        const senderId = message.sender.toString();

        if (!bySender.has(senderId)) {
            bySender.set(senderId, []);
        }

        bySender.get(senderId).push(message._id.toString());
    }

    for (const [senderId, ids] of bySender.entries()) {
        emitToUser(senderId, "message:delivered", {
            conversationUserId: String(userId),
            messageIds: ids,
            deliveredAt: deliveredAt.toISOString()
        });
    }
}

export default function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: getAllowedOrigins(),
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("_id isEmailVerified lastSeenAt");

            if (!user) {
                return next(new Error("User not found"));
            }

            if (!user.isEmailVerified) {
                return next(new Error("Verify your email to use chat"));
            }

            socket.data.userId = user._id.toString();
            socket.data.lastSeenAt = serializeDate(user.lastSeenAt);
            next();
        } catch (error) {
            next(new Error("Not authorized"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        const currentCount = userConnectionCounts.get(userId) || 0;

        socket.join(`user:${userId}`);
        userConnectionCounts.set(userId, currentCount + 1);
        updatePresence(userId, "online", socket.data.lastSeenAt);
        markDeliveredMessages(userId).catch(() => { });

        socket.on("presence:watch", ({ userIds = [] } = {}) => {
            const previousSubscriptions = socket.data.presenceSubscriptions || [];

            previousSubscriptions.forEach((watchedUserId) => {
                socket.leave(`presence-watch:${watchedUserId}`);
            });

            const nextSubscriptions = [...new Set(userIds.map(String).filter((watchedUserId) => watchedUserId && watchedUserId !== userId))];

            nextSubscriptions.forEach((watchedUserId) => {
                socket.join(`presence-watch:${watchedUserId}`);
            });

            socket.data.presenceSubscriptions = nextSubscriptions;
            socket.emit("presence:snapshot", nextSubscriptions.map((watchedUserId) => getPresencePayload(watchedUserId)));
        });

        socket.on("presence:status", ({ status } = {}) => {
            if (!["online", "idle"].includes(status)) {
                return;
            }

            updatePresence(userId, status);
        });

        socket.on("message:typing", ({ recipientId, isTyping }) => {
            if (!recipientId || recipientId === userId) {
                return;
            }

            emitToUser(recipientId, "message:typing", {
                userId,
                recipientId,
                isTyping: Boolean(isTyping)
            });
        });

        socket.on("disconnect", async () => {
            const remainingConnections = (userConnectionCounts.get(userId) || 1) - 1;

            if (remainingConnections > 0) {
                userConnectionCounts.set(userId, remainingConnections);
                return;
            }

            userConnectionCounts.delete(userId);

            const lastSeenAt = new Date().toISOString();
            updatePresence(userId, "offline", lastSeenAt);

            try {
                await User.findByIdAndUpdate(userId, { lastSeenAt });
            } catch {
                // best-effort presence persistence
            }
        });
    });

    return io;
}

export function isUserConnected(userId) {
    return Boolean(userConnectionCounts.get(String(userId)));
}

export function getUserPresence(userId) {
    return getPresencePayload(userId);
}

export function emitToUser(userId, eventName, payload) {
    if (!io || !userId) {
        return;
    }

    io.to(`user:${userId}`).emit(eventName, payload);
}

export function broadcastFeedEvent(eventName, payload) {
    if (!io) return;
    io.emit(eventName, payload);
}
