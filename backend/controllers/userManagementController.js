import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { StaffProfile } from "../models/staffModel.js";

// GET all staff users (non-candidate)
export const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $ne: "candidate" } })
      .select("-password")
      .populate("reportingManager", "name email")
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// CREATE a new staff user
export const createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, status, reportingManagerId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const allowedRoles = ["recruiter", "senior_manager", "employee"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Allowed: recruiter, senior_manager, employee" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // Resolve manager if provided
    let resolvedManagerId = null;
    let managerName = "";
    let managerEmail = "";
    if (reportingManagerId) {
      const managerUser = await User.findById(reportingManagerId);
      if (managerUser) {
        resolvedManagerId = managerUser._id;
        managerName = managerUser.name;
        managerEmail = managerUser.email;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${role}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newUser = await User.create({
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      company: req.user.company || "N/A",
      department: department || "",
      designation: designation || "",
      status: status || "active",
      reportingManager: resolvedManagerId
    });

    // Create a matching StaffProfile so this user appears on employees page
    const profilesCount = await StaffProfile.countDocuments();
    const employeeId = `EMP${String(profilesCount + 1).padStart(3, "0")}`;
    await StaffProfile.create({
      email: email.toLowerCase(),
      name,
      department: department || "",
      designation: designation || "",
      jobTitle: designation || "",
      employeeId,
      joinDate: new Date().toISOString().split("T")[0],
      dateJoined: new Date().toISOString().split("T")[0],
      reportingManagerId: resolvedManagerId,
      reportingManagerEmail: managerEmail,
      manager: managerName,
      status: status || "active",
      attendance: 100
    });

    res.status(201).json({
      _id: newUser._id,
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      company: newUser.company,
      department: newUser.department,
      designation: newUser.designation,
      status: newUser.status,
      reportingManager: resolvedManagerId,
      createdAt: newUser.createdAt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// UPDATE a staff user
export const updateStaffUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, designation, status, reportingManagerId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.role === "candidate") {
      return res.status(403).json({ error: "Cannot modify candidate accounts from this module." });
    }

    const oldEmail = user.email;

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role && ["recruiter", "senior_manager", "employee"].includes(role)) user.role = role;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;
    if (status !== undefined) user.status = status;

    // Handle reporting manager updates
    let managerName = "";
    let managerEmail = "";
    let resolvedManagerId = null;

    if (reportingManagerId !== undefined) {
      if (reportingManagerId) {
        const managerUser = await User.findById(reportingManagerId);
        if (managerUser) {
          resolvedManagerId = managerUser._id;
          managerName = managerUser.name;
          managerEmail = managerUser.email;
          user.reportingManager = resolvedManagerId;
        } else {
          user.reportingManager = null;
        }
      } else {
        user.reportingManager = null;
      }
    } else if (user.reportingManager) {
      // Retain existing manager details for StaffProfile sync
      const managerUser = await User.findById(user.reportingManager);
      if (managerUser) {
        resolvedManagerId = managerUser._id;
        managerName = managerUser.name;
        managerEmail = managerUser.email;
      }
    }

    await user.save();

    // Synchronize to StaffProfile matching the old/new email
    let profile = await StaffProfile.findOne({ email: oldEmail.toLowerCase() });
    if (!profile && email) {
      profile = await StaffProfile.findOne({ email: email.toLowerCase() });
    }

    if (!profile) {
      const profilesCount = await StaffProfile.countDocuments();
      const employeeId = `EMP${String(profilesCount + 1).padStart(3, "0")}`;
      profile = new StaffProfile({
        email: user.email.toLowerCase(),
        employeeId,
        attendance: 100
      });
    }

    profile.name = user.name;
    profile.email = user.email;
    profile.department = user.department;
    profile.designation = user.designation;
    profile.jobTitle = user.designation;
    profile.status = user.status;
    profile.reportingManagerId = resolvedManagerId;
    profile.reportingManagerEmail = managerEmail;
    profile.manager = managerName;
    await profile.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      department: user.department,
      designation: user.designation,
      status: user.status,
      reportingManager: user.reportingManager,
      createdAt: user.createdAt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE a staff user
export const deleteStaffUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.role === "management_admin") {
      return res.status(403).json({ error: "Cannot delete Management Admin accounts." });
    }
    if (user.role === "candidate") {
      return res.status(403).json({ error: "Cannot delete candidate accounts from this module." });
    }
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "Staff account deleted." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
