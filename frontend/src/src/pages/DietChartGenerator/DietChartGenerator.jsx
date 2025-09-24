import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FiRefreshCw, FiSave, FiHeart, FiCopy } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUtensils, FaChartLine, FaExclamationTriangle } from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";

export default function DietChartGenerator() {
  const [bmiData, setBmiData] = useState(null);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState(null);
  const [dietChart, setDietChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedDietChart, setSavedDietChart] = useState(null);
  const [bmiResult, setBmiResult] = useState(null); // Added bmiResult state

  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation

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
            setBmiResult({ bmi: latestBmi.bmi, category: latestBmi.category });
          }
        } catch (error) {
          console.error("Error fetching BMI data:", error);
        }
      }
    };

    if (location.state?.bmiData && location.state?.bmiResult) {
      setBmiData(location.state.bmiData);
      setBmiResult(location.state.bmiResult);
      toast.success("BMI data loaded for personalized plan generation!");
    } else if (user?.email) {
      fetchBMIData(); // Fetch from backend if not from navigation state
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
          // Don't show error to user as this is just checking for existing charts
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
    if (!currentWeight || !targetWeight || !goal || !age) return 12; // Default 12 weeks

    const weightDifference = Math.abs(targetWeight - currentWeight);
    let weeksPerKg = 0.5; // Default: 0.5 kg per week

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
      // build_muscles
      weeksPerKg = 0.3;
    }

    const calculatedWeeks = Math.ceil(weightDifference / weeksPerKg);
    return Math.max(4, Math.min(calculatedWeeks, 24)); // Between 4-24 weeks
  };

  const generateDietChart = async () => {
    console.log("🤖 [FRONTEND] Starting diet chart generation...");

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
        // Attempt to derive fitnessGoal from workout plan name if not explicitly present
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

      // Use the same durationWeeks as the active workout plan
      const durationWeeks = activeWorkoutPlan.durationWeeks;

      const requestData = {
        userId: user._id,
        durationWeeks: durationWeeks,
        fitnessGoal: fitnessGoal,
        currentWeight:
          activeWorkoutPlan.generatedParams.currentWeight || bmiData.weight,
        targetWeight: targetWeight,
        diseases: user.diseases || [],
        allergies: user.allergies || [],
        activeWorkoutPlan: activeWorkoutPlan,
      };

      console.log("🤖 [FRONTEND] Request data prepared:", {
        userId: requestData.userId,
        durationWeeks: requestData.durationWeeks,
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
        setDietChart(response.data.dietChart.dietChart);
        toast.success("Diet chart generated successfully!");
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

  // Helper function to clean and format diet chart content
  const formatDietChartContent = (content) => {
    if (!content) return "";

    return content
      .replace(/\*+/g, "") // Remove all asterisks
      .replace(/^[\s\-\*]+/gm, "") // Remove leading dashes, asterisks, and spaces
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing whitespace from each line
      .replace(/\n{3,}/g, "\n\n") // Replace 3+ consecutive newlines with 2
      .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s+/g, "\n") // Remove spaces at beginning of lines
      .trim();
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
        activeWorkoutPlan: activeWorkoutPlan, // Send the full activeWorkoutPlan object
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
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
      <NavBar />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            AI Diet Chart Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get personalized diet plans tailored to your active workout plan and
            health information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Information and Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* BMI Data Display */}
            {bmiData ? (
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 text-white">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FiHeart className="mr-3" /> Your Health Profile
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300">
                        BMI:{" "}
                        <span className="font-bold text-white">
                          {bmiData.bmi}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Category:{" "}
                        <span className="font-bold text-white">
                          {bmiResult.category}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Weight:{" "}
                        <span className="font-bold text-white">
                          {bmiData.weight}kg
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Height:{" "}
                        <span className="font-bold text-white">
                          {bmiData.heightFeet}'{bmiData.heightInches}"
                        </span>
                      </p>
                      {bmiData.age && (
                        <p className="text-gray-300">
                          Age:{" "}
                          <span className="font-bold text-white">
                            {bmiData.age} years
                          </span>
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-300">
                        Diseases:{" "}
                        <span className="font-bold text-white">
                          {user?.diseases && user.diseases.length > 0
                            ? user.diseases.join(", ")
                            : "None"}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Allergies:{" "}
                        <span className="font-bold text-white">
                          {user?.allergies && user.allergies.length > 0
                            ? user.allergies.join(", ")
                            : "None"}
                        </span>
                      </p>
                      {bmiData.targetWeight && (
                        <p className="text-gray-300">
                          Target Weight:{" "}
                          <span className="font-bold text-white">
                            {bmiData.targetWeight}kg
                          </span>
                        </p>
                      )}
                      {bmiData.targetTimeline && (
                        <p className="text-gray-300">
                          Target Timeline:{" "}
                          <span className="font-bold text-white">
                            {bmiData.targetTimeline}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 rounded-xl border border-red-600 p-6">
                <div className="flex items-center mb-4">
                  <FaExclamationTriangle className="text-red-400 mr-3" />
                  <h3 className="text-lg font-semibold text-red-300">
                    BMI Data Required
                  </h3>
                </div>
                <p className="text-red-300 mb-4">
                  Please calculate your BMI first to generate a personalized
                  diet chart.
                </p>
                <button
                  onClick={() => navigate("/CurrentBMI")}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Go to BMI Calculator
                </button>
              </div>
            )}

            {/* Active Workout Plan Display */}
            {activeWorkoutPlan ? (
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaChartLine className="mr-3" /> Active Workout Plan
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      Plan Name:{" "}
                      <span className="font-bold text-white">
                        {activeWorkoutPlan.name}
                      </span>
                    </p>
                    <p className="text-gray-300">
                      Goal:{" "}
                      <span className="font-bold text-white">
                        {activeWorkoutPlan?.generatedParams?.fitnessGoal
                          ?.replace(/_/g, " ")
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ") || "N/A"}
                      </span>
                    </p>
                    <p className="text-gray-300">
                      Duration:{" "}
                      <span className="font-bold text-white">
                        {activeWorkoutPlan.durationWeeks} weeks
                      </span>
                    </p>
                    <p className="text-gray-300">
                      Current Week:{" "}
                      <span className="font-bold text-white">
                        {activeWorkoutPlan.currentWeek} of{" "}
                        {activeWorkoutPlan.durationWeeks}
                      </span>
                    </p>
                    <p className="text-gray-300">
                      Days Per Week:{" "}
                      <span className="font-bold text-white">
                        {activeWorkoutPlan?.generatedParams?.daysPerWeek ||
                          "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-900/20 rounded-xl border border-yellow-600 p-6">
                <div className="flex items-center mb-4">
                  <FaExclamationTriangle className="text-yellow-400 mr-3" />
                  <h3 className="text-lg font-semibold text-yellow-300">
                    No Active Workout Plan
                  </h3>
                </div>
                <p className="text-yellow-300 mb-4">
                  Diet charts work in accordance with your active workout plan.
                  Please create and activate a workout plan first.
                </p>
                <button
                  onClick={() => navigate("/Workout")}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Go to Workout Generator
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center">
                  <FaUtensils className="mr-3" /> Generate Diet Chart
                </h2>
              </div>
              <div className="p-6">
                {savedDietChart ? (
                  <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-lg">
                    <p className="text-green-300 text-sm">
                      ✓ You already have a saved diet chart for this workout
                      plan
                    </p>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <button
                    onClick={generateDietChart}
                    disabled={
                      loading || !user || !bmiData || !activeWorkoutPlan
                    }
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin mr-2" />
                        Generating Diet Chart...
                      </>
                    ) : (
                      <>
                        <FaUtensils className="mr-2" />
                        Generate Diet Chart
                      </>
                    )}
                  </button>

                  {dietChart && !savedDietChart && (
                    <button
                      onClick={saveDietChart}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <FiRefreshCw className="animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="mr-2" />
                          Save Diet Chart
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-gray-400 text-sm mt-4">
                  The diet chart will be personalized based on your BMI data,
                  health conditions, and active workout plan.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Diet Chart Display */}
          <div className="lg:col-span-4">
            <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 h-full overflow-hidden w-full">
              <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaUtensils className="mr-3" /> Your Personalized Diet Chart
                  </h2>
                  <div className="flex space-x-3">
                    {dietChart && (
                      <button
                        onClick={saveDietChart}
                        disabled={loading}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                        title="Save diet chart"
                      >
                        <FiSave className="text-lg" />
                      </button>
                    )}
                    {dietChart && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(dietChart);
                          toast.success("Diet chart copied to clipboard!");
                        }}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
                {activeWorkoutPlan && (
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {activeWorkoutPlan.generatedParams?.fitnessGoal
                        ?.replace(/_/g, " ")
                        .toUpperCase() || "FITNESS GOAL"}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {activeWorkoutPlan.generatedParams?.daysPerWeek || 0}{" "}
                      days/week
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {activeWorkoutPlan.generatedParams?.timeCommitment || 0}{" "}
                      min sessions
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 max-h-96 overflow-y-auto w-full min-h-96">
                {dietChart ? (
                  <div className="w-full">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm w-full">
                      {formatDietChartContent(dietChart)}
                    </div>
                  </div>
                ) : savedDietChart ? (
                  <div className="w-full">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm w-full">
                      {formatDietChartContent(savedDietChart)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12">
                    <FaUtensils className="text-5xl text-gray-600 mb-6" />
                    <h3 className="text-2xl font-medium text-gray-400 mb-3">
                      No Diet Chart Generated
                    </h3>
                    <p className="text-gray-500 max-w-md">
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
      <Footer />
    </div>
  );
}

// export default DietChartGenerator;
