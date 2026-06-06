import express from "express";
import { getAttendanceData } from "../controllers/attendanceController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all attendance metrics (requires authentication)
router.get("/", authenticateToken, getAttendanceData);

export default router;
