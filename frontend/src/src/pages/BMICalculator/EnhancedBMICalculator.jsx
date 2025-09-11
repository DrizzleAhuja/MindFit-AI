import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { toast } from "react-toastify";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import {
  FaWeight,
  FaRulerVertical,
  FaBirthdayCake,
  FaHeartbeat,
  FaAllergies,
  FaHistory,
  FaEdit,
  FaChartLine,
  FaDumbbell,
  FaAppleAlt,
  FaRunning,
  FaBrain,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import { GiBodyHeight, GiWeightLiftingUp } from "react-icons/gi";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import { useNavigate } from "react-router-dom";

export default function EnhancedBMICalculator() {
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState("calculator");
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    heightFeet: "",
    heightInches: "",
    weight: "",
    age: "",
    diseases: [],
    allergies: [],
  });

  // BMI results
  const [bmiResult, setBmiResult] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [history, setHistory] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [newDisease, setNewDisease] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [showDiseaseDropdown, setShowDiseaseDropdown] = useState(false);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);

  // Common diseases and allergies
  const commonDiseases = [
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Asthma",
    "Arthritis",
    "High Cholesterol",
    "Thyroid Disorder",
    "Anemia",
    "Migraine",
    "Depression",
    "Anxiety",
    "Osteoporosis",
    "COPD",
    "Kidney Disease",
    "Liver Disease",
    "Epilepsy",
    "Cancer",
    "Autoimmune Disease",
    "PCOS",
    "Sleep Apnea",
  ];

  const commonAllergies = [
    "Peanuts",
    "Tree Nuts",
    "Milk",
    "Eggs",
    "Soy",
    "Wheat",
    "Fish",
    "Shellfish",
    "Pollen",
    "Dust Mites",
    "Pet Dander",
    "Mold",
    "Latex",
    "Penicillin",
    "Sulfa Drugs",
    "Aspirin",
    "Bee Stings",
    "Food Dyes",
    "Preservatives",
    "Gluten",
    "Lactose",
    "Sesame",
    "Mustard",
    "Celery",
  ];

  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) {
      fetchBMIHistory();
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".disease-dropdown") &&
        !event.target.closest(".allergy-dropdown")
      ) {
        setShowDiseaseDropdown(false);
        setShowAllergyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchBMIHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/history`,
        { params: { email: user.email } }
      );
      setHistory(res.data);

      // Load latest record into form
      if (res.data.length > 0) {
        const latest = res.data[0];
        setFormData({
          heightFeet: latest.heightFeet?.toString() || "",
          heightInches: latest.heightInches?.toString() || "",
          weight: latest.weight?.toString() || "",
          age: latest.age?.toString() || "",
          diseases: latest.diseases || [],
          allergies: latest.allergies || [],
        });
        setBmiResult({
          bmi: latest.bmi,
          category: latest.category,
        });
        setAiSuggestions(latest.aiSuggestions || "");
      }
    } catch (error) {
      console.error("Error fetching BMI history", error);
      // Set empty history on error
      setHistory([]);
    }
  };

  const calculateBMI = async () => {
    if (
      !formData.heightFeet ||
      !formData.heightInches ||
      !formData.weight ||
      !formData.age
    ) {
      toast.error("Please enter all required details");
      return;
    }

    setLoading(true);
    try {
      const totalHeightInInches =
        parseInt(formData.heightFeet) * 12 + parseInt(formData.heightInches);
      const heightInMeters = totalHeightInInches * 0.0254;
      const calculatedBMI = (
        formData.weight /
        (heightInMeters * heightInMeters)
      ).toFixed(2);

      let bmiCategory = "";
      if (calculatedBMI < 18.5) bmiCategory = "Underweight";
      else if (calculatedBMI < 24.9) bmiCategory = "Normal weight";
      else if (calculatedBMI < 29.9) bmiCategory = "Overweight";
      else if (calculatedBMI < 35) bmiCategory = "Obese";
      else bmiCategory = "Morbid obesity";

      const requestData = {
        email: user.email,
        heightFeet: formData.heightFeet,
        heightInches: formData.heightInches,
        weight: formData.weight,
        age: formData.age,
        diseases: formData.diseases,
        allergies: formData.allergies,
        bmi: calculatedBMI,
        category: bmiCategory,
      };

      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/save`,
        requestData
      );

      setFormData({ ...formData });
      setBmiResult({ bmi: calculatedBMI, category: bmiCategory });
      setAiSuggestions(res.data.aiSuggestions || "");
      toast.success("BMI saved successfully! You can now proceed to Workout Plan Generator.");

      fetchBMIHistory();

      // Navigate to Workout Plan Generator with BMI data
      navigate("/workout", { state: { bmiData: requestData, bmiResult: { bmi: calculatedBMI, category: bmiCategory } } });
    } catch (error) {
      console.error("Error calculating BMI", error);
      toast.error("Failed to calculate BMI");
    } finally {
      setLoading(false);
    }
  };

  const updateBMI = async () => {
    setLoading(true);
    try {
      // Calculate BMI on frontend first to ensure accuracy
      const totalHeightInInches =
        parseInt(formData.heightFeet) * 12 + parseInt(formData.heightInches);
      const heightInMeters = totalHeightInInches * 0.0254;
      const calculatedBMI = (
        parseFloat(formData.weight) /
        (heightInMeters * heightInMeters)
      ).toFixed(2);

      let bmiCategory = "";
      if (calculatedBMI < 18.5) bmiCategory = "Underweight";
      else if (calculatedBMI < 24.9) bmiCategory = "Normal weight";
      else if (calculatedBMI < 29.9) bmiCategory = "Overweight";
      else if (calculatedBMI < 35) bmiCategory = "Obese";
      else bmiCategory = "Morbid obesity";

      console.log("=== UPDATE BMI DEBUG ===");
      console.log(
        "Height Feet:",
        formData.heightFeet,
        typeof formData.heightFeet
      );
      console.log(
        "Height Inches:",
        formData.heightInches,
        typeof formData.heightInches
      );
      console.log("Weight:", formData.weight, typeof formData.weight);
      console.log("Calculated BMI:", calculatedBMI);
      console.log("BMI Category:", bmiCategory);

      const res = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/update`,
        {
          email: user.email,
          heightFeet: parseInt(formData.heightFeet),
          heightInches: parseInt(formData.heightInches),
          weight: parseFloat(formData.weight),
          age: parseInt(formData.age),
          diseases: formData.diseases,
          allergies: formData.allergies,
        }
      );

      setBmiResult({
        bmi: calculatedBMI,
        category: bmiCategory,
      });
      setAiSuggestions(res.data.aiSuggestions || "");
      setIsEditing(false);
      toast.success("BMI updated successfully");

      fetchBMIHistory();
    } catch (error) {
      console.error("=== UPDATE BMI ERROR ===");
      console.error("Full error object:", error);

      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        toast.error(
          `Server error: ${error.response.status} - ${
            error.response.data?.error || error.response.statusText
          }`
        );
      } else if (error.request) {
        console.error("Request was made but no response received");
        toast.error(
          "Cannot connect to server. Please check if backend is running on port 8000."
        );
      } else {
        console.error("Error setting up request:", error.message);
        toast.error("Failed to update BMI");
      }
    } finally {
      setLoading(false);
    }
  };

  const addDisease = (disease = null) => {
    const diseaseToAdd = disease || newDisease.trim();
    if (diseaseToAdd && !formData.diseases.includes(diseaseToAdd)) {
      setFormData({
        ...formData,
        diseases: [...formData.diseases, diseaseToAdd],
      });
      setNewDisease("");
      setShowDiseaseDropdown(false);
    }
  };

  const removeDisease = (disease) => {
    setFormData({
      ...formData,
      diseases: formData.diseases.filter((d) => d !== disease),
    });
  };

  const addAllergy = (allergy = null) => {
    const allergyToAdd = allergy || newAllergy.trim();
    if (allergyToAdd && !formData.allergies.includes(allergyToAdd)) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyToAdd],
      });
      setNewAllergy("");
      setShowAllergyDropdown(false);
    }
  };

  const removeAllergy = (allergy) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((a) => a !== allergy),
    });
  };

  const getBMIColor = (bmiValue) => {
    if (!bmiValue) return "text-gray-500";
    if (bmiValue < 18.5) return "text-blue-500";
    if (bmiValue < 24.9) return "text-green-500";
    if (bmiValue < 29.9) return "text-yellow-500";
    if (bmiValue < 35) return "text-orange-500";
    return "text-red-500";
  };

  const getBMIBgColor = (bmiValue) => {
    if (!bmiValue) return "bg-gray-500";
    if (bmiValue < 18.5) return "bg-blue-500";
    if (bmiValue < 24.9) return "bg-green-500";
    if (bmiValue < 29.9) return "bg-yellow-500";
    if (bmiValue < 35) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressIcon = (change) => {
    if (change > 0) return <FaArrowUp className="text-red-500" />;
    if (change < 0) return <FaArrowDown className="text-green-500" />;
    return <FaMinus className="text-gray-500" />;
  };

  // Calculate ideal weight range based on height
  const calculateIdealWeightRange = (heightFeet, heightInches) => {
    const totalHeightInInches =
      parseInt(heightFeet) * 12 + parseInt(heightInches);
    const heightInMeters = totalHeightInInches * 0.0254;

    // BMI range 18.5-24.9 for normal weight
    const minWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const maxWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);

    return { minWeight, maxWeight };
  };

  return (
    <div className="dark">
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
              Enhanced BMI Calculator
            </h1>
            <p className="text-xl text-gray-300">
              Track your health journey with AI-powered insights
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-8">
            {[
              {
                id: "calculator",
                label: "BMI Calculator",
                icon: <FaWeight className="mr-2" />,
              },
              {
                id: "ai-insights",
                label: "AI Insights",
                icon: <FaBrain className="mr-2" />,
              },
              {
                id: "history",
                label: "History",
                icon: <FaHistory className="mr-2" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 m-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Calculator Tab */}
          {activeTab === "calculator" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaWeight className="mr-3 text-green-400" />
                    {isEditing ? "Update Your Details" : "Calculate Your BMI"}
                  </h2>
                  {!isEditing && history.length > 0 && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <GiBodyHeight className="mr-2 text-gray-400" />
                      Height
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Feet"
                          value={formData.heightFeet}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              heightFeet: e.target.value,
                            })
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                          min="1"
                          max="8"
                        />
                        <span className="absolute right-3 top-3 text-gray-400">
                          ft
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Inches"
                          value={formData.heightInches}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              heightInches: e.target.value,
                            })
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                          min="0"
                          max="11"
                        />
                        <span className="absolute right-3 top-3 text-gray-400">
                          in
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaWeight className="mr-2 text-gray-400" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter weight in kg"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaBirthdayCake className="mr-2 text-gray-400" />
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="Enter your age"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    />
                  </div>

                  {/* Diseases */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaHeartbeat className="mr-2 text-gray-400" />
                      Diseases
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.diseases.map((disease, index) => (
                        <span
                          key={index}
                          className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
                          {disease}
                          <button
                            onClick={() => removeDisease(disease)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative disease-dropdown">
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="Type or select a disease"
                          value={newDisease}
                          onChange={(e) => {
                            setNewDisease(e.target.value);
                            setShowDiseaseDropdown(true);
                          }}
                          onFocus={() => setShowDiseaseDropdown(true)}
                          className="flex-1 p-3 rounded-l-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                        />
                        <button
                          onClick={() => addDisease()}
                          className="px-4 py-3 bg-red-600 text-white rounded-r-lg hover:bg-red-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Disease Dropdown */}
                      {showDiseaseDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {commonDiseases
                            .filter(
                              (disease) =>
                                disease
                                  .toLowerCase()
                                  .includes(newDisease.toLowerCase()) &&
                                !formData.diseases.includes(disease)
                            )
                            .map((disease, index) => (
                              <button
                                key={index}
                                onClick={() => addDisease(disease)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {disease}
                              </button>
                            ))}
                          {commonDiseases.filter(
                            (disease) =>
                              disease
                                .toLowerCase()
                                .includes(newDisease.toLowerCase()) &&
                              !formData.diseases.includes(disease)
                          ).length === 0 &&
                            newDisease && (
                              <div className="px-4 py-2 text-gray-400 text-sm">
                                Press "Add" to add "{newDisease}"
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaAllergies className="mr-2 text-gray-400" />
                      Allergies
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                        >
                          {allergy}
                          <button
                            onClick={() => removeAllergy(allergy)}
                            className="ml-2 text-yellow-600 hover:text-yellow-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative allergy-dropdown">
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="Type or select an allergy"
                          value={newAllergy}
                          onChange={(e) => {
                            setNewAllergy(e.target.value);
                            setShowAllergyDropdown(true);
                          }}
                          onFocus={() => setShowAllergyDropdown(true)}
                          className="flex-1 p-3 rounded-l-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                        />
                        <button
                          onClick={() => addAllergy()}
                          className="px-4 py-3 bg-yellow-600 text-white rounded-r-lg hover:bg-yellow-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Allergy Dropdown */}
                      {showAllergyDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {commonAllergies
                            .filter(
                              (allergy) =>
                                allergy
                                  .toLowerCase()
                                  .includes(newAllergy.toLowerCase()) &&
                                !formData.allergies.includes(allergy)
                            )
                            .map((allergy, index) => (
                              <button
                                key={index}
                                onClick={() => addAllergy(allergy)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {allergy}
                              </button>
                            ))}
                          {commonAllergies.filter(
                            (allergy) =>
                              allergy
                                .toLowerCase()
                                .includes(newAllergy.toLowerCase()) &&
                              !formData.allergies.includes(allergy)
                          ).length === 0 &&
                            newAllergy && (
                              <div className="px-4 py-2 text-gray-400 text-sm">
                                Press "Add" to add "{newAllergy}"
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={updateBMI}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {loading ? "Updating..." : "Update BMI"}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={calculateBMI}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {loading ? "Calculating..." : "Calculate BMI"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-6">
                {/* BMI Result */}
                {bmiResult && (
                  <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
                    <h3 className="text-2xl font-bold mb-4 flex items-center">
                      <FaCheckCircle className="mr-3 text-green-400" />
                      Your BMI Result
                    </h3>
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getBMIBgColor(
                          bmiResult.bmi
                        )} mb-4`}
                      >
                        <span className="text-4xl font-bold text-white">
                          {bmiResult.bmi}
                        </span>
                      </div>
                      <p
                        className={`text-2xl font-semibold ${getBMIColor(
                          bmiResult.bmi
                        )}`}
                      >
                        {bmiResult.category}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === "ai-insights" && (
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-8">
              <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center">
                <FaBrain className="mr-3 text-purple-400" />
                AI Health Insights
              </h2>

              {!aiSuggestions ? (
                <div className="text-center py-12">
                  <FaBrain className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400 mb-2">
                    No AI Insights yet
                  </p>
                  <p className="text-gray-500">
                    Calculate your BMI to get personalized insights.
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-center">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {aiSuggestions}
                  </p>
                  <button
                    onClick={() => navigate("/workout", { state: { bmiData: formData, bmiResult: bmiResult } })}
                    className="mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all"
                  >
                    Proceed to Workout Plan Generator
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-8">
              <h2 className="text-3xl font-bold mb-8 flex items-center">
                <FaHistory className="mr-3 text-green-400" />
                Your Health Journey
              </h2>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <FaChartLine className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No BMI records found</p>
                  <p className="text-gray-500">
                    Start by calculating your BMI to track your progress
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div
                            className={`w-12 h-12 ${getBMIBgColor(
                              record.bmi
                            )} rounded-full flex items-center justify-center mr-4`}
                          >
                            <span className="text-lg font-bold text-white">
                              {record.bmi}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {record.category}
                            </h3>
                            <p className="text-gray-400">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">
                            Weight: {record.weight}kg
                          </p>
                          <p className="text-sm text-gray-400">
                            Height: {record.heightFeet}'{record.heightInches}"
                          </p>
                        </div>
                      </div>

                      {record.diseases.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-400">
                            Diseases:{" "}
                          </span>
                          {record.diseases.map((disease, i) => (
                            <span
                              key={i}
                              className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1"
                            >
                              {disease}
                            </span>
                          ))}
                        </div>
                      )}

                      {record.allergies.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-400">
                            Allergies:{" "}
                          </span>
                          {record.allergies.map((allergy, i) => (
                            <span
                              key={i}
                              className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-1"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      )}

                      {record.selectedPlan && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-400">Plan: </span>
                          <span className="text-sm text-green-400 capitalize">
                            {record.selectedPlan.replace("_", " ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
