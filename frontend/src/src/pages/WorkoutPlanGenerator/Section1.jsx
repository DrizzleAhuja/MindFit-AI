// WorkoutPlanGenerator.js - Updated with professional styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FiCopy, FiRefreshCw, FiClock, FiCalendar } from "react-icons/fi";
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
  });
  const user = useSelector(selectUser);
  const [plan, setPlan] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [bmiData, setBmiData] = useState(null);

  useEffect(() => {
    if (user?.email) {
      fetchWorkoutHistory();
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

  const fetchWorkoutHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/history`,
        {
          params: { email: user.email },
        }
      );
      setHistory(res.data.history);
    } catch (error) {
      console.error("Error fetching workout history:", error);
    }
  };

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
      return;
    }

    if (!bmiData) {
      console.error(
        "Please calculate your BMI first to get personalized workout plans"
      );
      return;
    }

    setLoading(true);
    try {
      // Map our form data to backend expected format
      const requestData = {
        email: user.email,
        fitnessGoal: bmiData.selectedPlan || "General Fitness", // Use BMI plan or default
        gender: "Not specified", // Backend requires this field
        trainingMethod: `${formData.workoutType} Training`, // Map workout type to training method
        workoutType: formData.equipment, // Map equipment to workout type
        strengthLevel: formData.intensity, // Map intensity to strength level
        // Additional data for personalization
        timeCommitment: formData.timeCommitment,
        daysPerWeek: formData.daysPerWeek,
        bmiData: bmiData,
      };

      console.log("Sending workout plan request:", requestData);

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-plan`,
        requestData
      );

      console.log("Full API response:", response.data);
      console.log("Plan content:", response.data.plan);
      console.log("Plan length:", response.data.plan?.length);

      setPlan(response.data.plan);
      fetchWorkoutHistory();
      console.log("Workout plan generated successfully!");
    } catch (error) {
      console.error("Failed to generate plan:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanPlanContent(plan));
    console.log("Plan copied to clipboard!");
  };

  const regeneratePlan = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      // Map our form data to backend expected format
      const requestData = {
        email: user.email,
        fitnessGoal: bmiData?.selectedPlan || "General Fitness",
        gender: "Not specified",
        trainingMethod: `${formData.workoutType} Training`,
        workoutType: formData.equipment,
        strengthLevel: formData.intensity,
        timeCommitment: formData.timeCommitment,
        daysPerWeek: formData.daysPerWeek,
        bmiData: bmiData,
      };

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-plan`,
        requestData
      );
      setPlan(response.data.plan);
      console.log("New plan generated!");
    } catch (error) {
      console.error("Failed to regenerate plan:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
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
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium rounded-t-lg flex items-center ${
              activeTab === "history"
                ? "bg-gray-800 text-green-400 border-t-2 border-green-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FiClock className="mr-2" /> My History
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
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-gray-100 bg-gray-700 p-8 rounded-lg text-base leading-relaxed min-h-96">
                        {cleanPlanContent(plan)}
                      </div>
                    </div>
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
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center">
                <FiCalendar className="mr-3" /> Workout History
              </h2>
            </div>
            <div className="p-6">
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 rounded-lg p-5 border border-gray-600 hover:border-green-300 transition cursor-pointer"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-white">
                            {item.workoutType} Plan ({item.intensity})
                          </h3>
                          <p className="text-sm text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                          <span className="px-3 py-1 text-xs rounded-full bg-green-800 text-green-100">
                            {item.timeCommitment} min
                          </span>
                          <span className="px-3 py-1 text-xs rounded-full bg-blue-800 text-blue-100">
                            {item.daysPerWeek} days/week
                          </span>
                          <span className="px-3 py-1 text-xs rounded-full bg-purple-800 text-purple-100">
                            {item.equipment}
                          </span>
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap font-sans text-gray-100 text-sm bg-gray-900 p-4 rounded border border-gray-700 max-h-64 overflow-y-auto">
                          {cleanPlanContent(item.plan)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiClock className="text-5xl text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400">
                    No Workout History
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Generate your first workout plan to see it appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutPlanGenerator;
