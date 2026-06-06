import { Notification } from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email?.toLowerCase().trim();

    let query = {};
    if (userRole === "candidate") {
      query = {
        recipientRole: "candidate",
        recipientUserId: userEmail
      };
    } else if (userRole === "recruiter" || userRole === "management_admin") {
      query = {
        recipientRole: { $in: ["recruiter", "management_admin", "all"] }
      };
    } else {
      query = {
        recipientRole: userRole
      };
    }

    const list = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createNotificationController = async (req, res) => {
  try {
    const { title, message, type, recipientRole, recipientUserId } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "title and message are required." });
    }
    const notification = new Notification({
      title,
      message,
      type: type || "info",
      recipientRole: recipientRole || "recruiter",
      recipientUserId: recipientUserId ? recipientUserId.toLowerCase().trim() : null
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { readStatus: true } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Notification not found." });
    }
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const markAllAsReadBatch = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email?.toLowerCase().trim();

    let query = {};
    if (userRole === "candidate") {
      query = { recipientRole: "candidate", recipientUserId: userEmail };
    } else if (userRole === "recruiter" || userRole === "management_admin") {
      query = { recipientRole: { $in: ["recruiter", "management_admin", "all"] } };
    } else {
      query = { recipientRole: userRole };
    }

    await Notification.updateMany(query, { $set: { readStatus: true } });
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Notification not found." });
    }
    res.json({ success: true, message: "Notification deleted." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email?.toLowerCase().trim();

    let query = {};
    if (userRole === "candidate") {
      query = {
        recipientRole: "candidate",
        recipientUserId: userEmail
      };
    } else if (userRole === "recruiter" || userRole === "management_admin") {
      query = {
        recipientRole: { $in: ["recruiter", "management_admin", "all"] }
      };
    } else {
      query = {
        recipientRole: userRole
      };
    }

    await Notification.deleteMany(query);
    res.json({ success: true, message: "All notifications cleared." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
