import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FiRefreshCw, FiSave, FiHeart } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUtensils, FaChartLine, FaExclamationTriangle } from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

export default function DietChartGenerator()  {
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

  // Check for existing diet chart
  useEffect(() => {
    const checkExistingDietChart = async () => {
      if (user && user._id && activeWorkoutPlan) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.AUTH}/diet-chart/${user._id}/${activeWorkoutPlan._id}`
          );
          if (response.data.success && response.data.dietChart) {
            setSavedDietChart(response.data.dietChart.dietChart);
          }
        } catch (error) {
          console.error("Error checking existing diet chart:", error);
        }
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
    if (!user || !bmiData) {
      toast.error("Please ensure your BMI data is available to generate a diet chart.");
      return;
    }

    if (!activeWorkoutPlan) {
      toast.error("No active workout plan found. Please create and activate a workout plan first.");
      return;
    }

    setLoading(true);
    try {
      let fitnessGoal = activeWorkoutPlan?.generatedParams?.fitnessGoal;
      if (!fitnessGoal && activeWorkoutPlan?.name) {
        // Attempt to derive fitnessGoal from workout plan name if not explicitly present
        if (activeWorkoutPlan.name.toLowerCase().includes("lose weight")) {
          fitnessGoal = "lose_weight";
        } else if (activeWorkoutPlan.name.toLowerCase().includes("gain weight")) {
          fitnessGoal = "gain_weight";
        } else if (activeWorkoutPlan.name.toLowerCase().includes("build muscles")) {
          fitnessGoal = "build_muscles";
        }
      }

      const targetWeight = activeWorkoutPlan?.generatedParams?.targetWeight || bmiData.targetWeight;

      const calculatedDurationWeeks = calculateDurationWeeks(
        activeWorkoutPlan.generatedParams.currentWeight || bmiData.weight,
        targetWeight,
        fitnessGoal,
        bmiData.age
      );

      const requestData = {
        userId: user._id,
        durationWeeks: calculatedDurationWeeks,
        fitnessGoal: fitnessGoal,
        currentWeight: activeWorkoutPlan.generatedParams.currentWeight || bmiData.weight,
        targetWeight: targetWeight,
        diseases: user.diseases || [],
        allergies: user.allergies || [],
        activeWorkoutPlan: activeWorkoutPlan,
      };

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-diet-chart`,
        requestData
      );

      if (response.data.success) {
        setDietChart(response.data.dietChart.dietChart);
        toast.success("Diet chart generated successfully!");
      } else {
        toast.error("Failed to generate diet chart.");
      }
    } catch (error) {
      console.error("Error generating diet chart:", error);
      toast.error("Failed to generate diet chart. Please try again.");
    }
    setLoading(false);
  };

  const saveDietChart = async () => {
    if (!user || !dietChart || !activeWorkoutPlan) {
      toast.error("No diet chart to save.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/diet-chart/save`,
        {
          userId: user._id,
          workoutPlanId: activeWorkoutPlan._id,
          dietChart: dietChart,
          durationWeeks: calculateDurationWeeks(
            activeWorkoutPlan.generatedParams.currentWeight || bmiData.weight,
            activeWorkoutPlan.generatedParams.targetWeight || bmiData.targetWeight,
            activeWorkoutPlan.generatedParams.fitnessGoal,
            bmiData.age
          ),
          activeWorkoutPlan: activeWorkoutPlan, // Send the full activeWorkoutPlan object
        }
      );

      if (response.data.success) {
        setSavedDietChart(response.data.dietChart);
        toast.success("Diet chart saved successfully!");
      } else {
        toast.error("Failed to save diet chart.");
      }
    } catch (error) {
      console.error("Error saving diet chart:", error);
      toast.error("Failed to save diet chart. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            AI Diet Chart Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get personalized diet plans tailored to your active workout plan and health information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Information and Controls */}
          <div className="space-y-6">
            {/* BMI Data Display */}
            {bmiData ? (
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-6">
                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                   <FiHeart className="mr-3" /> Your Health Profile
                 </h2>
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
            ) : (
              <div className="bg-red-900/20 rounded-xl border border-red-600 p-6">
                <div className="flex items-center mb-4">
                  <FaExclamationTriangle className="text-red-400 mr-3" />
                  <h3 className="text-lg font-semibold text-red-300">
                    BMI Data Required
                  </h3>
                </div>
                <p className="text-red-300 mb-4">
                  Please calculate your BMI first to generate a personalized diet chart.
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
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <FaChartLine className="mr-3" /> Active Workout Plan
                </h2>
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
                      {activeWorkoutPlan?.generatedParams?.fitnessGoal?.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "N/A"}
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
                      {activeWorkoutPlan.currentWeek} of {activeWorkoutPlan.durationWeeks}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    Days Per Week:{" "}
                    <span className="font-bold text-white">
                      {activeWorkoutPlan?.generatedParams?.daysPerWeek || "N/A"}
                    </span>
                  </p>
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
                  Diet charts work in accordance with your active workout plan. Please create and activate a workout plan first.
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
            <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <FaUtensils className="mr-3" /> Generate Diet Chart
              </h2>
              
              {savedDietChart ? (
                <div className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">
                    ✓ You already have a saved diet chart for this workout plan
                  </p>
                </div>
              ) : null}

              <div className="space-y-4">
                <button
                  onClick={generateDietChart}
                  disabled={loading || !user || !bmiData || !activeWorkoutPlan}
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
                The diet chart will be personalized based on your BMI data, health conditions, and active workout plan.
              </p>
            </div>
          </div>

          {/* Right Side - Diet Chart Display */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-600">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaUtensils className="mr-3" /> Your Personalized Diet Chart
              </h2>
            </div>
            
            <div className="p-6 max-h-screen overflow-y-auto">
              {savedDietChart ? (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {savedDietChart}
                  </div>
                </div>
              ) : dietChart ? (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {dietChart}
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
  );
};

// export default DietChartGenerator;
