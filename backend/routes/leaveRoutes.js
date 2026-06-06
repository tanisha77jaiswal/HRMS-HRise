import express from "express";
import { getLeaves, createLeave, updateLeave } from "../controllers/leaveController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get leaves (accessible to all authenticated roles, results filtered in controller)
router.get("/", authenticateToken, getLeaves);

// Create leave request (accessible to employees and admin)
router.post("/", authenticateToken, createLeave);

// Update leave request status (accessible to senior managers and admins)
router.put("/:id", authenticateToken, requireRole(["senior_manager", "management_admin"]), updateLeave);

export default router;
