import express from "express";
import {
  getNotifications,
  createNotificationController,
  markAsRead,
  markAllAsReadBatch,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.post("/", authenticateToken, createNotificationController);
router.patch("/read-all", authenticateToken, markAllAsReadBatch);
router.patch("/:id/read", authenticateToken, markAsRead);
router.delete("/:id", authenticateToken, deleteNotification);
router.delete("/", authenticateToken, clearAllNotifications);

export default router;
