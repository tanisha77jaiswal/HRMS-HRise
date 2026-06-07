import { AttendanceRecord, AbsentToday, AttendanceTrend } from "../models/attendanceModel.js";
import { User } from "../models/userModel.js";
import { StaffProfile } from "../models/staffModel.js";
import { getAssignedEmployeeNames } from "../utils/hierarchyHelper.js";

export const getAttendanceData = async (req, res) => {
  try {
    let query = {};
    let isManagerView = false;

    if (req.user.role === "senior_manager") {
      isManagerView = true;
      let department = req.user.department;
      if (!department) {
        const u = await User.findById(req.user.id);
        department = u?.department;
      }
      if (!department && req.user.email) {
        const profile = await StaffProfile.findOne({ email: req.user.email.toLowerCase() });
        department = profile?.department;
      }

      const assignedNames = await getAssignedEmployeeNames(req.user.id);
      query = { name: { $in: assignedNames } };
      if (department) {
        query.dept = department;
      }
    }

    // 1. Get active staff profiles under scope
    let staffQuery = { status: "active" };
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

      const assignedNames = await getAssignedEmployeeNames(req.user.id);
      staffQuery.name = { $in: assignedNames };
      if (department) {
        staffQuery.department = department;
      }
    }

    const activeStaff = await StaffProfile.find(staffQuery);
    const activeEmployeeCount = activeStaff.length;
    const denominator = Math.max(activeEmployeeCount, 1);

    const activeEmails = activeStaff.map(s => s.email.toLowerCase());

    // Month parsing for filtering metrics
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();
    const defaultMonthStr = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    const selectedMonth = req.query.month || defaultMonthStr;
    const parts = selectedMonth.split(" ");
    const monthName = parts[0];
    const year = parseInt(parts[1], 10) || currentDate.getFullYear();
    const monthIndex = monthNames.indexOf(monthName);
    const resolvedMonth = monthIndex !== -1 ? monthIndex + 1 : currentDate.getMonth() + 1;
    const startMonthStr = `${year}-${String(resolvedMonth).padStart(2, '0')}`;
    const isCurrentMonth = (year === currentDate.getFullYear() && (monthIndex !== -1 ? monthIndex : currentDate.getMonth()) === currentDate.getMonth());

    const dailyRecords = await AttendanceRecord.find({
      employeeEmail: { $in: activeEmails },
      date: { $regex: `^${startMonthStr}` }
    });

    // 2. Calculate today's attendance from AttendanceRecord dynamically (always today)
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecords = await AttendanceRecord.find({
      employeeEmail: { $in: activeEmails },
      date: { $regex: `^${todayStr}` }
    });

    const todayPresentRecords = todayRecords.filter(r => r.status === "Present");
    const todayPresent = activeEmployeeCount === 0 ? 0 : todayPresentRecords.length;
    const todayAbsent = activeEmployeeCount === 0 ? 0 : Math.max(0, activeEmployeeCount - todayPresent);
    const attendanceRate = activeEmployeeCount === 0 ? 0 : parseFloat(((todayPresent / denominator) * 100).toFixed(1));

    // 3. Group database dailyRecords by email
    const recordGroups = {};
    activeEmails.forEach(email => {
      recordGroups[email] = { present: 0, absent: 0, leaves: 0 };
    });

    dailyRecords.forEach(rec => {
      const email = rec.employeeEmail ? rec.employeeEmail.toLowerCase() : "";
      if (email && recordGroups[email] !== undefined) {
        if (rec.status === "Present") {
          recordGroups[email].present++;
        } else if (rec.status === "Absent") {
          recordGroups[email].absent++;
        } else if (rec.status === "On Leave") {
          recordGroups[email].leaves++;
        }
      }
    });

    // Construct the Monthly report records for ALL active employees dynamically
    const presentEmails = new Set(todayPresentRecords.map(r => r.employeeEmail.toLowerCase()));
    const leaveEmails = new Set(todayRecords.filter(r => r.status === "On Leave").map(r => r.employeeEmail.toLowerCase()));

    const records = activeStaff.map(s => {
      const email = s.email.toLowerCase();
      const stats = recordGroups[email] || { present: 0, absent: 0, leaves: 0 };
      
      const isAbsentToday = isCurrentMonth && !presentEmails.has(email) && !leaveEmails.has(email);
      const displayAbsent = stats.absent + (isAbsentToday ? 1 : 0);
      
      const totalDays = stats.present + displayAbsent;
      const pct = totalDays > 0 ? parseFloat(((stats.present / totalDays) * 100).toFixed(1)) : 100.0;
      
      return {
        name: s.name,
        dept: s.department || "Engineering",
        present: stats.present,
        absent: displayAbsent,
        leaves: stats.leaves,
        pct: pct
      };
    });

    // 4. Department-level attendance breakdown
    const deptMap = {};
    records.forEach(emp => {
      const dept = emp.dept || "General";
      if (!deptMap[dept]) {
        deptMap[dept] = { dept, present: 0, total: 0 };
      }
      deptMap[dept].present += emp.present;
      deptMap[dept].total += emp.present + emp.absent;
    });
    const departmentStats = Object.values(deptMap).map(d => ({
      dept: d.dept,
      attendanceRate: d.total > 0 ? parseFloat(((d.present / d.total) * 100).toFixed(1)) : 0
    }));

    // 5. Dynamic 30-Day Trend
    const daysInMonth = new Date(year, resolvedMonth, 0).getDate();
    const presentCountsByDay = {};
    for (let d = 1; d <= daysInMonth; d++) {
      presentCountsByDay[d] = 0;
    }

    dailyRecords.forEach(rec => {
      if (rec.status === "Present") {
        const dateParts = rec.date.split("-");
        const dayNum = parseInt(dateParts[2], 10);
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          presentCountsByDay[dayNum]++;
        }
      }
    });

    const trendWithRate = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const presentVal = presentCountsByDay[d];
      trendWithRate.push({
        day: d,
        present: presentVal,
        rate: parseFloat(((presentVal / denominator) * 100).toFixed(1))
      });
    }

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

    console.log("---- ATTENDANCE API TRIGGERED ----");
    console.log("activeEmployeeCount:", activeEmployeeCount);
    console.log("denominator:", denominator);
    console.log("todayPresent:", todayPresent);
    console.log("todayAbsent:", todayAbsent);
    console.log("attendanceRate:", attendanceRate);

    res.status(200).json({
      records,
      absentToday,
      trend: trendWithRate,
      activeEmployeeCount,
      todayPresent,
      todayAbsent,
      attendanceRate,
      departmentStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch attendance data" });
  }
};

