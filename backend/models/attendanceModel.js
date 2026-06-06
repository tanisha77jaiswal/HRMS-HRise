import mongoose from "mongoose";

const AttendanceRecordSchema = new mongoose.Schema({
  employeeEmail: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  dept: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  checkIn: { type: String, default: "" },
  checkOut: { type: String, default: "" },
  hours: { type: Number, default: 0 },
  status: { type: String, enum: ["Present", "Absent", "On Leave"], default: "Present" }
});

const AbsentTodaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  dept: { type: String, required: true },
  consecutive: { type: Number, required: true }
});

const AttendanceTrendSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  present: { type: Number, required: true }
});

export const AttendanceRecord = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export const AbsentToday = mongoose.model("AbsentToday", AbsentTodaySchema);
export const AttendanceTrend = mongoose.model("AttendanceTrend", AttendanceTrendSchema);
