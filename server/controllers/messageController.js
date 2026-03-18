import Message from "../models/Message.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { emitToUser, isUserConnected } from "../socket/socket.js";

const populateMessageQuery = (query) =>
    query.populate("sender", "name username profilePhoto headline college").populate("recipient", "name username profilePhoto headline college");

export const getConversations = async (req, res) => {

    try {

        const messages = await populateMessageQuery(
            Message.find({
                $or: [
                    { sender: req.user._id },
                    { recipient: req.user._id }
                ]
            }).sort({ createdAt: -1 })
        );

        // Collect unique partner IDs while building conversation map
        const seen = new Set();
        const latestByPartner = [];

        for (const message of messages) {
            const partnerId = message.sender._id.toString() === req.user._id.toString()
                ? message.recipient._id.toString()
                : message.sender._id.toString();

            if (seen.has(partnerId)) continue;
            seen.add(partnerId);
            latestByPartner.push(message);
        }

        // Single aggregation to count unread per sender instead of N queries
        const unreadAgg = await Message.aggregate([
            {
                $match: {
                    recipient: req.user._id,
                    readAt: null
                }
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 }
                }
            }
        ]);
        const unreadMap = {};
        for (const entry of unreadAgg) {
            unreadMap[entry._id.toString()] = entry.count;
        }

        const conversations = latestByPartner.map((message) => {
            const partner = message.sender._id.toString() === req.user._id.toString()
                ? message.recipient
                : message.sender;
            return {
                partner,
                lastMessage: message,
                unreadCount: unreadMap[partner._id.toString()] ?? 0
            };
        });

        res.json(conversations);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};

export const getMessagesWithUser = async (req, res) => {

    try {

        const partner = await User.findById(req.params.userId).select("name username email profilePhoto headline college");

        if (!partner) {
            return res.status(404).json({ message: "User not found" });
        }

        const messages = await populateMessageQuery(
            Message.find({
                $or: [
                    { sender: req.user._id, recipient: req.params.userId },
                    { sender: req.params.userId, recipient: req.user._id }
                ]
            }).sort({ createdAt: 1 })
        );

        const unreadMessages = await Message.find(
            {
                sender: req.params.userId,
                recipient: req.user._id,
                readAt: null
            },
            { _id: 1 }
        );

        if (unreadMessages.length > 0) {
            const readAt = new Date();
            const unreadIds = unreadMessages.map((message) => message._id);

            await Message.updateMany(
                { _id: { $in: unreadIds } },
                { readAt }
            );

            emitToUser(req.params.userId, "message:read", {
                conversationUserId: req.user._id.toString(),
                messageIds: unreadIds.map((messageId) => messageId.toString()),
                readAt: readAt.toISOString()
            });
        }

        res.json({ partner, messages });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};

export const sendMessage = async (req, res) => {

    try {

        const content = req.body?.content?.trim();

        if (!content) {
            return res.status(400).json({ message: "Message content is required" });
        }

        if (req.params.userId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot message yourself" });
        }

        const recipient = await User.findById(req.params.userId).select("name username email profilePhoto headline college followers following");

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        const senderFollowsRecipient = req.user.following.some((userId) => userId.toString() === recipient._id.toString());
        const recipientFollowsSender = recipient.following.some((userId) => userId.toString() === req.user._id.toString());

        if (!senderFollowsRecipient && !recipientFollowsSender) {
            return res.status(403).json({ message: "Follow each other first to start messaging" });
        }

        const message = await Message.create({
            sender: req.user._id,
            recipient: req.params.userId,
            content,
            deliveredAt: isUserConnected(req.params.userId) ? new Date() : null
        });

        await message.populate("sender", "name username profilePhoto headline college");
        await message.populate("recipient", "name username profilePhoto headline college");

        emitToUser(req.params.userId, "message:new", message);

        if (message.deliveredAt) {
            emitToUser(req.user._id, "message:delivered", {
                conversationUserId: req.params.userId,
                messageIds: [message._id.toString()],
                deliveredAt: message.deliveredAt.toISOString()
            });
        }

        await createNotification({
            userId: req.params.userId,
            actorId: req.user._id,
            type: "message",
            title: "New direct message",
            message: `${req.user.name} sent you a message.`,
            link: "/messages"
        });

        res.status(201).json(message);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};