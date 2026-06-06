import express from "express";
import { getPayrollData, updatePayrollStatus, runPayroll } from "../controllers/payrollController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all payroll records (requires authentication)
router.get("/", authenticateToken, getPayrollData);

// Update a payroll record status (requires authentication)
router.put("/:id", authenticateToken, updatePayrollStatus);

// Trigger a payroll run (requires authentication)
router.post("/run", authenticateToken, runPayroll);

export default router;
