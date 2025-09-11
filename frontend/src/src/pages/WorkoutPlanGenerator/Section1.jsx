// WorkoutPlanGenerator.js - Updated with professional styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FiCopy, FiRefreshCw, FiClock, FiCalendar, FiSave } from "react-icons/fi"; // Added FiSave
import { ToastContainer, toast } from "react-toastify"; // Added ToastContainer and toast
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom"; // Added useNavigate, useLocation
import {
  FaDumbbell,
  FaHeartbeat,
  FaUtensils,
  FaChartLine,
} from "react-icons/fa";
import { GiWeightLiftingUp, GiRunningShoe } from "react-icons/gi";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

const WorkoutPlanGenerator = () => {
  const [formData, setFormData] = useState({
    timeCommitment: "", // 15, 30, 45, 60 minutes
    workoutType: "", // cardio, strength, mixed, flexibility
    intensity: "", // beginner, intermediate, advanced
    equipment: "", // none, basic, full_gym
    daysPerWeek: 0,
    goal: "", // new: lose_weight, gain_weight, build_muscles
    currentWeight: "", // new: from BMI data
    targetWeight: "", // new: for lose/gain weight goals
  });
  const user = useSelector(selectUser);
  const [plan, setPlan] = useState(null); // Changed to null to hold structured plan
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [bmiData, setBmiData] = useState(null);
  const [bmiResult, setBmiResult] = useState(null); // To store bmi result from navigation

  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Initialize useLocation

  useEffect(() => {
    if (location.state?.bmiData && location.state?.bmiResult) {
      setBmiData(location.state.bmiData);
      setBmiResult(location.state.bmiResult);
      setFormData(prev => ({ ...prev, currentWeight: location.state.bmiData.weight }));
      toast.success("BMI data loaded for personalized plan generation!");
    } else if (user?.email) {
      fetchBMIData(); // Fetch from backend if not from navigation state
    }
  }, [user, location.state]);

  const fetchBMIData = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/history`,
        { params: { email: user.email } }
      );
      if (res.data.length > 0) {
        const latestBmi = res.data[0];
        setBmiData(latestBmi);
        setBmiResult({ bmi: latestBmi.bmi, category: latestBmi.category });
        setFormData(prev => ({ ...prev, currentWeight: latestBmi.weight }));
      }
    } catch (error) {
      console.error("Error fetching BMI data", error);
    }
  };

  // Removed fetchWorkoutHistory as it's no longer needed here

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to clean AI-generated content
  const cleanPlanContent = (content) => {
    if (!content) return "";

    return content
      .replace(/#{1,6}\s*/g, "") // Remove markdown headers (# ## ### etc.)
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // Remove bold/italic markdown
      .replace(/\*{1,2}/g, "") // Remove any remaining asterisks
      .replace(/#/g, "") // Remove any remaining hashtags
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
      .trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.timeCommitment ||
      !formData.workoutType ||
      !formData.intensity ||
      !formData.equipment ||
      formData.daysPerWeek === 0 ||
      !formData.goal || // New validation for goal
      !formData.currentWeight || // New validation for current weight
      ((formData.goal === "lose_weight" || formData.goal === "gain_weight") && !formData.targetWeight) // Target weight required for specific goals
    ) {
      console.error("Please fill all fields");
      toast.error("Please fill all required details for your plan.");
      return;
    }

    if (!bmiData) {
      console.error(
        "Please calculate your BMI first to get personalized workout plans"
      );
      toast.error(
        "Please calculate your BMI first to get personalized workout plans"
      );
      return;
    }

    setLoading(true);
    try {
      // Calculate durationWeeks dynamically
      const calculatedDurationWeeks = calculateDurationWeeks(
        formData.currentWeight,
        formData.targetWeight,
        formData.goal,
        bmiData.age // Assuming age is in bmiData
      );

      const requestData = {
        email: user.email,
        fitnessGoal: formData.goal, // Use new goal
        gender: user.gender || "Not specified",
        trainingMethod: `${formData.workoutType} Training`,
        workoutType: formData.equipment,
        strengthLevel: formData.intensity,
        timeCommitment: formData.timeCommitment,
        daysPerWeek: formData.daysPerWeek,
        bmiData: bmiData, // Pass full BMI data
        durationWeeks: calculatedDurationWeeks, // Use calculated duration
        targetWeight: formData.targetWeight, // Pass target weight
        currentWeight: formData.currentWeight, // Pass current weight
      };

      console.log("Sending workout plan request:", requestData);

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-plan`,
        requestData
      );

      console.log("Full API response:", response.data);
      console.log("Plan content:", response.data.plan);

      setPlan(response.data.plan);
      toast.success("Workout plan generated successfully!");
    } catch (error) {
      console.error("Failed to generate plan:", error);
      let errorMessage = "Failed to generate plan.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  const savePlan = async () => {
    if (!user || !plan) {
      toast.error("Please generate a plan first.");
      return;
    }

    setLoading(true);
    try {
      const planName = prompt("Give your workout plan a name:", `My ${formData.goal.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Plan`);
      if (!planName) {
        setLoading(false);
        return;
      }

      // Recalculate durationWeeks for saving, ensure consistency
      const calculatedDurationWeeks = calculateDurationWeeks(
        formData.currentWeight,
        formData.targetWeight,
        formData.goal,
        bmiData.age
      );

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/save`,
        {
          userId: user._id,
          name: planName,
          description: `Personalized ${formData.goal.replace(/_/g, ' ')} plan for ${formData.intensity} level, targeting ${formData.targetWeight ? `${formData.targetWeight}kg` : 'maintenance'} over ${calculatedDurationWeeks} weeks.`, // Updated description with new goal and calculated duration
          planContent: plan, // Structured plan
          generatedParams: { ...formData, bmiData, durationWeeks: calculatedDurationWeeks }, // Include BMI snapshot, new goal fields and calculated duration with params for personalization
          durationWeeks: calculatedDurationWeeks, // Pass calculated duration to backend
        }
      );

      if (response.data.success) {
        toast.success("Workout plan saved successfully!");
        // Optionally navigate to the my-workout-plan page or history
        navigate("/my-workout-plan");
      } else {
        toast.error("Failed to save workout plan.");
      }
    } catch (error) {
      console.error("Error saving workout plan:", error);
      let errorMessage = "Failed to save workout plan.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (plan) {
      // Convert structured plan to a readable string for clipboard
      const planString = plan.map(day => {
        const exercises = day.exercises.map(ex => 
          `- ${ex.name}: ${ex.sets} sets of ${ex.reps} (${ex.weight}, ${ex.rest} rest)`
        ).join('\n');
        return `Day: ${day.day}${day.focus ? ` (${day.focus})` : ''}\nWarmup: ${day.warmup || 'N/A'}\n${exercises}\nCooldown: ${day.cooldown || 'N/A'}\n`;
      }).join('\n---\n');
      navigator.clipboard.writeText(planString);
      toast.success("Plan copied to clipboard!");
    } else {
      toast.error("No plan to copy.");
    }
  };

  const regeneratePlan = async () => {
    if (!formData.timeCommitment || !formData.workoutType || !formData.intensity || !formData.equipment || formData.daysPerWeek === 0 || !formData.goal || !formData.currentWeight || ((formData.goal === "lose_weight" || formData.goal === "gain_weight") && !formData.targetWeight)) {
        toast.error("Please fill all required fields to regenerate the plan.");
        return;
    }
    if (!bmiData) {
        toast.error("Please calculate your BMI first to get personalized workout plans.");
        return;
    }
    setLoading(true);
    try {
      // Recalculate durationWeeks for regenerating, ensure consistency
      const calculatedDurationWeeks = calculateDurationWeeks(
        formData.currentWeight,
        formData.targetWeight,
        formData.goal,
        bmiData.age
      );

      const requestData = {
        email: user.email,
        fitnessGoal: formData.goal, // Use new goal
        gender: user.gender || "Not specified",
        trainingMethod: `${formData.workoutType} Training`,
        workoutType: formData.equipment,
        strengthLevel: formData.intensity,
        timeCommitment: formData.timeCommitment,
        daysPerWeek: formData.daysPerWeek,
        bmiData: bmiData,
        durationWeeks: calculatedDurationWeeks, // Use calculated duration
        targetWeight: formData.targetWeight,
        currentWeight: formData.currentWeight,
      };

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-plan`,
        requestData
      );
      setPlan(response.data.plan);
      toast.success("New plan generated!");
    } catch (error) {
      console.error("Failed to regenerate plan:", error);
      let errorMessage = "Failed to regenerate plan.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
       <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            AI Workout Plan Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get personalized workout plans tailored to your goals, fitness
            level, and preferences
          </p>
        </div>

        {/* Tabs for Generate Plan and My Plans */}
        <div className="flex overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-6 py-3 font-medium rounded-t-lg flex items-center ${
              activeTab === "generate"
                ? "bg-gray-800 text-green-400 border-t-2 border-green-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FaDumbbell className="mr-2" /> Generate Plan
          </button>
          <button
            onClick={() => navigate("/my-workout-plan")}
            className={`px-6 py-3 font-medium rounded-t-lg flex items-center ${
              activeTab === "history"
                ? "bg-gray-800 text-green-400 border-t-2 border-green-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FiClock className="mr-2" /> My Plans
          </button>
        </div>

        {activeTab === "generate" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaChartLine className="mr-3" /> Workout Preferences
                  </h2>
                </div>

                {/* BMI Data Display */}
                {bmiData ? (
                  <div className="bg-gray-700 p-4 border-b border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Your BMI Data
                    </h3>
                    <div className="flex items-center justify-between">
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
                            {bmiData.category}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
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
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-900/20 p-4 border-b border-red-600">
                    <p className="text-red-300 text-sm">
                      <FaHeartbeat className="inline mr-2" />
                      Please go to BMI Calculator to input your data first.
                    </p>
                    <button
                      onClick={() => navigate("/CurrentBMI")}
                      className="mt-2 bg-blue-600 text-white py-1 px-3 rounded-lg text-xs hover:bg-blue-700 transition"
                    >
                      Go to BMI Calculator
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Goal Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What is your main fitness goal?
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[{
                        value: "build_muscles",
                        label: "Gain Muscles",
                        icon: <GiWeightLiftingUp className="text-xl mb-1" />
                      },
                      {
                        value: "lose_weight",
                        label: "Lose Weight",
                        icon: <GiRunningShoe className="text-xl mb-1" />
                      },
                      {
                        value: "gain_weight",
                        label: "Gain Weight",
                        icon: <FaUtensils className="text-xl mb-1" />
                      }].map((goalOption) => (
                        <button
                          key={goalOption.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, goal: goalOption.value })}
                          className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                            formData.goal === goalOption.value
                              ? "bg-green-700 border-green-500"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          {goalOption.icon} <span>{goalOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current and Target Weight Inputs for specific goals */}
                  {(formData.goal === "lose_weight" || formData.goal === "gain_weight") && (
                    <div className="space-y-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <h3 className="text-lg font-semibold text-white">Weight Goals</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Your Current Weight (kg)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter your current weight"
                          value={formData.currentWeight}
                          onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                          className="w-full p-3 rounded-lg bg-gray-600 border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                          disabled={true} // Current weight comes from BMI, user can't change it here
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Target Weight (kg)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter your target weight"
                          value={formData.targetWeight}
                          onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                          className="w-full p-3 rounded-lg bg-gray-600 border border-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Time Commitment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      How much time can you commit per workout?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[15, 30, 45, 60].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              timeCommitment: time.toString(),
                            })
                          }
                          className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                            formData.timeCommitment === time.toString()
                              ? "bg-green-700 border-green-500"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          {time} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workout Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What type of workout do you prefer?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, workoutType: "cardio" })
                        }
                        className={`p-3 rounded-lg border flex flex-col items-center text-gray-200 ${
                          formData.workoutType === "cardio"
                            ? "bg-red-700 border-red-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <GiRunningShoe className="text-xl mb-1" />
                        <span>Cardio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, workoutType: "strength" })
                        }
                        className={`p-3 rounded-lg border flex flex-col items-center text-gray-200 ${
                          formData.workoutType === "strength"
                            ? "bg-blue-700 border-blue-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <GiWeightLiftingUp className="text-xl mb-1" />
                        <span>Strength</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, workoutType: "mixed" })
                        }
                        className={`p-3 rounded-lg border flex flex-col items-center text-gray-200 ${
                          formData.workoutType === "mixed"
                            ? "bg-purple-700 border-purple-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <FaDumbbell className="text-xl mb-1" />
                        <span>Mixed</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            workoutType: "flexibility",
                          })
                        }
                        className={`p-3 rounded-lg border flex flex-col items-center text-gray-200 ${
                          formData.workoutType === "flexibility"
                            ? "bg-yellow-700 border-yellow-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <FaHeartbeat className="text-xl mb-1" />
                        <span>Flexibility</span>
                      </button>
                    </div>
                  </div>

                  {/* Intensity Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What's your fitness level?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, intensity: "beginner" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.intensity === "beginner"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        Beginner
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            intensity: "intermediate",
                          })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.intensity === "intermediate"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        Intermediate
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, intensity: "advanced" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.intensity === "advanced"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What equipment do you have access to?
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, equipment: "none" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.equipment === "none"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        No Equipment (Bodyweight Only)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, equipment: "basic" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.equipment === "basic"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        Basic (Dumbbells, Resistance Bands)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, equipment: "full_gym" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.equipment === "full_gym"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        Full Gym Access
                      </button>
                    </div>
                  </div>

                  {/* Days Per Week */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      How many days per week can you workout?
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 4, 5, 6].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, daysPerWeek: days })
                          }
                          className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                            formData.daysPerWeek === days
                              ? "bg-green-700 border-green-500"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          {days}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Duration Display */}
                  {formData.goal && formData.currentWeight && (formData.goal === "build_muscles" || formData.targetWeight) && (
                    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-2">Suggested Plan Duration:</h3>
                      <p className="text-gray-300">
                        {calculateDurationWeeks(
                          formData.currentWeight,
                          formData.targetWeight,
                          formData.goal,
                          bmiData?.age || 25 // Default age if not available
                        )} weeks
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      <span>Generate Workout Plan</span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Plan Column */}
            <div className="lg:col-span-3">
              {plan ? (
                <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 h-full overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold flex items-center">
                        <FaDumbbell className="mr-3" /> Your Personalized
                        Workout Plan
                      </h2>
                      <div className="flex space-x-3">
                        <button
                          onClick={copyToClipboard}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                          title="Copy to clipboard"
                        >
                          <FiCopy className="text-lg" />
                        </button>
                        <button
                          onClick={regeneratePlan}
                          disabled={loading}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                          title="Regenerate plan"
                        >
                          <FiRefreshCw
                            className={`text-lg ${
                              loading ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={savePlan}
                          disabled={loading}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                          title="Save plan"
                        >
                          <FiSave className="text-lg" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        {formData.timeCommitment} min sessions
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        {formData.workoutType} training
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        {formData.daysPerWeek} days/week
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        {formData.intensity} level
                      </span>
                      {formData.goal && (
                        <span className="bg-white/20 px-3 py-1 rounded-full capitalize">
                          Goal: {formData.goal.replace(/_/g, ' ')}
                        </span>
                      )}
                      {(formData.goal === "lose_weight" || formData.goal === "gain_weight") && formData.targetWeight && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          Target: {formData.targetWeight} kg
                        </span>
                      )}
                      {formData.currentWeight && (formData.goal === "build_muscles" || formData.targetWeight) && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          Duration: {calculateDurationWeeks(formData.currentWeight, formData.targetWeight, formData.goal, bmiData?.age || 25)} weeks
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 max-h-screen overflow-y-auto">
                    {plan.map((dayPlan, dayIndex) => (
                      <div key={dayIndex} className="mb-8 p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600">
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                          <FiCalendar className="mr-2" /> {dayPlan.day} {dayPlan.focus && ` - ${dayPlan.focus}`}
                        </h3>
                        {dayPlan.warmup && (
                          <p className="text-gray-300 mb-2">
                            <span className="font-semibold">Warmup:</span> {dayPlan.warmup}
                          </p>
                        )}
                        <ul className="space-y-3">
                          {dayPlan.exercises.map((exercise, exIndex) => (
                            <li key={exIndex} className="bg-gray-600 p-3 rounded-md border border-gray-500">
                              <p className="font-semibold text-white">{exercise.name}</p>
                              <p className="text-gray-300 text-sm">
                                Sets: {exercise.sets}, Reps: {exercise.reps}, Weight: {exercise.weight || 'N/A'}, Rest: {exercise.rest || 'N/A'}
                              </p>
                              {exercise.notes && (
                                <p className="text-gray-400 text-xs mt-1">Notes: {exercise.notes}</p>
                              )}
                              {exercise.demonstrationLink && (
                                <a href={exercise.demonstrationLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline mt-1 block">
                                  Watch Demo
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                        {dayPlan.cooldown && (
                          <p className="text-gray-300 mt-3">
                            <span className="font-semibold">Cooldown:</span> {dayPlan.cooldown}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 h-full flex flex-col items-center justify-center text-center p-12">
                  <FaDumbbell className="text-5xl text-gray-600 mb-6" />
                  <h3 className="text-2xl font-medium text-gray-400 mb-3">
                    No Workout Plan Generated
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    {!bmiData
                      ? "Please go to BMI Calculator to input your data first."
                      : "Fill out the form and click 'Generate Workout Plan' to create your personalized fitness routine."}
                  </p>
                  {!bmiData && (
                    <button
                      onClick={() => navigate("/CurrentBMI")}
                      className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Go to BMI Calculator
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Placeholder for the new "My Workout Plan" component
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              View Your Saved Workout Plans
            </h2>
            <p className="text-gray-400 mb-6">
              Navigate to the "My Plans" section to see your active and historical workout plans.
            </p>
            <button
              onClick={() => navigate("/my-workout-plan")}
              className="bg-green-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Go to My Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// New function to calculate durationWeeks dynamically
const calculateDurationWeeks = (currentWeight, targetWeight, goal, age) => {
  const currentW = parseFloat(currentWeight);
  const targetW = parseFloat(targetWeight);
  const currentAge = parseInt(age);

  let weeklyRateKg;
  let defaultDurationWeeks = 12; // Default for muscle building or general fitness

  if (goal === "lose_weight") {
    weeklyRateKg = currentAge < 30 ? 0.7 : 0.5; // kg per week
    const weightDiff = currentW - targetW;
    if (weightDiff <= 0) return 4; // Already at or below target, suggest short maintenance
    const weeks = Math.ceil(weightDiff / weeklyRateKg);
    return Math.min(weeks, 52); // Cap at 52 weeks (1 year)
  } else if (goal === "gain_weight") {
    weeklyRateKg = currentAge < 30 ? 0.4 : 0.3; // kg per week
    const weightDiff = targetW - currentW;
    if (weightDiff <= 0) return 4; // Already at or above target, suggest short maintenance
    const weeks = Math.ceil(weightDiff / weeklyRateKg);
    return Math.min(weeks, 52); // Cap at 52 weeks (1 year)
  } else if (goal === "build_muscles") {
    // Muscle gain is slower and less about specific target weight over short term
    // Suggest longer durations, 12-24 weeks commonly for noticeable muscle gain cycles
    return 24; // Default to 24 weeks for muscle building
  }

  return defaultDurationWeeks; // Fallback
};

export default WorkoutPlanGenerator;
