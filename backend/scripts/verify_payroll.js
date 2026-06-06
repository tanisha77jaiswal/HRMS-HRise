import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";

async function verifyPayroll() {
  try {
    await mongoose.connect(mongoUri);
    const { StaffProfile } = await import("./models/staffModel.js");
    const { PayrollRecord } = await import("./models/payrollModel.js");
    const { User } = await import("./models/userModel.js");

    const email = "tanisha1@gmail.com";
    
    const user = await User.findOne({ email });
    console.log("User:", user);

    const profile = await StaffProfile.findOne({ email });
    console.log("StaffProfile:", profile);

    const payroll = await PayrollRecord.find({ email });
    console.log("PayrollRecord (by email):", payroll);

    if (profile) {
      const payrollByName = await PayrollRecord.find({ name: profile.name });
      console.log("PayrollRecord (by name):", payrollByName);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
verifyPayroll();
