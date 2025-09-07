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
      fitnessGoal,
      gender,
      trainingMethod,
      workoutType,
      strengthLevel,
      timeCommitment, // Add timeCommitment
      daysPerWeek, // Add daysPerWeek
      bmiData, // Add bmiData
    } = req.body;

    // Validate required fields (updated to include new fields)
    if (
      !email ||
      !fitnessGoal ||
      !gender ||
      !trainingMethod ||
      !workoutType ||
      !strengthLevel ||
      !timeCommitment ||
      !daysPerWeek ||
      !bmiData
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Construct a more detailed prompt for structured output
    const prompt = `Create a detailed ${fitnessGoal} workout plan for a ${gender} at ${strengthLevel} level, for ${daysPerWeek} days a week, with ${timeCommitment} minute sessions. 
    Focus on ${trainingMethod} and ${workoutType} equipment. 
    The user's BMI data is: ${JSON.stringify(bmiData)}.
    
    Generate the plan as a JSON array of daily workouts. Each daily workout object should have:
    - a 'day' (e.g., 'Monday', 'Day 1')
    - an optional 'focus' (e.g., 'Chest & Triceps', 'Full Body')
    - an array of 'exercises'. Each exercise object should have:
        - 'name' (e.g., 'Bench Press')
        - 'sets' (number)
        - 'reps' (string, e.g., '8-12', 'to failure')
        - 'weight' (string, e.g., 'bodyweight', '10kg', 'N/A')
        - 'rest' (string, e.g., '60 seconds', '2 minutes')
        - 'notes' (optional string, e.g., 'Focus on form')
        - 'demonstrationLink' (optional string, a URL to a video demonstration)
    - optional 'warmup' (string)
    - optional 'cooldown' (string)

    Ensure the JSON is perfectly parsable. Do NOT include any extra text or markdown outside the JSON.`;

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
      generatedParams,
      durationWeeks,
      isActive: true, // Mark the new plan as active
      endDate: new Date(new Date().setDate(new Date().getDate() + (durationWeeks * 7))), // Calculate endDate
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

    const activePlan = await WorkoutPlan.findOne({ userId, isActive: true });

    if (!activePlan) {
      return res.status(404).json({ error: "No active workout plan found for this user" });
    }

    // Fetch workout session logs for the active plan
    const sessionLogs = await WorkoutSessionLog.find({ workoutPlanId: activePlan._id }).sort({ date: 1 });

    res.status(200).json({ success: true, plan: activePlan, sessionLogs });
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
    const { userId, workoutPlanId, workoutDetails, overallNotes, perceivedExertion, durationMinutes } = req.body;

    if (!userId || !workoutPlanId || !workoutDetails) {
      return res.status(400).json({ error: "Missing required fields to log workout session" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const workoutSession = new WorkoutSessionLog({
      userId,
      workoutPlanId,
      workoutDetails,
      overallNotes,
      perceivedExertion,
      durationMinutes,
    });

    await workoutSession.save();

    user.workoutSessionLogs.push(workoutSession._id);
    await user.save();

    res.status(201).json({ success: true, message: "Workout session logged successfully", session: workoutSession });
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
      .select("-__v"); // Includes durationWeeks automatically now

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
            userContext += `\n\nUser's Health Profile:\n   207|- BMI: ${latestBMI.bmi} (${latestBMI.category})\n   208|- Age: ${latestBMI.age}\n   209|- Height: ${latestBMI.heightFeet}'${latestBMI.heightInches}"\n   210|- Weight: ${latestBMI.weight}kg\n   211|- Selected Plan: ${latestBMI.selectedPlan || "Not selected"}\n   212|- Target Weight: ${latestBMI.targetWeight || "Not set"}kg\n   213|- Target Timeline: ${latestBMI.targetTimeline || "Not set"}\n   214|- Diseases: ${latestBMI.diseases?.join(", ") || "None"}\n   215|- Allergies: ${latestBMI.allergies?.join(", ") || "None"}`;
          }

          if (activeWorkoutPlan) {
            userContext += `\n\nUser's Current Active Workout Plan (${activeWorkoutPlan.name}):\n   220|- Fitness Goal: ${activeWorkoutPlan.generatedParams.fitnessGoal}\n   221|- Workout Type: ${activeWorkoutPlan.generatedParams.workoutType}\n   222|- Training Method: ${activeWorkoutPlan.generatedParams.trainingMethod}\n   223|- Strength Level: ${activeWorkoutPlan.generatedParams.strengthLevel}\n   224|- Time Commitment: ${activeWorkoutPlan.generatedParams.timeCommitment} min\n   225|- Days Per Week: ${activeWorkoutPlan.generatedParams.daysPerWeek}\n   226|- Duration: ${activeWorkoutPlan.durationWeeks} weeks\n   227|- Plan Details (first day): ${JSON.stringify(activeWorkoutPlan.planContent[0])}...`;
          }
        }
      } catch (contextError) {
        console.error("Error fetching user context:", contextError);
        // Continue without user context if there's an error
      }
    }

    const prompt = `You are FitBot, an AI fitness assistant. Help users with their fitness questions, workout advice, nutrition tips, and motivation. Be encouraging, professional, and provide practical advice.\n   376|   234|\n   377|   235|User's question: ${lastUserMessage.content}${userContext}\n   378|   236|\n   379|   237|Please provide a helpful response as a fitness coach would, taking into account the user's health profile and current workout plan when relevant.`;

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
