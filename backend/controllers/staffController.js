import { StaffProfile } from "../models/staffModel.js";
import { User } from "../models/userModel.js";
import { AttendanceRecord } from "../models/attendanceModel.js";

export const getMyProfile = async (req, res) => {
  try {
    const profile = await StaffProfile.findOne({ email: req.user.email.toLowerCase() });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    let list;
    if (req.user.role === "senior_manager") {
      let department = req.user.department;
      if (!department) {
        const u = await User.findById(req.user.id);
        department = u?.department;
      }
      if (!department && req.user.email) {
        const profile = await StaffProfile.findOne({ email: req.user.email.toLowerCase() });
        department = profile?.department;
      }
      
      const query = { reportingManagerId: req.user.id };
      if (department) {
        query.department = department;
      }
      list = await StaffProfile.find(query);
    } else {
      list = await StaffProfile.find({});
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const saveStaffProfile = async (req, res) => {
  try {
    const { email } = req.body;
    const profile = await StaffProfile.findOneAndUpdate(
      { email: email?.toLowerCase() },
      req.body,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getSeniorManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: "senior_manager", status: "active" })
      .select("name email _id department")
      .sort({ name: 1 });
    res.json(managers);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch senior managers" });
  }
};

export const getWorkforceOverview = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "senior_manager") {
      let department = req.user.department;
      if (!department) {
        const u = await User.findById(req.user.id);
        department = u?.department;
      }
      if (!department && req.user.email) {
        const profile = await StaffProfile.findOne({ email: req.user.email.toLowerCase() });
        department = profile?.department;
      }
      query = { reportingManagerId: req.user.id };
      if (department) {
        query.department = department;
      }
    }

    const allStaffInScope = await StaffProfile.find(query);
    const activeStaffInScope = allStaffInScope.filter(s => s.status === "active");

    // 1. Department Count
    const departments = await StaffProfile.distinct("department", query);
    const departmentCount = departments.filter(Boolean).length;

    // 2. Employees On Leave Today
    const employeesOnLeaveToday = allStaffInScope.filter(s => s.status === "on_leave").length;

    // 3. New Employees This Year
    const currentYear = new Date().getFullYear();
    const getYearFromDateStr = (dateStr) => {
      if (!dateStr) return null;
      const match = dateStr.match(/^(\d{4})/);
      if (match) {
        return parseInt(match[1], 10);
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.getFullYear();
    };
    const newEmployeesThisYear = allStaffInScope.filter(s => {
      const year = getYearFromDateStr(s.joinDate || s.dateJoined);
      return year === currentYear;
    }).length;

    // 4. Salary Band Distribution
    const salaryBandDistribution = {};
    allStaffInScope.forEach(s => {
      const band = s.salaryBand;
      if (band && band !== "N/A") {
        salaryBandDistribution[band] = (salaryBandDistribution[band] || 0) + 1;
      }
    });

    // 5. Average Attendance across Active Employees (real DB calculations)
    let averageAttendance = 100.0;
    if (activeStaffInScope.length > 0) {
      const emails = activeStaffInScope.map(s => s.email.toLowerCase());
      const attendanceRecords = await AttendanceRecord.find({
        employeeEmail: { $in: emails }
      });

      const recordsByEmail = {};
      emails.forEach(email => {
        recordsByEmail[email] = { present: 0, absent: 0 };
      });

      attendanceRecords.forEach(rec => {
        const email = rec.employeeEmail.toLowerCase();
        if (recordsByEmail[email] !== undefined) {
          if (rec.status === "Present") {
            recordsByEmail[email].present++;
          } else if (rec.status === "Absent") {
            recordsByEmail[email].absent++;
          }
        }
      });

      let sumPct = 0;
      activeStaffInScope.forEach(s => {
        const email = s.email.toLowerCase();
        const counts = recordsByEmail[email];
        if (counts) {
          const totalDays = counts.present + counts.absent;
          const pct = totalDays > 0 ? (counts.present / totalDays) * 100 : 100.0;
          sumPct += pct;
        } else {
          sumPct += 100.0;
        }
      });

      averageAttendance = parseFloat((sumPct / activeStaffInScope.length).toFixed(1));
    }

    res.json({
      averageAttendance,
      departmentCount,
      employeesOnLeaveToday,
      newEmployeesThisYear,
      salaryBandDistribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch workforce overview statistics" });
  }
};

