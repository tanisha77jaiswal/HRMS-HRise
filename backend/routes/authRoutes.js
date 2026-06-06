import express from "express";
import { signup, login, getMe, updatePassword, refreshToken } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/me", authenticateToken, getMe);
router.put("/update-password", authenticateToken, updatePassword);

export default router;
