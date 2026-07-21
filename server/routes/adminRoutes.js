import express from "express";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
    getStats,
    getAllUsers,
    deleteUser,
    deletePost,
    deleteComment,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require a valid JWT + admin role
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.delete("/user/:id", deleteUser);
router.delete("/post/:id", deletePost);
router.delete("/comment/:id", deleteComment);

export default router;
