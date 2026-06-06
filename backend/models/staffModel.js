import mongoose from "mongoose";

const StaffProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  location: { type: String },
  department: { type: String },
  jobTitle: { type: String },
  designation: { type: String },
  employeeId: { type: String },
  dateJoined: { type: String },
  joinDate: { type: String },
  notificationLevel: { type: String },
  language: { type: String },
  photoUrl: { type: String },
  salaryBand: { type: String },
  salary: { type: Number, default: 0 },
  manager: { type: String },
  reportingManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reportingManagerEmail: { type: String, default: "" },
  skills: [String],
  attendance: { type: Number },
  status: { type: String, default: "active" }
});

export const StaffProfile = mongoose.model("StaffProfile", StaffProfileSchema);
