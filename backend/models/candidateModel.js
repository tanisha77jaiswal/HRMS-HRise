import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  skills: [String],
  missingSkills: [String],
  experienceYears: { type: Number },
  education: [
    { degree: String, institution: String, year: Number }
  ],
  aiScore: { type: Number, default: 0 },
  status: { type: String, default: "applied" },
  appliedDate: { type: Date, required: true, default: Date.now },
  matchPercentage: { type: Number, default: 0 },
  matchExplanation: { type: String },
  resumeFile: { type: String },
  jobId: { type: String },
  jobTitle: { type: String },
  interviewScheduled: { type: Boolean, default: false },
  interviewCompleted: { type: Boolean, default: false },
  screenedByHR: { type: Boolean, default: false },
  interviewScore: { type: Number },
}, { timestamps: true });

const CandidateProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  experienceYears: { type: Number },
  skills: [String],
  bio: { type: String },
  photoUrl: { type: String },
  education: [
    { degree: String, institution: String, year: Number }
  ]
});

export const Candidate = mongoose.model("Candidate", CandidateSchema);
export const CandidateProfile = mongoose.model("CandidateProfile", CandidateProfileSchema);
