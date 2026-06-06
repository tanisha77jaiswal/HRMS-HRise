import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  experienceRequired: { type: Number, required: true },
  type: { type: String, default: "full-time" },
  description: { type: String, required: true },
  requiredSkills: [String],
  postedDate: { type: String, required: true },
  status: { type: String, default: "open" },
  applicantCount: { type: Number, default: 0 }
});

export const Job = mongoose.model("Job", JobSchema);
