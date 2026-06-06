import { LeaveRequest } from "../models/leaveModel.js";
import { User } from "../models/userModel.js";
import { StaffProfile } from "../models/staffModel.js";
import { getAssignedEmployeeEmails, isEmployeeAssignedToManager } from "../utils/hierarchyHelper.js";
import { ActivityLog } from "../models/activityLogModel.js";

export const getLeaves = async (req, res) => {
  try {
    const { role, email, id } = req.user;
    let query = {};

    if (role === "employee") {
      query = { email: email.toLowerCase() };
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
      query = { email: { $in: assignedEmails } };
    }

    const leaves = await LeaveRequest.find(query).sort({ appliedOn: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch leaves." });
  }
};

export const createLeave = async (req, res) => {
  try {
    const { employeeId, name, email, department, type, startDate, endDate, days, reason, status, appliedOn } = req.body;
    
    if (!employeeId || !name || !email || !department || !type || !startDate || !endDate || !days || !reason) {
      return res.status(400).json({ error: "Missing required leave fields." });
    }

    const newLeave = await LeaveRequest.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      department,
      type,
      startDate,
      endDate,
      days,
      reason,
      status: status || "Pending",
      appliedOn: appliedOn || new Date().toISOString().split("T")[0]
    });

    try {
      await ActivityLog.create({
        employeeEmail: email.toLowerCase(),
        action: "Leave Request Submitted",
        details: `${type} request submitted for ${days} days from ${startDate} to ${endDate}.`
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    res.status(201).json(newLeave);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create leave request." });
  }
};

export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    // Permission enforcement: if senior manager, check if employee reports to them
    if (req.user.role === "senior_manager") {
      const leaveRequest = await LeaveRequest.findById(id);
      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found." });
      }
      const isAssigned = await isEmployeeAssignedToManager(leaveRequest.email, req.user.id);
      if (!isAssigned) {
        return res.status(403).json({ error: "Access denied. Employee does not report to you." });
      }
    }

    const updated = await LeaveRequest.findByIdAndUpdate(
      id,
      { status, managerComment: managerComment || "" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Leave request not found." });
    }

    try {
      await ActivityLog.create({
        employeeEmail: updated.email.toLowerCase(),
        action: updated.status === "Approved" ? "Leave Approved" : "Leave Rejected",
        details: `Leave request for ${updated.type} from ${updated.startDate} to ${updated.endDate} was ${updated.status.toLowerCase()} by manager.`
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update leave request." });
  }
};
