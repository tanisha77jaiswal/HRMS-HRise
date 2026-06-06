import mongoose from "mongoose";

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  type: { type: String, required: true }, // Medical Leave, Casual Leave, Earned Leave
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  appliedOn: { type: String, required: true },
  managerComment: { type: String, default: "" }
});

export const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);
