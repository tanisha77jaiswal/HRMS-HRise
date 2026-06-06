import mongoose from "mongoose";
import dotenv from "dotenv";
import { PayrollRecord } from "./models/payrollModel.js";
import { StaffProfile } from "./models/staffModel.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";

async function verify() {
  try {
    await mongoose.connect(mongoUri);
    const email = "tanisha1@gmail.com";
    
    console.log("Checking PayrollRecord for:", email);
    let record = await PayrollRecord.findOne({ email });
    if (!record) {
      console.log("No payroll record by email. Checking by name...");
      const profile = await StaffProfile.findOne({ email });
      if (profile) {
        record = await PayrollRecord.findOne({ name: profile.name });
      }
    }
    
    if (record) {
      console.log("FOUND PAYROLL RECORD:", record);
    } else {
      console.log("NO PAYROLL RECORD EXISTS.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
