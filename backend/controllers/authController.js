import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/userModel.js";
import { ActivityLog } from "../models/activityLogModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "hrise_super_secure_jwt_token_secret_key_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + "_refresh";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, company, industry, companySize } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Server-side enforcement: workspace registration always creates management_admin
    // Candidates must explicitly pass role: "candidate"
    const safeRole = role === "candidate" ? "candidate" : "management_admin";

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${safeRole}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newUser = await User.create({
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: safeRole,
      company,
      industry,
      companySize
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: newUser._id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        company: newUser.company,
        industry: newUser.industry,
        companySize: newUser.companySize
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, company: user.company },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    if (user.role === "employee") {
      try {
        await ActivityLog.create({
          employeeEmail: user.email,
          action: "Login",
          details: "Logged into the HRise platform."
        });
      } catch (logErr) {
        console.error("Failed to log activity:", logErr);
      }
    }

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        company: user.company
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      company: user.company,
      industry: user.industry,
      companySize: user.companySize
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Invalid or expired refresh token." });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, company: user.company },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist." });
    }

    // Generate token and expiration
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Print professional email frame in server terminal logs for dev/demo retrieval
    console.log(`
============================================================
📧 [HRise Mailer] PASSWORD RESET REQUEST
------------------------------------------------------------
To: ${user.email}
Time: ${new Date().toLocaleString()}
Reset URL: ${resetUrl}
Expires In: 15 minutes
------------------------------------------------------------
This is a secure password reset link for your account.
If you did not make this request, please ignore this email.
============================================================
    `);

    try {
      await ActivityLog.create({
        employeeEmail: user.email,
        action: "Password Reset Link Sent",
        details: "Forgot password link printed to server logs."
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    res.status(200).json({ message: "Password reset link has been sent to your email." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: "Token, password, and confirmPassword are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Reset Link Expired" });
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    try {
      await ActivityLog.create({
        employeeEmail: user.email,
        action: "Password Updated",
        details: "Password was reset successfully using the reset token link."
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    res.status(200).json({ message: "Password updated successfully. Please login with your new password." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

