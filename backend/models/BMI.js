const mongoose = require("mongoose");
// backend/models/BMI.js
const BMISchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  heightFeet: { type: Number, required: true }, // in feet
  heightInches: { type: Number, required: true }, // in inches
  weight: { type: Number, required: true }, // in kg
  age: { type: Number, required: true },
  diseases: [{ type: String }], // array of diseases
  allergies: [{ type: String }], // array of allergies
  bmi: { type: Number, required: true },
  category: { type: String, required: true },
  selectedPlan: {
    type: String,
    enum: ["lose_weight", "gain_weight", "build_muscles"],
    default: null,
  },
  targetWeight: { type: Number }, // Target weight in kg
  targetTimeline: { type: String }, // Target timeline (e.g., "6 months")
  aiSuggestions: { type: String }, // Gemini AI suggestions
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BMI", BMISchema);
