import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";

async function verifyLeaves() {
  try {
    await mongoose.connect(mongoUri);
    const { Settings } = await import("./models/settingsModel.js");
    const { LeaveRequest } = await import("./models/leaveModel.js");

    const settings = await Settings.findOne({ workspaceId: "default" });
    console.log("Settings found:", settings);

    const email = "tanisha1@gmail.com";
    const leaves = await LeaveRequest.find({ email });
    console.log("Leave requests for tanisha1@gmail.com:", leaves);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
verifyLeaves();
