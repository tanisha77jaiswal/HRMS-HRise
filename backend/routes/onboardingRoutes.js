import express from "express";
import { 
  getAllOnboarding, 
  createOnboarding, 
  updateOnboarding, 
  convertToEmployee,
  generateOfferLetter
} from "../controllers/onboardingController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all onboarding records (available to admin, recruiter, senior manager, and candidates)
router.get("/", authenticateToken, requireRole(["management_admin", "recruiter", "senior_manager", "candidate"]), getAllOnboarding);

// Create or update onboarding record
router.post("/", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), createOnboarding);

// Generate offer letter via AI or Fallback
router.post("/generate-offer", authenticateToken, requireRole(["management_admin", "recruiter"]), generateOfferLetter);

// Update a specific onboarding record by ID
router.put("/:id", authenticateToken, requireRole(["management_admin", "recruiter", "candidate"]), updateOnboarding);

// Convert Candidate to Employee when criteria are fully met (restricted to recruiter and admin)
router.post("/:id/convert", authenticateToken, requireRole(["management_admin", "recruiter"]), convertToEmployee);

export default router;
