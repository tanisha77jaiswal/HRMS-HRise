import { api } from "./api";

export async function addHriseNotification(title, message, type = "info", targetRole = "all") {
  const rolesToNotify = [];
  
  if (targetRole === "all") {
    rolesToNotify.push("candidate", "recruiter");
  } else {
    targetRole.split(",").forEach((r) => {
      const trimmed = r.trim();
      if (trimmed) rolesToNotify.push(trimmed);
    });
  }

  for (const role of rolesToNotify) {
    try {
      await api.notifications.create({
        title,
        message,
        type,
        recipientRole: role
      });
    } catch (e) {
      console.error(`Failed to add notification for ${role}:`, e);
    }
  }

  // Dispatch custom events to notify active React components in the same window
  window.dispatchEvent(new Event("hrise_notifications_update"));
  window.dispatchEvent(new Event("storage"));
}

