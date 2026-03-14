import express from "express";
import { createComment, deleteComment, getComments } from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";
import { createCommentLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/:postId", createCommentLimiter, createComment);
router.get("/:postId", getComments);
router.delete("/item/:commentId", deleteComment);

export default router;