import mongoose from "mongoose";

const LeaderboardItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  score: { type: Number, required: true },
  prevScore: { type: Number, required: true },
  color: { type: String }
});

const DeptChartItemSchema = new mongoose.Schema({
  dept: { type: String, required: true },
  score: { type: Number, required: true }
});

const DistributionItemSchema = new mongoose.Schema({
  band: { type: String, required: true },
  range: { type: String, required: true },
  count: { type: Number, required: true },
  color: { type: String }
});

const ReviewItemSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  manager: { type: String, required: true },
  last: { type: String },
  next: { type: String },
  status: { type: String, required: true }
});

const PerformanceQuarterSchema = new mongoose.Schema({
  quarter: { type: String, required: true, unique: true },
  companyAvg: { type: Number, required: true },
  topPerformers: { type: Number, required: true },
  needsImprovement: { type: Number, required: true },
  leaderboard: [LeaderboardItemSchema],
  deptChart: [DeptChartItemSchema],
  distribution: [DistributionItemSchema],
  reviews: [ReviewItemSchema]
});

export const PerformanceQuarter = mongoose.model("PerformanceQuarter", PerformanceQuarterSchema);

const PerformanceReviewSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  employeeName: { type: String, required: true },
  managerId: { type: String, required: true },
  managerName: { type: String, required: true },
  quarter: { type: String, required: true },
  score: { type: Number, required: true },
  strengths: { type: String, default: "" },
  improvements: { type: String, default: "" },
  reviewDate: { type: Date, default: Date.now },
  // Back-compatibility fields
  ratings: {
    technical: { type: Number },
    communication: { type: Number },
    teamwork: { type: Number },
    productivity: { type: Number },
    overall: { type: Number }
  },
  feedback: { type: String },
  date: { type: Date, default: Date.now }
});

export const PerformanceReview = mongoose.model("PerformanceReview", PerformanceReviewSchema);

