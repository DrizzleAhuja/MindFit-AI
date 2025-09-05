const BMI = require("../models/BMI");
const User = require("../models/User");
const axios = require("axios");
const { GEMINI_API_KEY, GEMINI_API_URL } = require("../config/config");

exports.saveBMI = async (req, res) => {
  try {
    const {
      email,
      heightFeet,
      heightInches,
      weight,
      age,
      diseases = [],
      allergies = [],
      bmi,
      category,
      selectedPlan,
      targetWeight,
      targetTimeline,
    } = req.body;

    if (
      !email ||
      !heightFeet ||
      !heightInches ||
      !weight ||
      !age ||
      !bmi ||
      !category
    ) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate AI suggestions using Gemini (same as chatbot)
    let aiSuggestions = "";
    try {
      const prompt = `You are a health and fitness AI assistant. Based on the following health information, provide personalized diet tips, workout recommendations, and lifestyle advice:

BMI: ${bmi} (${category})
Age: ${age}
Height: ${heightFeet}'${heightInches}"
Weight: ${weight}kg
Diseases: ${diseases.join(", ") || "None"}
Allergies: ${allergies.join(", ") || "None"}
Selected Plan: ${selectedPlan || "Not selected"}

Please provide specific, actionable advice in 2-3 paragraphs. Be encouraging, professional, and provide practical advice.`;

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

      aiSuggestions =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "AI suggestions temporarily unavailable. Please consult with a healthcare professional for personalized advice.";

      // Clean up the response by removing excessive asterisks and formatting
      aiSuggestions = aiSuggestions
        .replace(/\*{2,}/g, "") // Remove multiple asterisks (**, ***, etc.)
        .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisks around text
        .replace(/\*{1,2}\s*/g, "") // Remove remaining asterisks at start of lines
        .replace(/\n\s*\*\s*/g, "\n• ") // Convert remaining asterisks to bullet points
        .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
        .replace(/^\s*\*\s*/gm, "• ") // Convert line-starting asterisks to bullets
        .trim();
    } catch (aiError) {
      console.error("AI suggestion error:", aiError);
      aiSuggestions =
        "AI suggestions temporarily unavailable. Please consult with a healthcare professional for personalized advice.";
    }

    const newBMI = new BMI({
      userId: user._id,
      heightFeet,
      heightInches,
      weight,
      age,
      diseases,
      allergies,
      bmi,
      category,
      selectedPlan,
      targetWeight,
      targetTimeline,
      aiSuggestions,
    });
    await newBMI.save();

    res.status(201).json({
      message: "BMI saved successfully",
      bmiRecord: newBMI,
      aiSuggestions,
    });
  } catch (error) {
    console.error("Save BMI error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getBMIHistory = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const history = await BMI.find({ userId: user._id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateBMI = async (req, res) => {
  try {
    const {
      email,
      heightFeet,
      heightInches,
      weight,
      age,
      diseases = [],
      allergies = [],
      selectedPlan,
      targetWeight,
      targetTimeline,
    } = req.body;

    if (!email || !heightFeet || !heightInches || !weight || !age) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate new BMI
    const totalHeightInInches = heightFeet * 12 + heightInches;
    const heightInMeters = totalHeightInInches * 0.0254;
    const calculatedBMI = (weight / (heightInMeters * heightInMeters)).toFixed(
      2
    );

    let bmiCategory = "";
    if (calculatedBMI < 18.5) bmiCategory = "Underweight";
    else if (calculatedBMI < 24.9) bmiCategory = "Normal weight";
    else if (calculatedBMI < 29.9) bmiCategory = "Overweight";
    else if (calculatedBMI < 35) bmiCategory = "Obese";
    else bmiCategory = "Morbid obesity";

    // Generate AI suggestions using Gemini (same as chatbot)
    let aiSuggestions = "";
    try {
      const prompt = `You are a health and fitness AI assistant. Based on the following updated health information, provide personalized diet tips, workout recommendations, and lifestyle advice:

BMI: ${calculatedBMI} (${bmiCategory})
Age: ${age}
Height: ${heightFeet}'${heightInches}"
Weight: ${weight}kg
Diseases: ${diseases.join(", ") || "None"}
Allergies: ${allergies.join(", ") || "None"}
Selected Plan: ${selectedPlan || "Not selected"}

Please provide specific, actionable advice in 2-3 paragraphs. Be encouraging, professional, and provide practical advice.`;

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

      aiSuggestions =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "AI suggestions temporarily unavailable. Please consult with a healthcare professional for personalized advice.";

      // Clean up the response by removing excessive asterisks and formatting
      aiSuggestions = aiSuggestions
        .replace(/\*{2,}/g, "") // Remove multiple asterisks (**, ***, etc.)
        .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisks around text
        .replace(/\*{1,2}\s*/g, "") // Remove remaining asterisks at start of lines
        .replace(/\n\s*\*\s*/g, "\n• ") // Convert remaining asterisks to bullet points
        .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
        .replace(/^\s*\*\s*/gm, "• ") // Convert line-starting asterisks to bullets
        .trim();
    } catch (aiError) {
      console.error("AI suggestion error:", aiError);
      aiSuggestions =
        "AI suggestions temporarily unavailable. Please consult with a healthcare professional for personalized advice.";
    }

    const updatedBMI = new BMI({
      userId: user._id,
      heightFeet,
      heightInches,
      weight,
      age,
      diseases,
      allergies,
      bmi: calculatedBMI,
      category: bmiCategory,
      selectedPlan,
      targetWeight,
      targetTimeline,
      aiSuggestions,
    });
    await updatedBMI.save();

    res.status(200).json({
      message: "BMI updated successfully",
      bmiRecord: updatedBMI,
      aiSuggestions,
    });
  } catch (error) {
    console.error("Update BMI error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getProgressTracking = async (req, res) => {
  try {
    const { email, period = "month" } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    let startDate;

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const recentRecords = await BMI.find({
      userId: user._id,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    const allRecords = await BMI.find({ userId: user._id }).sort({ date: -1 });

    let progress = {};

    if (recentRecords.length >= 2) {
      const latest = recentRecords[0];
      const previous = recentRecords[recentRecords.length - 1];

      progress = {
        weightChange: (latest.weight - previous.weight).toFixed(1),
        bmiChange: (latest.bmi - previous.bmi).toFixed(1),
        period: period,
        message: `This ${period}: you ${
          latest.weight > previous.weight ? "gained" : "lost"
        } ${Math.abs(latest.weight - previous.weight).toFixed(1)} kg`,
      };
    } else if (allRecords.length >= 2) {
      const latest = allRecords[0];
      const previous = allRecords[1];

      progress = {
        weightChange: (latest.weight - previous.weight).toFixed(1),
        bmiChange: (latest.bmi - previous.bmi).toFixed(1),
        period: "overall",
        message: `Overall: BMI ${
          latest.bmi > previous.bmi ? "increased" : "improved"
        } by ${Math.abs(latest.bmi - previous.bmi).toFixed(1)} points`,
      };
    }

    res.status(200).json({
      recentRecords,
      progress,
      totalRecords: allRecords.length,
    });
  } catch (error) {
    console.error("Progress tracking error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
