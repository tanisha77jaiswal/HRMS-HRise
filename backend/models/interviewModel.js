import mongoose from "mongoose";

const InterviewSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  candidateId: { type: String },
  candidateName: { type: String, required: true },
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
      analysis: { communicationScore: Number, confidenceScore: Number, overallRating: Number }
    }
  ],
  status: { type: String, default: "scheduled" },
  scheduledDate: { type: String },
  createdAt: { type: String }
});

export const InterviewSession = mongoose.model("InterviewSession", InterviewSessionSchema);
