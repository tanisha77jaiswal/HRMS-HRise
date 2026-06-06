import express from "express";
import { getAllStaff, saveStaffProfile, getSeniorManagers, getWorkforceOverview, getMyProfile } from "../controllers/staffController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get senior managers (accessible to admin and recruiter)
router.get("/senior-managers", authenticateToken, requireRole(["management_admin", "recruiter"]), getSeniorManagers);

// Get workforce overview stats (accessible to admin, recruiter, and senior manager)
router.get("/workforce-overview", authenticateToken, requireRole(["management_admin", "recruiter", "senior_manager"]), getWorkforceOverview);

// Get all staff (accessible to admin, recruiter, and senior_manager)
router.get("/me", authenticateToken, requireRole(["management_admin", "recruiter", "senior_manager"]), getMyProfile);
router.get("/", authenticateToken, requireRole(["management_admin", "recruiter", "senior_manager"]), getAllStaff);
router.post("/", authenticateToken, requireRole(["management_admin", "recruiter", "senior_manager"]), saveStaffProfile);


export default router;
