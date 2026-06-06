import express from "express";
import { getAllStaff, createStaffUser, updateStaffUser, deleteStaffUser } from "../controllers/userManagementController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(["management_admin"]), getAllStaff);
router.post("/", authenticateToken, requireRole(["management_admin"]), createStaffUser);
router.put("/:id", authenticateToken, requireRole(["management_admin"]), updateStaffUser);
router.delete("/:id", authenticateToken, requireRole(["management_admin"]), deleteStaffUser);

export default router;
