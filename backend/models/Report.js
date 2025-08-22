const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reportID: {
    type: String,
    required: true,
    unique: true,
    default: () => `RPT-${Date.now()}`,
  },
  reportType: { type: String, enum: ["lost", "found"], required: true },
  location: { type: String, required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  claimedBy: { type: String },
  claimedAt: { type: Date },
  read: { type: Boolean, default: false },
  responseMessage: { type: String },
  otp: { type: String },
  proofDescription: { type: String },
  verificationStatus: {
    type: String,
    default: "under verification",
  },
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
