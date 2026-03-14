import express from "express";
import protect from "../middleware/authMiddleware.js";
import { sendMessageLimiter } from "../middleware/rateLimitMiddleware.js";
import {
    getConversations,
    getMessagesWithUser,
    sendMessage
} from "../controllers/messageController.js";

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.get("/:userId", getMessagesWithUser);
router.post("/:userId", sendMessageLimiter, sendMessage);

export default router;