const mongoose = require('mongoose')
// backend/models/BMI.js
const BMISchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bmi: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BMI", BMISchema);
