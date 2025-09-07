// WorkoutPlanGenerator.js - Updated with professional styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FiCopy, FiRefreshCw, FiClock, FiCalendar, FiSave } from "react-icons/fi"; // Added FiSave
import { ToastContainer, toast } from "react-toastify"; // Added ToastContainer and toast
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom"; // Added useNavigate
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
    durationWeeks: 4, // Added durationWeeks with a default of 4
  });
  const user = useSelector(selectUser);
  const [plan, setPlan] = useState(null); // Changed to null to hold structured plan
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [bmiData, setBmiData] = useState(null);

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (user?.email) {
      fetchBMIData();
    }
  }, [user]);

  const fetchBMIData = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/history`,
        { params: { email: user.email } }
      );
      if (res.data.length > 0) {
        setBmiData(res.data[0]); // Get latest BMI data
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
      formData.daysPerWeek === 0
    ) {
      console.error("Please fill all fields");
      toast.error("Please fill all fields");
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
      const requestData = {
        email: user.email,
        fitnessGoal: bmiData.selectedPlan || "General Fitness",
        gender: user.gender || "Not specified", // Use user gender from profile if available
        trainingMethod: `${formData.workoutType} Training`,
        workoutType: formData.equipment,
        strengthLevel: formData.intensity,
        timeCommitment: formData.timeCommitment,
        daysPerWeek: formData.daysPerWeek,
        bmiData: bmiData,
        durationWeeks: formData.durationWeeks, // Pass durationWeeks to backend
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
      const planName = prompt("Give your workout plan a name:", `My ${formData.workoutType} Plan (${formData.durationWeeks} Weeks)`);
      if (!planName) {
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/save`,
        {
          userId: user._id,
          name: planName,
          description: `Personalized ${formData.workoutType} plan for ${formData.intensity} level over ${formData.durationWeeks} weeks.`, // Updated description
          planContent: plan, // Structured plan
          generatedParams: formData, // Save original form data for regeneration/reference
          durationWeeks: formData.durationWeeks, // Pass durationWeeks to backend
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
    if (!formData.timeCommitment || !formData.workoutType || !formData.intensity || !formData.equipment || formData.daysPerWeek === 0) {
        toast.error("Please fill all fields to regenerate the plan.");
        return;
    }
    if (!bmiData) {
        toast.error("Please calculate your BMI first to get personalized workout plans.");
        return;
    }
    setLoading(true);
    try {
      const requestData = {
        email: user.email,
        fitnessGoal: bmiData?.selectedPlan || "General Fitness",
        gender: user.gender || "Not specified",
        trainingMethod: `${formData.workoutType} Training`,
        workoutType: formData.equipment,
        strengthLevel: formData.intensity,
        timeCommitment: formData.timeCommitment,
        daysPerWeek: formData.daysPerWeek,
        bmiData: bmiData,
        durationWeeks: formData.durationWeeks, // Pass durationWeeks to backend
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
                    {bmiData.selectedPlan && (
                      <p className="text-gray-300 mt-2">
                        Plan:{" "}
                        <span className="font-bold text-green-400 capitalize">
                          {bmiData.selectedPlan.replace("_", " ")}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-900/20 p-4 border-b border-red-600">
                    <p className="text-red-300 text-sm">
                      <FaHeartbeat className="inline mr-2" />
                      Please calculate your BMI first to get personalized
                      workout plans
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

                  {/* Plan Duration in Weeks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      For how many weeks should this plan last?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[2, 4, 8, 12].map((weeks) => (
                        <button
                          key={weeks}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, durationWeeks: weeks })
                          }
                          className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                            formData.durationWeeks === weeks
                              ? "bg-green-700 border-green-500"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          {weeks} weeks
                        </button>
                      ))}
                    </div>
                  </div>

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
                      ? "Please calculate your BMI first, then fill out the form to create your personalized fitness routine."
                      : "Fill out the form and click 'Generate Workout Plan' to create your personalized fitness routine."}
                  </p>
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

export default WorkoutPlanGenerator;
