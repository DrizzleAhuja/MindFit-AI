import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FiRefreshCw, FiSave, FiHeart, FiCopy, FiDownload } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUtensils, FaChartLine, FaExclamationTriangle } from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import { formatBmiOneDecimal } from "../BMICalculator/bmiFormValidation";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Sparkles } from 'lucide-react';

const CUISINE_OPTIONS = [
  { id: "north_indian", label: "North Indian", icon: "🍛" },
  { id: "south_indian", label: "South Indian", icon: "🥘" },
  { id: "punjabi", label: "Punjabi", icon: "🫓" },
  { id: "gujarati", label: "Gujarati", icon: "🥗" },
  { id: "bengali", label: "Bengali", icon: "🍚" },
  { id: "maharashtrian", label: "Maharashtrian", icon: "🥙" },
  { id: "indian_mix", label: "Mixed Indian", icon: "🇮🇳" },
];

const DIET_TYPE_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", icon: "🥬", color: "from-green-500 to-emerald-500" },
  { id: "non_vegetarian", label: "Non-Vegetarian", icon: "🍗", color: "from-red-500 to-orange-500" },
  { id: "eggetarian", label: "Eggetarian", icon: "🥚", color: "from-yellow-500 to-amber-500" },
];

/** Merge profile + latest BMI health lists (BMI often holds diseases/allergies; User may be empty). */
function mergeHealthArrays(...sources) {
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
}

const SUBSTITUTION_BY_DIET = {
  vegetarian: [
    "Paneer dishes → tofu, chickpeas, or extra dal for protein.",
    "White rice → millets, brown rice, or half rice + salad.",
    "Fried snacks → roasted chana, makhana, or fruit with nuts.",
  ],
  non_vegetarian: [
    "Red meat days → fish or chicken breast for lean protein.",
    "Curries → grill or tandoori-style to cut oil.",
    "Extra hunger → add eggs or Greek-style thick curd.",
  ],
  eggetarian: [
    "Pair eggs with veg for fiber (spinach, capsicum, salad).",
    "Paneer overload → swap one meal for egg bhurji or dal.",
    "Rice portions → reduce slightly when you have 3+ eggs that day.",
  ],
};

export default function DietChartGenerator() {
  const { darkMode } = useTheme();
  const [bmiData, setBmiData] = useState(null);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState(null);
  const [dietChart, setDietChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedDietChart, setSavedDietChart] = useState(null);
  const [bmiResult, setBmiResult] = useState(null);
  
  // New: Diet preferences
  const [dietType, setDietType] = useState(() => localStorage.getItem("diet_preference_type") || "");
  const [cuisineType, setCuisineType] = useState(() => localStorage.getItem("diet_preference_cuisine") || "");
  const [lastGeneratedDate, setLastGeneratedDate] = useState(() => localStorage.getItem("diet_last_generated") || "");
  const [isSenior, setIsSenior] = useState(false);

  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedDiseases = useMemo(
    () => mergeHealthArrays(user?.diseases, bmiData?.diseases),
    [user?.diseases, bmiData?.diseases]
  );
  const resolvedAllergies = useMemo(
    () => mergeHealthArrays(user?.allergies, bmiData?.allergies),
    [user?.allergies, bmiData?.allergies]
  );
  
  // Check if we need to auto-refresh (new day)
  const todayDate = new Date().toDateString();
  const needsRefresh = lastGeneratedDate && lastGeneratedDate !== todayDate;

  // Fetch BMI data
  useEffect(() => {
    const fetchBMIData = async () => {
      if (user?.email) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.BMI}/history`,
            { params: { email: user.email } }
          );
          if (res.data.length > 0) {
            const latestBmi = res.data[0];
            setBmiData(latestBmi);
            setBmiResult({
              bmi: formatBmiOneDecimal(latestBmi.bmi),
              category: latestBmi.category,
            });
            if (latestBmi.age && parseInt(latestBmi.age) >= 60) {
              setIsSenior(true);
            }
          }
        } catch (error) {
          console.error("Error fetching BMI data:", error);
        }
      }
    };

    if (location.state?.bmiData && location.state?.bmiResult) {
      setBmiData(location.state.bmiData);
      setBmiResult(location.state.bmiResult);
      if (location.state.bmiData.age && parseInt(location.state.bmiData.age) >= 60) {
        setIsSenior(true);
      }
      toast.success("BMI data loaded for personalized plan generation!");
    } else if (user?.email) {
      fetchBMIData();
    }
  }, [user, location.state]);

  // Fetch active workout plan
  useEffect(() => {
    const fetchActiveWorkoutPlan = async () => {
      if (user && user._id) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/active/${user._id}`
          );
          if (response.data.success) {
            setActiveWorkoutPlan(response.data.plan);
          } else {
            setActiveWorkoutPlan(null);
          }
        } catch (error) {
          console.error("Error fetching active workout plan:", error);
          setActiveWorkoutPlan(null);
        }
      }
    };
    fetchActiveWorkoutPlan();
  }, [user]);

  // Clear savedDietChart when activeWorkoutPlan changes
  useEffect(() => {
    setSavedDietChart(null);
  }, [activeWorkoutPlan]);
  
  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (dietType) localStorage.setItem("diet_preference_type", dietType);
  }, [dietType]);
  
  useEffect(() => {
    if (cuisineType) localStorage.setItem("diet_preference_cuisine", cuisineType);
  }, [cuisineType]);
  
  // Auto-refresh diet chart if it's a new day
  useEffect(() => {
    if (needsRefresh && dietType && cuisineType && user && bmiData && activeWorkoutPlan) {
      console.log("🔄 New day detected! Auto-refreshing diet chart...");
      setDietChart(null);
      setSavedDietChart(null);
    }
  }, [needsRefresh, dietType, cuisineType, user, bmiData, activeWorkoutPlan]);

  // Check for existing diet chart
  useEffect(() => {
    const checkExistingDietChart = async () => {
      console.log("🔍 [FRONTEND] Checking existing diet chart...", {
        hasUser: !!user,
        userId: user?._id,
        hasActiveWorkoutPlan: !!activeWorkoutPlan,
        workoutPlanId: activeWorkoutPlan?._id,
      });

      if (user && user._id && activeWorkoutPlan && activeWorkoutPlan._id) {
        try {
          console.log(
            "🔍 [FRONTEND] Making API call to check existing diet chart..."
          );
          const response = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.AUTH}/diet-chart/${user._id}/${activeWorkoutPlan._id}`
          );
          console.log("🔍 [FRONTEND] API response received:", {
            success: response.data.success,
            hasDietChart: !!response.data.dietChart,
            dietChartLength: response.data.dietChart?.dietChart?.length || 0,
          });

          if (response.data.success && response.data.dietChart) {
            console.log("✅ [FRONTEND] Setting saved diet chart");
            setSavedDietChart(response.data.dietChart.dietChart);
          }
        } catch (error) {
          console.error(
            "❌ [FRONTEND] Error checking existing diet chart:",
            error
          );
        }
      } else {
        console.log(
          "⚠️ [FRONTEND] Missing required data for checking existing diet chart"
        );
      }
    };
    checkExistingDietChart();
  }, [user, activeWorkoutPlan]);

  const calculateDurationWeeks = (currentWeight, targetWeight, goal, age) => {
    if (!currentWeight || !targetWeight || !goal || !age) return 12;

    const weightDifference = Math.abs(targetWeight - currentWeight);
    let weeksPerKg = 0.5;

    if (goal === "lose_weight") {
      if (age < 25) weeksPerKg = 0.6;
      else if (age < 35) weeksPerKg = 0.5;
      else if (age < 45) weeksPerKg = 0.4;
      else weeksPerKg = 0.3;
    } else if (goal === "gain_weight") {
      if (age < 25) weeksPerKg = 0.4;
      else if (age < 35) weeksPerKg = 0.3;
      else if (age < 45) weeksPerKg = 0.25;
      else weeksPerKg = 0.2;
    } else {
      weeksPerKg = 0.3;
    }

    const calculatedWeeks = Math.ceil(weightDifference / weeksPerKg);
    return Math.max(4, Math.min(calculatedWeeks, 24));
  };

  const generateDietChart = async () => {
    console.log("🤖 [FRONTEND] Starting diet chart generation...");

    if (!dietType) {
      toast.error("Please select your diet type (Veg / Non-Veg)");
      return;
    }
    
    if (!cuisineType) {
      toast.error("Please select your preferred cuisine");
      return;
    }

    if (!user || !bmiData) {
      console.log("❌ [FRONTEND] Missing user or BMI data:", {
        hasUser: !!user,
        hasBmiData: !!bmiData,
      });
      toast.error(
        "Please ensure your BMI data is available to generate a diet chart."
      );
      return;
    }

    if (!activeWorkoutPlan) {
      console.log("❌ [FRONTEND] No active workout plan found");
      toast.error(
        "No active workout plan found. Please create and activate a workout plan first."
      );
      return;
    }

    console.log(
      "✅ [FRONTEND] All required data available, starting generation..."
    );
    setLoading(true);
    try {
      let fitnessGoal = activeWorkoutPlan?.generatedParams?.fitnessGoal;
      if (!fitnessGoal && activeWorkoutPlan?.name) {
        if (activeWorkoutPlan.name.toLowerCase().includes("lose weight")) {
          fitnessGoal = "lose_weight";
        } else if (
          activeWorkoutPlan.name.toLowerCase().includes("gain weight")
        ) {
          fitnessGoal = "gain_weight";
        } else if (
          activeWorkoutPlan.name.toLowerCase().includes("build muscles")
        ) {
          fitnessGoal = "build_muscles";
        }
      }

      const targetWeight =
        activeWorkoutPlan?.generatedParams?.targetWeight ||
        bmiData.targetWeight;

      const requestData = {
        userId: user._id,
        durationWeeks: 1,
        fitnessGoal: fitnessGoal,
        currentWeight:
          activeWorkoutPlan.generatedParams?.currentWeight || bmiData.weight,
        targetWeight: targetWeight,
        diseases: resolvedDiseases,
        allergies: resolvedAllergies,
        activeWorkoutPlan: activeWorkoutPlan,
        // New preferences
        dietType: dietType,
        cuisineType: cuisineType,
        singleDayPlan: true,
        meals: ["Breakfast", "Lunch", "Evening Snack", "Dinner"],
        isSenior: isSenior,
      };

      console.log("🤖 [FRONTEND] Request data prepared:", {
        userId: requestData.userId,
        dietType: requestData.dietType,
        cuisineType: requestData.cuisineType,
        fitnessGoal: requestData.fitnessGoal,
        currentWeight: requestData.currentWeight,
        targetWeight: requestData.targetWeight,
        diseasesCount: requestData.diseases.length,
        allergiesCount: requestData.allergies.length,
        hasActiveWorkoutPlan: !!requestData.activeWorkoutPlan,
      });

      console.log("🤖 [FRONTEND] Making API call to generate diet chart...");
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-diet-chart`,
        requestData
      );

      console.log("🤖 [FRONTEND] API response received:", {
        success: response.data.success,
        hasDietChart: !!response.data.dietChart,
        dietChartLength: response.data.dietChart?.dietChart?.length || 0,
      });

      if (response.data.success) {
        console.log(
          "✅ [FRONTEND] Diet chart generated successfully, setting state..."
        );
        setSavedDietChart(null);
        setDietChart(response.data.dietChart.dietChart);
        // Save the generation date
        const today = new Date().toDateString();
        setLastGeneratedDate(today);
        localStorage.setItem("diet_last_generated", today);
        toast.success("Today's diet chart generated successfully!");
      } else {
        console.error(
          "❌ [FRONTEND] Diet chart generation failed:",
          response.data
        );
        toast.error(response.data.error || "Failed to generate diet chart.");
      }
    } catch (error) {
      console.error("Error generating diet chart:", error);
      toast.error("Failed to generate diet chart. Please try again.");
    }
    setLoading(false);
  };

  const formatDietChartContent = (content) => {
    if (!content) return "";

    return content
      .replace(/\*+/g, "")
      .replace(/^[\s\-\*]+/gm, "")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/^\s+|\s+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim();
  };

  const normalizeHeading = (text) => {
    if (!text) return "";
    return text
      .replace(/[:\-]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const parseDietChartContent = (content) => {
    if (!content) return [];

    const cleaned = formatDietChartContent(content);
    const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);

    const dayHeadingRegex =
      /^(day\s*\d+|week\s*\d+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
    const mealHeadingRegex =
      /^(early\s*morning|breakfast|mid\s*morning|brunch|snack|pre\s*workout|post\s*workout|lunch|evening\s*snack|dinner|dessert|hydration|supplements|bed\s*time|night\s*snack)/i;

    const sections = [];
    let currentSection = null;
    let currentMeal = null;

    const pushSection = () => {
      if (currentSection) {
        currentSection.meals = currentSection.meals.filter(
          (meal) => meal.items.length > 0
        );
        sections.push(currentSection);
      }
    };

    lines.forEach((line) => {
      const normalizedLine = line.replace(/^[-•\d.]+\s*/, "").trim();
      if (!normalizedLine) return;

      if (dayHeadingRegex.test(normalizedLine)) {
        pushSection();
        currentSection = {
          title: normalizeHeading(normalizedLine),
          meals: [],
          notes: [],
        };
        currentMeal = null;
      } else if (mealHeadingRegex.test(normalizedLine)) {
        if (!currentSection) {
          currentSection = {
            title: "General Plan",
            meals: [],
            notes: [],
          };
        }
        const meal = {
          title: normalizeHeading(normalizedLine),
          items: [],
        };
        currentSection.meals.push(meal);
        currentMeal = meal;
      } else {
        if (!currentSection) {
          currentSection = {
            title: "General Guidelines",
            meals: [],
            notes: [],
          };
        }
        if (currentMeal) {
          currentMeal.items.push(normalizedLine);
        } else {
          currentSection.notes.push(normalizedLine);
        }
      }
    });

    pushSection();

    return sections.filter(
      (section) => section.notes.length > 0 || section.meals.length > 0
    );
  };

  const resolvedSavedDietChart = useMemo(() => {
    if (!savedDietChart) return null;
    return typeof savedDietChart === "string"
      ? savedDietChart
      : savedDietChart?.dietChart || null;
  }, [savedDietChart]);

  const displayDietChart = dietChart || resolvedSavedDietChart;

  const structuredDietChart = useMemo(
    () => parseDietChartContent(displayDietChart),
    [displayDietChart]
  );

  const groceryLines = useMemo(() => {
    const lines = new Set();
    for (const section of structuredDietChart || []) {
      for (const meal of section.meals || []) {
        for (const item of meal.items || []) {
          const s = String(item)
            .replace(/^[→*•-]\s*/, "")
            .trim();
          if (s.length > 2 && s.length < 200) lines.add(s);
        }
      }
    }
    return Array.from(lines);
  }, [structuredDietChart]);

  const exportGroceryList = () => {
    if (groceryLines.length === 0) {
      toast.error("Generate a diet chart first to build a grocery list.");
      return;
    }
    const header = `GenFit grocery list — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n\n`;
    const body = groceryLines.map((l) => `• ${l}`).join("\n");
    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `genfit-grocery-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Grocery list downloaded");
  };

  const saveDietChart = async () => {
    console.log("💾 [FRONTEND] Starting diet chart save...");

    if (!user || !dietChart || !activeWorkoutPlan) {
      console.log("❌ [FRONTEND] Missing required data for save:", {
        hasUser: !!user,
        hasDietChart: !!dietChart,
        hasActiveWorkoutPlan: !!activeWorkoutPlan,
      });
      toast.error("No diet chart to save.");
      return;
    }

    console.log("✅ [FRONTEND] All required data available for save");
    setLoading(true);
    try {
      const saveData = {
        userId: user._id,
        workoutPlanId: activeWorkoutPlan._id,
        dietChart: dietChart,
        durationWeeks: activeWorkoutPlan.durationWeeks,
        activeWorkoutPlan: activeWorkoutPlan,
      };

      console.log("💾 [FRONTEND] Save data prepared:", {
        userId: saveData.userId,
        workoutPlanId: saveData.workoutPlanId,
        dietChartLength: saveData.dietChart?.length || 0,
        durationWeeks: saveData.durationWeeks,
        hasActiveWorkoutPlan: !!saveData.activeWorkoutPlan,
      });

      console.log("💾 [FRONTEND] Making API call to save diet chart...");
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/diet-chart/save`,
        saveData
      );

      console.log("💾 [FRONTEND] Save API response received:", {
        success: response.data.success,
        hasDietChart: !!response.data.dietChart,
        message: response.data.message,
      });

      if (response.data.success) {
        console.log(
          "✅ [FRONTEND] Diet chart saved successfully, updating state..."
        );
        setSavedDietChart(response.data.dietChart);
        toast.success("Diet chart saved successfully!");
      } else {
        console.error("❌ [FRONTEND] Diet chart save failed:", response.data);
        toast.error("Failed to save diet chart.");
      }
    } catch (error) {
      console.error("Error saving diet chart:", error);
      toast.error("Failed to save diet chart. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <NavBar />
      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-6 sm:mb-8 lg:mb-10">
            {/* Header */}
            <header className="text-center">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                <span className="text-xs sm:text-sm font-semibold text-gray-100">
                  Nutrition Planning
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                Today's{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Diet Chart
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300 mb-3">
                Personalized Indian meals: Breakfast, Lunch, Evening Snack & Dinner
              </p>
              
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-300'}`}>
                <span className="text-lg">📅</span>
                <span className="text-sm font-medium text-gray-300">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </header>
          </div>

          <div className="relative z-10 container mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Information Cards */}
          <div className="xl:col-span-4 2xl:col-span-3 space-y-5 sm:space-y-6 order-2 xl:order-1">
            {/* BMI Data Card - Enhanced */}
            {bmiData ? (
            <div className={`group relative rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-slide-in-left ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400 text-gray-900'}`}>
                <div className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 p-5 sm:p-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <FiHeart className="text-2xl text-white drop-shadow-lg" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Your Health Profile
                    </h2>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "BMI", value: formatBmiOneDecimal(bmiData.bmi), color: "text-orange-400" },
                      { label: "Category", value: bmiResult.category, color: "text-pink-400" },
                      { label: "Weight", value: `${bmiData.weight}kg`, color: "text-blue-400" },
                      { label: "Height", value: `${bmiData.heightFeet}'${bmiData.heightInches}"`, color: "text-purple-400" },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`backdrop-blur-sm p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] hover:border-[#22D3EE]/40' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className={`font-bold text-lg ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                    {bmiData.age && (
                      <div className={`backdrop-blur-sm p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] hover:border-[#22D3EE]/40' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}>
                        <p className="text-xs text-gray-400 mb-1">Age</p>
                        <p className="font-bold text-lg text-green-400">{bmiData.age} years</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-700/50">
                    <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 p-4 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                        Diseases
                      </p>
                      <p className="font-semibold text-sm text-gray-200 break-words">
                        {resolvedDiseases.length > 0
                          ? resolvedDiseases.join(", ")
                          : "None"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        Allergies
                      </p>
                      <p className="font-semibold text-sm text-gray-200 break-words">
                        {resolvedAllergies.length > 0
                          ? resolvedAllergies.join(", ")
                          : "None"}
                      </p>
                    </div>
                    {bmiData.targetWeight && (
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Target Weight
                        </p>
                        <p className="font-bold text-lg text-green-400">{bmiData.targetWeight}kg</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="group bg-gradient-to-br from-red-950/40 to-red-900/30 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 p-6 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-1 animate-slide-in-left">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl animate-bounce-slow">
                    <FaExclamationTriangle className="text-2xl text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-300 mb-2">
                      BMI Data Required
                    </h3>
                    <p className="text-sm text-red-200 leading-relaxed">
                      Please calculate your BMI first to generate a personalized diet chart.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/CurrentBMI")}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <span>Go to BMI Calculator</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            )}

            {/* Active Workout Plan Card - Enhanced */}
            {activeWorkoutPlan ? (
            <div className={`group relative rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-slide-in-left ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400 text-gray-900'}`} style={{ animationDelay: '200ms' }}>
                <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-5 sm:p-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <FaChartLine className="text-2xl text-white drop-shadow-lg" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Active Workout Plan
                    </h2>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/30">
                    <p className="text-xs text-gray-400 mb-2">Plan Name</p>
                    <p className="font-bold text-white text-base">{activeWorkoutPlan.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { 
                        label: "Goal", 
                        value: activeWorkoutPlan?.generatedParams?.fitnessGoal
                          ?.replace(/_/g, " ")
                          .split(" ")
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ") || "N/A",
                        color: "text-green-400"
                      },
                      { label: "Duration", value: `${activeWorkoutPlan.durationWeeks} weeks`, color: "text-blue-400" },
                      { label: "Progress", value: `Week ${activeWorkoutPlan.currentWeek}/${activeWorkoutPlan.durationWeeks}`, color: "text-purple-400" },
                      { label: "Days/Week", value: activeWorkoutPlan?.generatedParams?.daysPerWeek || "N/A", color: "text-orange-400" },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`backdrop-blur-sm p-3 rounded-xl border transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] hover:border-[#22D3EE]/40' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
                      >
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="group bg-gradient-to-br from-yellow-950/40 to-yellow-900/30 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/50 p-6 shadow-2xl hover:shadow-yellow-500/20 transition-all duration-500 hover:-translate-y-1 animate-slide-in-left" style={{ animationDelay: '200ms' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl animate-bounce-slow">
                    <FaExclamationTriangle className="text-2xl text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-300 mb-2">
                      No Active Workout Plan
                    </h3>
                    <p className="text-sm text-yellow-200 leading-relaxed">
                      Diet charts work in accordance with your active workout plan. Please create one first.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/Workout")}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <span>Go to Workout Generator</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            )}

            {/* Diet Preferences Card - NEW */}
            <div className={`group relative rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-slide-in-left ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400 text-gray-900'}`} style={{ animationDelay: '300ms' }}>
              <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-5 sm:p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Your Preferences
                  </h2>
                </div>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                {/* Diet Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Diet Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {DIET_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDietType(option.id)}
                        className={`relative p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                          dietType === option.id
                            ? `border-transparent bg-gradient-to-r ${option.color} text-white shadow-lg scale-[1.02]`
                            ? (darkMode ? "border-[#1F2937] bg-[#020617]/60 hover:border-[#22D3EE]/40 text-gray-300 hover:text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100")
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-semibold text-sm">{option.label}</span>
                        {dietType === option.id && (
                          <span className="ml-auto text-white">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Cuisine Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                    Cuisine Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CUISINE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setCuisineType(option.id)}
                        className={`relative p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                          cuisineType === option.id
                            ? "border-[#22D3EE] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-white shadow-lg scale-[1.02]"
                            ? (darkMode ? "border-[#1F2937] bg-[#020617]/60 hover:border-[#22D3EE]/40 text-gray-300 hover:text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100")
                        }`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-medium text-xs text-center">{option.label}</span>
                        {cuisineType === option.id && (
                          <span className="absolute top-1 right-1 text-[#22D3EE] text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Senior Citizen Toggle - Deep Niche */}
                {!(bmiData && bmiData.age && parseInt(bmiData.age) >= 60) && (
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    ♿ Special Accessibility
                  </label>
                  <button
                    onClick={() => setIsSenior(!isSenior)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                      isSenior
                        ? "border-[#22D3EE] bg-cyan-500/20 text-white shadow-lg"
                        ? (darkMode ? "border-[#1F2937] bg-[#020617]/60 text-gray-400" : "border-gray-200 bg-gray-100 text-gray-500")
                    }`}
                  >
                    <span className="text-xl">👴</span>
                    <span className="font-semibold text-sm">Senior Citizen Mode</span>
                    {isSenior && <span className="ml-auto text-[#22D3EE]">✓</span>}
                  </button>
                </div>
                )}
                
                {/* Show selected preferences summary */}
                {(dietType || cuisineType || isSenior) && (
                  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20">
                    <p className="text-xs text-gray-400 mb-1">Selected:</p>
                    <p className="text-sm font-semibold text-white">
                      {dietType && DIET_TYPE_OPTIONS.find(o => o.id === dietType)?.label}
                      {dietType && (cuisineType || isSenior) && " • "}
                      {cuisineType && CUISINE_OPTIONS.find(o => o.id === cuisineType)?.label} 
                      {cuisineType && isSenior && " • "}
                      {isSenior && "Senior Friendly"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Card - Enhanced */}
            <div className={`group relative rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-slide-in-left ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400 text-gray-900'}`} style={{ animationDelay: '400ms' }}>
              <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-5 sm:p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <FaUtensils className="text-2xl text-white drop-shadow-lg" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Generate Today's Diet
                  </h2>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                {/* New Day Refresh Notice */}
                {needsRefresh && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-500/30 rounded-lg animate-pulse">
                          <FiRefreshCw className="w-5 h-5 text-blue-300" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-blue-200 text-sm font-semibold">New Day!</p>
                        <p className="text-blue-300 text-xs">Generate a fresh diet chart for today</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {savedDietChart && !needsRefresh && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-green-500/30 rounded-lg">
                          <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-green-200 text-sm leading-relaxed flex-1">
                        Today's diet chart is ready!
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Check if preferences are selected */}
                  {(!dietType || !cuisineType) && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <p className="text-yellow-300 text-xs flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Please select your diet type & cuisine preference above</span>
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={generateDietChart}
                    disabled={loading || !user || !bmiData || !activeWorkoutPlan || !dietType || !cuisineType}
                    className="w-full bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold hover:from-orange-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 active:scale-95 min-h-[56px] group"
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin text-xl" />
                        <span>Generating Today's Diet...</span>
                      </>
                    ) : needsRefresh ? (
                      <>
                        <FiRefreshCw className="text-xl group-hover:rotate-180 transition-transform duration-500" />
                        <span>Generate New Day's Diet</span>
                      </>
                    ) : (
                      <>
                        <FaUtensils className="text-xl group-hover:rotate-12 transition-transform" />
                        <span>Generate Today's Diet</span>
                      </>
                    )}
                  </button>

                  {dietChart && !savedDietChart && (
                    <button
                      onClick={saveDietChart}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/50 transform hover:scale-105 active:scale-95 min-h-[56px] group animate-slide-in-up"
                    >
                      {loading ? (
                        <>
                          <FiRefreshCw className="animate-spin text-xl" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="text-xl group-hover:scale-110 transition-transform" />
                          <span>Save Today's Diet</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                  <p className="text-gray-300 text-xs leading-relaxed flex items-start gap-2">
                    <span className="text-blue-400 text-sm mt-0.5">💡</span>
                    <span>A new diet chart will be generated for each day! 4 meals: Breakfast, Lunch, Evening Snack & Dinner.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Diet Chart Display - Full Height */}
          <div className="xl:col-span-8 2xl:col-span-9 order-1 xl:order-2">
            <div className={`relative rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-500 animate-slide-in-right h-full flex flex-col ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400 text-gray-900'}`}>
              <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-5 sm:p-6 overflow-hidden flex-shrink-0">
                <div className={`absolute inset-0 ${darkMode ? 'bg-[#020617]/20' : 'bg-gray-50/20'}`}></div>
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                        <FaUtensils className="text-2xl text-white drop-shadow-lg" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          Today's Meal Plan
                        </h2>
                        <p className="text-white/70 text-sm">
                          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dietType && (
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold border border-white/30 shadow-lg">
                          {DIET_TYPE_OPTIONS.find(o => o.id === dietType)?.icon} {DIET_TYPE_OPTIONS.find(o => o.id === dietType)?.label}
                        </span>
                      )}
                      {cuisineType && (
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold border border-white/30 shadow-lg">
                          {CUISINE_OPTIONS.find(o => o.id === cuisineType)?.icon} {CUISINE_OPTIONS.find(o => o.id === cuisineType)?.label}
                        </span>
                      )}
                      {activeWorkoutPlan?.generatedParams?.fitnessGoal && (
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold border border-white/30 shadow-lg">
                          🎯 {activeWorkoutPlan.generatedParams.fitnessGoal.replace(/_/g, " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  {displayDietChart && (
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
                      <button
                        type="button"
                        onClick={exportGroceryList}
                        disabled={groceryLines.length === 0}
                        className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 disabled:opacity-40 shadow-lg hover:shadow-white/30 border border-white/20 hover:scale-110 active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center group"
                        title="Download grocery list (.txt)"
                      >
                        <FiDownload className="text-xl group-hover:translate-y-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={saveDietChart}
                        disabled={loading}
                        className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/30 border border-white/20 hover:scale-110 active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center group"
                        title="Save diet chart"
                      >
                        <FiSave className="text-xl group-hover:rotate-12 transition-transform" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(displayDietChart);
                          toast.success("Diet chart copied to clipboard!");
                        }}
                        className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-white/30 border border-white/20 hover:scale-110 active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center group"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="text-xl group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable content area - takes remaining height */}
              <div className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
                {displayDietChart ? (
                  structuredDietChart.length > 0 ? (
                    <div className="space-y-5 sm:space-y-6">
                      {dietType && SUBSTITUTION_BY_DIET[dietType]?.length > 0 && (
                        <div className="rounded-2xl border border-[#22D3EE]/35 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-[#22D3EE] mb-2 flex items-center gap-2">
                            <span>↔</span> Smart swaps ({DIET_TYPE_OPTIONS.find((o) => o.id === dietType)?.label || "your diet"})
                          </h3>
                          <ul className="list-none space-y-2 text-sm text-gray-300">
                            {SUBSTITUTION_BY_DIET[dietType].map((line, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[#A855F7] shrink-0">•</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {structuredDietChart.map((section, sectionIndex) => (
                        <div
                          key={`${section.title}-${sectionIndex}`}
                          className={`group relative rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-lg transition-all duration-500 hover:scale-[1.01] animate-fade-in-up ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400 text-gray-900'}`}
                          style={{ animationDelay: `${sectionIndex * 100}ms` }}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-12 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                              <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                                {section.title}
                              </h3>
                            </div>
                            <span className="text-xs uppercase tracking-widest font-bold px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 rounded-full border border-orange-500/30 shadow-lg">
                              {sectionIndex + 1 < 10 ? `Day ${sectionIndex + 1}` : "Plan Detail"}
                            </span>
                          </div>

                          {section.notes.length > 0 && (
                            <div className="mb-5 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                              <ul className="list-none space-y-2 text-sm text-gray-200 leading-relaxed">
                                {section.notes.map((note, noteIndex) => (
                                  <li key={noteIndex} className="flex items-start gap-2 hover:text-white transition-colors">
                                    <span className="text-blue-400 mt-1">•</span>
                                    <span>{note}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.meals.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {section.meals.map((meal, mealIndex) => (
                                <div
                                  key={`${meal.title}-${mealIndex}`}
                                  className={`group/meal p-4 backdrop-blur-sm border rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] hover:border-[#22D3EE]/50' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
                                    <h4 className="font-bold text-base sm:text-lg text-orange-300 group-hover/meal:text-orange-200 transition-colors">
                                      {meal.title}
                                    </h4>
                                  </div>
                                  <ul className="list-none space-y-2 text-sm text-gray-200 leading-relaxed">
                                    {meal.items.map((item, itemIndex) => (
                                      <li key={itemIndex} className="flex items-start gap-2 hover:text-white transition-colors">
                                        <span className="text-orange-400 mt-1 flex-shrink-0">→</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-full max-w-4xl">
                        <div className={`whitespace-pre-wrap leading-relaxed text-sm sm:text-base p-6 backdrop-blur-sm rounded-2xl border ${darkMode ? 'text-gray-300 bg-[#020617]/60 border-[#1F2937]' : 'text-gray-800 bg-gray-50 border-gray-200'}`}>
                          {formatDietChartContent(displayDietChart)}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[500px]">
                    <div className="relative mb-8 animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 blur-3xl opacity-20 rounded-full"></div>
                      <FaUtensils className="relative text-7xl sm:text-8xl text-gray-600" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-400 mb-4 animate-fade-in">
                      No Diet Chart Generated
                    </h3>
                    <p className="text-base sm:text-lg text-gray-500 max-w-md px-4 leading-relaxed animate-fade-in-delay">
                      {!bmiData
                        ? "Please calculate your BMI first to generate a personalized diet chart."
                        : !activeWorkoutPlan
                        ? "Please create and activate a workout plan first."
                        : "Click 'Generate Diet Chart' to create your personalized meal plan."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-delay {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 4s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 0.6s ease-out 0.2s both;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316, #ef4444);
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.5);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #ea580c, #dc2626);
        }
      `}</style>
    </div>
  );
}