import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { toast } from "react-toastify";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Sparkles } from 'lucide-react';
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
import {
  BMI_LIMITS,
  validateBmiForm,
  bmiCategoryFromValue,
  computeBmiFromForm,
  ftInToCm,
  cmToFtIn,
  kgToLb,
  lbToKg,
  roundBmiOneDecimal,
  formatBmiOneDecimal,
} from "./bmiFormValidation";

export default function EnhancedBMICalculator() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState("calculator");
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    heightUnit: "imperial",
    weightUnit: "kg",
    heightFeet: "",
    heightInches: "",
    heightCm: "",
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
  const [fieldErrors, setFieldErrors] = useState({});
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
      if (!event.target.closest(".disease-dropdown")) {
        setShowDiseaseDropdown(false);
      }
      if (!event.target.closest(".allergy-dropdown")) {
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
        const hf = latest.heightFeet;
        const hi = latest.heightInches;
        let heightCm = "";
        if (hf != null && hf !== "" && hi != null && hi !== "") {
          heightCm = String(
            Math.round(ftInToCm(hf, hi) * 10) / 10
          );
        }
        setFormData({
          heightUnit: "imperial",
          weightUnit: "kg",
          heightFeet: hf?.toString() ?? "",
          heightInches: hi?.toString() ?? "",
          heightCm,
          weight: latest.weight?.toString() || "",
          age: latest.age?.toString() || "",
          diseases: latest.diseases || [],
          allergies: latest.allergies || [],
        });
        setBmiResult({
          bmi: formatBmiOneDecimal(latest.bmi),
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
    const { ok, errors, firstMessage } = validateBmiForm(formData);
    if (!ok) {
      setFieldErrors(errors);
      toast.error(firstMessage || "Please fix the highlighted fields.");
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const { weightKg, heightFeet, heightInches, bmiNum } =
        computeBmiFromForm(formData);
      const bmiRounded = roundBmiOneDecimal(bmiNum);
      const calculatedBMI = formatBmiOneDecimal(bmiNum);
      const bmiCategory = bmiCategoryFromValue(bmiRounded);

      const requestData = {
        email: user.email,
        heightFeet,
        heightInches,
        weight: weightKg,
        age: parseInt(formData.age, 10),
        diseases: formData.diseases,
        allergies: formData.allergies,
        bmi: bmiRounded,
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
      // navigate("/workout", { state: { bmiData: requestData, bmiResult: { bmi: calculatedBMI, category: bmiCategory } } });
    } catch (error) {
      console.error("Error calculating BMI", error);
      toast.error("Failed to calculate BMI");
    } finally {
      setLoading(false);
    }
  };

  const updateBMI = async () => {
    const { ok, errors, firstMessage } = validateBmiForm(formData);
    if (!ok) {
      setFieldErrors(errors);
      toast.error(firstMessage || "Please fix the highlighted fields.");
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const { weightKg, heightFeet, heightInches, bmiNum } =
        computeBmiFromForm(formData);
      const bmiRounded = roundBmiOneDecimal(bmiNum);
      const calculatedBMI = formatBmiOneDecimal(bmiNum);
      const bmiCategory = bmiCategoryFromValue(bmiRounded);

      const res = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/update`,
        {
          email: user.email,
          heightFeet,
          heightInches,
          weight: weightKg,
          age: parseInt(formData.age, 10),
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
          `Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText
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
    const n = Number(bmiValue);
    if (!Number.isFinite(n)) return "text-gray-500";
    if (n < 18.5) return "text-blue-500";
    if (n < 24.9) return "text-green-500";
    if (n < 29.9) return "text-yellow-500";
    if (n < 35) return "text-orange-500";
    return "text-red-500";
  };

  const getBMIBgColor = (bmiValue) => {
    const n = Number(bmiValue);
    if (!Number.isFinite(n)) return "bg-gray-500";
    if (n < 18.5) return "bg-blue-500";
    if (n < 24.9) return "bg-green-500";
    if (n < 29.9) return "bg-yellow-500";
    if (n < 35) return "bg-orange-500";
    return "bg-red-500";
  };

  const inputRing = (key) =>
    fieldErrors[key]
      ? "border-red-500/80 focus:border-red-400 focus:ring-red-500/40"
      : "border-[#1F2937] focus:border-green-500 focus:ring-green-500";

  const clearError = (keys) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  };

  const weightLbMin = Math.ceil(kgToLb(BMI_LIMITS.weightKgMin));
  const weightLbMax = Math.floor(kgToLb(BMI_LIMITS.weightKgMax));

  const switchHeightUnit = (next) => {
    if (next === formData.heightUnit) return;
    clearError(["heightFeet", "heightInches", "height", "heightCm"]);
    if (next === "metric") {
      const { heightFeet, heightInches } = formData;
      if (heightFeet !== "" && heightInches !== "") {
        const cm = Math.round(ftInToCm(heightFeet, heightInches) * 10) / 10;
        setFormData((p) => ({
          ...p,
          heightUnit: "metric",
          heightCm: String(cm),
        }));
      } else {
        setFormData((p) => ({ ...p, heightUnit: "metric" }));
      }
    } else {
      const cm = parseFloat(String(formData.heightCm).trim().replace(",", "."));
      if (Number.isFinite(cm) && cm > 0) {
        const { feet, inches } = cmToFtIn(cm);
        setFormData((p) => ({
          ...p,
          heightUnit: "imperial",
          heightFeet: String(feet),
          heightInches: String(inches),
        }));
      } else {
        setFormData((p) => ({ ...p, heightUnit: "imperial" }));
      }
    }
  };

  const switchWeightUnit = (next) => {
    if (next === formData.weightUnit) return;
    clearError(["weight"]);
    const w = String(formData.weight).trim().replace(",", ".");
    const n = parseFloat(w);
    if (Number.isFinite(n) && n > 0) {
      if (formData.weightUnit === "kg" && next === "lb") {
        setFormData((p) => ({
          ...p,
          weightUnit: "lb",
          weight: String(Math.round(kgToLb(n) * 10) / 10),
        }));
      } else if (formData.weightUnit === "lb" && next === "kg") {
        setFormData((p) => ({
          ...p,
          weightUnit: "kg",
          weight: String(Math.round(lbToKg(n) * 100) / 100),
        }));
      } else {
        setFormData((p) => ({ ...p, weightUnit: next }));
      }
    } else {
      setFormData((p) => ({ ...p, weightUnit: next }));
    }
  };

  const unitToggleBtn = (active) =>
    `flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-semibold transition-all ${
      active
        ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md"
        : "text-gray-400 hover:text-white"
    }`;

  const getProgressIcon = (change) => {
    if (change > 0) return <FaArrowUp className="text-red-500" />;
    if (change < 0) return <FaArrowDown className="text-green-500" />;
    return <FaMinus className="text-gray-500" />;
  };

  // Calculate ideal weight range based on height
  const calculateIdealWeightRange = (heightFeet, heightInches) => {
    const totalHeightInInches =
      parseInt(heightFeet, 10) * 12 + parseInt(heightInches, 10);
    if (!Number.isFinite(totalHeightInInches) || totalHeightInInches <= 0) {
      return { minWeight: "—", maxWeight: "—" };
    }
    const heightInMeters = totalHeightInInches * 0.0254;

    // BMI range 18.5-24.9 for normal weight
    const minWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const maxWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);

    return { minWeight, maxWeight };
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
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
                  Health Assessment
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                BMI{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Calculator
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300">
                Calculate your Body Mass Index and get personalized health insights powered by AI.
              </p>
            </header>
          </div>

          <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 max-w-7xl py-4 sm:py-8">
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center mb-4 sm:mb-8 gap-2 sm:gap-0">
              {[
                {
                  id: "calculator",
                  label: "BMI Calculator",
                  icon: <FaWeight className="mr-1 sm:mr-2 text-sm sm:text-base" />,
                },
                {
                  id: "ai-insights",
                  label: "AI Insights",
                  icon: <FaBrain className="mr-1 sm:mr-2 text-sm sm:text-base" />,
                },
                {
                  id: "history",
                  label: "History",
                  icon: <FaHistory className="mr-1 sm:mr-2 text-sm sm:text-base" />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 sm:px-6 py-2 sm:py-3 m-1 sm:m-2 rounded-lg font-medium transition-all text-xs sm:text-sm md:text-base min-h-[44px] ${activeTab === tab.id
                    ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg"
                    : "bg-[#020617]/80 backdrop-blur-sm border border-[#1F2937] text-gray-300 hover:bg-[#1F2937] active:bg-[#1F2937]/80"
                    }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Calculator Tab */}
            {activeTab === "calculator" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Form */}
                <div className="relative rounded-xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.8)] order-2 lg:order-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center">
                      <FaWeight className="mr-2 sm:mr-3 text-green-400 text-base sm:text-lg lg:text-xl" />
                      <span className="text-sm sm:text-base lg:text-lg">{isEditing ? "Update Your Details" : "Calculate Your BMI"}</span>
                    </h2>
                    {!isEditing && history.length > 0 && (
                      <button
                        onClick={() => {
                          setFieldErrors({});
                          setIsEditing(true);
                        }}
                        className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm min-h-[44px] active:bg-blue-800 w-full sm:w-auto"
                      >
                        <FaEdit className="mr-2 text-sm sm:text-base" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Height */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-300 flex items-center">
                          <GiBodyHeight className="mr-2 text-gray-400 text-sm sm:text-base" />
                          Height
                        </label>
                        <div
                          className="flex rounded-lg border border-[#1F2937] p-1 bg-[#020617]/60 w-full sm:w-auto sm:min-w-[200px]"
                          role="group"
                          aria-label="Height unit"
                        >
                          <button
                            type="button"
                            onClick={() => switchHeightUnit("imperial")}
                            className={unitToggleBtn(
                              formData.heightUnit === "imperial"
                            )}
                          >
                            ft / in
                          </button>
                          <button
                            type="button"
                            onClick={() => switchHeightUnit("metric")}
                            className={unitToggleBtn(
                              formData.heightUnit === "metric"
                            )}
                          >
                            cm
                          </button>
                        </div>
                      </div>

                      {formData.heightUnit === "imperial" ? (
                        <>
                          <p className="text-[11px] sm:text-xs text-gray-500 mb-2">
                            Whole numbers only. Inches 0–11. Total height about
                            3′6″–8′0″.
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="relative">
                              <input
                                type="number"
                                inputMode="numeric"
                                placeholder="Feet"
                                value={formData.heightFeet}
                                onChange={(e) => {
                                  clearError(["heightFeet", "height"]);
                                  setFormData({
                                    ...formData,
                                    heightFeet: e.target.value,
                                  });
                                }}
                                className={`w-full p-3 sm:p-3 rounded-lg bg-[#020617]/60 backdrop-blur-sm border focus:ring-1 text-white text-base pr-10 ${inputRing(
                                  "heightFeet"
                                )}`}
                                min={BMI_LIMITS.feetMin}
                                max={BMI_LIMITS.feetMax}
                                step={1}
                                aria-invalid={!!fieldErrors.heightFeet}
                              />
                              <span className="absolute right-3 top-3 text-gray-400 text-sm">
                                ft
                              </span>
                              {fieldErrors.heightFeet && (
                                <p className="text-xs text-red-400 mt-1">
                                  {fieldErrors.heightFeet}
                                </p>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                inputMode="numeric"
                                placeholder="Inches"
                                value={formData.heightInches}
                                onChange={(e) => {
                                  clearError(["heightInches", "height"]);
                                  setFormData({
                                    ...formData,
                                    heightInches: e.target.value,
                                  });
                                }}
                                className={`w-full p-3 sm:p-3 rounded-lg bg-[#020617]/60 backdrop-blur-sm border focus:ring-1 text-white text-base pr-10 ${inputRing(
                                  "heightInches"
                                )}`}
                                min={BMI_LIMITS.inchesMin}
                                max={BMI_LIMITS.inchesMax}
                                step={1}
                                aria-invalid={!!fieldErrors.heightInches}
                              />
                              <span className="absolute right-3 top-3 text-gray-400 text-sm">
                                in
                              </span>
                              {fieldErrors.heightInches && (
                                <p className="text-xs text-red-400 mt-1">
                                  {fieldErrors.heightInches}
                                </p>
                              )}
                            </div>
                          </div>
                          {fieldErrors.height && (
                            <p className="text-xs text-red-400 mt-2">
                              {fieldErrors.height}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] sm:text-xs text-gray-500 mb-2">
                            Enter height in centimeters ({BMI_LIMITS.heightCmMin}–
                            {BMI_LIMITS.heightCmMax} cm). One decimal allowed.
                          </p>
                          <div className="relative">
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="e.g. 175"
                              value={formData.heightCm}
                              onChange={(e) => {
                                clearError(["heightCm"]);
                                setFormData({
                                  ...formData,
                                  heightCm: e.target.value,
                                });
                              }}
                              className={`w-full p-3 sm:p-3 rounded-lg bg-[#020617]/60 backdrop-blur-sm border focus:ring-1 text-white text-base pr-12 ${inputRing(
                                "heightCm"
                              )}`}
                              min={BMI_LIMITS.heightCmMin}
                              max={BMI_LIMITS.heightCmMax}
                              step="0.1"
                              aria-invalid={!!fieldErrors.heightCm}
                            />
                            <span className="absolute right-3 top-3 text-gray-400 text-sm">
                              cm
                            </span>
                            {fieldErrors.heightCm && (
                              <p className="text-xs text-red-400 mt-1">
                                {fieldErrors.heightCm}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Weight */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-300 flex items-center">
                          <FaWeight className="mr-2 text-gray-400 text-sm sm:text-base" />
                          Weight
                        </label>
                        <div
                          className="flex rounded-lg border border-[#1F2937] p-1 bg-[#020617]/60 w-full sm:w-auto sm:min-w-[180px]"
                          role="group"
                          aria-label="Weight unit"
                        >
                          <button
                            type="button"
                            onClick={() => switchWeightUnit("kg")}
                            className={unitToggleBtn(
                              formData.weightUnit === "kg"
                            )}
                          >
                            kg
                          </button>
                          <button
                            type="button"
                            onClick={() => switchWeightUnit("lb")}
                            className={unitToggleBtn(
                              formData.weightUnit === "lb"
                            )}
                          >
                            lb
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 mb-2">
                        {formData.weightUnit === "kg"
                          ? `Kilograms: ${BMI_LIMITS.weightKgMin}–${BMI_LIMITS.weightKgMax} kg, up to 2 decimals.`
                          : `Pounds: about ${weightLbMin}–${weightLbMax} lb (same range as kg), up to 2 decimals.`}
                      </p>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder={
                          formData.weightUnit === "kg"
                            ? "e.g. 72.5"
                            : "e.g. 160"
                        }
                        value={formData.weight}
                        onChange={(e) => {
                          clearError(["weight"]);
                          setFormData({ ...formData, weight: e.target.value });
                        }}
                        className={`w-full p-3 sm:p-3 rounded-lg bg-[#020617]/60 backdrop-blur-sm border focus:ring-1 text-white text-base ${inputRing(
                          "weight"
                        )}`}
                        min={
                          formData.weightUnit === "lb"
                            ? weightLbMin
                            : BMI_LIMITS.weightKgMin
                        }
                        max={
                          formData.weightUnit === "lb"
                            ? weightLbMax
                            : BMI_LIMITS.weightKgMax
                        }
                        step="0.01"
                        aria-invalid={!!fieldErrors.weight}
                      />
                      {fieldErrors.weight && (
                        <p className="text-xs text-red-400 mt-1">
                          {fieldErrors.weight}
                        </p>
                      )}
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <FaBirthdayCake className="mr-2 text-gray-400 text-sm sm:text-base" />
                        Age (years)
                      </label>
                      <p className="text-[11px] sm:text-xs text-gray-500 mb-2">
                        Whole years only. This calculator is intended for ages{" "}
                        {BMI_LIMITS.ageMin}–{BMI_LIMITS.ageMax} (BMI categories
                        differ for children).
                      </p>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 28"
                        value={formData.age}
                        onChange={(e) => {
                          clearError(["age"]);
                          setFormData({ ...formData, age: e.target.value });
                        }}
                        className={`w-full p-3 sm:p-3 rounded-lg bg-[#020617]/60 backdrop-blur-sm border focus:ring-1 text-white text-base ${inputRing(
                          "age"
                        )}`}
                        min={BMI_LIMITS.ageMin}
                        max={BMI_LIMITS.ageMax}
                        step={1}
                        aria-invalid={!!fieldErrors.age}
                      />
                      {fieldErrors.age && (
                        <p className="text-xs text-red-400 mt-1">
                          {fieldErrors.age}
                        </p>
                      )}
                    </div>

                    {/* Diseases */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <FaHeartbeat className="mr-2 text-gray-400 text-sm sm:text-base" />
                        Diseases
                      </label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                        {formData.diseases.map((disease, index) => (
                          <span
                            key={index}
                            className="flex items-center px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm"
                          >
                            {disease}
                            <button
                              onClick={() => removeDisease(disease)}
                              className="ml-1.5 sm:ml-2 text-red-600 hover:text-red-800 text-base sm:text-lg font-bold"
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
                            className="flex-1 p-3 sm:p-3 rounded-l-lg bg-[#020617]/60 backdrop-blur-sm border border-[#1F2937] focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white text-sm sm:text-base"
                          />
                          <button
                            onClick={() => addDisease()}
                            className="px-3 sm:px-4 py-3 bg-red-600 text-white rounded-r-lg hover:bg-red-700 transition-colors text-xs sm:text-sm min-w-[60px] active:bg-red-800"
                          >
                            Add
                          </button>
                        </div>

                        {/* Disease Dropdown */}
                        {showDiseaseDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-[#020617]/95 backdrop-blur-xl border border-[#1F2937] rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                                  className="w-full px-3 sm:px-4 py-2 text-left text-white hover:bg-[#1F2937] transition-colors text-xs sm:text-sm min-h-[44px] active:bg-[#1F2937]/80"
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
                                <div className="px-3 sm:px-4 py-2 text-gray-400 text-xs sm:text-sm">
                                  Press "Add" to add "{newDisease}"
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Allergies */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <FaAllergies className="mr-2 text-gray-400 text-sm sm:text-base" />
                        Allergies
                      </label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                        {formData.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className="flex items-center px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm"
                          >
                            {allergy}
                            <button
                              onClick={() => removeAllergy(allergy)}
                              className="ml-1.5 sm:ml-2 text-yellow-600 hover:text-yellow-800 text-base sm:text-lg font-bold"
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
                            className="flex-1 p-3 sm:p-3 rounded-l-lg bg-[#020617]/60 backdrop-blur-sm border border-[#1F2937] focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white text-sm sm:text-base"
                          />
                          <button
                            onClick={() => addAllergy()}
                            className="px-3 sm:px-4 py-3 bg-yellow-600 text-white rounded-r-lg hover:bg-yellow-700 transition-colors text-xs sm:text-sm min-w-[60px] active:bg-yellow-800"
                          >
                            Add
                          </button>
                        </div>

                        {/* Allergy Dropdown */}
                        {showAllergyDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-[#020617]/95 backdrop-blur-xl border border-[#1F2937] rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                                  className="w-full px-3 sm:px-4 py-2 text-left text-white hover:bg-[#1F2937] transition-colors text-xs sm:text-sm min-h-[44px] active:bg-[#1F2937]/80"
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
                                <div className="px-3 sm:px-4 py-2 text-gray-400 text-xs sm:text-sm">
                                  Press "Add" to add "{newAllergy}"
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={updateBMI}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 sm:py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 text-sm sm:text-base min-h-[48px] active:opacity-80"
                          >
                            {loading ? "Updating..." : "Update BMI"}
                          </button>
                          <button
                            onClick={() => {
                              setFieldErrors({});
                              setIsEditing(false);
                            }}
                            className="px-4 sm:px-6 py-3 bg-[#1F2937] text-white rounded-lg hover:bg-[#1F2937]/80 transition-colors text-sm sm:text-base min-h-[48px] active:bg-[#1F2937]/60"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={calculateBMI}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 sm:py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 text-sm sm:text-base min-h-[48px] active:opacity-80"
                        >
                          {loading ? "Calculating..." : "Calculate BMI"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                  {/* BMI Result */}
                  {bmiResult && (
                    <div className="relative rounded-xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.8)] overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] rounded-t-xl" />
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-5 flex items-center pt-1">
                        <FaCheckCircle className="mr-2 sm:mr-3 text-green-400 text-base sm:text-lg lg:text-xl" />
                        <span className="text-sm sm:text-base lg:text-lg">Your BMI Result</span>
                      </h3>
                      <div className="text-center">
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-2">
                          Body Mass Index
                        </p>
                        <div
                          className={`inline-flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full ${getBMIBgColor(
                            roundBmiOneDecimal(Number(bmiResult.bmi))
                          )} mb-3 sm:mb-4 shadow-lg ring-2 ring-white/10`}
                        >
                          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums tracking-tight">
                            {formatBmiOneDecimal(bmiResult.bmi)}
                          </span>
                        </div>
                        <p
                          className={`text-lg sm:text-xl lg:text-2xl font-semibold ${getBMIColor(
                            roundBmiOneDecimal(Number(bmiResult.bmi))
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
              <div className="relative rounded-xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-4 sm:p-6 lg:p-8 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-center flex items-center justify-center">
                  <FaBrain className="mr-2 sm:mr-3 text-purple-400 text-base sm:text-lg lg:text-xl" />
                  <span className="text-base sm:text-lg lg:text-xl">AI Health Insights</span>
                </h2>

                {!aiSuggestions ? (
                  <div className="text-center py-8 sm:py-12">
                    <FaBrain className="text-4xl sm:text-5xl lg:text-6xl text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-2">
                      No AI Insights yet
                    </p>
                    <p className="text-sm sm:text-base text-gray-500 px-2">
                      Calculate your BMI to get personalized insights.
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-center">
                    <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed whitespace-pre-line px-2">
                      {aiSuggestions}
                    </p>
                    <button
                      onClick={() => navigate("/workout", { state: { bmiData: formData, bmiResult: bmiResult } })}
                      className="mt-4 sm:mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:opacity-90 transition-all text-sm sm:text-base min-h-[48px] active:opacity-80"
                    >
                      Proceed to Workout Plan Generator
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="relative rounded-xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-4 sm:p-6 lg:p-8 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 flex items-center">
                  <FaHistory className="mr-2 sm:mr-3 text-green-400 text-base sm:text-lg lg:text-xl" />
                  <span className="text-base sm:text-lg lg:text-xl">Your Health Journey</span>
                </h2>

                {history.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FaChartLine className="text-4xl sm:text-5xl lg:text-6xl text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-2">No BMI records found</p>
                    <p className="text-sm sm:text-base text-gray-500 px-2">
                      Start by calculating your BMI to track your progress
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {history.map((record, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                          <div className="flex items-center w-full sm:w-auto">
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 ${getBMIBgColor(
                                record.bmi
                              )} rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0`}
                            >
                              <span className="text-base sm:text-lg font-bold text-white">
                                {formatBmiOneDecimal(record.bmi)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold truncate">
                                {record.category}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-400">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            <p className="text-xs sm:text-sm text-gray-400">
                              Weight: {record.weight}kg
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400">
                              Height: {record.heightFeet}'{record.heightInches}"
                            </p>
                          </div>
                        </div>

                        {record.diseases.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs sm:text-sm text-gray-400">
                              Diseases:{" "}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {record.diseases.map((disease, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {disease}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.allergies.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs sm:text-sm text-gray-400">
                              Allergies:{" "}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {record.allergies.map((allergy, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
