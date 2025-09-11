const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout");
const User = require("../models/User");
const BMI = require("../models/BMI");
const WorkoutPlan = require("../models/WorkoutPlan").default; // Correct import for default export
const WorkoutSessionLog = require("../models/WorkoutSessionLog").default; // Correct import for default export
const axios = require("axios");
const { login } = require("../controllers/authController");
const {
  getCurrentUrl,
  GEMINI_API_KEY,
  GEMINI_API_URL,
} = require("../config/config");

router.post("/generate-plan", async (req, res) => {
  try {
    const {
      email,
      fitnessGoal, // This will now be the new 'goal' from frontend
      gender,
      trainingMethod,
      workoutType,
      strengthLevel,
      timeCommitment,
      daysPerWeek,
      bmiData,
      durationWeeks, // Dynamically calculated duration from frontend
      currentWeight,
      targetWeight,
    } = req.body;

    // Validate required fields (updated to include new fields)
    if (
      !email ||
      !fitnessGoal || // This now represents the high-level goal (lose_weight, etc.)
      !gender ||
      !trainingMethod ||
      !workoutType ||
      !strengthLevel ||
      !timeCommitment ||
      !daysPerWeek ||
      !bmiData ||
      !durationWeeks ||
      !currentWeight ||
      ((fitnessGoal === "lose_weight" || fitnessGoal === "gain_weight") && !targetWeight)
    ) {
      return res.status(400).json({ error: "All required fields are missing or invalid" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    let specificGoalInstruction = "";
    if (fitnessGoal === "lose_weight") {
      specificGoalInstruction = `The user's goal is to lose weight from ${currentWeight}kg to ${targetWeight}kg over ${durationWeeks} weeks. Focus on creating a plan for safe and effective weight loss.`;
    } else if (fitnessGoal === "gain_weight") {
      specificGoalInstruction = `The user's goal is to gain weight from ${currentWeight}kg to ${targetWeight}kg over ${durationWeeks} weeks. Focus on creating a plan for healthy weight gain and muscle development.`;
    } else if (fitnessGoal === "build_muscles") {
      specificGoalInstruction = `The user's goal is to build muscle mass. Focus on progressive overload and hypertrophy principles over ${durationWeeks} weeks.`;
    }

    // Construct a more detailed prompt for structured output
    const prompt = `Create a detailed ${fitnessGoal} workout plan for a ${gender} at ${strengthLevel} level, with ${daysPerWeek} sessions per week, and ${timeCommitment} minute sessions. 
    Focus on ${trainingMethod} and ${workoutType} equipment. 
    ${specificGoalInstruction}
    The user's BMI data is: ${JSON.stringify(bmiData)}.
    Consider any health conditions from bmiData.diseases or bmiData.allergies to make the plan safe and effective. 

    OUTPUT REQUIREMENTS (STRICT):
    - Return a JSON ARRAY with EXACTLY ${daysPerWeek} objects (representing ONE week's schedule). No more, no less.
    - Use weekday names for 'day': choose an appropriate schedule such as ["Monday","Wednesday","Friday"] for 3 days, ["Monday","Tuesday","Thursday","Saturday"] for 4, etc.
    - Our app will REPEAT this weekly schedule for the specified duration of ${durationWeeks} weeks.
    - Each day object MUST include:
        - 'day' (e.g., 'Monday')
        - optional 'focus' (e.g., 'Chest & Triceps', 'Full Body')
        - 'exercises': an array of exercise objects, each with:
            - 'name' (e.g., 'Bench Press')
            - 'sets' (number)
            - 'reps' (string, e.g., '8-12', 'to failure')
            - 'weight' (string, e.g., 'bodyweight', '10kg', 'N/A')
            - 'rest' (string, e.g., '60 seconds', '2 minutes')
            - optional 'notes'
            - optional 'demonstrationLink' (URL)
        - optional 'warmup' (string)
        - optional 'cooldown' (string)

    IMPORTANT: Return ONLY valid JSON (no markdown/code fences, no extra text).`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8, // Increased temperature for more creative plans
          maxOutputTokens: 8000, // Increased token limit significantly for detailed plans (from 4000)
          topP: 0.9,
          topK: 20,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 25000, // Increased timeout
      }
    );

    let planContentRaw =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "[]"; // Default to empty array if plan generation fails

    // Strip markdown code block delimiters if present
    if (planContentRaw.startsWith("```json")) {
      planContentRaw = planContentRaw.substring(7);
    }
    if (planContentRaw.endsWith("```")) {
      planContentRaw = planContentRaw.slice(0, -3);
    }
    planContentRaw = planContentRaw.trim(); // Trim any leading/trailing whitespace

    // Attempt to fix common JSON issues from AI, like unescaped quotes in strings
    // This is a heuristic and might not catch all cases, but addresses common ones.
    planContentRaw = planContentRaw.replace(/"(\w+)":\s*"([^"]*)"([^",}\]]*)"([^"]*)"/g, (match, p1, p2, p3, p4) => {
      // This regex tries to find an unescaped double quote within a string value.
      // It's tricky to get perfectly right with regex, but this will help with basic cases.
      // A more robust solution might involve a JSON linter/formatter library.
      return `"${p1}": "${p2}\'${p3.replace(/'/g, "\\'")}\'${p4}"`;
    });

    let planContent;
    try {
      planContent = JSON.parse(planContentRaw);
      if (!Array.isArray(planContent)) {
        throw new Error("AI did not return a valid JSON array.");
      }
    } catch (parseError) {
      console.error("Error parsing AI generated plan:", parseError.message);
      console.error("Raw AI response:", planContentRaw);
      return res.status(500).json({
        error: "Failed to parse AI generated workout plan",
        details: parseError.message,
        rawResponse: planContentRaw,
      });
    }

    // Do not save to old Workout model, as we are saving to WorkoutPlan model now upon user request
    // The frontend will call a separate save endpoint

    res.status(201).json({
      success: true,
      plan: planContent, // Send structured plan to frontend
      metadata: {
        fitnessGoal,
        gender,
        trainingMethod,
        workoutType,
        strengthLevel,
        timeCommitment,
        daysPerWeek,
        durationWeeks, // Include durationWeeks in metadata
        currentWeight, // Include currentWeight in metadata
        targetWeight, // Include targetWeight in metadata
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error generating workout plan:", error);
    if (error.response) {
      console.error("Gemini API response error:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to generate workout plan",
      details: error.message,
    });
  }
});

// New endpoint to save a workout plan
router.post("/workout-plan/save", async (req, res) => {
  try {
    const { userId, name, description, planContent, generatedParams, durationWeeks } = req.body;

    if (!userId || !name || !planContent || !generatedParams || !durationWeeks) {
      return res.status(400).json({ error: "Missing required fields to save workout plan" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Deactivate any existing active plans for this user
    await WorkoutPlan.updateMany({ userId: userId, isActive: true }, { isActive: false });

    const workoutPlan = new WorkoutPlan({
      userId,
      name,
      description,
      planContent,
      generatedParams: { ...generatedParams, durationWeeks }, // Ensure durationWeeks is explicitly saved in generatedParams
      durationWeeks,
      isActive: true, // Mark the new plan as active
      endDate: new Date(new Date().setDate(new Date().getDate() + (durationWeeks * 7))), // Calculate endDate
      currentWeek: 1, // Initialize current week
      completed: false, // Initialize as not completed
      dayCompletions: [], // Initialize empty day completions
      weeklyContentOverrides: new Map(), // Initialize empty map for overrides
    });

    await workoutPlan.save();

    user.workoutPlans.push(workoutPlan._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Workout plan saved successfully and set as active",
      plan: workoutPlan,
    });
  } catch (error) {
    console.error("Error saving workout plan:", error);
    res.status(500).json({
      error: "Failed to save workout plan",
      details: error.message,
    });
  }
});

// New endpoint to get the user's active workout plan
router.get("/workout-plan/active/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let activePlan = await WorkoutPlan.findOne({ userId, isActive: true });

    if (!activePlan) {
      // Fallback: latest plan (even if completed), useful to show info when no active exists
      activePlan = await WorkoutPlan.findOne({ userId }).sort({ createdAt: -1 });
      if (!activePlan) {
        return res.status(404).json({ error: "No active workout plan found for this user" });
      }
    }

    // Fetch workout session logs for the active plan
    const sessionLogs = await WorkoutSessionLog.find({ workoutPlanId: activePlan._id }).sort({ date: 1 });

    console.log("Backend /workout-plan/active/:userId sending sessionLogs:", sessionLogs.map(log => ({ weekNumber: log.weekNumber, dayIndex: log.dayIndex, completedExercises: log.workoutDetails.filter(ex => ex.completed).map(ex => ex.exerciseName) })));

    // Get the plan content for the current week, prioritizing overrides
    const currentWeekPlanContent = activePlan.weeklyContentOverrides.get(activePlan.currentWeek.toString()) || activePlan.planContent;

    res.status(200).json({
      success: true, plan: {
        ...activePlan.toObject(),
        planContent: currentWeekPlanContent, // Ensure we send the correct week's plan content
      }, sessionLogs
    });
  } catch (error) {
    console.error("Error fetching active workout plan:", error);
    res.status(500).json({
      error: "Failed to fetch active workout plan",
      details: error.message,
    });
  }
});

// New endpoint to get workout session logs for a specific workout plan
router.get("/workout-plan/:planId/sessions", async (req, res) => {
  try {
    const { planId } = req.params;

    const sessionLogs = await WorkoutSessionLog.find({ workoutPlanId: planId }).sort({ date: 1 });

    res.status(200).json({ success: true, sessionLogs });
  } catch (error) {
    console.error("Error fetching workout sessions for plan:", error);
    res.status(500).json({
      error: "Failed to fetch workout sessions",
      details: error.message,
    });
  }
});

// New endpoint to log a workout session
router.post("/workout-session/log", async (req, res) => {
  try {
    const { userId, workoutPlanId, workoutDetails, overallNotes, perceivedExertion, durationMinutes, dayIndex, date, weekNumber } = req.body;

    if (!userId || !workoutPlanId || !workoutDetails || dayIndex === undefined) {
      return res.status(400).json({ error: "Missing required fields to log workout session" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = await WorkoutPlan.findById(workoutPlanId);
    if (!plan) return res.status(404).json({ error: "Workout plan not found" });
    if (plan.completed || plan.isActive === false) {
      return res.status(400).json({ error: "This workout plan is closed or completed. Activate a new plan to continue logging." });
    }

    // Use weekNumber from req.body if provided, otherwise compute from date relative to plan.startDate
    const sessionDate = date ? new Date(date) : new Date();
    let actualWeekNumber = weekNumber;
    if (actualWeekNumber === undefined) {
      const msInWeek = 7 * 24 * 60 * 60 * 1000;
      actualWeekNumber = Math.floor((sessionDate - new Date(plan.startDate)) / msInWeek) + 1;
    }

    console.log("Backend /workout-session/log received:", {
      userId,
      workoutPlanId,
      dayIndex,
      actualWeekNumber,
      workoutDetails: workoutDetails.map(ex => ({ name: ex.exerciseName, completed: ex.completed })),
    });

    // Get the actual plan content for this specific week and dayIndex, prioritizing overrides
    const currentWeekPlanContent = plan.weeklyContentOverrides.get(actualWeekNumber.toString()) || plan.planContent;
    const plannedDayExercises = currentWeekPlanContent[dayIndex]?.exercises || [];

    // Find or create workout session log
    let workoutSession = await WorkoutSessionLog.findOne({
      userId,
      workoutPlanId,
      weekNumber: actualWeekNumber,
      dayIndex,
    });

    if (workoutSession) {
      // Merge existing workout details with new ones
      const existingDetailsMap = new Map(workoutSession.workoutDetails.map(d => [d.exerciseName, d]));
      workoutDetails.forEach(newDetail => {
        if (existingDetailsMap.has(newDetail.exerciseName)) {
          // Update existing exercise details
          const existingDetail = existingDetailsMap.get(newDetail.exerciseName);
          existingDetail.sets = newDetail.sets;
          existingDetail.reps = newDetail.reps;
          existingDetail.weight = newDetail.weight;
          existingDetail.notes = newDetail.notes;
          existingDetail.completed = newDetail.completed;
        } else {
          // Add new exercise details if it doesn't exist (shouldn't happen if plan is static, but for safety)
          workoutSession.workoutDetails.push(newDetail);
        }
      });

      // Update other fields
      workoutSession.overallNotes = overallNotes;
      workoutSession.perceivedExertion = perceivedExertion;
      workoutSession.durationMinutes = durationMinutes;
      workoutSession.date = sessionDate; // Update date if logging retroactively
    } else {
      // Create new session log
      workoutSession = new WorkoutSessionLog({
        userId,
        workoutPlanId,
        dayIndex,
        weekNumber: actualWeekNumber,
        date: sessionDate,
        workoutDetails,
        overallNotes,
        perceivedExertion,
        durationMinutes,
      });
    }

    // Determine if all planned exercises for THIS DAY are completed within the workoutSession
    let allPlannedExercisesCompletedForThisDay = plannedDayExercises.length > 0 && plannedDayExercises.every(plannedEx => {
      return workoutSession.workoutDetails.some(loggedEx =>
        loggedEx.exerciseName === plannedEx.name && loggedEx.completed
      );
    });
    workoutSession.allExercisesCompleted = allPlannedExercisesCompletedForThisDay; // Update the session log's own completion status

    await workoutSession.save();

    // Link session to user if it's a new session
    if (!user.workoutSessionLogs.includes(workoutSession._id)) {
      user.workoutSessionLogs.push(workoutSession._id);
      await user.save();
    }

    let planUpdated = false;
    const totalDaysPerWeek = plan.generatedParams?.daysPerWeek || plan.planContent.length;
    // const uniqueDayCompletionId = `${weekNumber}-${dayIndex}`;
    const wasDayAlreadyCompleted = plan.dayCompletions.some(dc => dc.weekNumber === actualWeekNumber && dc.dayIndex === dayIndex);

    if (allPlannedExercisesCompletedForThisDay && !wasDayAlreadyCompleted) {
      // Mark day as completed in the plan
      plan.dayCompletions.push({ weekNumber: actualWeekNumber, dayIndex, sessionId: workoutSession._id, date: sessionDate });
      plan.completedDayCount = (plan.completedDayCount || 0) + 1;
      planUpdated = true;
    } else if (!allPlannedExercisesCompletedForThisDay && wasDayAlreadyCompleted) {
      // If a day was previously completed but now some exercises are unchecked, unmark it
      plan.dayCompletions = plan.dayCompletions.filter(dc => !(dc.weekNumber === actualWeekNumber && dc.dayIndex === dayIndex));
      plan.completedDayCount = (plan.completedDayCount || 0) - 1;
      planUpdated = true;
    }

    // Check for weekly completion and potentially generate next week's plan
    const currentWeekCompletions = plan.dayCompletions.filter(dc => dc.weekNumber === plan.currentWeek);
    if (currentWeekCompletions.length >= totalDaysPerWeek && plan.currentWeek === actualWeekNumber) {
      // Current week is completed
      if (plan.currentWeek < plan.durationWeeks) {
        // Move to the next week only if not the final week
        plan.currentWeek += 1;
        planUpdated = true;

        // Generate the next week's plan using AI
        try {
          const gp = plan.generatedParams || {};
          const requestData = {
            email: user.email,
            fitnessGoal: gp.fitnessGoal || "General Fitness",
            gender: user.gender || "Not specified",
            trainingMethod: `${gp.trainingMethod || "mixed"} Training`,
            workoutType: gp.equipment || "none",
            strengthLevel: gp.intensity || "beginner",
            timeCommitment: gp.timeCommitment || "30",
            daysPerWeek: gp.daysPerWeek || plan.planContent.length,
            bmiData: gp.bmiData || {},
            durationWeeks: gp.durationWeeks || 1, // Use generatedParams durationWeeks for regeneration
            currentWeight: gp.currentWeight, // Pass currentWeight for regeneration
            targetWeight: gp.targetWeight, // Pass targetWeight for regeneration
          };
          console.log(`Generating plan for week ${plan.currentWeek}...`);
          const generateResponse = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [
              {
                parts: [
                  {
                    text: `Create a varied workout plan for week ${plan.currentWeek} given the user's initial parameters: ${JSON.stringify(requestData)}. The previous week's plan content was: ${JSON.stringify(plan.planContent)}. Only return the JSON array for this week's plan.`, // Include previous plan content for variation
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8000,
              topP: 0.9,
              topK: 20,
            },
          }, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          });

          let newWeeklyPlanRaw = generateResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

          // Strip markdown code fences if present
          if (newWeeklyPlanRaw.startsWith("```json")) {
            newWeeklyPlanRaw = newWeeklyPlanRaw.substring(7);
          }
          if (newWeeklyPlanRaw.endsWith("```")) {
            newWeeklyPlanRaw = newWeeklyPlanRaw.slice(0, -3);
          }
          newWeeklyPlanRaw = newWeeklyPlanRaw.trim();

          let newWeeklyPlanContent;
          try {
            // Attempt to parse the new plan content
            newWeeklyPlanContent = JSON.parse(newWeeklyPlanRaw);
            if (!Array.isArray(newWeeklyPlanContent)) {
              throw new Error("AI did not return a valid JSON array for the new weekly plan.");
            }
            // Store the newly generated plan in weeklyContentOverrides
            plan.weeklyContentOverrides.set(plan.currentWeek.toString(), newWeeklyPlanContent);
            console.log(`Successfully generated and stored plan for week ${plan.currentWeek} in overrides.`);

          } catch (parseError) {
            console.error(`Error parsing AI generated plan for week ${plan.currentWeek}:`, parseError.message);
            console.error("Raw AI response for new weekly plan:", newWeeklyPlanRaw);
            // If parsing fails, we should not proceed with an invalid plan
            // You might want to add more robust error handling here, e.g., keep the old plan or mark the week as problematic.
            return res.status(500).json({
              error: `Failed to parse AI generated workout plan for week ${plan.currentWeek}`,
              details: parseError.message,
              rawResponse: newWeeklyPlanRaw,
            });
          }

          // Do not overwrite plan.planContent directly here, as weeklyContentOverrides will now manage week-specific plans.
          // plan.planContent = newWeeklyPlanContent; // OLD: This line will be removed or commented out.

        } catch (aiError) {
          console.error(`Error generating plan for week ${plan.currentWeek}:`, aiError);
          // Continue without new plan
        }
      }
    }

    // Check overall plan completion based on completedDayCount
    if (plan.completedDayCount >= (plan.durationWeeks * totalDaysPerWeek)) {
      plan.completed = true;
      plan.isActive = false;
      plan.closedAt = new Date();
    }

    if (planUpdated) {
      await plan.save();
    }

    res.status(201).json({ success: true, message: "Workout session logged successfully", session: workoutSession, planProgress: { completed: plan.completed, completedDayCount: plan.completedDayCount, totalDays: plan.durationWeeks * (plan.generatedParams?.daysPerWeek || plan.planContent.length || 0), currentWeek: plan.currentWeek, weeklyContentOverrides: Object.fromEntries(plan.weeklyContentOverrides) } });
  } catch (error) {
    console.error("Error logging workout session:", error);
    res.status(500).json({
      error: "Failed to log workout session",
      details: error.message,
    });
  }
});

// Modify existing /history endpoint to fetch WorkoutPlan history
router.get("/workout-plan/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const history = await WorkoutPlan.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select("-__v"); // Includes durationWeeks, completed, etc., automatically now

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Error fetching workout plan history:", error);
    res.status(500).json({
      error: "Failed to fetch workout plan history",
      details: error.message,
    });
  }
});

// New endpoint to update a workout plan (e.g., set as active/inactive, change name/description)
router.put("/workout-plan/update/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, description, isActive } = req.body;

    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan) return res.status(404).json({ error: "Workout plan not found" });

    if (isActive !== undefined) {
      if (workoutPlan.completed && isActive) {
        return res.status(400).json({ error: "Completed plans cannot be reactivated. Please create a new plan." });
      }
      // If setting this plan to active, deactivate all other plans for the user
      if (isActive) {
        await WorkoutPlan.updateMany({ userId: workoutPlan.userId, isActive: true }, { isActive: false });
      }
      workoutPlan.isActive = isActive;
    }
    if (name) workoutPlan.name = name;
    if (description) workoutPlan.description = description;

    await workoutPlan.save();

    res.status(200).json({ success: true, message: "Workout plan updated successfully", plan: workoutPlan });
  } catch (error) {
    console.error("Error updating workout plan:", error);
    res.status(500).json({
      error: "Failed to update workout plan",
      details: error.message,
    });
  }
});

router.post("/login", login);

// New endpoint to delete a workout plan
router.delete("/workout-plan/delete/:planId", async (req, res) => {
  try {
    const { planId } = req.params;

    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan) return res.status(404).json({ error: "Workout plan not found" });

    // Delete associated workout session logs
    await WorkoutSessionLog.deleteMany({ workoutPlanId: planId });

    // Remove plan from user's workoutPlans array
    await User.updateOne(
      { _id: workoutPlan.userId },
      { $pull: { workoutPlans: planId } }
    );

    // Delete the workout plan itself
    await workoutPlan.deleteOne();

    res.status(200).json({ success: true, message: "Workout plan and associated logs deleted successfully" });
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    res.status(500).json({
      error: "Failed to delete workout plan",
      details: error.message,
    });
  }
});

// Chat endpoint for FitBot (update to use structured plan from WorkoutPlan model)
router.post("/chat", async (req, res) => {
  try {
    const { messages, userEmail } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Get the last user message
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop();
    if (!lastUserMessage) {
      return res.status(400).json({ error: "No user message found" });
    }

    // Fetch user's BMI and active workout plan data for personalized advice
    let userContext = "";
    if (userEmail) {
      try {
        const user = await User.findOne({ email: userEmail });
        if (user) {
          // Get latest BMI data
          const latestBMI = await BMI.findOne({ userId: user._id })
            .sort({ date: -1 })
            .lean();

          // Get active workout plan from the new WorkoutPlan model
          const activeWorkoutPlan = await WorkoutPlan.findOne({ userId: user._id, isActive: true })
            .sort({ createdAt: -1 })
            .lean();

          if (latestBMI) {
            userContext += `\n\nUser's Health Profile:\n   632|- BMI: ${latestBMI.bmi} (${latestBMI.category})\n   633|- Age: ${latestBMI.age}\n   634|- Height: ${latestBMI.heightFeet}'${latestBMI.heightInches}"\n   635|- Weight: ${latestBMI.weight}kg\n   636|- Target Weight: ${latestBMI.targetWeight || "Not set"}kg\n   637|- Target Timeline: ${latestBMI.targetTimeline || "Not set"}\n   638|- Diseases: ${latestBMI.diseases?.join(", ") || "None"}\n   639|- Allergies: ${latestBMI.allergies?.join(", ") || "None"}`;
          }

          if (activeWorkoutPlan) {
            userContext += `\n\nUser's Current Active Workout Plan (${activeWorkoutPlan.name}):\n   642|- Goal: ${activeWorkoutPlan.generatedParams.fitnessGoal?.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "N/A"}\n   643|- Current Weight: ${activeWorkoutPlan.generatedParams.currentWeight || "N/A"}kg\n   644|- Target Weight: ${activeWorkoutPlan.generatedParams.targetWeight || "N/A"}kg\n   645|- Workout Type: ${activeWorkoutPlan.generatedParams.workoutType || "N/A"}\n   646|- Training Method: ${activeWorkoutPlan.generatedParams.trainingMethod || "N/A"}\n   647|- Strength Level: ${activeWorkoutPlan.generatedParams.strengthLevel || "N/A"}\n   648|- Time Commitment: ${activeWorkoutPlan.generatedParams.timeCommitment || "N/A"} min\n   649|- Days Per Week: ${activeWorkoutPlan.generatedParams.daysPerWeek || "N/A"}\n   650|- Duration: ${activeWorkoutPlan.generatedParams.durationWeeks || "N/A"} weeks\n   651|- Plan Details (first day): ${JSON.stringify(activeWorkoutPlan.planContent[0])}...`;
          }
        }
      } catch (contextError) {
        console.error("Error fetching user context:", contextError);
        // Continue without user context if there's an error
      }
    }

    const prompt = `You are FitBot, an AI fitness assistant. Help users with their fitness questions, workout advice, nutrition tips, and motivation. You MUST prioritize the user's provided health profile and current active workout plan details in your responses. Be encouraging, professional, and provide practical advice.\n   376|   234|\n   377|   235|User's question: ${lastUserMessage.content}${userContext}\n   378|   236|\n   379|   237|Please provide a helpful response as a fitness coach would, taking into account the user's health profile and current workout plan when relevant.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 10,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    let botResponse =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't process your request right now. Please try again.";

    // Clean up the response by removing excessive asterisks and formatting
    botResponse = botResponse
      .replace(/\*{2,}/g, "") // Remove multiple asterisks (**, ***, etc.)
      .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisks around text
      .replace(/\*{1,2}\s*/g, "") // Remove remaining asterisks at start of lines
      .replace(/\n\s*\*\s*/g, "\n• ") // Convert remaining asterisks to bullet points
      .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s*\*\s*/gm, "• ") // Convert line-starting asterisks to bullets
      .trim();

    res.json({
      success: true,
      response: botResponse,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    if (error.response) {
      console.error("Gemini API response error:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to process chat message",
      details: error.message,
    });
  }
});

module.exports = router;
