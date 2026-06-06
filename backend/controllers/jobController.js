import { Job } from "../models/jobModel.js";

export const getAllJobs = async (req, res) => {
  try {
    const list = await Job.find({});
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const { id } = req.body;
    const fresh = await Job.findOneAndUpdate({ id }, req.body, { new: true, upsert: true });
    res.status(201).json(fresh);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const updated = await Job.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    await Job.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
