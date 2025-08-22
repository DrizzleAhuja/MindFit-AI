const express = require("express");
const {
  createReport,
  getReports,
  getReportsByUser,
  editReport,
  deleteReport,
  claimReport,
  verifyReport,
  resetReport,
  markNotificationAsRead,
  sendOTPtoFound
} = require("../controllers/reportController");
const authenticateUser = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authenticateUser, createReport);
router.get("/", getReports);
router.get("/user", authenticateUser, getReportsByUser);
router.put("/:id", authenticateUser, editReport);
router.delete("/:id", authenticateUser, deleteReport);
router.put("/:id/claim", authenticateUser, claimReport);
router.put("/notification/:id/read", authenticateUser, markNotificationAsRead); // Update endpoint
router.put("/:id/verify", verifyReport);
router.put("/:id/reset", authenticateUser, resetReport);
router.put("/:id/send-otp", authenticateUser, sendOTPtoFound);
module.exports = router;
