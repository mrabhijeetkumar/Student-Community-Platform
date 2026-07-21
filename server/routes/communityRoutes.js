import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getCommunities, getCommunityBySlug, joinCommunity, leaveCommunity } from "../controllers/communityController.js";

const router = express.Router();

router.use(protect);

router.get("/", getCommunities);
router.get("/:slug", getCommunityBySlug);
router.post("/:slug/join", joinCommunity);
router.delete("/:slug/join", leaveCommunity);

export default router;