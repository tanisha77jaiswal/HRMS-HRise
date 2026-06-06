import express from "express";
import { getAllInterviews, createInterview, updateInterview, deleteInterview, rescheduleInterview, generateInterviewQuestions } from "../controllers/interviewController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI question generation (must be before /:id routes)
router.post("/generate-questions", authenticateToken, requireRole(["management_admin", "recruiter"]), generateInterviewQuestions);

router.get("/", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), getAllInterviews);
router.post("/", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), createInterview);
router.put("/:id/reschedule", authenticateToken, requireRole(["management_admin", "recruiter"]), rescheduleInterview);
router.put("/:id", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), updateInterview);
router.delete("/:id", authenticateToken, requireRole(["management_admin", "recruiter"]), deleteInterview);

export default router;

