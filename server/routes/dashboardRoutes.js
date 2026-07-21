import express from "express";
import adminOnly from "../middleware/adminMiddleware.js";
import protect from "../middleware/authMiddleware.js";
import {
    deletePostByAdmin,
    deleteUserByAdmin,
    deleteCommentByAdmin,
    getAdminDashboard,
    getAdminPosts,
    getAdminUsers,
    getAdminComments,
    getAdminActivity,
    getAdminCommunities,
    deleteAdminCommunity,
    toggleCommunityFeatured,
    removeCommunityMember,
    toggleBanUser,
    getUserDashboard,
    setUserRole
} from "../controllers/dashboardController.js";

const router = express.Router();

router.use(protect);

router.get("/me", getUserDashboard);

// Admin-only routes
router.get("/admin", adminOnly, getAdminDashboard);
router.get("/admin/users", adminOnly, getAdminUsers);
router.get("/admin/posts", adminOnly, getAdminPosts);
router.get("/admin/comments", adminOnly, getAdminComments);
router.get("/admin/activity", adminOnly, getAdminActivity);
router.post("/admin/users/:userId/role", adminOnly, setUserRole);
router.post("/admin/users/:userId/ban", adminOnly, toggleBanUser);
router.delete("/admin/users/:userId", adminOnly, deleteUserByAdmin);
router.delete("/admin/posts/:postId", adminOnly, deletePostByAdmin);
router.delete("/admin/comments/:commentId", adminOnly, deleteCommentByAdmin);
router.get("/admin/communities", adminOnly, getAdminCommunities);
router.delete("/admin/communities/:communityId", adminOnly, deleteAdminCommunity);
router.post("/admin/communities/:communityId/featured", adminOnly, toggleCommunityFeatured);
router.delete("/admin/communities/:communityId/members/:userId", adminOnly, removeCommunityMember);

export default router;