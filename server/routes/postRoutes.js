import express from "express";
import {
    createPost,
    deletePost,
    getPostsFeed,
    getUserPosts,
    searchPosts,
    toggleLike,
    toggleSave,
    updatePost,
    voteOnPost
} from "../controllers/postController.js";
import protect from "../middleware/authMiddleware.js";
import { createPostLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getPostsFeed);
router.post("/", createPostLimiter, createPost);
router.get("/feed", getPostsFeed);
router.get("/search", searchPosts);
router.get("/user/:userId", getUserPosts);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.put("/:id/vote", voteOnPost);
router.put("/:id/like", toggleLike);
router.put("/:id/save", toggleSave);

export default router;