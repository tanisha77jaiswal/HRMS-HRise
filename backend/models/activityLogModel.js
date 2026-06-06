import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema({
  employeeEmail: { type: String, required: true, lowercase: true, trim: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
