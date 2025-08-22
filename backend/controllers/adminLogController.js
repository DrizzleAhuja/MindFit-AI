const AdminLog = require("../models/adminLogModel");

// Save a new admin log
const saveAdminLog = async (req, res) => {
  try {
    console.log("Saving user log:", req.body);
    const newLog = new AdminLog({
      adminId: req.body.adminId, // Assuming the middleware provides admin details
      action: req.body.action,
      timestamp: new Date(),
    });
    await newLog.save();
    res.status(201).json({ message: "Admin log saved successfully!" });
  } catch (error) {
    console.error("Error saving user log:", error);
    res
      .status(500)
      .json({ message: "Failed to save user log", error: error.message });
  }
};

// Get all admin logs
const getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin logs", error });
  }
};

module.exports = { saveAdminLog, getAdminLogs };
