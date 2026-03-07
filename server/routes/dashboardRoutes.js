import express from "express";
import adminOnly from "../middleware/adminMiddleware.js";
import protect from "../middleware/authMiddleware.js";
import { getAdminDashboard, getUserDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(protect);

router.get("/me", getUserDashboard);
router.get("/admin", adminOnly, getAdminDashboard);

export default router;