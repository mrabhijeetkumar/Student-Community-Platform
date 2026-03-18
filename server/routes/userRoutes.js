import express from "express";
import { body } from "express-validator";
import protect from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { validatePasswordStrength } from "../services/authService.js";
import {
    acceptFollowRequest,
    changePassword,
    followUser,
    getCurrentUser,
    getFollowRequests,
    getUserDirectory,
    getUserFollowers,
    getUserFollowing,
    getSuggestedUsers,
    getUserProfile,
    rejectFollowRequest,
    unfollowUser,
    updateCurrentUser
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get("/profile", getCurrentUser);
router.put("/profile", updateCurrentUser);
router.get("/me", getCurrentUser);
router.put("/me", updateCurrentUser);
router.put(
    "/change-password",
    [
        body("currentPassword").optional().isString().isLength({ min: 1 }).withMessage("Current password is required"),
        body("newPassword")
            .isString().withMessage("New password is required")
            .custom((value) => {
                const result = validatePasswordStrength(value);
                if (!result.valid) {
                    throw new Error(result.message);
                }
                return true;
            })
    ],
    validateRequest,
    changePassword
);
router.get("/directory", getUserDirectory);
router.get("/suggestions", getSuggestedUsers);
router.get("/follow-requests", getFollowRequests);
router.get("/profile/:username", getUserProfile);
router.post("/profile/:username/follow", followUser);
router.delete("/profile/:username/follow", unfollowUser);
router.post("/profile/:username/follow-request/accept", acceptFollowRequest);
router.delete("/profile/:username/follow-request", rejectFollowRequest);
router.get("/profile/:username/followers", getUserFollowers);
router.get("/profile/:username/following", getUserFollowing);

export default router;
