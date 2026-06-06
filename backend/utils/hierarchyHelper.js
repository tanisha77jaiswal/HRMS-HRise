import { StaffProfile } from "../models/staffModel.js";
import { User } from "../models/userModel.js";

/**
 * Get all employee emails assigned to a given senior manager.
 * @param {string} managerId - The _id of the senior manager User document
 * @returns {Promise<string[]>} Array of lowercase employee emails
 */
export const getAssignedEmployeeEmails = async (managerId) => {
  const profiles = await StaffProfile.find({ reportingManagerId: managerId });
  return profiles.map((p) => p.email.toLowerCase());
};

/**
 * Get all StaffProfile documents assigned to a given senior manager.
 * @param {string} managerId - The _id of the senior manager User document
 * @returns {Promise<StaffProfile[]>}
 */
export const getAssignedStaffProfiles = async (managerId) => {
  return StaffProfile.find({ reportingManagerId: managerId });
};

/**
 * Get the names of employees assigned to a given senior manager (for attendance filtering).
 * @param {string} managerId - The _id of the senior manager User document
 * @returns {Promise<string[]>} Array of employee names
 */
export const getAssignedEmployeeNames = async (managerId) => {
  const profiles = await StaffProfile.find({ reportingManagerId: managerId });
  return profiles.map((p) => p.name);
};

/**
 * Get the department(s) of employees assigned to a given senior manager.
 * @param {string} managerId - The _id of the senior manager User document
 * @returns {Promise<string[]>} Array of unique department names
 */
export const getAssignedDepartments = async (managerId) => {
  const profiles = await StaffProfile.find({ reportingManagerId: managerId });
  const depts = [...new Set(profiles.map((p) => p.department).filter(Boolean))];
  return depts;
};

/**
 * Validate that an employee is assigned to a specific manager.
 * @param {string} employeeEmail - The email of the employee
 * @param {string} managerId - The _id of the senior manager
 * @returns {Promise<boolean>}
 */
export const isEmployeeAssignedToManager = async (employeeEmail, managerId) => {
  const profile = await StaffProfile.findOne({
    email: employeeEmail.toLowerCase(),
    reportingManagerId: managerId,
  });
  return !!profile;
};
