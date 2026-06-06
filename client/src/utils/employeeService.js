/**
 * Employee Module Service Layer
 * Deals with backend MERN API integrations for the 'employee' role.
 * Removed all localStorage mock persistence.
 */

import { api } from "./api";

export const employeeService = {
  // ─── 1. Profile ─────────────────────────────────────────────────────────────
  getProfile: async (email) => {
    try {
      const res = await api.employeeDashboard.get();
      return res.profile;
    } catch (e) {
      console.error("Failed to get employee profile:", e);
      return null;
    }
  },

  updateProfile: async (email, updatedFields) => {
    try {
      // Send allowed fields only
      const fields = {
        phone: updatedFields.phone,
        location: updatedFields.location,
        photoUrl: updatedFields.photoUrl
      };
      return await api.employeeDashboard.updateProfile(fields);
    } catch (e) {
      console.error("Failed to update employee profile:", e);
      return null;
    }
  },

  // ─── 2. Attendance ──────────────────────────────────────────────────────────
  getAttendance: async (email) => {
    try {
      const res = await api.employeeDashboard.get();
      return res.attendance;
    } catch (e) {
      console.error("Failed to get attendance:", e);
      return null;
    }
  },

  checkIn: async (email) => {
    try {
      await api.employeeDashboard.checkIn();
      const res = await api.employeeDashboard.get();
      return res.attendance;
    } catch (e) {
      console.error("Check in failed:", e);
      return null;
    }
  },

  checkOut: async (email) => {
    try {
      await api.employeeDashboard.checkOut();
      const res = await api.employeeDashboard.get();
      return res.attendance;
    } catch (e) {
      console.error("Check out failed:", e);
      return null;
    }
  },

  // ─── 3. Leave Management ──────────────────────────────────────────────────
  getLeaves: async (email) => {
    try {
      const res = await api.employeeDashboard.get();
      return res.leaves;
    } catch (e) {
      console.error("Failed to load leaves:", e);
      return { balances: [], requests: [] };
    }
  },

  applyLeave: async (email, leave) => {
    try {
      const dash = await api.employeeDashboard.get();
      const profile = dash.profile;
      
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const payload = {
        employeeId: profile.employeeId,
        name: profile.name,
        email: email.toLowerCase(),
        department: profile.department,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: diffDays,
        reason: leave.reason
      };

      await api.leaves.create(payload);
      
      // Return updated leaves data
      const res = await api.employeeDashboard.get();
      return res.leaves;
    } catch (e) {
      console.error("Failed to apply leave:", e);
      return null;
    }
  },

  // ─── 4. Payroll ─────────────────────────────────────────────────────────────
  getPayroll: async (email) => {
    try {
      const res = await api.employeeDashboard.get();
      return res.payroll;
    } catch (e) {
      console.error("Failed to load payroll:", e);
      return null;
    }
  },

  // ─── 5. Performance ────────────────────────────────────────────────────────
  getPerformance: async (email) => {
    try {
      const res = await api.employeeDashboard.get();
      return res.performance;
    } catch (e) {
      console.error("Failed to load performance metrics:", e);
      return null;
    }
  },

  // ─── 6. Recent Activity ────────────────────────────────────────────────────
  getRecentActivity: async (email) => {
    try {
      const res = await api.employeeDashboard.get();
      return res.activities;
    } catch (e) {
      console.error("Failed to load recent activity:", e);
      return [];
    }
  }
};
