// WorkoutPlanGenerator.js - Updated with professional styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
    fitnessGoal: "",
    gender: "",
    trainingMethod: "",
    workoutType: "",
    strengthLevel: "",
  });
  const user = useSelector(selectUser);
  const [plan, setPlan] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");

  useEffect(() => {
    if (user?.email) fetchWorkoutHistory();
  }, [user]);

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
      toast.error("Error fetching workout history");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(formData).every(Boolean)) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-plan`,
        {
          ...formData,
          email: user.email,
        }
      );
      setPlan(response.data.plan);
      fetchWorkoutHistory();
      toast.success("Workout plan generated successfully!");
    } catch (error) {
      toast.error(
        "Failed to generate plan. Please try again. " + error.message
      );
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(plan);
    toast.success("Plan copied to clipboard!");
  };

  const regeneratePlan = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/generate-plan`,
        {
          ...formData,
          email: user.email,
        }
      );
      setPlan(response.data.plan);
      toast.success("New plan generated!");
    } catch (error) {
      toast.error("Failed to regenerate plan");
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaChartLine className="mr-3" /> Plan Settings
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fitness Goal
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            fitnessGoal: "Lose Weight",
                          })
                        }
                        className={`p-3 rounded-lg border flex flex-col items-center text-gray-200 ${
                          formData.fitnessGoal === "Lose Weight"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <GiRunningShoe className="text-xl mb-1" />
                        <span>Lose Weight</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            fitnessGoal: "Gain Muscle",
                          })
                        }
                        className={`p-3 rounded-lg border flex flex-col items-center text-gray-200 ${
                          formData.fitnessGoal === "Gain Muscle"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <GiWeightLiftingUp className="text-xl mb-1" />
                        <span>Gain Muscle</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, gender: "Male" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.gender === "Male"
                            ? "bg-blue-700 border-blue-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, gender: "Female" })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.gender === "Female"
                            ? "bg-purple-700 border-purple-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Training Method
                    </label>
                    <select
                      name="trainingMethod"
                      value={formData.trainingMethod}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                      required
                    >
                      <option value="">Select Method</option>
                      <option value="Resistance Training">
                        Resistance Training
                      </option>
                      <option value="Resistance + Cardio">
                        Resistance + Cardio
                      </option>
                      <option value="Meal Plan Only">Meal Plan Only</option>
                      <option value="Custom Routine">Custom Routine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Workout Type
                    </label>
                    <select
                      name="workoutType"
                      value={formData.workoutType}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Weighted">Weighted</option>
                      <option value="Bodyweight">Bodyweight</option>
                      <option value="No Equipment">No Equipment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Strength Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            strengthLevel: "Beginner",
                          })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.strengthLevel === "Beginner"
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
                            strengthLevel: "Intermediate",
                          })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.strengthLevel === "Intermediate"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        Intermediate
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            strengthLevel: "Advanced",
                          })
                        }
                        className={`p-3 rounded-lg border flex items-center justify-center text-gray-200 ${
                          formData.strengthLevel === "Advanced"
                            ? "bg-green-700 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        Advanced
                      </button>
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
            <div className="lg:col-span-2">
              {plan ? (
                <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 h-full overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold flex items-center">
                        <FaDumbbell className="mr-3" /> Your Custom Plan
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
                  </div>
                  <div className="p-6">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-100 bg-gray-700 p-4 rounded-lg">
                        {plan}
                      </pre>
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
                    Fill out the form and click "Generate Workout Plan" to
                    create your personalized fitness routine.
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
                            {item.fitnessGoal} Plan ({item.strengthLevel})
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
                            {item.trainingMethod}
                          </span>
                          <span className="px-3 py-1 text-xs rounded-full bg-blue-800 text-blue-100">
                            {item.workoutType}
                          </span>
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-100 text-sm bg-gray-900 p-3 rounded border border-gray-700">
                          {item.plan}
                        </pre>
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
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default WorkoutPlanGenerator;
