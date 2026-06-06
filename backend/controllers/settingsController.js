import { Settings } from "../models/settingsModel.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ workspaceId: "default" });
    if (!settings) {
      settings = await Settings.create({ workspaceId: "default" });
    }
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const saveSettings = async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate(
      { workspaceId: "default" },
      req.body,
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
