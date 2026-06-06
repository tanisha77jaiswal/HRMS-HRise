import express from "express";
import { getAllCandidateProfiles, saveCandidateProfile } from "../controllers/candidateController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), getAllCandidateProfiles);
router.post("/", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), saveCandidateProfile);

export default router;
