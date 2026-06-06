import express from "express";
import { getDashboardData } from "../controllers/adminDashboardController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(["management_admin"]), getDashboardData);

export default router;
