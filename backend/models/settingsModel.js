import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true, default: "default", unique: true },
  aiScoreThreshold: { type: Number, default: 75 },
  evaluationStrictness: { type: String, default: "Balanced Evaluation" },
  autoShortlist: { type: Boolean, default: true },
  sendShortlistEmails: { type: Boolean, default: true },
  sendInterviewEmails: { type: Boolean, default: true },
  workspaceTimezone: { type: String, default: "Asia/Kolkata (IST)" },
  medicalLeaveAllocated: { type: Number, default: 12 },
  casualLeaveAllocated: { type: Number, default: 10 },
  earnedLeaveAllocated: { type: Number, default: 15 }
});

export const Settings = mongoose.model("Settings", SettingsSchema);
