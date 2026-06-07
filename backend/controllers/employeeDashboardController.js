import { StaffProfile } from "../models/staffModel.js";
import { User } from "../models/userModel.js";
import { Settings } from "../models/settingsModel.js";
import { LeaveRequest } from "../models/leaveModel.js";
import { AttendanceRecord } from "../models/attendanceModel.js";
import { PayrollRecord } from "../models/payrollModel.js";
import { PerformanceReview } from "../models/performanceModel.js";
import { ActivityLog } from "../models/activityLogModel.js";

// Helper to count weekdays
function getWorkingDaysCount(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start) || isNaN(end) || start > end) return 0;
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Helper to get past date
const getPastDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

// Helper to format activity date
function formatActivityDate(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Helper to parse duration
function calculateHours(checkInStr, checkOutStr) {
  const today = new Date().toISOString().split("T")[0];
  const inDate = new Date(`${today} ${checkInStr}`);
  const outDate = new Date(`${today} ${checkOutStr}`);
  if (isNaN(inDate) || isNaN(outDate) || outDate < inDate) return 0;
  const diffMs = outDate - inDate;
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
}

export const getDashboardData = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    
    // 1. Employee Profile
    let profile = await StaffProfile.findOne({ email });
    if (!profile) {
      // Create a default profile matching the user if not found for testing
      const user = await User.findById(req.user.id);
      profile = await StaffProfile.create({
        email,
        name: req.user.name || user?.name || "Employee",
        designation: user?.designation || "Staff Member",
        department: user?.department || "Operations",
        employeeId: "EMP" + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
        joinDate: new Date().toISOString().split("T")[0],
        dateJoined: new Date().toISOString().split("T")[0],
        manager: "Management Admin",
        status: "active"
      });
    }

    // 2. User Account (for Last Login Time)
    const userDoc = await User.findById(req.user.id);
    const lastLoginTime = userDoc?.lastLogin ? userDoc.lastLogin.toISOString() : null;

    // 3. Settings (Leave Policies)
    const settings = await Settings.findOne({ workspaceId: "default" }) || {
      medicalLeaveAllocated: 12,
      casualLeaveAllocated: 10,
      earnedLeaveAllocated: 15
    };

    // 4. Leave Management & Balances
    const userLeaves = await LeaveRequest.find({ email });
    const approvedMedical = userLeaves
      .filter((l) => l.type === "Medical Leave" && l.status === "Approved")
      .reduce((sum, l) => sum + (l.days || 0), 0);
    const approvedCasual = userLeaves
      .filter((l) => l.type === "Casual Leave" && l.status === "Approved")
      .reduce((sum, l) => sum + (l.days || 0), 0);
    const approvedEarned = userLeaves
      .filter((l) => l.type === "Earned Leave" && l.status === "Approved")
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const leaveBalances = [
      { type: "Medical Leave", total: settings.medicalLeaveAllocated, remaining: Math.max(0, settings.medicalLeaveAllocated - approvedMedical) },
      { type: "Casual Leave", total: settings.casualLeaveAllocated, remaining: Math.max(0, settings.casualLeaveAllocated - approvedCasual) },
      { type: "Earned Leave", total: settings.earnedLeaveAllocated, remaining: Math.max(0, settings.earnedLeaveAllocated - approvedEarned) }
    ];

    // 5. Attendance & Clocking (Reusing AttendanceRecord collection)
    const attendanceRecords = await AttendanceRecord.find({ employeeEmail: email });
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecord = attendanceRecords.find(r => r.date === todayStr);

    let currentCheckIn = null;
    if (todayRecord) {
      currentCheckIn = {
        checkIn: todayRecord.checkIn,
        checkOut: todayRecord.checkOut || null,
        status: todayRecord.status
      };
    }

    const presentDays = attendanceRecords.filter(r => r.status === "Present").length;
    const absentDays = attendanceRecords.filter(r => r.status === "Absent").length;
    const leaveDays = attendanceRecords.filter(r => r.status === "On Leave").length;
    const workingDays = presentDays + absentDays;
    const attendancePct = workingDays > 0 ? parseFloat(((presentDays / workingDays) * 100).toFixed(1)) : null;

    const attendanceHistory = attendanceRecords.map(r => ({
      date: r.date,
      checkIn: r.checkIn || "--:--",
      checkOut: r.checkOut || "--:--",
      hours: r.hours || 0,
      status: r.status
    })).sort((a, b) => b.date.localeCompare(a.date));

    // 6. Salary & Payroll (Dynamic fetch from Payroll OR Profile salary)
    let payrollRecord = await PayrollRecord.findOne({ email });
    if (!payrollRecord) {
      payrollRecord = await PayrollRecord.findOne({ name: profile.name });
    }

    const baseSal = payrollRecord ? payrollRecord.base : 0;
    const bonusSal = payrollRecord ? payrollRecord.bonus : 0;
    const grossSal = baseSal + bonusSal;
    const ded = Math.floor(baseSal * 0.16 + 200);
    const net = grossSal > 0 ? grossSal - ded : 0;

    const currentSalary = payrollRecord ? net : null;
    const lastPaymentDate = payrollRecord ? (payrollRecord.lastPaymentDate || "N/A") : "N/A";
    const payrollStatus = payrollRecord ? payrollRecord.status : "No Data";

    const payrollHistory = payrollRecord ? [{
      id: payrollRecord._id,
      month: "Current Period",
      salary: net,
      base: baseSal,
      bonus: bonusSal,
      gross: grossSal,
      deductions: ded,
      netPay: net,
      status: payrollStatus,
      datePaid: lastPaymentDate
    }] : [];

    // 7. Performance Reviews & Feedback
    const reviews = await PerformanceReview.find({ employeeEmail: email }).sort({ date: -1 });
    
    let latestScore = "No Performance Review Available";
    let averageScore = "No Performance Review Available";
    let currentCycle = "Review Cycle: Not Available";
    let feedback = "No performance feedback available yet.";
    let feedbackManager = "N/A";
    let feedbackDate = null;
    let reviewsList = [];

    if (reviews.length > 0) {
      const latest = reviews[0];
      latestScore = latest.ratings.overall;
      
      const sum = reviews.reduce((acc, r) => acc + r.ratings.overall, 0);
      averageScore = parseFloat((sum / reviews.length).toFixed(1));
      
      currentCycle = `Review Cycle: ${latest.quarter}`;
      feedback = latest.feedback;
      feedbackManager = `${latest.managerName} (${latest.quarter})`;
      feedbackDate = latest.date.toISOString().split("T")[0];

      reviewsList = reviews.map(r => ({
        quarter: r.quarter,
        score: r.ratings.overall,
        rating: parseFloat((r.ratings.overall / 20).toFixed(1)),
        status: "Completed",
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      }));
    }

    // 8. Recent Activities (ActivityLogs)
    const logs = await ActivityLog.find({ employeeEmail: email }).sort({ timestamp: -1 }).limit(5);
    const activityFeed = logs.map(l => ({
      date: formatActivityDate(l.timestamp),
      action: l.action,
      details: l.details
    }));

    res.json({
      profile: {
        name: profile.name,
        email: profile.email,
        designation: profile.designation,
        department: profile.department,
        employeeId: profile.employeeId,
        joinDate: profile.joinDate || profile.dateJoined,
        manager: profile.manager,
        phone: profile.phone || "",
        location: profile.location || "",
        photoUrl: profile.photoUrl || "",
        skills: profile.skills || []
      },
      lastLoginTime,
      attendance: {
        summary: {
          percentage: attendancePct,
          present: presentDays,
          absent: absentDays,
          leaves: leaveDays
        },
        currentCheckIn,
        history: attendanceHistory
      },
      leaves: {
        balances: leaveBalances,
        requests: userLeaves
      },
      payroll: {
        summary: {
          salary: currentSalary,
          lastPaid: lastPaymentDate,
          status: payrollStatus
        },
        history: payrollHistory
      },
      performance: {
        score: latestScore,
        averageScore,
        grade: typeof latestScore === "number" ? (latestScore >= 90 ? "Excellent" : latestScore >= 75 ? "Good" : latestScore >= 60 ? "Average" : "Needs Improvement") : "N/A",
        cycle: currentCycle,
        feedback,
        feedbackManager,
        feedbackDate,
        reviews: reviewsList
      },
      activities: activityFeed
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load aggregated dashboard data." });
  }
};

export const updateEmployeeProfile = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const { phone, location, photoUrl } = req.body;

    const updated = await StaffProfile.findOneAndUpdate(
      { email },
      { phone, location, photoUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Employee profile not found." });
    }

    // Create activity log
    await ActivityLog.create({
      employeeEmail: email,
      action: "Profile Updated",
      details: "Updated contact/location profile details."
    });

    // Return normalized profile shape matching getDashboardData
    res.json({
      name: updated.name,
      email: updated.email,
      designation: updated.designation,
      department: updated.department,
      employeeId: updated.employeeId,
      joinDate: updated.joinDate || updated.dateJoined,
      manager: updated.manager,
      phone: updated.phone || "",
      location: updated.location || "",
      photoUrl: updated.photoUrl || "",
      skills: updated.skills || [],
      status: updated.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update profile." });
  }
};

export const employeeCheckIn = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const { localDate, localTime } = req.body;
    const todayStr = localDate || new Date().toISOString().split("T")[0];

    let record = await AttendanceRecord.findOne({ employeeEmail: email, date: todayStr });
    if (record) {
      return res.status(400).json({ error: "You have already clocked in today." });
    }

    const now = new Date();
    const timeStr = localTime || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Fetch profile for name and dept
    const profile = await StaffProfile.findOne({ email });

    record = await AttendanceRecord.create({
      employeeEmail: email,
      name: profile?.name || req.user.name || "Employee",
      dept: profile?.department || "Operations",
      date: todayStr,
      checkIn: timeStr,
      checkOut: "",
      hours: 0,
      status: "Present"
    });

    // Log Activity
    await ActivityLog.create({
      employeeEmail: email,
      action: "Check-In",
      details: `Clocked in for shift at ${timeStr}.`
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to check in." });
  }
};

export const employeeCheckOut = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const { localDate, localTime } = req.body;
    const todayStr = localDate || new Date().toISOString().split("T")[0];

    const record = await AttendanceRecord.findOne({ employeeEmail: email, date: todayStr });
    if (!record) {
      return res.status(400).json({ error: "You must clock in first before clocking out." });
    }
    if (record.checkOut) {
      return res.status(400).json({ error: "You have already clocked out today." });
    }

    const now = new Date();
    const timeStr = localTime || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    record.checkOut = timeStr;
    record.hours = calculateHours(record.checkIn, timeStr);
    await record.save();

    // Log Activity
    await ActivityLog.create({
      employeeEmail: email,
      action: "Check-Out",
      details: `Clocked out at ${timeStr} (${record.hours} hrs worked).`
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to check out." });
  }
};

export const logPayslipDownload = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const { month } = req.body;

    await ActivityLog.create({
      employeeEmail: email,
      action: "Payslip Downloaded",
      details: `Downloaded payslip for ${month || "current period"}.`
    });

    res.json({ success: true, message: "Payslip download activity logged." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to log payslip download." });
  }
};
