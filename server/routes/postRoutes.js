import express from "express";
import {
    createPost,
    deletePost,
    getPostsFeed,
    getUserPosts,
    toggleLike,
    updatePost
} from "../controllers/postController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createPost);
router.get("/feed", getPostsFeed);
router.get("/user/:userId", getUserPosts);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.put("/:id/like", toggleLike);

export default router;