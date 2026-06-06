import mongoose from "mongoose";

const PayrollRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  base: { type: Number, required: true },
  bonus: { type: Number, required: true },
  status: { type: String, required: true },
  lastPaymentDate: { type: String, default: "" }
});

export const PayrollRecord = mongoose.model("PayrollRecord", PayrollRecordSchema);
