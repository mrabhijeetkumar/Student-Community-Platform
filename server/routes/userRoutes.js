import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    followUser,
    getCurrentUser,
    getUserDirectory,
    getSuggestedUsers,
    getUserProfile,
    unfollowUser,
    updateCurrentUser
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get("/me", getCurrentUser);
router.put("/me", updateCurrentUser);
router.get("/directory", getUserDirectory);
router.get("/suggestions", getSuggestedUsers);
router.get("/profile/:username", getUserProfile);
router.post("/profile/:username/follow", followUser);
router.delete("/profile/:username/follow", unfollowUser);

export default router;
