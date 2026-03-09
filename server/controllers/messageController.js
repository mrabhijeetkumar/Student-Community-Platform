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

        const conversations = [];
        const seenPartners = new Set();

        for (const message of messages) {
            const partner = message.sender._id.toString() === req.user._id.toString()
                ? message.recipient
                : message.sender;

            if (seenPartners.has(partner._id.toString())) {
                continue;
            }

            seenPartners.add(partner._id.toString());

            const unreadCount = await Message.countDocuments({
                sender: partner._id,
                recipient: req.user._id,
                readAt: null
            });

            conversations.push({
                partner,
                lastMessage: message,
                unreadCount
            });
        }

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

        const recipient = await User.findById(req.params.userId).select("name username email profilePhoto headline college");

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
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