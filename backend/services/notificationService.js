import { Notification } from "../models/notificationModel.js";

/**
 * Service function to create a backend notification record.
 * @param {Object} data - { title, message, type, recipientRole, recipientUserId }
 * @returns {Promise<Object>}
 */
export async function createNotification(data) {
  try {
    const { title, message, type = "info", recipientRole = "recruiter", recipientUserId } = data;
    const notif = new Notification({
      title,
      message,
      type,
      recipientRole,
      recipientUserId: recipientUserId ? recipientUserId.toLowerCase().trim() : null
    });
    await notif.save();
    return notif;
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
