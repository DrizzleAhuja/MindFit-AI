import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true }, // Can be '8-12', 'to failure', etc.
    weight: { type: String }, // 'bodyweight', '10kg', 'N/A'
    rest: { type: String }, // '60 seconds', '2 minutes'
    notes: { type: String },
    demonstrationLink: { type: String }, // Optional link to exercise video
});

const WorkoutDaySchema = new mongoose.Schema({
    day: { type: String, required: true }, // e.g., 'Monday', 'Day 1'
    focus: { type: String }, // e.g., 'Chest & Triceps', 'Full Body'
    exercises: [ExerciseSchema],
    warmup: { type: String },
    cooldown: { type: String },
});

const WorkoutPlanSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        description: { type: String },
        isActive: { type: Boolean, default: false }, // Only one plan can be active at a time
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date }, // Can be set based on durationWeeks or manually
        durationWeeks: { type: Number, default: 4 }, // Default to 4 weeks
        // Optional: track progress per week if needed, e.g., an array of completion status for each week
        // weeklyProgress: [{ weekNumber: Number, completedDays: [String] }],
        generatedParams: {
            timeCommitment: { type: String, required: true },
            workoutType: { type: String, required: true },
            intensity: { type: String, required: true },
            equipment: { type: String, required: true },
            daysPerWeek: { type: Number, required: true },
            fitnessGoal: { type: String },
            gender: { type: String },
            strengthLevel: { type: String },
            trainingMethod: { type: String },
            bmiData: { type: Object }, // Store BMI data at the time of generation
        },
        planContent: [WorkoutDaySchema], // Structured plan content
    },
    { timestamps: true }
);

const WorkoutPlan = mongoose.model('WorkoutPlan', WorkoutPlanSchema);

export default WorkoutPlan;
