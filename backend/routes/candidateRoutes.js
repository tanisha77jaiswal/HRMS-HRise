import express from "express";
import {
  getAllCandidates,
  createCandidate,
  bulkCreateCandidates,
  updateCandidate,
  deleteCandidate,
  clearAllCandidates,
  getCandidateEvaluationData,
  applyForJob,
  screenBulkResumes,
} from "../controllers/candidateController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// HR / Admin routes
router.get(   "/",           authenticateToken, requireRole(["management_admin", "recruiter"]), getAllCandidates);
router.post(  "/",           authenticateToken, requireRole(["management_admin", "recruiter"]), createCandidate);
router.post(  "/bulk",       authenticateToken, requireRole(["management_admin", "recruiter"]), bulkCreateCandidates);
router.put(   "/:id",        authenticateToken, requireRole(["management_admin", "recruiter"]), updateCandidate);
router.delete("/:id",        authenticateToken, requireRole(["management_admin", "recruiter"]), deleteCandidate);
router.delete("/",           authenticateToken, requireRole(["management_admin", "recruiter"]), clearAllCandidates);
router.get(   "/:id/evaluation", authenticateToken, requireRole(["management_admin", "recruiter"]), getCandidateEvaluationData);



// HR Bulk Resume Screening — accepts multiple PDFs → Gemini AI parses each
router.post(
  "/screen-bulk",
  authenticateToken,
  requireRole(["management_admin", "recruiter"]),
  upload.array("resumes", 20),  // up to 20 files per request
  screenBulkResumes
);

// Candidate self-apply with single PDF upload
router.post("/apply", authenticateToken, upload.single("resume"), applyForJob);

export default router;
