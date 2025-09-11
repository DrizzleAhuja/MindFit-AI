import mongoose from 'mongoose';

const WorkoutSessionLogSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
        date: { type: Date, default: Date.now },
        // Identify which planned day this session corresponds to
        dayIndex: { type: Number }, // 0-based index within planContent
        weekNumber: { type: Number }, // 1-based week within the plan duration
        allExercisesCompleted: { type: Boolean, default: false },
        workoutDetails: {
            type: [
                {
                    exerciseName: { type: String, required: true },
                    sets: { type: Number, required: true },
                    reps: { type: String, required: true },
                    weight: { type: String },
                    notes: { type: String },
                    completed: { type: Boolean, default: false },
                },
            ],
            default: [],
        },
        overallNotes: { type: String },
        perceivedExertion: { type: Number, min: 1, max: 10 }, // RPE scale
        durationMinutes: { type: Number },
    },
    { timestamps: true }
);

const WorkoutSessionLog = mongoose.model('WorkoutSessionLog', WorkoutSessionLogSchema);

export default WorkoutSessionLog;
