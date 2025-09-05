const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout");
const User = require("../models/User");
const BMI = require("../models/BMI");
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
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !fitnessGoal ||
      !gender ||
      !trainingMethod ||
      !workoutType ||
      !strengthLevel
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const prompt = `Create a detailed ${fitnessGoal} workout plan for a ${gender} at ${strengthLevel} level. 
    Training method: ${trainingMethod}. Workout type: ${workoutType}.
    Include exercises, sets, reps, rest periods, and progression tips.
    Format it professionally with clear sections and bullet points.
    
    Example format:
    ### Workout Plan for [Goal]
    **Training Method:** [Method]
    **Workout Type:** [Type]
    **Level:** [Level]
    
    #### Day 1: [Muscle Group]
    - Exercise 1: [Name]
      - Sets: [Number]
      - Reps: [Range]
      - Rest: [Time]
    - Exercise 2: [Name]
      - Sets: [Number]
      - Reps: [Range]
      - Rest: [Time]
    
    #### Progression Tips:
    - [Tip 1]
    - [Tip 2]`;

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

    let planContent =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Could not generate plan.";

    // Clean up the response by removing excessive asterisks and formatting
    planContent = planContent
      .replace(/\*{2,}/g, "") // Remove multiple asterisks (**, ***, etc.)
      .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisks around text
      .replace(/\*{1,2}\s*/g, "") // Remove remaining asterisks at start of lines
      .replace(/\n\s*\*\s*/g, "\n• ") // Convert remaining asterisks to bullet points
      .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s*\*\s*/gm, "• ") // Convert line-starting asterisks to bullets
      .trim();

    const workout = new Workout({
      userId: user._id,
      fitnessGoal,
      gender,
      trainingMethod,
      workoutType,
      strengthLevel,
      plan: planContent,
    });

    await workout.save();

    res.status(201).json({
      success: true,
      plan: planContent,
      metadata: {
        fitnessGoal,
        gender,
        trainingMethod,
        workoutType,
        strengthLevel,
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

router.get("/history", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const history = await Workout.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select("-__v -_id -userId");

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Error fetching workout history:", error);
    res.status(500).json({
      error: "Failed to fetch workout history",
      details: error.message,
    });
  }
});

router.post("/login", login);

// Chat endpoint for FitBot
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

    // Fetch user's BMI and workout plan data for personalized advice
    let userContext = "";
    if (userEmail) {
      try {
        const user = await User.findOne({ email: userEmail });
        if (user) {
          // Get latest BMI data
          const latestBMI = await BMI.findOne({ userId: user._id })
            .sort({ date: -1 })
            .lean();

          // Get latest workout plan
          const latestWorkout = await Workout.findOne({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean();

          if (latestBMI) {
            userContext += `\n\nUser's Health Profile:
- BMI: ${latestBMI.bmi} (${latestBMI.category})
- Age: ${latestBMI.age}
- Height: ${latestBMI.heightFeet}'${latestBMI.heightInches}"
- Weight: ${latestBMI.weight}kg
- Selected Plan: ${latestBMI.selectedPlan || "Not selected"}
- Target Weight: ${latestBMI.targetWeight || "Not set"}kg
- Target Timeline: ${latestBMI.targetTimeline || "Not set"}
- Diseases: ${latestBMI.diseases?.join(", ") || "None"}
- Allergies: ${latestBMI.allergies?.join(", ") || "None"}`;
          }

          if (latestWorkout) {
            userContext += `\n\nUser's Current Workout Plan:
- Fitness Goal: ${latestWorkout.fitnessGoal}
- Workout Type: ${latestWorkout.workoutType}
- Training Method: ${latestWorkout.trainingMethod}
- Strength Level: ${latestWorkout.strengthLevel}
- Plan Details: ${latestWorkout.plan?.substring(0, 500)}...`;
          }
        }
      } catch (contextError) {
        console.error("Error fetching user context:", contextError);
        // Continue without user context if there's an error
      }
    }

    const prompt = `You are FitBot, an AI fitness assistant. Help users with their fitness questions, workout advice, nutrition tips, and motivation. Be encouraging, professional, and provide practical advice.

User's question: ${lastUserMessage.content}${userContext}

Please provide a helpful response as a fitness coach would, taking into account the user's health profile and current workout plan when relevant.`;

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
