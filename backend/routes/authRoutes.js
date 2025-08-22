const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout");
const User = require("../models/User");
const axios = require('axios');
const { login } = require("../controllers/authController")
const HF_API_KEY = "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";
const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";

// Add debugging middleware for auth routes
router.use((req, res, next) => {
  console.log('Auth route accessed:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
  next();
});

router.post("/generate-plan", async (req, res) => {
  try {
    const { email, fitnessGoal, gender, trainingMethod, workoutType, strengthLevel } = req.body;

    // Validate required fields
    if (!email || !fitnessGoal || !gender || !trainingMethod || !workoutType || !strengthLevel) {
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
      HF_API_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const planContent = response.data[0]?.generated_text || "Could not generate plan.";

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
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error generating workout plan:", error);
    if (error.response) {
      console.error("API response error:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to generate workout plan",
      details: error.message
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
      .select('-__v -_id -userId');

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error("Error fetching workout history:", error);
    res.status(500).json({
      error: "Failed to fetch workout history",
      details: error.message
    });
  }
});

router.post("/login", (req, res, next) => {
  console.log('Login route hit:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    body: req.body
  });
  next();
}, login);

module.exports = router;