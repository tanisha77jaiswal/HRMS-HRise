import { PerformanceQuarter, PerformanceReview } from "../models/performanceModel.js";
import { User } from "../models/userModel.js";
import { StaffProfile } from "../models/staffModel.js";
import { getAssignedEmployeeEmails, isEmployeeAssignedToManager } from "../utils/hierarchyHelper.js";
import { ActivityLog } from "../models/activityLogModel.js";

export const getPerformanceData = async (req, res) => {
  try {
    const activeStaff = await StaffProfile.find({}, 'email');
    const validEmails = new Set(activeStaff.map(s => s.email.toLowerCase()));

    const allReviews = await PerformanceReview.find({});
    // Filter out orphan reviews to maintain referential integrity
    const reviews = allReviews.filter(r => r.employeeEmail && validEmails.has(r.employeeEmail.toLowerCase()));
    
    // Group reviews by quarter
    const quarterGroups = {};
    const standardQuarters = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2025"];
    
    standardQuarters.forEach(q => {
      quarterGroups[q] = [];
    });

    reviews.forEach(r => {
      if (r.quarter) {
        if (!quarterGroups[r.quarter]) {
          quarterGroups[r.quarter] = [];
        }
        quarterGroups[r.quarter].push(r);
      }
    });

    const result = {};

    for (const [quarter, qReviews] of Object.entries(quarterGroups)) {
      // 1. Average Performance Score
      let averageScore = 0;
      if (qReviews.length > 0) {
        const sum = qReviews.reduce((s, r) => s + (r.score !== undefined ? r.score : r.ratings?.overall || 0), 0);
        averageScore = parseFloat((sum / qReviews.length).toFixed(1));
      }

      // 2. Top Performers (score >= 90)
      const topPerformers = qReviews.filter(r => (r.score !== undefined ? r.score : r.ratings?.overall || 0) >= 90).length;

      // 3. Employees Reviewed (distinct employeeId or employeeEmail)
      const reviewedEmployeeIds = new Set();
      qReviews.forEach(r => {
        if (r.employeeId) reviewedEmployeeIds.add(r.employeeId);
        else if (r.employeeEmail) reviewedEmployeeIds.add(r.employeeEmail.toLowerCase());
      });
      const employeesReviewed = reviewedEmployeeIds.size;

      // 4. Performance Distribution
      const excellentCount = qReviews.filter(r => (r.score !== undefined ? r.score : r.ratings?.overall || 0) >= 90).length;
      const goodCount = qReviews.filter(r => {
        const s = (r.score !== undefined ? r.score : r.ratings?.overall || 0);
        return s >= 75 && s < 90;
      }).length;
      const avgCount = qReviews.filter(r => {
        const s = (r.score !== undefined ? r.score : r.ratings?.overall || 0);
        return s >= 60 && s < 75;
      }).length;
      const poorCount = qReviews.filter(r => (r.score !== undefined ? r.score : r.ratings?.overall || 0) < 60).length;

      const distribution = [
        { band: "Excellent", range: "90–100", count: excellentCount, color: "#10b981" },
        { band: "Good",      range: "75–89",  count: goodCount,      color: "#6366f1" },
        { band: "Average",   range: "60–74",  count: avgCount,       color: "#f59e0b" },
        { band: "Poor",      range: "< 60",   count: poorCount,      color: "#ef4444" }
      ];

      // Helper for status text
      const getStatusText = (score) => {
        if (score >= 90) return "Excellent";
        if (score >= 75) return "Good";
        if (score >= 60) return "Average";
        return "Poor";
      };

      // Helper to format date as DD-MMM-YYYY (e.g. 05-Jun-2026)
      const formatDate = (dateVal) => {
        if (!dateVal) return "N/A";
        const d = new Date(dateVal);
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // 5. Table data
      const tableData = qReviews.map(r => {
        const score = (r.score !== undefined ? r.score : r.ratings?.overall || 0);
        return {
          id: r._id,
          employeeName: r.employeeName,
          managerName: r.managerName,
          score: score,
          quarter: r.quarter,
          status: getStatusText(score),
          reviewDate: formatDate(r.reviewDate || r.date)
        };
      });

      result[quarter] = {
        averageScore,
        topPerformers,
        employeesReviewed,
        distribution,
        tableData
      };
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch performance data" });
  }
};

export const getPerformanceReviews = async (req, res) => {
  try {
    const { role, email, id } = req.user;
    let query = {};

    if (role === "employee") {
      query = { employeeEmail: email.toLowerCase() };
    } else if (role === "senior_manager") {
      // Determine manager's department
      let department = req.user.department;
      if (!department) {
        const u = await User.findById(id);
        department = u?.department;
      }
      if (!department && email) {
        const profile = await StaffProfile.findOne({ email: email.toLowerCase() });
        department = profile?.department;
      }

      const assignedEmails = await getAssignedEmployeeEmails(id);
      query = { employeeEmail: { $in: assignedEmails } };
    }

    const reviews = await PerformanceReview.find(query).sort({ date: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch performance reviews" });
  }
};

export const createPerformanceReview = async (req, res) => {
  try {
    const { 
      employeeEmail, 
      employeeName, 
      managerName, 
      quarter, 
      ratings, 
      feedback,
      // Simplified structure inputs
      employeeId: inputEmployeeId,
      managerId: inputManagerId,
      score: inputScore,
      strengths,
      improvements,
      reviewDate
    } = req.body;

    const email = (employeeEmail || '').toLowerCase();
    
    // STRICT Referential Integrity Check
    const staff = await StaffProfile.findOne({ email });
    if (!staff) {
      return res.status(400).json({ error: "Employee must exist in StaffProfile to receive a performance review." });
    }

    const finalEmployeeId = inputEmployeeId || staff.employeeId || staff._id.toString();
    const finalEmployeeEmail = email;
    const finalEmployeeName = staff.name;

    // Resolve managerId
    const finalManagerId = inputManagerId || req.user.id;
    const finalManagerName = managerName || req.user.name || "Senior Manager";

    // Permission enforcement: if senior manager, check if employee reports to them
    if (req.user.role === "senior_manager") {
      const isAssigned = await isEmployeeAssignedToManager(finalEmployeeEmail, req.user.id);
      if (!isAssigned) {
        return res.status(403).json({ error: "Access denied. Employee does not report to you." });
      }
    }

    // Calculate score
    const finalScore = inputScore !== undefined 
      ? Number(inputScore) 
      : (ratings?.overall !== undefined ? Number(ratings.overall) : 85);

    // Calculate strengths/improvements/feedback
    const finalStrengths = strengths || feedback || "";
    const finalImprovements = improvements || "";
    const finalFeedback = feedback || `${finalStrengths}\n${finalImprovements}`.trim();

    // Calculate rating options
    const finalRatings = ratings || {
      technical: finalScore,
      communication: finalScore,
      teamwork: finalScore,
      productivity: finalScore,
      overall: finalScore
    };

    const newReview = await PerformanceReview.create({
      employeeId: finalEmployeeId,
      employeeEmail: finalEmployeeEmail,
      employeeName: finalEmployeeName,
      managerId: finalManagerId,
      managerName: finalManagerName,
      quarter,
      score: finalScore,
      strengths: finalStrengths,
      improvements: finalImprovements,
      reviewDate: reviewDate || new Date(),
      // Back-compatibility
      ratings: finalRatings,
      feedback: finalFeedback,
      date: reviewDate || new Date()
    });

    try {
      await ActivityLog.create({
        employeeEmail: finalEmployeeEmail,
        action: "Performance Review Received",
        details: `Received performance review for ${quarter} with overall score of ${finalScore}/100.`
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create performance review" });
  }
};

