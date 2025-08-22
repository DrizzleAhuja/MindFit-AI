const express = require("express");
const {
  getUserLogs,
  getUserLogsByUser,
  saveUserLog,
} = require("../controllers/userLogController");
const {
  getAdminLogs,
  saveAdminLog,
} = require("../controllers/adminLogController");
const authenticateUser = require("../middlewares/authMiddleware");
const router = express.Router();

// Routes for User Logs
router.get("/user-logs",getUserLogs);
router.get("/user-logs/:userId", getUserLogsByUser);
router.post("/user-logs",  saveUserLog); // Route to save user logs

// Routes for Admin Logs
router.get("/admin-logs",  getAdminLogs);
router.post("/admin-logs",  saveAdminLog); // Route to save admin logs

module.exports = router;
