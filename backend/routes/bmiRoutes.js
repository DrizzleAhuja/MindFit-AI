// routes/bmiRoutes.js
const express = require("express");
const { saveBMI, getBMIHistory } = require("../controllers/bmiController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/save", saveBMI);
router.get("/history", getBMIHistory);

module.exports = router;