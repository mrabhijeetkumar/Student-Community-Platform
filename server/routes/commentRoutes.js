import express from "express";
import { createComment, deleteComment, getComments } from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/:postId", createComment);
router.get("/:postId", getComments);
router.delete("/item/:commentId", deleteComment);

export default router;