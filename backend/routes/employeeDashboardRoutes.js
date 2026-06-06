import express from "express";
import { 
  getDashboardData, 
  updateEmployeeProfile, 
  employeeCheckIn, 
  employeeCheckOut,
  logPayslipDownload
} from "../controllers/employeeDashboardController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get aggregated employee dashboard data (restricted to employees)
router.get("/", authenticateToken, requireRole(["employee"]), getDashboardData);

// Self-service profile updates
router.put("/profile", authenticateToken, requireRole(["employee"]), updateEmployeeProfile);

// Shift clocking check-in
router.post("/check-in", authenticateToken, requireRole(["employee"]), employeeCheckIn);

// Shift clocking check-out
router.post("/check-out", authenticateToken, requireRole(["employee"]), employeeCheckOut);

// Log payslip download
router.post("/log-payslip-download", authenticateToken, requireRole(["employee"]), logPayslipDownload);

export default router;
