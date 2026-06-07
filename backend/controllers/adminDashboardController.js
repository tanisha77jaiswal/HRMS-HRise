import { StaffProfile } from "../models/staffModel.js";
import { Candidate } from "../models/candidateModel.js";
import { Job } from "../models/jobModel.js";
import { User } from "../models/userModel.js";
import { AttendanceRecord, AbsentToday, AttendanceTrend } from "../models/attendanceModel.js";
import { PerformanceReview } from "../models/performanceModel.js";

export const getDashboardData = async (req, res) => {
  try {
    // 1. KPI Stats
    const totalEmployees = await StaffProfile.countDocuments({});
    const activeStaffCount = await StaffProfile.countDocuments({ status: "active" });
    const denominator = activeStaffCount || 1;

    const totalCandidates = await Candidate.countDocuments({
      status: { $in: ["applied", "screened", "shortlisted", "interviewed", "selected"] }
    });
    const totalRecruiters = await User.countDocuments({ role: "recruiter" });
    const totalManagers = await User.countDocuments({ role: "senior_manager" });
    const openJobs = await Job.countDocuments({ status: { $in: ["open", "Active"] } });

    // 2. Hiring Funnel count aggregates
    const appliedCount = await Candidate.countDocuments({ status: { $in: ["applied", "screened"] } });
    const shortlistedCount = await Candidate.countDocuments({ status: "shortlisted" });
    const interviewedCount = await Candidate.countDocuments({ status: "interviewed" });
    const selectedCount = await Candidate.countDocuments({ status: "selected" });
    const hiredCount = await Candidate.countDocuments({ status: "hired" });

    const funnelData = [
      { stage: "Applied", count: appliedCount, fill: "#6366f1" },
      { stage: "Shortlisted", count: shortlistedCount, fill: "#8b5cf6" },
      { stage: "Interviewed", count: interviewedCount, fill: "#a855f7" },
      { stage: "Selected", count: selectedCount, fill: "#10b981" },
      { stage: "Hired", count: hiredCount, fill: "#06b6d4" }
    ];

    // 3. Candidates application monthly trend
    const candidates = await Candidate.find({});
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const monthlyCounts = months.reduce((acc, m) => {
      acc[m] = { name: m, apps: 0, shortlists: 0 };
      return acc;
    }, {});

    candidates.forEach((c) => {
      const dateStr = c.appliedDate || c.dateApplied;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
          const monthIndex = date.getMonth();
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthName = monthNames[monthIndex];
          if (monthlyCounts[monthName]) {
            monthlyCounts[monthName].apps += 1;
            if (["shortlisted", "interviewed", "selected", "hired"].includes(c.status)) {
              monthlyCounts[monthName].shortlists += 1;
            }
          }
        }
      }
    });
    const monthlyApps = Object.values(monthlyCounts);

    // 4. Department headcounts
    const employees = await StaffProfile.find({});
    const depts = {};
    employees.forEach((emp) => {
      const dept = emp.department || "Engineering";
      depts[dept] = (depts[dept] || 0) + 1;
    });

    const colors = {
      Engineering: "#6366f1",
      Product: "#a855f7",
      Design: "#ec4899",
      Sales: "#10b981",
      HR: "#f59e0b",
      Finance: "#3b82f6",
      Operations: "#14b8a6",
      Marketing: "#ec4899",
      Analytics: "#8b5cf6"
    };

    const deptDistribution = Object.entries(depts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#64748b"
    }));

    // 5. Daily Attendance Trend with dynamic denominator
    const trends = await AttendanceTrend.find({}).sort({ day: 1 });
    const attendanceTrend = trends.map(item => ({
      day: item.day,
      rate: Math.round((item.present / denominator) * 100)
    }));

    const dailyRecords = await AttendanceRecord.find({});
    const employeeMap = {};
    dailyRecords.forEach(rec => {
      const key = rec.employeeEmail ? rec.employeeEmail.toLowerCase() : rec.name;
      if (!employeeMap[key]) {
        employeeMap[key] = { present: 0, absent: 0 };
      }
      if (rec.status === "Present") {
        employeeMap[key].present++;
      } else if (rec.status === "Absent" || rec.status === "On Leave") {
        employeeMap[key].absent++;
      }
    });

    let sumPct = 0;
    let countEmps = 0;
    Object.values(employeeMap).forEach(emp => {
      const total = emp.present + emp.absent;
      if (total > 0) {
        sumPct += (emp.present / total) * 100;
        countEmps++;
      }
    });
    const overallAttendancePct = countEmps > 0 ? (sumPct / countEmps).toFixed(1) : "100.0";
    const overallAttendance = `${overallAttendancePct}%`;

    // Calculate absentToday dynamically for all active employees
    const activeStaff = await StaffProfile.find({ status: "active" });
    const activeEmails = activeStaff.map(s => s.email.toLowerCase());
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecords = await AttendanceRecord.find({
      employeeEmail: { $in: activeEmails },
      date: { $regex: `^${todayStr}` }
    });

    const presentEmails = new Set(todayRecords.filter(r => r.status === "Present").map(r => r.employeeEmail.toLowerCase()));
    const leaveEmails = new Set(todayRecords.filter(r => r.status === "On Leave").map(r => r.employeeEmail.toLowerCase()));

    // Pre-fetch all past attendance records for active staff to avoid N+1 query in loop
    const allPastRecords = await AttendanceRecord.find({
      employeeEmail: { $in: activeEmails }
    }).sort({ date: -1 });

    const recordsMap = {};
    allPastRecords.forEach(rec => {
      if (rec.employeeEmail) {
        const email = rec.employeeEmail.toLowerCase();
        if (!recordsMap[email]) {
          recordsMap[email] = [];
        }
        recordsMap[email].push(rec);
      }
    });

    const absentToday = [];
    for (let s of activeStaff) {
      const email = s.email.toLowerCase();
      if (!presentEmails.has(email) && !leaveEmails.has(email)) {
        const pastRecords = recordsMap[email] || [];

        let consecutive = 1;
        for (let rec of pastRecords) {
          if (rec.date === todayStr) continue;
          if (rec.status === "Absent") {
            consecutive++;
          } else {
            break;
          }
        }
        absentToday.push({
          id: s._id.toString(),
          name: s.name,
          dept: s.department || "Engineering",
          consecutive
        });
      }
    }

    // 6. Recruitment diagnostics
    const recruitmentStats = {
      total: totalCandidates,
      shortlisted: shortlistedCount,
      interviewed: interviewedCount,
      hired: hiredCount + selectedCount
    };

    const rejectedCount = await Candidate.countDocuments({ status: "rejected" });
    const appliedAndScreened = await Candidate.countDocuments({ status: { $in: ["applied", "screened"] } });

    const pieRecruitment = [
      { name: "Selected", value: hiredCount + selectedCount, color: "#10b981" },
      { name: "Shortlisted", value: shortlistedCount, color: "#8b5cf6" },
      { name: "Rejected", value: rejectedCount, color: "#ef4444" },
      { name: "Applied / Scanned", value: appliedAndScreened, color: "#6366f1" }
    ];

    // 7. AI resume skills pool frequency
    const skillCounts = {};
    candidates.forEach(c => {
      if (Array.isArray(c.skills)) {
        c.skills.forEach(s => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
      }
    });
    const aiSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const validCandidates = candidates.filter(c => c.aiScore > 0);
    const avgResume = validCandidates.length > 0
      ? Math.round(validCandidates.reduce((acc, c) => acc + c.aiScore, 0) / validCandidates.length)
      : 0;

    // Sync Analytics with Performance Module using the actual PerformanceReview collection
    const activeQuarterReviews = await PerformanceReview.find({ quarter: "Q2 2026" });
    const avgInterview = activeQuarterReviews.length > 0 
      ? Math.round((activeQuarterReviews.reduce((sum, r) => sum + (r.score !== undefined ? r.score : r.ratings?.overall || 0), 0) / activeQuarterReviews.length) * 10) / 10 
      : 0;
    const overallPerformance = `${avgInterview} / 100`;

    // 8. Headcount growth trend
    const departments = ["Engineering", "Product", "Design", "Sales", "HR"];
    const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const activeList = employees.map(e => {
      let joinYear = 2022;
      let joinMonth = 1;
      const joinStr = e.joinDate || e.dateJoined;
      if (joinStr) {
        const d = new Date(joinStr);
        if (!isNaN(d)) {
          joinYear = d.getFullYear();
          joinMonth = d.getMonth() + 1;
        }
      }
      return {
        department: e.department || "Engineering",
        joinYear,
        joinMonth
      };
    });

    const isEmpEmpty = activeList.length === 0;
    const growthData = monthsList.map((m, idx) => {
      const data = { month: m };
      departments.forEach(dept => {
        if (isEmpEmpty) {
          data[dept] = 0;
        } else {
          data[dept] = activeList.filter(e => 
            e.department.toLowerCase() === dept.toLowerCase() &&
            (e.joinYear < 2026 || (e.joinYear === 2026 && e.joinMonth <= idx + 1))
          ).length;
        }
      });
      return data;
    });

    res.status(200).json({
      kpis: {
        employees: totalEmployees,
        candidates: totalCandidates,
        recruiters: totalRecruiters,
        managers: totalManagers,
        openJobs
      },
      funnelData,
      monthlyApps,
      deptDistribution,
      attendance: {
        trend: attendanceTrend,
        absentToday,
        overallRate: overallAttendance
      },
      recruitmentStats,
      pieRecruitment,
      aiSkills,
      performance: {
        avgResumeScore: avgResume,
        avgInterviewScore: avgInterview,
        overallScore: overallPerformance
      },
      growthData
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch aggregated admin dashboard data." });
  }
};
