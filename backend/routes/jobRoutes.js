import express from "express";
import { getAllJobs, createJob, updateJob, deleteJob } from "../controllers/jobController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getAllJobs);
router.post("/", authenticateToken, requireRole(["management_admin", "recruiter"]), createJob);
router.put("/:id", authenticateToken, requireRole(["management_admin", "recruiter"]), updateJob);
router.delete("/:id", authenticateToken, requireRole(["management_admin", "recruiter"]), deleteJob);

export default router;
