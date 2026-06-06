import { PayrollRecord } from "../models/payrollModel.js";

export const getPayrollData = async (req, res) => {
  try {
    const records = await PayrollRecord.find({});
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch payroll data" });
  }
};

export const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await PayrollRecord.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update payroll status" });
  }
};

export const runPayroll = async (req, res) => {
  try {
    // Transition all processing/pending to Paid
    await PayrollRecord.updateMany({ status: { $ne: "Paid" } }, { status: "Paid" });
    const records = await PayrollRecord.find({});
    res.status(200).json({ message: "Payroll run completed", records });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to run payroll" });
  }
};
