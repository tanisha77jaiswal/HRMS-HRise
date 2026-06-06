import express from "express";
import { getPerformanceData, getPerformanceReviews, createPerformanceReview } from "../controllers/performanceController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all performance metrics (requires authentication)
router.get("/", authenticateToken, getPerformanceData);

// Detailed reviews endpoints
router.get("/reviews", authenticateToken, getPerformanceReviews);
router.post("/reviews", authenticateToken, requireRole(["senior_manager", "management_admin"]), createPerformanceReview);

export default router;
