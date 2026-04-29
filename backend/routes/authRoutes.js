const express = require("express");
const { checkAndIncrementLimit } = require("../utils/limitCheck");

const router = express.Router();
const Workout = require("../models/Workout");
const User = require("../models/User");
const BMI = require("../models/BMI");
const WorkoutPlan = require("../models/WorkoutPlan").default; // Correct import for default export
const WorkoutSessionLog = require("../models/WorkoutSessionLog").default; // Correct import for default export
const DietChart = require("../models/DietChart");
const CalorieIntakeLog = require("../models/CalorieIntakeLog").default;
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const { login } = require("../controllers/authController");
const {
  getCurrentUrl,
  GEMINI_API_KEY,
  GEMINI_API_URL,
  GROQ_API_KEY,
} = require("../config/config");
const {
  computeNutritionTargets,
  normalizeGoal,
  resolveFitnessGoal,
  inferMacrosFromCalories,
  getSuggestedFoodsForMeal,
} = require("../utils/nutritionTargets");
const {
  WEIGHT_KG_MIN,
  WEIGHT_KG_MAX,
  AGE_MIN,
  AGE_MAX,
} = require("../utils/bmiLimits");
const { safeErrorForLog } = require("../utils/safeLog");

function getGoogleFitRedirectUri(req) {
  // Must match an Authorized redirect URI in Google Cloud Console
  // Use explicit env var if set, otherwise construct from backend URL
  if (process.env.GOOGLE_FIT_REDIRECT_URI) {
    console.log('🔗 [Google Fit] Using explicit REDIRECT_URI from ENV:', process.env.GOOGLE_FIT_REDIRECT_URI);
    return process.env.GOOGLE_FIT_REDIRECT_URI;
  }

  // Construct from backend base URL (remove trailing slash if present)
  const baseUrl = getCurrentUrl(req).replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/google-fit/callback`;

  console.log('🔗 [Google Fit] Auto-constructed Redirect URI:', redirectUri);
  console.log('   - Req Host:', req.get('host'));
  console.log('   - Req Protocol:', req.protocol);
  console.log('   - ENV NODE_ENV:', process.env.NODE_ENV);
  
  return redirectUri;
}

function getFrontendRedirectBase() {
  return process.env.FRONTEND_APP_URL || "http://localhost:5173";
}

/** Groq free tier TPM is tight; keep chat requests small. */
const GROQ_FITBOT_TEXT_MODEL =
  process.env.GROQ_FITBOT_MODEL || "llama-3.3-70b-versatile";
const GROQ_FITBOT_VISION_MODEL =
  process.env.GROQ_FITBOT_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const FITBOT_MAX_CHAT_HISTORY = 4;
const FITBOT_MAX_ASSISTANT_CHARS = 900;
const FITBOT_MAX_USER_CHARS = 1200;
/** Groq counts max_completion toward TPM; keep low for on_demand tier. */
const FITBOT_MAX_COMPLETION_TOKENS = Math.min(
  1024,
  parseInt(process.env.GROQ_FITBOT_MAX_TOKENS || "512", 10) || 512
);
const FITBOT_GROQ_MAX_RETRIES = 5;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Omit long fields (e.g. aiSuggestions) from BMI embedded in Gemini prompts — smaller payload, fewer timeouts. */
function summarizeBmiForWorkoutPrompt(bmiData) {
  if (!bmiData || typeof bmiData !== "object") return "{}";
  try {
    return JSON.stringify({
      weight: bmiData.weight,
      heightFeet: bmiData.heightFeet,
      heightInches: bmiData.heightInches,
      age: bmiData.age,
      bmi: bmiData.bmi,
      category: bmiData.category,
      diseases: bmiData.diseases,
      allergies: bmiData.allergies,
      targetWeight: bmiData.targetWeight,
      selectedPlan: bmiData.selectedPlan,
    });
  } catch {
    return "{}";
  }
}

function stripGeminiMarkdownFences(text) {
  let s = String(text || "").trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/s, "").trim();
  }
  return s;
}

/**
 * Helper to get Google Fit credentials.
 * Supports:
 * 1. Separate env vars: GOOGLE_CLIENT_ID and GOOGLE_ANDROID_CLIENT_ID
 * 2. Comma-separated list in GOOGLE_CLIENT_ID: "web_id,android_id"
 */
function getGoogleClientCredentials() {
  const webIdRaw = process.env.GOOGLE_CLIENT_ID || "";
  let webId = webIdRaw.trim();
  let androidId = (process.env.GOOGLE_ANDROID_CLIENT_ID || "").trim();

  // Handle single-variable comma-separated list
  if (webId.includes(",")) {
    const parts = webId.split(",");
    webId = parts[0].trim();
    if (!androidId && parts[1]) {
      androidId = parts[1].trim();
    }
  }

  return {
    webId,
    androidId,
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim()
  };
}

/** Parse JSON array from Gemini (workout week plan). */
function parseGeminiJsonArray(rawText) {
  const stripped = stripGeminiMarkdownFences(rawText);
  try {
    const v = JSON.parse(stripped);
    return Array.isArray(v) ? v : null;
  } catch {
    const a0 = stripped.indexOf("[");
    const a1 = stripped.lastIndexOf("]");
    if (a0 !== -1 && a1 > a0) {
      try {
        const v = JSON.parse(stripped.slice(a0, a1 + 1));
        return Array.isArray(v) ? v : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Parse JSON object from Gemini (meal insights). */
function parseGeminiJsonObject(rawText) {
  const stripped = stripGeminiMarkdownFences(rawText);
  try {
    const v = JSON.parse(stripped);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    const j0 = stripped.indexOf("{");
    const j1 = stripped.lastIndexOf("}");
    if (j0 !== -1 && j1 > j0) {
      try {
        const v = JSON.parse(stripped.slice(j0, j1 + 1));
        return v && typeof v === "object" && !Array.isArray(v) ? v : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function groqRetryDelayMs(error) {
  const h = error.response?.headers || {};
  const ra = h["retry-after"] || h["Retry-After"];
  if (ra != null) {
    const sec = parseFloat(ra);
    if (!Number.isNaN(sec)) return Math.min(Math.ceil(sec * 1000) + 500, 120000);
  }
  const msg = String(error.response?.data?.error?.message || "");
  const m = msg.match(/try again in ([\d.]+)\s*s/i);
  if (m) {
    const sec = parseFloat(m[1]);
    if (!Number.isNaN(sec)) return Math.min(Math.ceil(sec * 1000) + 800, 120000);
  }
  return 4000;
}

function isGroqRateOrTokenLimit(error) {
  if (!error.response) return false;
  const status = error.response.status;
  const code = error.response.data?.error?.code;
  const msg = String(error.response.data?.error?.message || "");
  if (status === 413 || status === 429) return true;
  if (code === "rate_limit_exceeded") return true;
  if (/rate limit|TPM|tokens per minute|Payload Too Large/i.test(msg)) return true;
  return false;
}

async function postGroqChatCompletions(payload, groqApiKey) {
  let lastErr;
  for (let attempt = 1; attempt <= FITBOT_GROQ_MAX_RETRIES; attempt++) {
    try {
      return await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          timeout: 60000,
        }
      );
    } catch (err) {
      lastErr = err;
      if (isGroqRateOrTokenLimit(err) && attempt < FITBOT_GROQ_MAX_RETRIES) {
        const wait = groqRetryDelayMs(err);
        console.warn(
          `[FitBot] Groq limit hit (attempt ${attempt}/${FITBOT_GROQ_MAX_RETRIES}), retry in ${wait}ms`
        );
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function truncateGroqText(s, maxLen = FITBOT_MAX_ASSISTANT_CHARS) {
  if (s == null || s === "") return "";
  const t = String(s);
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}\n...[truncated]`;
}

function summarizeActivePlanForPrompt(plan) {
  if (!plan) return "";
  const gp = plan.generatedParams || {};
  const goal =
    gp.fitnessGoal?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "N/A";
  const first = plan.planContent?.[0];
  let dayLine = "";
  if (first) {
    const names = (first.exercises || []).map((e) => e?.name).filter(Boolean);
    const shown = names.slice(0, 5).join(", ");
    const more = names.length > 5 ? ` +${names.length - 5}` : "";
    dayLine = `${first.day || "D1"} ${first.focus || ""}: ${shown}${more}`;
  } else {
    dayLine = "app";
  }
  const nDays = Array.isArray(plan.planContent) ? plan.planContent.length : 0;
  const block =
    `Workout plan (internal): name=${plan.name}; goal=${goal}; type=${gp.workoutType || "?"}; ${gp.daysPerWeek || nDays}d/wk; ${gp.timeCommitment ?? "?"}min; ${gp.durationWeeks || plan.durationWeeks || "?"}wk; sample=${dayLine}; days=${nDays}.`;
  return block.slice(0, 450);
}

/** User wants to log food — force log_food so the model does not echo system context instead. */
function looksLikeFoodLogRequest(text) {
  const t = (text || "").toLowerCase();
  if (t.length > 800) return false;
  const isMetricsUpdate = /\b(weight|height|bmi|profile|diseases|allergies)\b/.test(t);
  if (isMetricsUpdate) return false;

  const hasFood =
    /\b(breakfast|lunch|dinner|evening|snack|meal|paratha|parantha|roti|chapati|naan|rice|dal|curry|sabzi|egg|apple|fruit|milk|coffee|tea|juice|calorie|kcal|food|plate|eat|ate)\b/.test(
      t
    ) || /\b(aloo|allo|potato)\b/.test(t);
  const hasLogVerb = /\b(log|logged|record|track|add to|enter)\b/.test(t);
  const hasEatVerb = /\b(ate|eat|eating|had|having)\b/.test(t);
  return hasFood && (hasLogVerb || hasEatVerb);
}

// Exercises supported by the Virtual Training Assistant (posture coach). Gemini must only use these names so users can train with the assistant.
const VTA_ALLOWED_EXERCISES = [
  "Bench Press", "Incline Dumbbell Press", "Decline Press", "Push-up", "Cable Fly", "Pec Deck", "Chest Press", "Diamond Push-up",
  "Bent-over Row", "Barbell Row", "Lat Pulldown", "Pull-up", "Cable Row", "Single-Arm Row", "T-Bar Row", "Chin-up",
  "Overhead Press", "Military Press", "Arnold Press", "Front Raise", "Lateral Raise", "Reverse Fly", "Face Pull", "Upright Row",
  "Bicep Curl", "Hammer Curl", "Preacher Curl", "Concentration Curl", "Cable Curl", "Barbell Curl", "Incline Curl",
  "Tricep Extension", "Tricep Pushdown", "Skull Crusher", "Overhead Extension", "Kickback", "Close-Grip Bench", "Dips",
  "Back Squat", "Front Squat", "Leg Press", "Goblet Squat", "Walking Lunge", "Reverse Lunge", "Bulgarian Split Squat", "Romanian Deadlift", "Deadlift", "Calf Raise",
  "Plank", "Side Plank", "Mountain Climber", "High Knees", "Forearm Plank", "Hollow Hold", "Dead Bug", "Jumping Jack",
];

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
      diseases, // Add diseases
      allergies, // Add allergies
      isSenior,
      isWheelchairBound
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
      ((fitnessGoal === "lose_weight" || fitnessGoal === "gain_weight") &&
        !targetWeight)
    ) {
      return res
        .status(400)
        .json({ error: "All required fields are missing or invalid" });
    }

    const cwNum = Number(currentWeight);
    if (!Number.isFinite(cwNum) || cwNum < WEIGHT_KG_MIN || cwNum > WEIGHT_KG_MAX) {
      return res.status(400).json({
        error: `Current weight must be between ${WEIGHT_KG_MIN} and ${WEIGHT_KG_MAX} kg (same range as BMI).`,
      });
    }
    if (fitnessGoal === "lose_weight" || fitnessGoal === "gain_weight") {
      const twNum = Number(targetWeight);
      if (!Number.isFinite(twNum) || twNum < WEIGHT_KG_MIN || twNum > WEIGHT_KG_MAX) {
        return res.status(400).json({
          error: `Target weight must be between ${WEIGHT_KG_MIN} and ${WEIGHT_KG_MAX} kg (same range as BMI).`,
        });
      }
      if (fitnessGoal === "lose_weight" && twNum >= cwNum) {
        return res.status(400).json({
          error: "For weight loss, target weight must be below current weight.",
        });
      }
      if (fitnessGoal === "gain_weight" && twNum <= cwNum) {
        return res.status(400).json({
          error: "For weight gain, target weight must be above current weight.",
        });
      }
    }
    const bmiAgeNum = Number(bmiData?.age);
    if (!Number.isFinite(bmiAgeNum) || bmiAgeNum < AGE_MIN || bmiAgeNum > AGE_MAX) {
      return res.status(400).json({
        error: `BMI record age must be between ${AGE_MIN} and ${AGE_MAX} years (same range as BMI calculator).`,
      });
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

    const wheelchairForbidden = [
      "Back Squat", "Front Squat", "Leg Press", "Goblet Squat", "Walking Lunge", "Reverse Lunge",
      "Bulgarian Split Squat", "Romanian Deadlift", "Deadlift", "Calf Raise", "Plank", "Side Plank",
      "Mountain Climber", "High Knees", "Forearm Plank", "Hollow Hold", "Dead Bug", "Jumping Jack",
      "Push-up", "Diamond Push-up", "Pull-up", "Chin-up", "Dips"
    ];

    const finalAllowedExercises = isWheelchairBound
      ? VTA_ALLOWED_EXERCISES.filter(ex => !wheelchairForbidden.includes(ex))
      : VTA_ALLOWED_EXERCISES;

    // Construct a more detailed prompt for structured output
    const prompt = `Create a detailed ${fitnessGoal} workout plan for a ${gender} at ${strengthLevel} level, with ${daysPerWeek} sessions per week, and ${timeCommitment} minute sessions. 
    Focus on ${trainingMethod} and ${workoutType} equipment. 
    ${specificGoalInstruction}
    The user's BMI data is: ${summarizeBmiForWorkoutPrompt(bmiData)}.
    Consider any health conditions from bmiData.diseases or bmiData.allergies to make the plan safe and effective. 
    The user also has the following allergies: ${allergies.join(", ") || "None"}.
    
    ${isSenior ? "CRITICAL: The user is a SENIOR CITIZEN (60+ years old). You MUST add ' - Senior Friendly' to the 'focus' of EVERY day. Add specific safety notes for seniors in the 'notes' field for EVERY exercise. Choose ONLY the safest, most senior-appropriate exercises from the allowed list (e.g., proper supported rows, basic presses, planks, avoiding heavy or dangerous compound lifts like Deadlifts unless exclusively light/bodyweight). Keep repetition schemes very safe and emphasize mobility and joint health." : ""}
    ${isWheelchairBound ? "CRITICAL: The user is WHEELCHAIR-BOUND. All exercises MUST be performable from a seated position. We have strictly filtered the allowed exercise list to ensure no standing or leg-based movements are given. You MUST ONLY pick from the provided list below and focus on upper-body strength, mobility, and seated core stabilization." : ""}


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

    VIRTUAL TRAINING ASSISTANT (CRITICAL): Our app has a Virtual Training Assistant that gives form feedback. You MUST use ONLY exercises from this list for the 'name' field (use these names exactly or very close variants like "Push-up" or "Push up"):
    ${finalAllowedExercises.join(", ")}
    Do not invent other exercise names. If you need a similar movement, pick the closest match from the list above so users can practice with the assistant.

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
          responseMimeType: "application/json",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );

    let planContentRaw =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]"; // Default to empty array if plan generation fails

    // Strip markdown code block delimiters if present
    if (planContentRaw.startsWith("```json")) {
      planContentRaw = planContentRaw.substring(7);
    }
    if (planContentRaw.endsWith("```")) {
      planContentRaw = planContentRaw.slice(0, -3);
    }
    planContentRaw = planContentRaw.trim(); // Trim any leading/trailing whitespace

    const planContent = parseGeminiJsonArray(planContentRaw);
    if (!planContent || planContent.length === 0) {
      console.error("Error parsing AI generated plan: empty or invalid JSON array");
      console.error("Raw AI response (truncated):", String(planContentRaw).slice(0, 2000));
      return res.status(500).json({
        error: "Failed to parse AI generated workout plan",
        details: "Model did not return a valid JSON array. Try again.",
        rawResponse: String(planContentRaw).slice(0, 4000),
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
    console.error("Error generating workout plan:", safeErrorForLog(error));
    if (error.response) {
      console.error("Gemini API response error:", error.response.data);
    }
    const isTimeout =
      error.code === "ECONNABORTED" || /timeout/i.test(String(error.message || ""));
    res.status(500).json({
      error: "Failed to generate workout plan",
      details: isTimeout
        ? "The AI request timed out. Wait a moment and try again, or reduce sessions per week / session length if it keeps happening."
        : error.message,
    });
  }
});

// Helper function to calculate scheduled dates for workouts
function calculateScheduledDates(startDate, daysPerWeek, durationWeeks, planContent) {
  const scheduledDates = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Reset time to start of day

  let currentDate = new Date(start);
  const daysInWeek = 7;
  const interval = Math.floor(daysInWeek / daysPerWeek); // Spread workouts evenly

  // Generate schedule for all weeks
  for (let week = 1; week <= durationWeeks; week++) {
    // Reset to start of week (same weekday as start date)
    if (week > 1) {
      currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + (week - 1) * 7);
    }

    // Schedule workouts for this week
    for (let dayIndex = 0; dayIndex < planContent.length && dayIndex < daysPerWeek; dayIndex++) {
      const workoutDate = new Date(currentDate);

      // Distribute workouts evenly across the week
      // For 2 days/week: days 0, 3 (or similar)
      // For 3 days/week: days 0, 2, 4
      // For 4 days/week: days 0, 1, 3, 5
      if (daysPerWeek === 2) {
        workoutDate.setDate(currentDate.getDate() + (dayIndex === 0 ? 0 : 3));
      } else if (daysPerWeek === 3) {
        workoutDate.setDate(currentDate.getDate() + (dayIndex === 0 ? 0 : dayIndex === 1 ? 2 : 4));
      } else if (daysPerWeek === 4) {
        workoutDate.setDate(currentDate.getDate() + (dayIndex === 0 ? 0 : dayIndex === 1 ? 1 : dayIndex === 2 ? 3 : 5));
      } else if (daysPerWeek === 5) {
        workoutDate.setDate(currentDate.getDate() + (dayIndex === 0 ? 0 : dayIndex === 1 ? 1 : dayIndex === 2 ? 2 : dayIndex === 3 ? 4 : 5));
      } else if (daysPerWeek === 6) {
        workoutDate.setDate(currentDate.getDate() + (dayIndex === 0 ? 0 : dayIndex === 1 ? 1 : dayIndex === 2 ? 2 : dayIndex === 3 ? 3 : dayIndex === 4 ? 4 : 5));
      } else {
        // Default: spread evenly
        workoutDate.setDate(currentDate.getDate() + Math.floor(dayIndex * (daysInWeek / daysPerWeek)));
      }

      scheduledDates.push({
        date: workoutDate,
        dayIndex: dayIndex,
        weekNumber: week,
        status: 'pending',
      });
    }
  }

  return scheduledDates.sort((a, b) => a.date - b.date); // Sort by date
}

// New endpoint to save a workout plan
router.post("/workout-plan/save", async (req, res) => {
  try {
    const {
      userId,
      name,
      description,
      planContent,
      generatedParams,
      durationWeeks,
    } = req.body;

    if (
      !userId ||
      !name ||
      !planContent ||
      !generatedParams ||
      !durationWeeks
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields to save workout plan" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Deactivate any existing active plans for this user
    await WorkoutPlan.updateMany(
      { userId: userId, isActive: true },
      { isActive: false }
    );

    // Deactivate any existing active diet charts for this user
    await DietChart.updateMany(
      { userId: userId, isActive: true },
      { isActive: false }
    );

    // Calculate start date (today)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Calculate scheduled dates for all workouts
    const scheduledDates = calculateScheduledDates(
      startDate,
      generatedParams.daysPerWeek || planContent.length,
      durationWeeks,
      planContent
    );

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationWeeks * 7);

    const workoutPlan = new WorkoutPlan({
      userId,
      name,
      description,
      planContent,
      generatedParams: {
        ...generatedParams,
        durationWeeks,
        diseases: generatedParams.diseases, // Store diseases
        allergies: generatedParams.allergies, // Store allergies
      }, // Ensure durationWeeks is explicitly saved in generatedParams
      durationWeeks,
      isActive: true, // Mark the new plan as active
      startDate: startDate,
      endDate: endDate,
      scheduledDates: scheduledDates,
      currentWeek: 1, // Initialize current week
      completed: false, // Initialize as not completed
      dayCompletions: [], // Initialize empty day completions
      weeklyContentOverrides: new Map(), // Initialize empty map for overrides
    });

    await workoutPlan.save();

    user.workoutPlans.push(workoutPlan._id);
    await user.save();

    // Award points for generating workout plan
    try {
      const { awardPoints } = require("../utils/gamify");
      await awardPoints(userId, "workout_generate");
    } catch (e) {
      console.error("Gamify award error:", safeErrorForLog(e));
    }

    try {
      const { pushUserNotification } = require("../utils/pushUserNotification");
      await pushUserNotification(userId, {
        title: "New workout plan ready",
        message: `Your workout plan "${name}" is active. Open My Workout Plan to start training.`,
        type: "workout",
      });
    } catch (e) {
      console.error("Notification error (workout save):", safeErrorForLog(e));
    }

    res.status(201).json({
      success: true,
      message: "Workout plan saved successfully and set as active",
      plan: workoutPlan,
    });
  } catch (error) {
    console.error("Error saving workout plan:", safeErrorForLog(error));
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
      activePlan = await WorkoutPlan.findOne({ userId }).sort({
        createdAt: -1,
      });
      if (!activePlan) {
        return res
          .status(404)
          .json({ error: "No active workout plan found for this user" });
      }
    }

    // Fetch workout session logs for the active plan
    const sessionLogs = await WorkoutSessionLog.find({
      workoutPlanId: activePlan._id,
    }).sort({ date: 1 });

    console.log(
      "Backend /workout-plan/active/:userId sending sessionLogs:",
      sessionLogs.map((log) => ({
        weekNumber: log.weekNumber,
        dayIndex: log.dayIndex,
        completedExercises: log.workoutDetails
          .filter((ex) => ex.completed)
          .map((ex) => ex.exerciseName),
      }))
    );

    // Get the plan content for the current week, prioritizing overrides
    const currentWeekPlanContent =
      activePlan.weeklyContentOverrides.get(
        activePlan.currentWeek.toString()
      ) || activePlan.planContent;

    res.status(200).json({
      success: true,
      plan: {
        ...activePlan.toObject(),
        planContent: currentWeekPlanContent, // Ensure we send the correct week's plan content
      },
      sessionLogs,
    });
  } catch (error) {
    console.error("Error fetching active workout plan:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to fetch active workout plan",
      details: error.message,
    });
  }
});

// Helper function to mark missed workouts
async function markMissedWorkouts(workoutPlan) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let hasUpdates = false;

  if (workoutPlan.scheduledDates && workoutPlan.scheduledDates.length > 0) {
    for (let scheduled of workoutPlan.scheduledDates) {
      const scheduledDate = new Date(scheduled.date);
      scheduledDate.setHours(0, 0, 0, 0);

      // If scheduled date is in the past and status is still pending, mark as missed
      if (scheduledDate < today && scheduled.status === 'pending') {
        scheduled.status = 'missed';
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await workoutPlan.save();
    }
  }

  return hasUpdates;
}

// Endpoint to get today's workout only (blocks tomorrow's workout)
router.get("/workout-plan/today/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let activePlan = await WorkoutPlan.findOne({ userId, isActive: true });
    if (!activePlan) {
      return res.status(404).json({
        error: "No active workout plan found",
        todayWorkout: null
      });
    }

    // Mark missed workouts
    await markMissedWorkouts(activePlan);

    // Refresh plan from DB after marking missed
    activePlan = await WorkoutPlan.findOne({ userId, isActive: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's scheduled workout
    let todayWorkout = null;
    if (activePlan.scheduledDates && activePlan.scheduledDates.length > 0) {
      const todaySchedule = activePlan.scheduledDates.find(scheduled => {
        const scheduledDate = new Date(scheduled.date);
        scheduledDate.setHours(0, 0, 0, 0);
        return scheduledDate.getTime() === today.getTime();
      });

      if (todaySchedule) {
        // Get the workout content for this day
        const dayIndex = todaySchedule.dayIndex;
        const workoutContent = activePlan.planContent[dayIndex];

        // Check if already completed today (full day marked complete)
        const isCompleted = todaySchedule.status === 'completed';
        // Always fetch today's session log so UI can show which exercises are done (partial or full)
        const completedSessionLog = await WorkoutSessionLog.findOne({
          workoutPlanId: activePlan._id,
          weekNumber: todaySchedule.weekNumber,
          dayIndex: dayIndex,
          date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        const isSkipped = todaySchedule.status === "skipped";
        todayWorkout = {
          scheduledDate: todaySchedule.date,
          dayIndex: dayIndex,
          weekNumber: todaySchedule.weekNumber,
          status: todaySchedule.status,
          workoutContent: workoutContent,
          completedSessionLog: completedSessionLog,
          isCompleted: isCompleted,
          isSkipped,
          skipReason: todaySchedule.skipReason || null,
        };
      }
    }

    // Get next workout date (for info)
    let nextWorkoutDate = null;
    if (activePlan.scheduledDates && activePlan.scheduledDates.length > 0) {
      const upcomingSchedules = activePlan.scheduledDates
        .filter(s => {
          const scheduledDate = new Date(s.date);
          scheduledDate.setHours(0, 0, 0, 0);
          return scheduledDate > today && s.status === 'pending';
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (upcomingSchedules.length > 0) {
        nextWorkoutDate = upcomingSchedules[0].date;
      }
    }

    // Get missed workouts count and details
    const missedSchedules = activePlan.scheduledDates
      ? activePlan.scheduledDates.filter(s => s.status === 'missed')
      : [];
    const missedCount = missedSchedules.length;

    // Format missed workouts for display
    const missedWorkoutDetails = missedSchedules.map(scheduled => {
      const workoutContent = activePlan.planContent[scheduled.dayIndex];
      return {
        date: scheduled.date,
        weekNumber: scheduled.weekNumber,
        dayIndex: scheduled.dayIndex,
        focus: workoutContent?.focus || `Day ${scheduled.dayIndex + 1}`,
      };
    });

    res.status(200).json({
      success: true,
      todayWorkout: todayWorkout,
      nextWorkoutDate: nextWorkoutDate,
      missedWorkouts: missedCount,
      missedWorkoutDetails: missedWorkoutDetails,
      message: todayWorkout
        ? (todayWorkout.isCompleted
          ? "Today's workout is already completed!"
          : "Today's workout is ready!")
        : "No workout scheduled for today. Rest day!",
    });
  } catch (error) {
    console.error("Error fetching today's workout:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to fetch today's workout",
      details: error.message,
    });
  }
});

const SKIP_REASONS = new Set(["rest", "sick", "low_mood", "other"]);

/** Mark today's scheduled session as voluntarily skipped (rest/sick) — not counted as "missed". */
router.post("/workout-plan/skip-today", async (req, res) => {
  try {
    const { userId, reason } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    let activePlan = await WorkoutPlan.findOne({ userId, isActive: true });
    if (!activePlan) {
      return res.status(404).json({ success: false, error: "No active workout plan" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduled = (activePlan.scheduledDates || []).find((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (!scheduled) {
      return res.status(400).json({
        success: false,
        error: "No workout is scheduled for today — enjoy your rest day.",
      });
    }
    if (scheduled.status === "completed") {
      return res.status(400).json({
        success: false,
        error: "Today's workout is already completed.",
      });
    }
    if (scheduled.status === "skipped") {
      return res.status(400).json({
        success: false,
        error: "You already logged that you can't train today.",
      });
    }
    if (scheduled.status === "missed") {
      return res.status(400).json({
        success: false,
        error: "This day was already marked missed. Use the plan as a guide and continue with your next session.",
      });
    }

    const r = SKIP_REASONS.has(String(reason)) ? String(reason) : "other";
    scheduled.status = "skipped";
    scheduled.skipReason = r;
    activePlan.markModified("scheduledDates");
    await activePlan.save();

    return res.status(200).json({
      success: true,
      message:
        r === "sick"
          ? "Rest up — we logged today as a planned rest. Come back when you feel better."
          : "Got it — today is logged as a rest day. Your plan continues with the next session.",
    });
  } catch (error) {
    console.error("skip-today error:", safeErrorForLog(error));
    return res.status(500).json({ success: false, error: "Failed to update plan", details: error.message });
  }
});

/** Undo voluntary skip if the user still wants to train today. */
router.post("/workout-plan/unskip-today", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const activePlan = await WorkoutPlan.findOne({ userId, isActive: true });
    if (!activePlan) {
      return res.status(404).json({ success: false, error: "No active workout plan" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduled = (activePlan.scheduledDates || []).find((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (!scheduled || scheduled.status !== "skipped") {
      return res.status(400).json({
        success: false,
        error: "Today is not marked as a voluntary rest day.",
      });
    }

    scheduled.status = "pending";
    scheduled.skipReason = undefined;
    activePlan.markModified("scheduledDates");
    await activePlan.save();

    return res.status(200).json({
      success: true,
      message: "Today's workout is available again — train when you're ready.",
    });
  } catch (error) {
    console.error("unskip-today error:", safeErrorForLog(error));
    return res.status(500).json({ success: false, error: "Failed to update plan", details: error.message });
  }
});

// New endpoint to get workout session logs for a specific workout plan
router.get("/workout-plan/:planId/sessions", async (req, res) => {
  try {
    const { planId } = req.params;

    const sessionLogs = await WorkoutSessionLog.find({
      workoutPlanId: planId,
    }).sort({ date: 1 });

    res.status(200).json({ success: true, sessionLogs });
  } catch (error) {
    console.error("Error fetching workout sessions for plan:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to fetch workout sessions",
      details: error.message,
    });
  }
});

// New endpoint to log a workout session
router.post("/workout-session/log", async (req, res) => {
  try {
    const {
      userId,
      workoutPlanId,
      workoutDetails,
      overallNotes,
      perceivedExertion,
      durationMinutes,
      dayIndex,
      date,
      weekNumber,
    } = req.body;

    if (
      !userId ||
      !workoutPlanId ||
      !workoutDetails ||
      dayIndex === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields to log workout session" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = await WorkoutPlan.findById(workoutPlanId);
    if (!plan) return res.status(404).json({ error: "Workout plan not found" });
    if (plan.completed || plan.isActive === false) {
      return res.status(400).json({
        error:
          "This workout plan is closed or completed. Activate a new plan to continue logging.",
      });
    }

    // Use weekNumber from req.body if provided, otherwise compute from date relative to plan.startDate
    const sessionDate = date ? new Date(date) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDateOnly = new Date(sessionDate);
    sessionDateOnly.setHours(0, 0, 0, 0);

    // VALIDATION: Only allow logging today's workout (block future dates)
    if (sessionDateOnly > today) {
      return res.status(400).json({
        error: "Cannot log future workouts. You can only log today's scheduled workout.",
      });
    }

    // Check if this workout is scheduled for today
    let scheduledWorkout = null;
    if (plan.scheduledDates && plan.scheduledDates.length > 0) {
      scheduledWorkout = plan.scheduledDates.find(scheduled => {
        const scheduledDate = new Date(scheduled.date);
        scheduledDate.setHours(0, 0, 0, 0);
        return scheduledDate.getTime() === sessionDateOnly.getTime() &&
          scheduled.dayIndex === dayIndex;
      });

      if (!scheduledWorkout && sessionDateOnly.getTime() === today.getTime()) {
        return res.status(400).json({
          error: "No workout scheduled for today. Check your plan schedule.",
        });
      }

      // If logging for past date (missed workout), allow it but show warning
      if (sessionDateOnly < today && scheduledWorkout) {
        if (scheduledWorkout.status === 'missed') {
          // Allow making up missed workout
          console.log(`User logging missed workout from ${sessionDateOnly.toDateString()}`);
        }
      }
    }

    let actualWeekNumber = weekNumber;
    if (actualWeekNumber === undefined) {
      const msInWeek = 7 * 24 * 60 * 60 * 1000;
      actualWeekNumber =
        Math.floor((sessionDate - new Date(plan.startDate)) / msInWeek) + 1;
    }

    console.log("Backend /workout-session/log received:", {
      userId,
      workoutPlanId,
      dayIndex,
      actualWeekNumber,
      workoutDetails: workoutDetails.map((ex) => ({
        name: ex.exerciseName,
        completed: ex.completed,
      })),
    });

    // Get the actual plan content for this specific week and dayIndex, prioritizing overrides
    const currentWeekPlanContent =
      plan.weeklyContentOverrides.get(actualWeekNumber.toString()) ||
      plan.planContent;
    const plannedDayExercises =
      currentWeekPlanContent[dayIndex]?.exercises || [];

    // Find or create workout session log
    let workoutSession = await WorkoutSessionLog.findOne({
      userId,
      workoutPlanId,
      weekNumber: actualWeekNumber,
      dayIndex,
    });

    if (workoutSession) {
      // Merge existing workout details with new ones
      const existingDetailsMap = new Map(
        workoutSession.workoutDetails.map((d) => [d.exerciseName, d])
      );
      workoutDetails.forEach((newDetail) => {
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
    let allPlannedExercisesCompletedForThisDay =
      plannedDayExercises.length > 0 &&
      plannedDayExercises.every((plannedEx) => {
        return workoutSession.workoutDetails.some(
          (loggedEx) =>
            loggedEx.exerciseName === plannedEx.name && loggedEx.completed
        );
      });
    workoutSession.allExercisesCompleted =
      allPlannedExercisesCompletedForThisDay; // Update the session log's own completion status

    await workoutSession.save();
    try {
      const { awardPoints } = require("../utils/gamify");
      await awardPoints(userId, 'workout_log');
    } catch (e) { console.error('Gamify award error:', safeErrorForLog(e)); }

    // Link session to user if it's a new session
    if (!user.workoutSessionLogs.includes(workoutSession._id)) {
      user.workoutSessionLogs.push(workoutSession._id);
      await user.save();
    }

    let planUpdated = false;
    const totalDaysPerWeek =
      plan.generatedParams?.daysPerWeek || plan.planContent.length;
    // const uniqueDayCompletionId = `${weekNumber}-${dayIndex}`;
    const wasDayAlreadyCompleted = plan.dayCompletions.some(
      (dc) => dc.weekNumber === actualWeekNumber && dc.dayIndex === dayIndex
    );

    if (allPlannedExercisesCompletedForThisDay && !wasDayAlreadyCompleted) {
      // Mark day as completed in the plan
      plan.dayCompletions.push({
        weekNumber: actualWeekNumber,
        dayIndex,
        sessionId: workoutSession._id,
        date: sessionDate,
      });
      plan.completedDayCount = (plan.completedDayCount || 0) + 1;
      planUpdated = true;

      // Update scheduled date status to 'completed'
      if (scheduledWorkout) {
        scheduledWorkout.status = 'completed';
        scheduledWorkout.completedAt = new Date();
        planUpdated = true;
      }
    } else if (
      !allPlannedExercisesCompletedForThisDay &&
      wasDayAlreadyCompleted
    ) {
      // If a day was previously completed but now some exercises are unchecked, unmark it
      plan.dayCompletions = plan.dayCompletions.filter(
        (dc) =>
          !(dc.weekNumber === actualWeekNumber && dc.dayIndex === dayIndex)
      );
      plan.completedDayCount = (plan.completedDayCount || 0) - 1;
      planUpdated = true;

      // Revert scheduled date status back to 'pending' or 'missed'
      if (scheduledWorkout) {
        const scheduledDateOnly = new Date(scheduledWorkout.date);
        scheduledDateOnly.setHours(0, 0, 0, 0);
        scheduledWorkout.status = scheduledDateOnly < today ? 'missed' : 'pending';
        scheduledWorkout.completedAt = undefined;
        planUpdated = true;
      }
    }

    // Check for weekly completion and potentially generate next week's plan
    const currentWeekCompletions = plan.dayCompletions.filter(
      (dc) => dc.weekNumber === plan.currentWeek
    );
    if (
      currentWeekCompletions.length >= totalDaysPerWeek &&
      plan.currentWeek === actualWeekNumber
    ) {
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
          const generateResponse = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: `Create a varied workout plan for week ${plan.currentWeek
                        } given the user's initial parameters: ${JSON.stringify(
                          requestData
                        )}. The previous week's plan content was: ${JSON.stringify(
                          plan.planContent
                        )}. Only return the JSON array for this week's plan.`, // Include previous plan content for variation
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
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 30000,
            }
          );

          let newWeeklyPlanRaw =
            generateResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

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
              throw new Error(
                "AI did not return a valid JSON array for the new weekly plan."
              );
            }
            // Store the newly generated plan in weeklyContentOverrides
            plan.weeklyContentOverrides.set(
              plan.currentWeek.toString(),
              newWeeklyPlanContent
            );
            console.log(
              `Successfully generated and stored plan for week ${plan.currentWeek} in overrides.`
            );
          } catch (parseError) {
            console.error(
              `Error parsing AI generated plan for week ${plan.currentWeek}:`,
              parseError.message
            );
            console.error(
              "Raw AI response for new weekly plan:",
              newWeeklyPlanRaw
            );
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
          console.error(
            `Error generating plan for week ${plan.currentWeek}:`,
            safeErrorForLog(aiError)
          );
          // Continue without new plan
        }
      }
    }

    // Check overall plan completion based on completedDayCount
    if (plan.completedDayCount >= plan.durationWeeks * totalDaysPerWeek) {
      plan.completed = true;
      plan.isActive = false;
      plan.closedAt = new Date();
    }

    if (planUpdated) {
      await plan.save();
    }

    res.status(201).json({
      success: true,
      message: "Workout session logged successfully",
      session: workoutSession,
      planProgress: {
        completed: plan.completed,
        completedDayCount: plan.completedDayCount,
        totalDays:
          plan.durationWeeks *
          (plan.generatedParams?.daysPerWeek || plan.planContent.length || 0),
        currentWeek: plan.currentWeek,
        weeklyContentOverrides: Object.fromEntries(plan.weeklyContentOverrides),
      },
    });
  } catch (error) {
    console.error("Error logging workout session:", safeErrorForLog(error));
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
    console.error("Error fetching workout plan history:", safeErrorForLog(error));
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
    if (!workoutPlan)
      return res.status(404).json({ error: "Workout plan not found" });

    if (isActive !== undefined) {
      if (workoutPlan.completed && isActive) {
        return res.status(400).json({
          error:
            "Completed plans cannot be reactivated. Please create a new plan.",
        });
      }
      // If setting this plan to active, deactivate all other plans for the user
      if (isActive) {
        await WorkoutPlan.updateMany(
          { userId: workoutPlan.userId, isActive: true },
          { isActive: false }
        );
        // Deactivate any existing active diet charts for this user
        await DietChart.updateMany(
          { userId: workoutPlan.userId, isActive: true },
          { isActive: false }
        );
      }
      workoutPlan.isActive = isActive;
    }
    if (name) workoutPlan.name = name;
    if (description) workoutPlan.description = description;

    await workoutPlan.save();

    res.status(200).json({
      success: true,
      message: "Workout plan updated successfully",
      plan: workoutPlan,
    });
  } catch (error) {
    console.error("Error updating workout plan:", safeErrorForLog(error));
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
    if (!workoutPlan)
      return res.status(404).json({ error: "Workout plan not found" });

    // Delete associated workout session logs
    await WorkoutSessionLog.deleteMany({ workoutPlanId: planId });

    // Delete associated diet charts
    await DietChart.deleteMany({ workoutPlanId: planId });

    // Remove plan from user's workoutPlans array
    await User.updateOne(
      { _id: workoutPlan.userId },
      { $pull: { workoutPlans: planId } }
    );

    // Delete the workout plan itself
    await workoutPlan.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Workout plan, associated logs, and diet charts deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting workout plan:", safeErrorForLog(error));
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

    // Build userContext
    let userContext = "";
    let userObj = null;
    let activeWorkoutPlan = null;

    if (userEmail) {
      try {
        userObj = await User.findOne({ email: userEmail });
        if (userObj) {
          const latestBMI = await BMI.findOne({ userId: userObj._id }).sort({ date: -1 }).lean();
          activeWorkoutPlan = await WorkoutPlan.findOne({ userId: userObj._id, isActive: true }).sort({ createdAt: -1 }).lean();

          if (latestBMI) {
            userContext += `Profile (internal): ${latestBMI.weight}kg; ${latestBMI.heightFeet}'${latestBMI.heightInches}"; age ${latestBMI.age}; BMI ${latestBMI.bmi} (${latestBMI.category}); target ${latestBMI.targetWeight ?? "—"}kg; dz:${userObj.diseases?.join(",") || "none"}; al:${userObj.allergies?.join(",") || "none"}\n`;
          }

          if (activeWorkoutPlan) {
            userContext += summarizeActivePlanForPrompt(activeWorkoutPlan);
          }

          try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const dayLogs = await CalorieIntakeLog.find({
              userId: userObj._id,
              date: { $gte: todayStart, $lte: todayEnd },
            }).lean();
            const todayIntakeKcal = dayLogs.reduce((s, l) => s + (Number(l.totalCalories) || 0), 0);
            userContext += `Today calorie log (internal): ${Math.round(todayIntakeKcal)} kcal logged so far.\n`;
          } catch (calCtxErr) {
            console.error("Error fetching today calories for chat context:", safeErrorForLog(calCtxErr));
          }
        }
      } catch (contextError) {
        console.error("Error fetching user context:", safeErrorForLog(contextError));
      }
    }

    const lastUserText = String(lastUserMessage.content || "");
    const forceFoodTool = Boolean(userObj && looksLikeFoodLogRequest(lastUserText));

    const systemPrompt =
      `You are FitBot, the official AI Fitness Agent for GenFit AI. 

### CRITICAL LANGUAGE RULE:
You MUST match the language of the user's last message EXACTLY. 
- If user input is ENGLISH -> YOU MUST RESPOND IN ENGLISH.
- If user input is HINDI (Hindi script) -> YOU MUST RESPOND IN HINDI.
- If user input is HINGLISH (Hindi in Roman script) -> YOU MUST RESPOND IN HINGLISH.

### LANGUAGE MATCHING EXAMPLES:
- User: "Update my weight" -> Assistant: "I've updated your weight to 52 kg. Your new BMI is..."
- User: "मेरा वजन 52 किलो कर दो" -> Assistant: "मैंने आपका वजन 52 किलो अपडेट कर दिया है। आपका नया बीएमआई..."
- User: "Vajan 52 kg kar do" -> Assistant: "Bilkul, aapka vajan 52 kg update kar diya gaya hai. Aapka naya BMI..."

STRICTLY NEVER RESPOND IN HINDI/HINGLISH IF THE USER SPEAKS ENGLISH.

### STYLE & CAPABILITIES:
- Style: Friendly, concise, professional. Short plain-text only.
- Capabilities: Log food, log workouts, update BMI, update profile, create plans.
- Context: Use BEGIN_CONTEXT for internal data; never show raw context to users.

BEGIN_CONTEXT
${userContext || "(no profile/plan loaded)"}
END_CONTEXT`;

    // Format messages for Grok
    const formattedMessages = [
      { role: "system", content: systemPrompt }
    ];

    const recentMessages = messages.slice(-FITBOT_MAX_CHAT_HISTORY);
    for (const msg of recentMessages) {
      if (msg.role === "user") {
        if (msg.imageBase64) {
          formattedMessages.push({
            role: "user",
            content: [
              { type: "text", text: truncateGroqText(msg.content || "", FITBOT_MAX_USER_CHARS) },
              { type: "image_url", image_url: { url: msg.imageBase64 } }
            ]
          });
        } else {
          formattedMessages.push({ role: "user", content: truncateGroqText(msg.content || "", FITBOT_MAX_USER_CHARS) });
        }
      } else if (msg.role === "assistant") {
        formattedMessages.push({
          role: msg.role,
          content: truncateGroqText(msg.content || ""),
        });
      }
    }

    const exerciseItem = {
      type: "object",
      properties: {
        name: { type: "string" },
        sets: { type: "number" },
        reps: { type: "string" },
        weight: { type: "string" },
        rest: { type: "string" },
        notes: { type: "string" },
      },
      required: ["name", "sets", "reps"],
    };
    const dayItem = {
      type: "object",
      properties: {
        day: { type: "string" },
        focus: { type: "string" },
        warmup: { type: "string" },
        cooldown: { type: "string" },
        exercises: { type: "array", items: exerciseItem },
      },
      required: ["day", "exercises"],
    };
    const tools = [
      {
        type: "function",
        function: {
          name: "log_food",
          description:
            "Use when the user wants to log food or meals (including Indian dishes). Estimate calories; never ask the user for calories.",
          parameters: {
            type: "object",
            properties: {
              foodItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    caloriesPerItem: { type: "number" },
                    quantity: { type: "number" },
                    totalCalories: { type: "number" },
                    mealType: {
                      type: "string",
                      enum: ["Breakfast", "Lunch", "Evening Snack", "Dinner", "Other"],
                    },
                  },
                  required: ["name", "caloriesPerItem", "quantity", "totalCalories"],
                },
              },
              totalCalories: { type: "number" },
              waterIntake: { type: "number" },
              notes: { type: "string" },
            },
            required: ["foodItems", "totalCalories"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "log_workout",
          description: "Log completed workout session.",
          parameters: {
            type: "object",
            properties: {
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    exerciseName: { type: "string" },
                    sets: { type: "number" },
                    reps: { type: "string" },
                    weight: { type: "string" },
                  },
                  required: ["exerciseName", "sets", "reps"],
                },
              },
              durationMinutes: { type: "number" },
              caloriesBurned: { type: "number" },
              perceivedExertion: { type: "number" },
              overallNotes: { type: "string" },
            },
            required: ["exercises"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "update_bmi",
          description: "Update BMI record (weight kg, height ft/in, age, optional targets).",
          parameters: {
            type: "object",
            properties: {
              heightFeet: { type: "number" },
              heightInches: { type: "number" },
              weight: { type: "number" },
              age: { type: "number" },
              targetWeight: { type: "number" },
              targetTimeline: { type: "string" },
              selectedPlan: {
                type: "string",
                enum: ["lose_weight", "gain_weight", "build_muscles"],
              },
            },
            required: ["weight", "heightFeet", "heightInches", "age"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "update_profile",
          description: "Update name, diseases, allergies.",
          parameters: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              diseases: { type: "array", items: { type: "string" } },
              allergies: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_workout_plan",
          description: "Create workout plan; setActive default true.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              durationWeeks: { type: "number" },
              planContent: { type: "array", items: dayItem },
              setActive: { type: "boolean" },
            },
            required: ["name", "durationWeeks", "planContent"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_diet_chart",
          description: "Save diet chart markdown.",
          parameters: {
            type: "object",
            properties: {
              dietChartMarkdown: { type: "string" },
              durationWeeks: { type: "number" },
            },
            required: ["dietChartMarkdown", "durationWeeks"],
          },
        },
      },
    ];

    let hasToolCalls = true;
    let botResponseText = "";
    let iterations = 0;

    while (hasToolCalls && iterations < 3) {
      iterations++;

      const hasImage = formattedMessages.some(
        (m) => Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
      );
      const useForcedFood =
        iterations === 1 && forceFoodTool && userObj && !hasImage;
      const payload = {
        model: hasImage ? GROQ_FITBOT_VISION_MODEL : GROQ_FITBOT_TEXT_MODEL,
        messages: formattedMessages,
        tools: tools,
        tool_choice: useForcedFood
          ? { type: "function", function: { name: "log_food" } }
          : "auto",
        temperature: 0.5,
        max_completion_tokens: useForcedFood
          ? Math.min(900, Math.max(FITBOT_MAX_COMPLETION_TOKENS, 640))
          : FITBOT_MAX_COMPLETION_TOKENS,
        top_p: 1,
        stream: false,
      };

      const response = await postGroqChatCompletions(payload, GROQ_API_KEY);

      const responseMessage = response.data.choices[0].message;
      formattedMessages.push(responseMessage);

      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          let toolResult = "";

          try {
            if (!userObj) {
              toolResult = JSON.stringify({ error: "User not identified. Cannot log data without a user context." });
            } else if (functionName === "log_food") {
              const logDate = new Date();
              const log = await CalorieIntakeLog.create({
                userId: userObj._id,
                totalCalories: args.totalCalories || 0,
                source: "chat",
                notes: args.notes,
                date: logDate,
                items: args.foodItems.map(it => ({
                  name: it.name,
                  caloriesPerItem: it.caloriesPerItem,
                  quantity: it.quantity || 1,
                  totalCalories: it.totalCalories,
                  mealType: it.mealType || "Other",
                })),
                waterIntake: args.waterIntake || 0,
              });
              toolResult = JSON.stringify({ success: true, message: "Food logged successfully", logId: log._id });
            } else if (functionName === "log_workout") {
              if (!activeWorkoutPlan) {
                toolResult = JSON.stringify({ error: "No active workout plan found for the user. A workout plan is required to log a session." });
              } else {
                const log = await WorkoutSessionLog.create({
                  userId: userObj._id,
                  workoutPlanId: activeWorkoutPlan._id,
                  date: new Date(),
                  workoutDetails: args.exercises.map(ex => ({
                    exerciseName: ex.exerciseName,
                    sets: ex.sets,
                    reps: String(ex.reps),
                    weight: ex.weight || "",
                    completed: true
                  })),
                  durationMinutes: args.durationMinutes || 0,
                  calories: args.caloriesBurned || 0,
                  perceivedExertion: args.perceivedExertion || 5,
                  overallNotes: args.overallNotes,
                  allExercisesCompleted: true
                });

                try {
                  const { awardPoints } = require("../utils/gamify");
                  await awardPoints(userObj._id, 'workout_log');
                } catch (e) {
                  console.error('Gamify error logging workout from chat:', safeErrorForLog(e));
                }

                toolResult = JSON.stringify({ success: true, message: "Workout logged successfully", logId: log._id });
              }
            } else if (functionName === "update_bmi") {
              const heightInMeters = (args.heightFeet * 0.3048) + (args.heightInches * 0.0254);
              const calculatedBmi = args.weight / (heightInMeters * heightInMeters);
              let category = "Normal";
              if (calculatedBmi < 18.5) category = "Underweight";
              else if (calculatedBmi >= 25 && calculatedBmi < 30) category = "Overweight";
              else if (calculatedBmi >= 30) category = "Obese";

              const bmiData = {
                userId: userObj._id,
                heightFeet: args.heightFeet,
                heightInches: args.heightInches,
                weight: args.weight,
                age: args.age,
                bmi: parseFloat(calculatedBmi.toFixed(2)),
                category,
                selectedPlan: args.selectedPlan || null,
                targetWeight: args.targetWeight || null,
                targetTimeline: args.targetTimeline || null,
                date: new Date()
              };
              const newBmi = await BMI.create(bmiData);
              toolResult = JSON.stringify({ success: true, message: "BMI updated successfully", bmi: newBmi.bmi });
            } else if (functionName === "update_profile") {
              const updates = {};
              if (args.firstName) updates.firstName = args.firstName;
              if (args.lastName) updates.lastName = args.lastName;
              if (args.diseases) updates.diseases = args.diseases;
              if (args.allergies) updates.allergies = args.allergies;
              const updatedUser = await User.findByIdAndUpdate(userObj._id, { $set: updates }, { new: true });
              toolResult = JSON.stringify({ success: true, message: "Profile updated successfully" });
            } else if (functionName === "create_workout_plan") {
              if (args.setActive !== false) {
                await WorkoutPlan.updateMany({ userId: userObj._id, isActive: true }, { isActive: false });
              }
              const plan = await WorkoutPlan.create({
                userId: userObj._id,
                name: args.name,
                description: args.description || "",
                durationWeeks: args.durationWeeks,
                isActive: args.setActive !== false,
                planContent: args.planContent,
                generatedParams: {
                  timeCommitment: "N/A",
                  workoutType: "mixed",
                  intensity: "N/A",
                  equipment: "N/A",
                  daysPerWeek: args.planContent.length
                }
              });
              if (args.setActive !== false) activeWorkoutPlan = plan;
              toolResult = JSON.stringify({ success: true, message: "Workout plan created successfully", planId: plan._id });
            } else if (functionName === "create_diet_chart") {
              let planIdToUse = activeWorkoutPlan ? activeWorkoutPlan._id : null;
              if (!planIdToUse) {
                const latestPlan = await WorkoutPlan.findOne({ userId: userObj._id }).sort({ createdAt: -1 });
                if (latestPlan) planIdToUse = latestPlan._id;
              }
              if (!planIdToUse) {
                toolResult = JSON.stringify({ error: "Cannot create a diet chart without an associated workout plan." });
              } else {
                await DietChart.updateMany({ userId: userObj._id, isActive: true }, { isActive: false });
                const chart = await DietChart.create({
                  userId: userObj._id,
                  workoutPlanId: planIdToUse,
                  dietChart: args.dietChartMarkdown,
                  durationWeeks: args.durationWeeks,
                  isActive: true
                });
                toolResult = JSON.stringify({ success: true, message: "Diet chart created successfully", chartId: chart._id });
              }
            } else {
              toolResult = JSON.stringify({ error: `Tool ${functionName} not supported.` });
            }
          } catch (toolError) {
            console.error(`Error executing tool ${functionName}:`, safeErrorForLog(toolError));
            toolResult = JSON.stringify({ error: toolError.message });
          }

          formattedMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: truncateGroqText(toolResult, 1500),
          });
        }
      } else {
        hasToolCalls = false;
        botResponseText = responseMessage.content;
      }
    }

    if (botResponseText) {
      botResponseText = botResponseText
        .replace(/\*{2,}/g, "")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\*{1,2}\s*/g, "")
        .replace(/\n\s*\*\s*/g, "\n• ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s*\*\s*/gm, "• ")
        .trim();
    }

    res.json({
      success: true,
      response: botResponseText || "I've handled that for you.",
    });
  } catch (error) {
    console.error("Error in chat endpoint:", safeErrorForLog(error));
    if (error.response) {
      console.error("Groq API response error:", JSON.stringify(error.response.data, null, 2));
    }
    const status = error.response?.status;
    const groqMsg = error.response?.data?.error?.message;
    const isTokenLimit =
      status === 413 ||
      status === 429 ||
      error.response?.data?.error?.code === "rate_limit_exceeded" ||
      (groqMsg && /too large|TPM|tokens per minute|rate limit/i.test(String(groqMsg)));
    res.status(isTokenLimit ? 429 : 500).json({
      error: isTokenLimit
        ? "FitBot hit a Groq rate or token limit after automatic retries. Wait ~30 seconds and try again, or shorten your message."
        : "Failed to process chat message",
      details: groqMsg || error.message,
    });
  }
});

// Image-based calorie tracking using Gemini Vision
router.post("/calorie-tracker/scan", async (req, res) => {
  try {
    const { imageBase64, userNote, userId } = req.body || {};

    if (!imageBase64 || !userId) {
      return res.status(400).json({
        success: false,
        error: "imageBase64 and userId are required",
      });
    }

    // --- ENFORCE LIMITS ---
    const limitCheck = await checkAndIncrementLimit(userId, "photoUsage");
    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.message || "Limit exceeded"
      });
    }
    // -----------------------

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    const prompt = `
You are a nutrition assistant. A user has uploaded an image of a food or beverage.

TASK:
- Detect the main food/beverage items and estimate calories as realistically as you can.
- You MUST work well for **Indian foods** (South Indian, North Indian, street food, curries, dosas, etc.), as well as international foods and drinks (like milk, coffee, juice, soda).
- DO NOT return 0 calories for items that contain caloric value (e.g. Milk, Juices, Foods). Even plain beverages like milk or lattes have calories.
- If multiple foods/drinks are present, list them separately and give a total.

VERY IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON (no markdown, no code fences, no trailing commas).
- Do NOT break strings across lines. Every string value must be on a single line.
- The "estimated_calories" and "total_estimated_calories" MUST be strict numbers (integer or float). Do NOT include words like "kcal" or string quotes for these fields.
- Use plain ASCII characters in the JSON output.
- If unsure of the exact dish or drink, choose the closest reasonable name and give a best calorie estimate.

OUTPUT FORMAT (STRICT JSON ONLY):
Include protein_g, carbs_g, fat_g (grams) per item for that portion. Numbers only.

{
  "food_items": [
    {
      "name": "Glass of Milk",
      "estimated_calories": 150,
      "protein_g": 8,
      "carbs_g": 12,
      "fat_g": 8,
      "confidence": 0.90
    }
  ],
  "total_estimated_calories": 150,
  "notes": "short human readable note about assumptions/portion size"
}

${userNote ? `User note / context: ${userNote}` : ""}
`.trim();

    const payload = {
      model: GROQ_FITBOT_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 1024,
      response_format: { type: "json_object" }
    };

    const response = await postGroqChatCompletions(payload, GROQ_API_KEY);

    let raw = response.data?.choices?.[0]?.message?.content || "{}";
    raw = raw.trim();

    // Strip accidental code fences if Groq adds them
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse Groq calorie JSON:", e.message);
      console.error("Raw response:", raw);

      // Fallback: try to salvage something from the text response
      try {
        const items = [];

        const nameMatches = [...raw.matchAll(/"name"\s*:\s*"([^"\n]+)/g)];
        const calMatches = [...raw.matchAll(
          /"estimated_calories"\s*:\s*([0-9]+(?:\.[0-9]+)?)/g
        )];

        const maxLen = Math.max(nameMatches.length, calMatches.length);
        for (let i = 0; i < maxLen; i++) {
          const name = nameMatches[i]?.[1]?.trim() || `Food ${i + 1}`;
          const calories = calMatches[i]
            ? Number(calMatches[i][1])
            : 0;
          const inf = inferMacrosFromCalories(calories);
          items.push({
            name,
            estimated_calories: calories,
            protein_g: inf.proteinG,
            carbs_g: inf.carbsG,
            fat_g: inf.fatG,
            confidence: null,
          });
        }

        const total = items.reduce(
          (acc, it) => acc + (Number(it.estimated_calories) || 0),
          0
        );

        parsed = {
          food_items: items,
          total_estimated_calories: total,
          notes:
            "Parsed in fallback mode because the AI response was not valid JSON. Values are approximate.",
        };
      } catch (fallbackErr) {
        console.error(
          "Fallback parse for Groq calorie response also failed:",
          fallbackErr.message
        );
        // Final ultra-safe fallback: return empty, not an error
        parsed = {
          food_items: [],
          total_estimated_calories: 0,
          notes:
            "Could not parse AI response reliably. Please try again with a clearer photo or different lighting.",
        };
      }
    }

    if (parsed?.food_items && Array.isArray(parsed.food_items)) {
      parsed.food_items = parsed.food_items.map((row) => {
        const name =
          typeof row.name === "string" ? row.name.trim() : String(row.name || "").trim();
        const estimated_calories = Number(row.estimated_calories);
        if (!name || !Number.isFinite(estimated_calories)) return row;
        let protein_g = Number(row.protein_g);
        let carbs_g = Number(row.carbs_g);
        let fat_g = Number(row.fat_g);
        const hasAll =
          [protein_g, carbs_g, fat_g].every((n) => Number.isFinite(n) && n >= 0) &&
          protein_g + carbs_g + fat_g > 0;
        if (!hasAll) {
          const inf = inferMacrosFromCalories(estimated_calories);
          protein_g = inf.proteinG;
          carbs_g = inf.carbsG;
          fat_g = inf.fatG;
        }
        return {
          ...row,
          name,
          estimated_calories,
          protein_g: Math.round(protein_g),
          carbs_g: Math.round(carbs_g),
          fat_g: Math.round(fat_g),
        };
      });
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Error in calorie-tracker/scan endpoint:", safeErrorForLog(error));
    if (error.response) {
      console.error("Groq API response error:", error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: "Failed to analyze food image with Groq",
      details: error.message,
    });
  }
});
// Log daily calorie intake — merges into the same calendar day (UTC) so users can add many foods.
router.post("/calorie-intake/log", async (req, res) => {
  try {
    const { userId, totalCalories, date, source, notes, items, waterIntake, mealType: bodyMealType } =
      req.body || {};

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const logDate = date ? new Date(date) : new Date();
    const dayStr = logDate.toISOString().slice(0, 10);
    const startUtc = new Date(`${dayStr}T00:00:00.000Z`);
    const endUtc = new Date(`${dayStr}T23:59:59.999Z`);

    const MEALS = ["Breakfast", "Lunch", "Evening Snack", "Dinner", "Other"];
    const defaultMeal =
      typeof bodyMealType === "string" && MEALS.includes(bodyMealType) ? bodyMealType : "Other";

    const rawItems = Array.isArray(items) ? items : [];

    const safeItems = rawItems
      .map((it) => {
        if (!it) return null;
        const name =
          typeof it.name === "string"
            ? it.name.trim()
            : String(it.name ?? "")
              .trim();
        if (!name) return null;

        const cpi = Number(it.caloriesPerItem ?? it.estimated_calories);
        const qtyRaw = Number(it.quantity);
        const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
        let tc = Number(it.totalCalories);
        if (!Number.isFinite(tc) || tc < 0) {
          tc = Number.isFinite(cpi) && cpi >= 0 ? cpi * qty : NaN;
        }
        if (!Number.isFinite(cpi) || cpi < 0 || !Number.isFinite(tc) || tc < 0) return null;

        const mt =
          typeof it.mealType === "string" && MEALS.includes(it.mealType) ? it.mealType : defaultMeal;

        const p = Number(it.proteinG ?? it.protein_g);
        const cg = Number(it.carbsG ?? it.carbs_g);
        const fg = Number(it.fatG ?? it.fat_g);
        const hasAllMacros =
          [p, cg, fg].every((n) => Number.isFinite(n) && n >= 0) && p + cg + fg > 0;
        let proteinG;
        let carbsG;
        let fatG;
        if (hasAllMacros) {
          proteinG = Math.round(p);
          carbsG = Math.round(cg);
          fatG = Math.round(fg);
        } else {
          const inf = inferMacrosFromCalories(tc);
          proteinG = inf.proteinG;
          carbsG = inf.carbsG;
          fatG = inf.fatG;
        }

        return {
          name,
          caloriesPerItem: cpi,
          quantity: qty,
          totalCalories: tc,
          mealType: mt,
          proteinG,
          carbsG,
          fatG,
        };
      })
      .filter(Boolean);

    const tcBody = Number(totalCalories);
    if (safeItems.length === 0 && Number.isFinite(tcBody) && tcBody > 0) {
      const inf = inferMacrosFromCalories(tcBody);
      safeItems.push({
        name: "Meal",
        caloriesPerItem: tcBody,
        quantity: 1,
        totalCalories: tcBody,
        mealType: defaultMeal,
        proteinG: inf.proteinG,
        carbsG: inf.carbsG,
        fatG: inf.fatG,
      });
    }

    const calorieDelta = safeItems.reduce((s, it) => s + (Number(it.totalCalories) || 0), 0);
    const addWaterRaw = Number(waterIntake);
    const addWaterSafe = Number.isFinite(addWaterRaw) && addWaterRaw > 0 ? addWaterRaw : 0;

    if (safeItems.length === 0 && addWaterSafe <= 0) {
      return res.status(400).json({
        success: false,
        error: "Nothing to log. Describe what you ate or add water.",
      });
    }

    const todays = await CalorieIntakeLog.find({
      userId: user._id,
      date: { $gte: startUtc, $lte: endUtc },
    }).sort({ updatedAt: -1 });

    const targetLog =
      todays.find((l) => Array.isArray(l.items) && l.items.length > 0) || todays[0] || null;

    if (targetLog && (safeItems.length > 0 || addWaterSafe > 0)) {
      for (const it of safeItems) {
        targetLog.items.push(it);
      }
      targetLog.totalCalories = (Number(targetLog.totalCalories) || 0) + calorieDelta;
      if (addWaterSafe) {
        targetLog.waterIntake = (Number(targetLog.waterIntake) || 0) + addWaterSafe;
      }
      if (notes && String(notes).trim()) {
        const n = String(notes).trim();
        targetLog.notes = targetLog.notes ? `${targetLog.notes}\n${n}` : n;
      }
      if (source) {
        if (targetLog.source && targetLog.source !== source) {
          targetLog.source = "mixed";
        } else if (!targetLog.source) {
          targetLog.source = source;
        }
      }
      targetLog.markModified("items");
      await targetLog.save();
      return res.status(200).json({
        success: true,
        log: targetLog,
        merged: true,
      });
    }

    const log = await CalorieIntakeLog.create({
      userId: user._id,
      totalCalories: calorieDelta,
      source: source || "image",
      notes: notes || undefined,
      date: logDate,
      items: safeItems,
      waterIntake: addWaterSafe,
    });

    return res.status(201).json({
      success: true,
      log,
    });
  } catch (err) {
    console.error("Calorie intake log error:", safeErrorForLog(err));
    return res.status(500).json({
      success: false,
      error: "Failed to log calorie intake",
      details: err.message,
    });
  }
});

// Text-based calorie tracking using Gemini
router.post("/calorie-intake/estimate", async (req, res) => {
  try {
    const { text, mealType } = req.body || {};

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text input is required",
      });
    }

    const prompt = `
You are a nutrition assistant. A user has typed a description of what they ate.

TASK:
- Estimate the calories for the given food text as realistically as possible.
- The input might contain quantities (e.g., "2 boiled eggs and 1 slice of bread" or "1 bowl of dal, 2 rotis").
- If multiple food items are specified, list them separately in the JSON array.
- Understand common Indian foods and international foods.

VERY IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON (no markdown, no code fences, no comments).
- Do NOT break strings across lines.
- No surrounding quotes inside keys/values.
- The "mealType" must be one of: "Breakfast", "Lunch", "Evening Snack", "Dinner", "Other". Default to what the user provides (${mealType || "Other"}), or infer if obvious.

OUTPUT FORMAT (STRICT JSON ONLY):
For EACH food item also estimate approximate macros (grams) for that line's portion: protein_g, carbs_g, fat_g. Numbers only, no units in strings.

{
  "food_items": [
    {
      "name": "2 Boiled Eggs",
      "estimated_calories": 156,
      "protein_g": 13,
      "carbs_g": 1,
      "fat_g": 11
    },
    {
      "name": "1 Slice of Bread",
      "estimated_calories": 80,
      "protein_g": 3,
      "carbs_g": 14,
      "fat_g": 1
    }
  ],
  "total_estimated_calories": 236,
  "mealType": "${mealType || "Other"}"
}

User input: "${text}"
`.trim();

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 25000,
      }
    );

    let raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    raw = raw.trim();

    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    }

    const tryParseJsonObject = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    let parsed = tryParseJsonObject(raw);
    if (!parsed) {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end > start) {
        parsed = tryParseJsonObject(raw.slice(start, end + 1));
      }
    }

    if (!parsed) {
      console.error("Text estimate: primary JSON parse failed, using regex fallback. Raw:", raw);
      try {
        const items = [];
        const nameMatches = [...raw.matchAll(/"name"\s*:\s*"([^"\n]+)/g)];
        const calMatches = [
          ...raw.matchAll(/"estimated_calories"\s*:\s*([0-9]+(?:\.[0-9]+)?)/g),
        ];
        const maxLen = Math.max(nameMatches.length, calMatches.length);
        for (let i = 0; i < maxLen; i++) {
          const name = nameMatches[i]?.[1]?.trim() || `Food ${i + 1}`;
          const calories = calMatches[i] ? Number(calMatches[i][1]) : 0;
          items.push({
            name,
            estimated_calories: calories,
          });
        }
        const totalFromKeys = items.reduce(
          (acc, it) => acc + (Number(it.estimated_calories) || 0),
          0
        );
        const totalMatch = raw.match(
          /"total_estimated_calories"\s*:\s*([0-9]+(?:\.[0-9]+)?)/
        );
        const totalFromField = totalMatch ? Number(totalMatch[1]) : NaN;
        parsed = {
          food_items: items,
          total_estimated_calories: Number.isFinite(totalFromField)
            ? totalFromField
            : totalFromKeys,
          mealType: mealType || "Other",
        };
      } catch (fallbackErr) {
        console.error("Text estimate regex fallback failed:", fallbackErr.message);
        parsed = null;
      }
    }

    const heuristicFromUserText = (userText) => {
      const t = String(userText || "").trim().toLowerCase();
      if (!t) return null;
      const original = String(userText || "").trim();
      if (/\bmilk\b/.test(t)) {
        const isPlant = /\b(almond|soy|oat|coconut|cashew)\b/.test(t);
        const skim = /\b(skim|low[-\s]?fat|toned)\b/.test(t);
        const kcal = isPlant ? 80 : skim ? 90 : 150;
        const macros = isPlant
          ? { protein_g: 2, carbs_g: 7, fat_g: 4 }
          : skim
            ? { protein_g: 9, carbs_g: 13, fat_g: 1 }
            : { protein_g: 8, carbs_g: 12, fat_g: 8 };
        return {
          food_items: [
            {
              name: original || "1 glass milk",
              estimated_calories: kcal,
              ...macros,
            },
          ],
          total_estimated_calories: kcal,
          mealType: mealType || "Other",
        };
      }
      return null;
    };

    const totalBeforeNormalize = Number(parsed?.total_estimated_calories);
    const hasTotalBefore =
      Number.isFinite(totalBeforeNormalize) && totalBeforeNormalize > 0;
    if (
      !parsed ||
      !Array.isArray(parsed.food_items) ||
      parsed.food_items.length === 0
    ) {
      const h = heuristicFromUserText(text);
      if (h) {
        parsed = h;
      } else if (!parsed) {
        return res.status(500).json({
          success: false,
          error: "Failed to parse AI response. Please try being more specific.",
        });
      } else if (!hasTotalBefore) {
        return res.status(422).json({
          success: false,
          error:
            "Could not estimate calories for that text. Try adding amount and food name (e.g. 250 ml milk).",
        });
      }
    }

    const MEAL_TYPES = ["Breakfast", "Lunch", "Evening Snack", "Dinner", "Other"];
    if (parsed.food_items && Array.isArray(parsed.food_items)) {
      parsed.food_items = parsed.food_items
        .map((row) => {
          const name =
            typeof row.name === "string"
              ? row.name.trim()
              : String(row.name ?? "")
                .trim();
          const estimated_calories = Number(row.estimated_calories);
          if (!name || !Number.isFinite(estimated_calories) || estimated_calories < 0) return null;
          let protein_g = Number(row.protein_g ?? row.proteinG);
          let carbs_g = Number(row.carbs_g ?? row.carbsG);
          let fat_g = Number(row.fat_g ?? row.fatG);
          const hasAllMacros =
            [protein_g, carbs_g, fat_g].every((n) => Number.isFinite(n) && n >= 0) &&
            protein_g + carbs_g + fat_g > 0;
          if (!hasAllMacros) {
            const inf = inferMacrosFromCalories(estimated_calories);
            protein_g = inf.proteinG;
            carbs_g = inf.carbsG;
            fat_g = inf.fatG;
          }
          return {
            name,
            estimated_calories,
            protein_g: Math.round(protein_g),
            carbs_g: Math.round(carbs_g),
            fat_g: Math.round(fat_g),
          };
        })
        .filter(Boolean);
    }
    let totalEst = Number(parsed.total_estimated_calories);
    if (!Number.isFinite(totalEst) || totalEst < 0) {
      totalEst = (parsed.food_items || []).reduce(
        (acc, row) => acc + (Number(row.estimated_calories) || 0),
        0
      );
    }
    parsed.total_estimated_calories = totalEst;
    if (typeof parsed.mealType === "string" && MEAL_TYPES.includes(parsed.mealType)) {
      // keep
    } else if (mealType && MEAL_TYPES.includes(mealType)) {
      parsed.mealType = mealType;
    }

    if (!parsed.food_items?.length) {
      const h = heuristicFromUserText(text);
      if (h) {
        parsed.food_items = h.food_items;
        parsed.total_estimated_calories = h.total_estimated_calories;
        if (mealType && MEAL_TYPES.includes(mealType)) parsed.mealType = mealType;
      }
    }
    const hasTotal =
      Number.isFinite(Number(parsed.total_estimated_calories)) &&
      Number(parsed.total_estimated_calories) > 0;
    if (!parsed.food_items?.length && !hasTotal) {
      return res.status(422).json({
        success: false,
        error:
          "Could not estimate calories for that text. Try rephrasing with amount and food name (e.g. 250 ml milk).",
      });
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Error in calorie-intake/estimate endpoint:", safeErrorForLog(error));
    return res.status(500).json({
      success: false,
      error: "Failed to estimate calories from text",
    });
  }
});

// Get calorie intake history for last N days (default 15)
router.get("/calorie-intake/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days, 10) || 15;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const logs = await CalorieIntakeLog.find({
      userId: userId,
      date: { $gte: cutoff },
    })
      .sort({ date: 1 })
      .lean();

    return res.json({
      success: true,
      logs,
    });
  } catch (err) {
    console.error("Calorie intake history error:", safeErrorForLog(err));
    return res.status(500).json({
      success: false,
      error: "Failed to fetch calorie intake history",
      details: err.message,
    });
  }
});

// Personalized calorie + macro targets from latest BMI and workout plan (activity + goal)
router.get("/calorie-intake/targets/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const latestBmi = await BMI.findOne({ userId }).sort({ date: -1 }).lean();
    if (!latestBmi) {
      return res.json({
        success: true,
        hasBmi: false,
        message:
          "Add your BMI in the BMI Calculator to unlock personalized calorie and macro targets tied to your workout plan.",
      });
    }
    let activePlan = await WorkoutPlan.findOne({ userId, isActive: true }).lean();
    if (!activePlan) {
      activePlan = await WorkoutPlan.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    }
    const params = activePlan?.generatedParams || {};
    const fitnessGoal = resolveFitnessGoal(
      params,
      activePlan?.name,
      latestBmi.selectedPlan
    );
    const nt = computeNutritionTargets({
      weightKg: latestBmi.weight,
      heightFeet: latestBmi.heightFeet,
      heightInches: latestBmi.heightInches,
      age: latestBmi.age,
      gender: user.gender,
      fitnessGoal,
      workoutParams: params,
    });
    if (!nt) {
      return res.status(400).json({
        success: false,
        error: "Invalid BMI data for targets",
      });
    }
    const gk = nt.goalKey;
    const goalLabel =
      gk === "lose_weight"
        ? "Fat loss (calories below maintenance)"
        : gk === "gain_weight"
          ? "Weight gain (calorie surplus)"
          : gk === "build_muscles"
            ? "Muscle building (moderate surplus)"
            : "Maintenance";

    return res.json({
      success: true,
      hasBmi: true,
      hasWorkoutPlan: Boolean(activePlan),
      planName: activePlan?.name || null,
      workoutSummary: params?.daysPerWeek
        ? `${params.daysPerWeek}×/week · ${params.intensity || "—"} intensity`
        : null,
      goalLabel,
      resolvedFitnessGoal: fitnessGoal,
      goalKey: gk,
      bmi: latestBmi.bmi,
      category: latestBmi.category,
      ...nt,
    });
  } catch (err) {
    console.error("calorie-intake/targets error:", safeErrorForLog(err));
    return res.status(500).json({
      success: false,
      error: "Failed to compute nutrition targets",
      details: err.message,
    });
  }
});

router.post("/calorie-intake/insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const latestBmi = await BMI.findOne({ userId }).sort({ date: -1 }).lean();
    let activePlan = await WorkoutPlan.findOne({ userId, isActive: true }).lean();
    if (!activePlan) {
      activePlan = await WorkoutPlan.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    }
    const params = activePlan?.generatedParams || {};
    const fitnessGoal = resolveFitnessGoal(
      params,
      activePlan?.name,
      latestBmi?.selectedPlan
    );
    const nt = latestBmi
      ? computeNutritionTargets({
        weightKg: latestBmi.weight,
        heightFeet: latestBmi.heightFeet,
        heightInches: latestBmi.heightInches,
        age: latestBmi.age,
        gender: user.gender,
        fitnessGoal,
        workoutParams: params,
      })
      : null;

    const MEAL_SLOTS = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];
    const today = new Date().toISOString().slice(0, 10);
    const startUtc = new Date(`${today}T00:00:00.000Z`);
    const endUtc = new Date(`${today}T23:59:59.999Z`);
    const logs = await CalorieIntakeLog.find({
      userId,
      date: { $gte: startUtc, $lte: endUtc },
    }).lean();

    let sumCal = 0;
    let sumP = 0;
    let sumC = 0;
    let sumF = 0;
    const foodsByMeal = {
      Breakfast: [],
      Lunch: [],
      "Evening Snack": [],
      Dinner: [],
    };
    for (const log of logs) {
      sumCal += Number(log.totalCalories) || 0;
      for (const it of log.items || []) {
        const cal = Number(it.totalCalories) || 0;
        const p = Number(it.proteinG) || 0;
        const c = Number(it.carbsG) || 0;
        const f = Number(it.fatG) || 0;
        const hasM = p + c + f > 0;
        const inf = !hasM && cal > 0 ? inferMacrosFromCalories(cal) : null;
        sumP += hasM ? p : inf?.proteinG || 0;
        sumC += hasM ? c : inf?.carbsG || 0;
        sumF += hasM ? f : inf?.fatG || 0;
        const mt = it.mealType || "Other";
        if (it.name && foodsByMeal[mt]) {
          foodsByMeal[mt].push(`${it.name} (~${Math.round(cal)} kcal)`);
        }
      }
    }

    const goalKey = nt?.goalKey || normalizeGoal(fitnessGoal);
    const mealHint = (slot) => {
      if (goalKey === "lose_weight") {
        if (slot === "Breakfast")
          return "try protein + fiber (eggs, oats, fruit) to stay full on fewer calories.";
        if (slot === "Lunch")
          return "lean protein with vegetables works well for a calorie deficit.";
        if (slot === "Evening Snack")
          return "a small high-protein snack beats sugary drinks for fat loss.";
        return "keep dinner moderate; load half the plate with vegetables.";
      }
      if (goalKey === "gain_weight" || goalKey === "build_muscles") {
        if (slot === "Breakfast") return "add carbs + protein for training fuel.";
        if (slot === "Lunch") return "include starch and protein to hit your surplus.";
        if (slot === "Evening Snack") return "Greek yogurt, nuts, or fruit supports recovery.";
        return "balanced carbs and protein after training help growth.";
      }
      if (slot === "Breakfast") return "a balanced breakfast sets energy for the day.";
      if (slot === "Lunch") return "mix protein, carbs, and color on the plate.";
      if (slot === "Evening Snack") return "a light snack can bridge you to dinner.";
      return "wind down with a satisfying but portion-aware dinner.";
    };

    const buildRulesInsightsByMeal = () => {
      const out = {};
      for (const slot of MEAL_SLOTS) {
        const lines = foodsByMeal[slot];
        const suggestedFoods = getSuggestedFoodsForMeal(slot, goalKey);
        const insight = lines.length
          ? `Logged: ${lines.join(", ")}. ${mealHint(slot)}`
          : `No logs yet for this meal. Suggestion: ${mealHint(slot)}`;
        out[slot] = { insight, suggestedFoods };
      }
      return out;
    };

    const mergeMealInsight = (slot, geminiVal, rulesSlot) => {
      const rules = rulesSlot || { insight: "", suggestedFoods: getSuggestedFoodsForMeal(slot, goalKey) };
      if (typeof geminiVal === "string" && geminiVal.trim()) {
        return {
          insight: geminiVal.trim(),
          suggestedFoods: rules.suggestedFoods,
        };
      }
      if (geminiVal && typeof geminiVal === "object") {
        const ins =
          typeof geminiVal.insight === "string"
            ? geminiVal.insight.trim()
            : typeof geminiVal.message === "string"
              ? geminiVal.message.trim()
              : "";
        let foods = geminiVal.suggestedFoods ?? geminiVal.foods ?? geminiVal.suggestions;
        if (!Array.isArray(foods)) foods = [];
        foods = foods
          .map((f) => String(f).trim())
          .filter(Boolean)
          .slice(0, 8);
        return {
          insight: ins || rules.insight,
          suggestedFoods: foods.length ? foods : rules.suggestedFoods,
        };
      }
      return rules;
    };

    if (!GEMINI_API_KEY) {
      return res.json({
        success: true,
        insightsByMeal: buildRulesInsightsByMeal(),
        source: "rules",
      });
    }

    const perMealLines = MEAL_SLOTS.map(
      (s) => `${s}: ${foodsByMeal[s].join("; ") || "(nothing yet)"}`
    ).join("\n");

    const prompt = `You are a supportive nutrition coach for GenFit AI.

User goal key: ${goalKey} (resolved from plan/BMI: ${fitnessGoal})
BMI: ${latestBmi ? `${latestBmi.bmi} (${latestBmi.category})` : "not set"}
Workout: ${activePlan?.name || "none"} ${params?.daysPerWeek ? `— ${params.daysPerWeek}x/week, ${params.intensity || ""}` : ""}
Daily targets: ${nt
        ? `${nt.targetCalories} kcal target (maintenance ~${nt.maintenanceCalories} kcal); P ${nt.proteinG}g, C ${nt.carbsG}g, F ${nt.fatG}g`
        : "BMI not set"
      }
So far today total: ~${Math.round(sumCal)} kcal, P ~${Math.round(sumP)}g, C ~${Math.round(sumC)}g, F ~${Math.round(sumF)}g.

Foods logged TODAY by meal:
${perMealLines}

Return ONLY valid JSON (no markdown fences). Top-level keys must be exactly: "Breakfast", "Lunch", "Evening Snack", "Dinner".
Each value must be an object with:
- "insight": string, 1-2 short sentences for THAT meal only (comment on what they logged or encourage logging; align with deficit vs surplus).
- "suggestedFoods": array of 3-5 short, realistic food ideas they could eat for that meal (mix Indian and common international options when appropriate). No brand names. Not medical advice.

Example shape: {"Breakfast":{"insight":"...","suggestedFoods":["...","..."]},...}`;

    const rulesInsights = buildRulesInsightsByMeal();
    let insightsByMeal = { ...rulesInsights };
    let insightSource = "rules";
    try {
      const gr = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 60000 }
      );
      const raw = gr.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = parseGeminiJsonObject(raw);
      if (parsed) {
        for (const slot of MEAL_SLOTS) {
          insightsByMeal[slot] = mergeMealInsight(slot, parsed[slot], rulesInsights[slot]);
        }
        insightSource = "gemini";
      } else {
        console.error("Meal insights: could not parse Gemini JSON; using rules fallback");
      }
    } catch (parseErr) {
      console.error("Meal insights Gemini/parse error:", parseErr.message);
    }

    return res.json({ success: true, insightsByMeal, source: insightSource });
  } catch (err) {
    console.error("calorie-intake/insights error:", safeErrorForLog(err));
    return res.status(500).json({
      success: false,
      error: "Failed to generate insights",
      details: err.message,
    });
  }
});

// Update one food line-item inside a calorie log (same user only)
router.put("/calorie-intake/log/:logId/item/:itemId", async (req, res) => {
  try {
    const { logId, itemId } = req.params;
    const {
      userId,
      name,
      quantity,
      caloriesPerItem,
      mealType,
      totalCalories,
      proteinG,
      carbsG,
      fatG,
    } = req.body || {};

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const log = await CalorieIntakeLog.findOne({ _id: logId, userId });
    if (!log) {
      return res.status(404).json({ success: false, error: "Log not found" });
    }

    const item = log.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Food item not found" });
    }

    if (typeof name === "string" && name.trim()) item.name = name.trim();
    if (typeof quantity === "number" && quantity > 0) item.quantity = quantity;
    if (typeof caloriesPerItem === "number" && caloriesPerItem >= 0) {
      item.caloriesPerItem = caloriesPerItem;
    }
    if (
      typeof mealType === "string" &&
      ["Breakfast", "Lunch", "Evening Snack", "Dinner", "Other"].includes(mealType)
    ) {
      item.mealType = mealType;
    }
    if (typeof totalCalories === "number" && totalCalories >= 0) {
      item.totalCalories = totalCalories;
    } else {
      item.totalCalories = (item.quantity || 1) * (item.caloriesPerItem || 0);
    }

    const macrosProvided =
      typeof proteinG === "number" &&
      typeof carbsG === "number" &&
      typeof fatG === "number" &&
      proteinG >= 0 &&
      carbsG >= 0 &&
      fatG >= 0;
    if (macrosProvided) {
      item.proteinG = proteinG;
      item.carbsG = carbsG;
      item.fatG = fatG;
    } else {
      const inf = inferMacrosFromCalories(Number(item.totalCalories) || 0);
      item.proteinG = inf.proteinG;
      item.carbsG = inf.carbsG;
      item.fatG = inf.fatG;
    }

    log.totalCalories = (log.items || []).reduce(
      (s, it) => s + (Number(it.totalCalories) || 0),
      0
    );
    await log.save();

    return res.json({ success: true, log: log.toObject() });
  } catch (err) {
    console.error("Calorie item update error:", safeErrorForLog(err));
    return res.status(500).json({
      success: false,
      error: "Failed to update food item",
      details: err.message,
    });
  }
});

// Delete one food line-item (or whole log if it was the last item)
router.delete("/calorie-intake/log/:logId/item/:itemId", async (req, res) => {
  try {
    const { logId, itemId } = req.params;
    const userId = req.query.userId || req.body?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const log = await CalorieIntakeLog.findOne({ _id: logId, userId });
    if (!log) {
      return res.status(404).json({ success: false, error: "Log not found" });
    }

    const item = log.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Food item not found" });
    }

    log.items.pull(itemId);
    log.totalCalories = (log.items || []).reduce(
      (s, it) => s + (Number(it.totalCalories) || 0),
      0
    );

    if (!log.items.length) {
      await log.deleteOne();
      return res.json({ success: true, deleted: "log" });
    }

    await log.save();
    return res.json({ success: true, deleted: "item", log: log.toObject() });
  } catch (err) {
    console.error("Calorie item delete error:", safeErrorForLog(err));
    return res.status(500).json({
      success: false,
      error: "Failed to delete food item",
      details: err.message,
    });
  }
});

// Cuisine type mapping for Indian regional cuisines
const CUISINE_DESCRIPTIONS = {
  north_indian: "North Indian cuisine (dal, roti, paneer dishes, curries, parathas, chole, rajma)",
  south_indian: "South Indian cuisine (idli, dosa, sambar, rasam, upma, uttapam, coconut-based dishes)",
  punjabi: "Punjabi cuisine (makki di roti, sarson da saag, lassi, butter chicken/paneer, paratha, chole bhature)",
  gujarati: "Gujarati cuisine (dhokla, thepla, khakhra, undhiyu, dal-bhat-shaak-roti, kadhi)",
  bengali: "Bengali cuisine (macher jhol, shorshe dishes, mishti doi, luchi, kosha mangsho, cholar dal)",
  maharashtrian: "Maharashtrian cuisine (vada pav, puran poli, thalipeeth, misal pav, pitla bhakri)",
  indian_mix: "Mixed Indian cuisine (variety from all regions - rotis, rice, dal, sabzi, curries)"
};

// New endpoint to generate a diet chart
router.post("/generate-diet-chart", async (req, res) => {
  try {
    const {
      userId,
      durationWeeks,
      fitnessGoal,
      currentWeight,
      targetWeight,
      diseases,
      allergies,
      activeWorkoutPlan,
      // New preferences
      dietType,
      cuisineType,
      singleDayPlan,
      meals,
      isSenior
    } = req.body;

    console.log("🤖 [DIET CHART GENERATE] Request received:", {
      userId,
      durationWeeks,
      fitnessGoal,
      currentWeight,
      targetWeight,
      dietType,
      cuisineType,
      singleDayPlan,
      hasActiveWorkoutPlan: !!activeWorkoutPlan,
      activeWorkoutPlanId: activeWorkoutPlan?._id,
    });

    if (!userId || !fitnessGoal || !currentWeight) {
      console.log("❌ [DIET CHART GENERATE] Missing required fields:", {
        hasUserId: !!userId,
        hasFitnessGoal: !!fitnessGoal,
        hasCurrentWeight: !!currentWeight,
      });
      return res
        .status(400)
        .json({ error: "Missing required fields for diet chart generation" });
    }

    console.log("🔍 [DIET CHART GENERATE] Finding user...");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ [DIET CHART GENERATE] User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("✅ [DIET CHART GENERATE] User found:", user.email);

    console.log("🔍 [DIET CHART GENERATE] Finding latest BMI...");
    const latestBMI = await BMI.findOne({ userId }).sort({ date: -1 });
    console.log(
      "🔍 [DIET CHART GENERATE] Latest BMI:",
      latestBMI ? "Found" : "Not found"
    );

    const mergeHealthArrays = (...sources) => {
      const out = [];
      const seen = new Set();
      for (const src of sources) {
        const arr = Array.isArray(src) ? src : [];
        for (const item of arr) {
          const s = String(item ?? "").trim();
          if (!s) continue;
          const key = s.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(s);
        }
      }
      return out;
    };
    const diseasesForDiet = mergeHealthArrays(
      diseases,
      user.diseases,
      latestBMI?.diseases
    );
    const allergiesForDiet = mergeHealthArrays(
      allergies,
      user.allergies,
      latestBMI?.allergies
    );

    // Determine diet type label
    const dietTypeLabel = dietType === "vegetarian" ? "Pure Vegetarian (No eggs, no meat)"
      : dietType === "eggetarian" ? "Eggetarian (Vegetarian + Eggs allowed)"
        : "Non-Vegetarian (Chicken, fish, eggs, mutton allowed)";

    // Get cuisine description
    const cuisineDesc = CUISINE_DESCRIPTIONS[cuisineType] || "Indian cuisine";

    // Get today's day name for variety
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[new Date().getDay()];

    let dietChartPrompt;

    if (singleDayPlan) {
      // Generate 1-day diet chart with 4 meals
      dietChartPrompt = `Generate a SINGLE DAY diet chart for TODAY (${todayName}) with EXACTLY 4 meals.

USER DETAILS:
- Diet Type: ${dietTypeLabel}
- Cuisine Preference: ${cuisineDesc}
- Fitness Goal: ${fitnessGoal.replace(/_/g, " ")}
- Current Weight: ${currentWeight}kg
- Target Weight: ${targetWeight || "Not specified"}kg
- Health Conditions: ${diseasesForDiet.length > 0 ? diseasesForDiet.join(", ") : "None"}
- Allergies: ${allergiesForDiet.length > 0 ? allergiesForDiet.join(", ") : "None"}`;

      if (latestBMI) {
        dietChartPrompt += `
- BMI: ${latestBMI.bmi} (${latestBMI.category})
- Age: ${latestBMI.age} years`;
      }

      if (activeWorkoutPlan) {
        dietChartPrompt += `
- Active Workout: ${activeWorkoutPlan.name} (${activeWorkoutPlan.generatedParams?.intensity || "moderate"} intensity)`;
      }

      dietChartPrompt += `

GENERATE EXACTLY THESE 4 MEALS:

BREAKFAST (7:00 - 9:00 AM)
- Provide 2-3 food items with portion sizes
- Include approximate calories
- Must be ${cuisineDesc} style

LUNCH (12:30 - 2:00 PM)
- Provide 3-4 food items with portion sizes (main dish, side, accompaniment)
- Include approximate calories
- Must be ${cuisineDesc} style

EVENING SNACK (4:30 - 6:00 PM)
- Provide 1-2 healthy snack items
- Include approximate calories
- Light and energizing options

DINNER (7:30 - 9:00 PM)
- Provide 2-3 food items with portion sizes (lighter than lunch)
- Include approximate calories
- Must be ${cuisineDesc} style

IMPORTANT RULES:
1. ${dietType === "vegetarian" ? "NO meat, NO eggs, NO fish - PURE VEG only" : dietType === "eggetarian" ? "Eggs allowed, but NO meat or fish" : "Include chicken/fish/eggs as protein sources"}
2. All dishes must be authentic ${cuisineDesc}
3. Consider the user's ${fitnessGoal.replace(/_/g, " ")} goal when calculating portions
4. Keep total daily calories appropriate for ${fitnessGoal.replace(/_/g, " ")}
5. Include a small hydration tip at the end
6. Make it practical and easy to prepare at home
7. ${isSenior ? "IMPORTANT: The user is a SENIOR CITIZEN. Ensure all meals are easy to digest, soft, and nutrient-dense." : ""}
8. CRITICAL: Do not include any ingredient that matches the user's listed allergies. Choose foods appropriate for the listed health conditions (or state safe substitutions if needed).

Format each meal clearly with the meal name as a header, followed by food items with portions and calories.`;

    } else {
      // Original multi-week logic
      dietChartPrompt = `Generate a ${durationWeeks}-week diet chart for a user with the following details:
    - Diet Type: ${dietTypeLabel}
    - Cuisine Preference: ${cuisineDesc}
    - Fitness Goal: ${fitnessGoal}
    - Current Weight: ${currentWeight}kg
    - Target Weight: ${targetWeight || "Not specified"}kg
    - Diseases: ${diseasesForDiet.join(", ") || "None"}
    - Allergies: ${allergiesForDiet.join(", ") || "None"}
    - Special Category: ${isSenior ? "Senior Citizen (Needs easy-to-digest, soft foods)" : "None"}
    `;

      if (latestBMI) {
        dietChartPrompt += `\n- BMI: ${latestBMI.bmi} (${latestBMI.category})\n- Age: ${latestBMI.age}\n- Height: ${latestBMI.heightFeet}'${latestBMI.heightInches}"`;
      }

      if (activeWorkoutPlan) {
        dietChartPrompt += `\n\nUser's Current Active Workout Plan (ID: ${activeWorkoutPlan._id
          }):\n- Name: ${activeWorkoutPlan.name}\n- Goal: ${activeWorkoutPlan.generatedParams?.fitnessGoal
            ?.replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "N/A"
          }\n- Days Per Week: ${activeWorkoutPlan.generatedParams?.daysPerWeek || "N/A"
          }\n- Workout Type: ${activeWorkoutPlan.generatedParams?.workoutType || "N/A"
          }\n- Intensity: ${activeWorkoutPlan.generatedParams?.intensity || "N/A"
          }\n- Time Commitment: ${activeWorkoutPlan.generatedParams?.timeCommitment || "N/A"
          } minutes\n- Current Week: ${activeWorkoutPlan.currentWeek || "N/A"} of ${activeWorkoutPlan.durationWeeks || "N/A"
          } weeks`;
      }

      dietChartPrompt += `\n\nProvide a detailed meal plan for each day of the week, including breakfast, lunch, dinner, and snacks. Specify portion sizes and calorie estimates. Ensure the plan is healthy, balanced, strictly avoids listed allergens, respects listed diseases/conditions, aligns with the fitness goal, and matches the active workout plan. The diet chart should be suitable for the entire ${durationWeeks}-week duration, with general guidelines for variation week-to-week.`;
    }

    console.log("🤖 [DIET CHART GENERATE] Calling Gemini API...");
    console.log(
      "🤖 [DIET CHART GENERATE] Prompt length:",
      dietChartPrompt.length
    );

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: dietChartPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: singleDayPlan ? 2000 : 8000,
          topP: 0.9,
          topK: 30,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    console.log("🤖 [DIET CHART GENERATE] Gemini API response received");
    console.log("🤖 [DIET CHART GENERATE] Response status:", response.status);

    let dietChartContent =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Failed to generate diet chart.";

    // Remove markdown # headers from Gemini response (e.g. ## Week 1 -> Week 1)
    dietChartContent = dietChartContent.replace(/^#+\s*/gm, "").trim();

    console.log(
      "🤖 [DIET CHART GENERATE] Generated content length:",
      dietChartContent.length
    );
    console.log(
      "🤖 [DIET CHART GENERATE] Content preview:",
      dietChartContent.substring(0, 200) + "..."
    );

    // Optional: Parse and structure the diet chart if a specific JSON format is desired from Gemini
    // For now, sending as plain text/markdown string.

    console.log("✅ [DIET CHART GENERATE] Sending response to frontend");
    res.status(200).json({
      success: true,
      dietChart: {
        dietChart: dietChartContent,
        generatedAt: new Date().toISOString(),
        preferences: {
          dietType,
          cuisineType,
          singleDayPlan
        }
      },
    });
  } catch (error) {
    console.error("Error generating diet chart:", safeErrorForLog(error));
    if (error.response) {
      console.error("Gemini API response error:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to generate diet chart",
      details: error.message,
    });
  }
});

// Save diet chart
router.post("/diet-chart/save", async (req, res) => {
  try {
    const { userId, workoutPlanId, dietChart, durationWeeks } = req.body;
    console.log("💾 [DIET CHART SAVE] Request received:", {
      userId,
      workoutPlanId,
      hasDietChart: !!dietChart,
      dietChartLength: dietChart?.length || 0,
      durationWeeks,
    });

    if (!userId || !workoutPlanId || !dietChart) {
      console.log("❌ [DIET CHART SAVE] Missing required fields:", {
        hasUserId: !!userId,
        hasWorkoutPlanId: !!workoutPlanId,
        hasDietChart: !!dietChart,
      });
      return res.status(400).json({
        error: "Missing required fields: userId, workoutPlanId, and dietChart",
      });
    }

    console.log("🔄 [DIET CHART SAVE] Deactivating existing diet charts...");
    // Deactivate any existing diet charts for this workout plan
    const deactivateResult = await DietChart.updateMany(
      { userId: userId, workoutPlanId: workoutPlanId },
      { isActive: false }
    );
    console.log(
      "🔄 [DIET CHART SAVE] Deactivated existing charts:",
      deactivateResult.modifiedCount
    );

    console.log("💾 [DIET CHART SAVE] Creating new diet chart...");
    const newDietChart = new DietChart({
      userId,
      workoutPlanId,
      dietChart,
      durationWeeks,
      isActive: true,
    });

    console.log("💾 [DIET CHART SAVE] Saving to database...");
    const savedDietChart = await newDietChart.save();
    console.log("✅ [DIET CHART SAVE] Successfully saved:", {
      id: savedDietChart._id,
      userId: savedDietChart.userId,
      workoutPlanId: savedDietChart.workoutPlanId,
      isActive: savedDietChart.isActive,
      contentLength: savedDietChart.dietChart?.length || 0,
    });

    // Award points for generating diet chart
    try {
      const { awardPoints } = require("../utils/gamify");
      await awardPoints(userId, "diet_chart");
    } catch (e) {
      console.error("Gamify award error:", safeErrorForLog(e));
    }

    try {
      const { pushUserNotification } = require("../utils/pushUserNotification");
      await pushUserNotification(userId, {
        title: "New diet chart saved",
        message:
          "Your diet chart is linked to your workout plan. Open Diet Chart to review meals and macros.",
        type: "diet",
      });
    } catch (e) {
      console.error("Notification error (diet chart save):", safeErrorForLog(e));
    }

    res.status(201).json({
      success: true,
      message: "Diet chart saved successfully",
      dietChart: savedDietChart,
    });
  } catch (error) {
    console.error("❌ [DIET CHART SAVE] Error saving diet chart:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to save diet chart",
      details: error.message,
    });
  }
});

// Get diet chart for a specific workout plan
router.get("/diet-chart/:userId/:workoutPlanId", async (req, res) => {
  try {
    const { userId, workoutPlanId } = req.params;
    console.log("🔍 [DIET CHART GET] Request received:", {
      userId,
      workoutPlanId,
    });

    const dietChart = await DietChart.findOne({
      userId: userId,
      workoutPlanId: workoutPlanId,
      isActive: true,
    });

    console.log(
      "🔍 [DIET CHART GET] Database query result:",
      dietChart ? "Found" : "Not found"
    );

    if (!dietChart) {
      console.log("❌ [DIET CHART GET] No active diet chart found");
      return res.status(404).json({
        error: "No active diet chart found for this workout plan",
      });
    }

    console.log("✅ [DIET CHART GET] Returning diet chart:", {
      id: dietChart._id,
      hasContent: !!dietChart.dietChart,
      contentLength: dietChart.dietChart?.length || 0,
    });

    res.status(200).json({
      success: true,
      dietChart: dietChart,
    });
  } catch (error) {
    console.error("❌ [DIET CHART GET] Error fetching diet chart:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to fetch diet chart",
      details: error.message,
    });
  }
});

// Get all diet charts for a user
router.get("/diet-charts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const dietCharts = await DietChart.find({ userId: userId })
      .populate("workoutPlanId", "name description")
      .sort({ generatedAt: -1 });

    res.status(200).json({
      success: true,
      dietCharts: dietCharts,
    });
  } catch (error) {
    console.error("Error fetching diet charts:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to fetch diet charts",
      details: error.message,
    });
  }
});

// Delete diet chart
router.delete("/diet-chart/:dietChartId", async (req, res) => {
  try {
    const { dietChartId } = req.params;

    const dietChart = await DietChart.findById(dietChartId);
    if (!dietChart) {
      return res.status(404).json({
        error: "Diet chart not found",
      });
    }

    await DietChart.findByIdAndDelete(dietChartId);

    res.status(200).json({
      success: true,
      message: "Diet chart deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting diet chart:", safeErrorForLog(error));
    res.status(500).json({
      error: "Failed to delete diet chart",
      details: error.message,
    });
  }
});

// ==========================================
// Tracker AI Insights (Gemini)
// ==========================================
router.post("/tracker/ai-insights", async (req, res) => {
  try {
    const { userId, metricType, data } = req.body;

    if (!userId || !metricType || !data) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const prompt = `
You are an expert fitness and health AI coach for GenFit AI.
The user wants a deep analysis of their daily activity and health metrics.

User Data for today:
${JSON.stringify(data)}

Please provide a structured analysis in JSON format with exactly these keys:
1. "status": A summary of their current health standing today (1 sentence).
2. "strength": What they are doing best based on the data (1 sentence).
3. "consistency": How well they are sticking to their goals (1 sentence).
4. "actionPlan": One specific, actionable tip for the next few hours (1 sentence).

Return ONLY the JSON. No markdown fences.
`.trim();

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 500,
          responseMimeType: "application/json"
        },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse Gemini insight JSON:", raw);
      parsed = { status: raw.substring(0, 100) };
    }

    res.status(200).json({ success: true, insight: parsed });
  } catch (error) {
    console.error("Error generating AI insight:", safeErrorForLog(error));
    res.status(500).json({ success: false, error: "Failed to generate AI insight" });
  }
});

// -----------------------------
// Google Fit integration (steps)
// -----------------------------

// Start OAuth flow for Google Fit (links Fit account to a userId)
router.get("/google-fit/link", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get credentials using helper
    const { webId, clientSecret, androidId } = getGoogleClientCredentials();

    if (!webId) {
      console.error('❌ [Google Fit] Web Client ID is missing');
      return res.status(500).json({
        error: "Google OAuth configuration error: Web Client ID is missing",
        hint: "Check your GOOGLE_CLIENT_ID environment variable"
      });
    }

    if (!clientSecret) {
      console.error('❌ [Google Fit] GOOGLE_CLIENT_SECRET is missing');
      return res.status(500).json({
        error: "Google OAuth configuration error: Client Secret is missing"
      });
    }

    const redirectUri = getGoogleFitRedirectUri(req);
    console.log('🔗 [Google Fit] Starting OAuth flow');
    console.log('🔗 [Google Fit] Redirect URI:', redirectUri);
    console.log('🔗 [Google Fit] Web ID:', webId.substring(0, 15) + '...');
    if (androidId) console.log('🔗 [Google Fit] Android ID:', androidId.substring(0, 15) + '...');

    const oauth2Client = new OAuth2Client(
      webId,
      clientSecret,
      redirectUri
    );

    const scopes = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.sleep.read"
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: String(userId),
      include_granted_scopes: true,
    });

    console.log('🔗 [Google Fit] Generated auth URL (first 100 chars):', authUrl.substring(0, 100) + '...');
    return res.redirect(authUrl);
  } catch (e) {
    console.error("❌ [Google Fit] Link error:", safeErrorForLog(e));
    return res.status(500).json({ error: "Failed to start Google Fit linking", details: e.message });
  }
});

// OAuth callback: exchanges code for tokens and stores refresh token
router.get("/google-fit/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    console.log('🔄 [Google Fit] Callback received:', {
      hasCode: !!code,
      state,
      error
    });

    if (error) {
      console.error("❌ [Google Fit] OAuth error parameter from Google:", error);
      return res.redirect(
        `${getFrontendRedirectBase()}/home?googleFit=error&reason=${encodeURIComponent(error)}`
      );
    }
    if (!code || !state) {
      console.error("❌ [Google Fit] Missing code or state in callback");
      return res.status(400).send("Missing code/state");
    }

    const userId = String(state);
    const user = await User.findById(userId).select("+googleFit.refreshToken");
    if (!user) {
      console.error("❌ [Google Fit] User not found for state (userId):", userId);
      return res.status(404).send("User not found");
    }

    const redirectUri = getGoogleFitRedirectUri(req);
    const { webId, clientSecret } = getGoogleClientCredentials();
    
    console.log('🔄 [Google Fit] Exchanging code for tokens using redirectUri:', redirectUri);

    const oauth2Client = new OAuth2Client(
      webId,
      clientSecret,
      redirectUri
    );

    const tokenResponse = await oauth2Client.getToken(String(code));
    const tokens = tokenResponse.tokens || {};

    console.log('✅ [Google Fit] Tokens received successfully');

    if (!tokens.refresh_token && !user.googleFit?.refreshToken) {
      console.warn(
        "⚠️ [Google Fit] missing refresh_token (user may have previously consented)"
      );
    }

    user.googleFitLinked = true;
    user.googleFit = user.googleFit || {};
    if (tokens.refresh_token) user.googleFit.refreshToken = tokens.refresh_token;

    await user.save();
    console.log('✅ [Google Fit] User updated and linked');

    return res.redirect(
      `${getFrontendRedirectBase()}/home?googleFit=linked`
    );
  } catch (e) {
    console.error("❌ [Google Fit] callback exception:", safeErrorForLog(e));
    return res.redirect(`${getFrontendRedirectBase()}/home?googleFit=error&msg=${encodeURIComponent(e.message)}`);
  }
});

// Simple status endpoint for UI
router.get("/google-fit/status", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      linked: !!user.googleFitLinked,
      lastSyncedSteps: user.googleFit?.lastSyncedSteps || 0,
      lastSyncAt: user.googleFit?.lastSyncAt || null,
    });
  } catch (e) {
    console.error("Google Fit status error:", safeErrorForLog(e));
    return res.status(500).json({ error: "Failed to fetch Google Fit status" });
  }
});

// Fetch today's steps from Google Fit (requires linked account)
router.get("/google-fit/steps/today", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const user = await User.findById(userId).select("+googleFit.refreshToken");
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.googleFitLinked || !user.googleFit?.refreshToken) {
      return res.status(400).json({
        error:
          "Google Fit not linked (or missing refresh token). Please link again.",
      });
    }

    const redirectUri = getGoogleFitRedirectUri(req);
    const { webId, clientSecret } = getGoogleClientCredentials();
    
    const oauth2Client = new OAuth2Client(
      webId,
      clientSecret,
      redirectUri
    );
    oauth2Client.setCredentials({ refresh_token: user.googleFit.refreshToken });

    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;
    if (!accessToken) {
      return res.status(500).json({ error: "Failed to get Google access token" });
    }

    const now = new Date();
    // Offset in milliseconds for IST (+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffset);
    
    // Start of day in IST (12:00 AM Midnight)
    const startOfDayIst = new Date(nowIst);
    startOfDayIst.setUTCHours(0, 0, 0, 0);
    
    // Convert back to UTC for the API call
    const startTimeMillis = startOfDayIst.getTime() - istOffset;
    const endTimeMillis = now.getTime();

    const fitResponse = await axios.post(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" }
        ],
        bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
        startTimeMillis,
        endTimeMillis,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const buckets = fitResponse.data?.bucket || [];
    let totalSteps = 0;
    for (const bucket of buckets) {
      const datasets = bucket?.dataset || [];
      for (const ds of datasets) {
        const points = ds?.point || [];
        for (const p of points) {
          const val = p?.value?.[0];
          const stepsVal =
            typeof val?.intVal === "number"
              ? Math.round(val.intVal)
              : typeof val?.fpVal === "number"
                ? Math.round(val.fpVal)
                : 0;
          totalSteps += stepsVal;
        }
      }
    }

    user.googleFit = user.googleFit || {};
    user.googleFit.lastSyncedSteps = totalSteps;
    user.googleFit.lastSyncAt = new Date();
    await user.save();

    return res.status(200).json({
      steps: totalSteps,
      date: startOfDayIst.toISOString().slice(0, 10),
      source: "google_fit",
    });
  } catch (e) {
    console.error(
      "Google Fit steps error:",
      e?.response?.data != null ? e.response.data : safeErrorForLog(e)
    );
    return res.status(500).json({
      error: "Failed to fetch steps from Google Fit",
      details: e?.response?.data || e?.message,
    });
  }
});

// Centralized sync for all fitness metrics
router.get("/google-fit/sync", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const user = await User.findById(userId).select("+googleFit.refreshToken");
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.googleFitLinked || !user.googleFit?.refreshToken) {
      return res.status(400).json({ error: "Google Fit not linked" });
    }

    const { webId, clientSecret } = getGoogleClientCredentials();

    if (!webId || !clientSecret) {
      console.error("❌ [Google Fit Sync] Missing Google Client credentials");
      return res.status(500).json({ 
        error: "Server configuration error", 
        details: "Google Fit API credentials are not configured on the server." 
      });
    }

    console.log(`🔍 [Google Fit Sync] Using Web Client ID: ${webId.substring(0, 15)}...`);

    const oauth2Client = new OAuth2Client(
      webId,
      clientSecret,
      getGoogleFitRedirectUri(req)
    );
    oauth2Client.setCredentials({ refresh_token: user.googleFit.refreshToken });

    const { token: accessToken } = await oauth2Client.getAccessToken();
    if (!accessToken) return res.status(500).json({ error: "Failed to refresh token" });

    // Calculate "Today" based on Midnight IST reset (00:00 AM)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffset);
    
    const startOfDayIst = new Date(nowIst);
    startOfDayIst.setUTCHours(0, 0, 0, 0);
    
    const startTimeMillis = startOfDayIst.getTime() - istOffset;
    const endTimeMillis = now.getTime();

    // 1. Fetch ALL data sources to find the specific one that matches the phone app's 6,281
    const dataSourcesResponse = await axios.get(
      "https://www.googleapis.com/fitness/v1/users/me/dataSources",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const dataSources = dataSourcesResponse.data.dataSource || [];
    
    // 2. Identify all Step-related sources
    const stepSources = dataSources.filter(ds => ds.dataType.name === "com.google.step_count.delta");
    console.log(`🔍 [Google Fit Sync] Auditing ${stepSources.length} step sources...`);

    let metrics = { steps: 0, calories: 0, heartRate: 0, sleepMinutes: 0 };

    // 3. Helper to fetch and sum a source
    const getSourceTotal = async (sourceId) => {
      const startTimeNanos = startTimeMillis * 1000000;
      const endTimeNanos = endTimeMillis * 1000000;
      const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${sourceId}/datasets/${startTimeNanos}-${endTimeNanos}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const pts = res.data.point || [];
      return pts.reduce((acc, p) => acc + (p.value[0].intVal || p.value[0].fpVal || 0), 0);
    };

    // 4. Final Data Extraction: We use the 'estimated'/'merge' streams as they are 
    // Google's own "Global Merged Totals" across all the user's devices.
    const masterStepSource = stepSources.find(ds => ds.dataStreamId.includes("estimated_steps")) || 
                             stepSources.find(ds => ds.dataStreamId.includes("merge")) ||
                             stepSources[0];
    
    if (masterStepSource) {
      try {
        metrics.steps = Math.round(await getSourceTotal(masterStepSource.dataStreamId));
        console.log(`🌍 [Google Fit Sync] Global Accumulated Steps: ${metrics.steps} (${masterStepSource.dataStreamId})`);
      } catch (sumError) {
        console.error(`⚠️ [Google Fit Sync] Error fetching steps from source ${masterStepSource.dataStreamId}:`, sumError.message);
        metrics.steps = 0;
      }
    } else {
      metrics.steps = 0;
    }

    // 5. Aggregate everything else (Calories, HR, sleep)
    const aggregateBy = [
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.heart_rate.bpm" },
      { dataTypeName: "com.google.sleep.segment" }
    ];

    const fitResponse = await axios.post(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        aggregateBy,
        bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
        startTimeMillis,
        endTimeMillis,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const buckets = fitResponse.data?.bucket || [];
    if (buckets.length > 0) {
      buckets.forEach((bucket) => {
        const datasets = bucket.dataset || [];
        datasets.forEach((ds, dsIdx) => {
          const points = ds.point || [];
          points.forEach((p) => {
            const val = p.value?.[0];
            const pVal = val?.fpVal || 0;

            if (dsIdx === 0) { // Calories (includes BMR)
              metrics.calories = Math.round(pVal);
            } else if (dsIdx === 1) { // Heart Rate
              metrics.heartRate = Math.round(pVal || metrics.heartRate || 0);
            } else if (dsIdx === 2) { // Sleep
              const start = parseInt(p.startTimeNanos) / 1000000;
              const end = parseInt(p.endTimeNanos) / 1000000;
              metrics.sleepMinutes += Math.round((end - start) / (1000 * 60));
            }
          });
        });
      });
      console.log(`✅ [Google Fit Sync] Merged metrics:`, metrics);
    }

    // Update User
    user.googleFit.lastSyncedSteps = metrics.steps;
    user.googleFit.lastSyncedCalories = metrics.calories;
    user.googleFit.lastSyncedHeartRate = metrics.heartRate;
    user.googleFit.lastSyncedSleep = metrics.sleepMinutes;
    user.googleFit.lastSyncAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, metrics, lastSyncAt: user.googleFit.lastSyncAt });
  } catch (e) {
    console.error("Google Fit Sync Error:", e?.response?.data || e.message);
    return res.status(500).json({ error: "Failed to sync wearable data", details: e?.message });
  }
});

module.exports = router;
