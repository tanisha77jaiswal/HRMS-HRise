import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";

async function verifyPerformance() {
  try {
    await mongoose.connect(mongoUri);
    const { PerformanceReview } = await import("./models/performanceModel.js");

    const email = "tanisha1@gmail.com";
    
    const reviews = await PerformanceReview.find({ employeeEmail: email }).sort({ date: -1 });
    console.log(`PerformanceReviews for ${email}:`, reviews);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
verifyPerformance();
