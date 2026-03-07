import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getCommunities, joinCommunity, leaveCommunity } from "../controllers/communityController.js";

const router = express.Router();

router.use(protect);

router.get("/", getCommunities);
router.post("/:slug/join", joinCommunity);
router.delete("/:slug/join", leaveCommunity);

export default router;