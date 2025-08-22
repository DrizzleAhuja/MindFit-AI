const moment = require("moment-timezone");
const UserLog = require("../models/userLogModel");

// Save a new user log
const saveUserLog = async (req, res) => {
  try {
  
    const newLog = new UserLog({
      userId: req.body.userId, // Save the user ID
      userEmail: req.body.userEmail, // Save the user email
      action: req.body.action,
      timestamp: new Date(req.body.timestamp), // Store in UTC
    });
    await newLog.save();
    res.status(201).json({ message: "User log saved successfully!" });
  } catch (error) {
    console.error("Error saving user log:", error);
    res
      .status(500)
      .json({ message: "Failed to save user log", error: error.message });
  }
};

// Get all user logs and convert timestamps to IST
const getUserLogs = async (req, res) => {
  try {
    const logs = await UserLog.find();
    const logsWithIST = logs.map((log) => ({
      ...log.toObject(),
      timestamp: moment(log.timestamp)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DDTHH:mm:ss.SSSZ"), // Convert to IST
    }));
    res.status(200).json(logsWithIST);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user logs", error });
  }
};

// Get logs by user ID and convert timestamps to IST
const getUserLogsByUser = async (req, res) => {
  try {
    const logs = await UserLog.find({ userId: req.params.userId }); // Query by userId
    const logsWithIST = logs.map((log) => ({
      ...log.toObject(),
      timestamp: moment(log.timestamp)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DDTHH:mm:ss.SSSZ"), // Convert to IST
    }));
    res.status(200).json(logsWithIST);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch user logs by user", error });
  }
};

module.exports = { saveUserLog, getUserLogs, getUserLogsByUser };
