// // Workout Plan Schema
// const mongoose = require('mongoose')
// const workoutSchema = new mongoose.Schema({
//     fitnessLevel: String,
//     fitnessGoal: String,
//     workoutType: String,
//     frequency: String,
//     duration: String,
//     plan: String,
//     createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Workout", workoutSchema)
const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Foreign key reference
    fitnessLevel: String,
    fitnessGoal: String,
    workoutType: String,
    frequency: String,
    duration: String,
    plan: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Workout", workoutSchema);
