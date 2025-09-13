const mongoose = require("mongoose");

const dietChartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    workoutPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkoutPlan",
        required: true,
    },
    dietChart: {
        type: String,
        required: true,
    },
    durationWeeks: {
        type: Number,
        required: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

// Index for efficient queries
dietChartSchema.index({ userId: 1, workoutPlanId: 1 });
dietChartSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("DietChart", dietChartSchema);
