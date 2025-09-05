// routes/bmiRoutes.js
const express = require("express");
const {
  saveBMI,
  getBMIHistory,
  updateBMI,
  getProgressTracking,
} = require("../controllers/bmiController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/save", saveBMI);
router.get("/history", getBMIHistory);
router.put("/update", updateBMI);
router.get("/progress", getProgressTracking);

module.exports = router;
