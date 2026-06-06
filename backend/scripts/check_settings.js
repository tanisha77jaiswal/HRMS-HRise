import mongoose from "mongoose";
import dotenv from "dotenv";
import { Settings } from "./models/settingsModel.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";

async function checkSettings() {
  try {
    await mongoose.connect(mongoUri);
    const settings = await Settings.findOne({ workspaceId: "default" });
    console.log("Settings in DB:", settings);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkSettings();
