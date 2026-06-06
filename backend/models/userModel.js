import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["management_admin", "recruiter", "senior_manager", "candidate", "employee"],
    required: true
  },
  company: { type: String },
  industry: { type: String },
  companySize: { type: String },
  department: { type: String },
  designation: { type: String },
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  lastLogin: { type: Date },
  refreshToken: { type: String },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", UserSchema);
