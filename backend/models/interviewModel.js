import mongoose from "mongoose";

const InterviewSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  candidateId: { type: String },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String },
  jobId: { type: String },
  jobTitle: { type: String },
  questions: [
    { id: String, question: String, category: String, difficulty: String }
  ],
  answers: [
    {
      questionId: String,
      audioUrl: String,
      videoUrl: String,
      transcript: String,
      analysis: {
        communicationScore: Number,
        confidenceScore: Number,
        overallRating: Number,
        keywordMatches: [String],
        summary: String
      }
    }
  ],
  status: { type: String, default: "scheduled" },
  scheduledDate: { type: String },
  createdAt: { type: String },
  completedAt: { type: String },
  rescheduledAt: { type: String },
  rescheduleReason: { type: String }
}, { timestamps: true });

export const InterviewSession = mongoose.model("InterviewSession", InterviewSessionSchema);
