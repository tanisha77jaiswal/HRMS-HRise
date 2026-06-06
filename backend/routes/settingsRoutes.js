import express from "express";
import { getSettings, saveSettings } from "../controllers/settingsController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(["management_admin", "recruiter"]), getSettings);
router.put("/", authenticateToken, requireRole(["management_admin", "recruiter"]), saveSettings);

export default router;
