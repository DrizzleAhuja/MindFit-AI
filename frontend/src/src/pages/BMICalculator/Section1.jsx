// BMICalculator.js - Updated with professional styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../context/ThemeContext";
import {
  FaWeight,
  FaBirthdayCake,
  FaVenusMars,
  FaHistory,
} from "react-icons/fa";
import { GiBodyHeight } from "react-icons/gi";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
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

export default function BMICalculator() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const [heightUnit, setHeightUnit] = useState("imperial");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState("");
  const [history, setHistory] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (user?.email) fetchBMIHistory();
  }, [user]);

  const fetchBMIHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BMI}/history`,
        {
          params: { email: user.email },
        }
      );
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching BMI history", error);
    }
  };

  const clearError = (keys) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  };

  const weightLbMin = Math.ceil(kgToLb(BMI_LIMITS.weightKgMin));
  const weightLbMax = Math.floor(kgToLb(BMI_LIMITS.weightKgMax));

  const buildForm = () => ({
    heightUnit,
    weightUnit,
    heightFeet,
    heightInches,
    heightCm,
    weight,
    age,
  });

  const switchHeightUnit = (next) => {
    if (next === heightUnit) return;
    clearError(["heightFeet", "heightInches", "height", "heightCm"]);
    if (next === "metric") {
      if (heightFeet !== "" && heightInches !== "") {
        const cm = Math.round(ftInToCm(heightFeet, heightInches) * 10) / 10;
        setHeightCm(String(cm));
      }
      setHeightUnit("metric");
    } else {
      const cm = parseFloat(String(heightCm).trim().replace(",", "."));
      if (Number.isFinite(cm) && cm > 0) {
        const { feet, inches } = cmToFtIn(cm);
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
      }
      setHeightUnit("imperial");
    }
  };

  const switchWeightUnit = (next) => {
    if (next === weightUnit) return;
    clearError(["weight"]);
    const w = String(weight).trim().replace(",", ".");
    const n = parseFloat(w);
    if (Number.isFinite(n) && n > 0) {
      if (weightUnit === "kg" && next === "lb") {
        setWeight(String(Math.round(kgToLb(n) * 10) / 10));
      } else if (weightUnit === "lb" && next === "kg") {
        setWeight(String(Math.round(lbToKg(n) * 100) / 100));
      }
    }
    setWeightUnit(next);
  };

  const calculateBMI = () => {
    const form = buildForm();
    const { ok, errors, firstMessage } = validateBmiForm(form);
    if (!ok) {
      setFieldErrors(errors);
      toast.error(firstMessage || "Please fix the highlighted fields.");
      return;
    }
    setFieldErrors({});

    const { weightKg, heightFeet: hf, heightInches: hi, bmiNum } =
      computeBmiFromForm(form);
    const bmiRounded = roundBmiOneDecimal(bmiNum);
    const calculatedBMI = formatBmiOneDecimal(bmiNum);
    const bmiCategory = bmiCategoryFromValue(bmiRounded);

    setBmi(calculatedBMI);
    setCategory(bmiCategory);
    saveBMI(calculatedBMI, bmiCategory, hf, hi, weightKg, bmiRounded);
  };

  const saveBMI = async (
    calculatedBMI,
    bmiCategory,
    apiFeet,
    apiInches,
    weightKg,
    bmiRounded
  ) => {
    try {
      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.BMI}/save`, {
        email: user.email,
        heightFeet: apiFeet,
        heightInches: apiInches,
        weight: weightKg,
        age: parseInt(age, 10),
        diseases: [],
        allergies: [],
        bmi: bmiRounded,
        category: bmiCategory,
      });
      toast.success("BMI saved successfully");
      fetchBMIHistory();
    } catch (error) {
      console.error("Error saving BMI", error);
      toast.error("Failed to save BMI");
    }
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

  const inputErr = (key) =>
    fieldErrors[key] ? "border-red-500 focus:border-red-400" : "border-gray-600";

  const unitBtn = (on) =>
    `flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-all ${
      on
        ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow"
        : "text-gray-400 hover:text-white"
    }`;

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            BMI Calculator
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Track your Body Mass Index and monitor your health progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
              <FaWeight className="mr-3 text-green-400" /> Calculate Your BMI
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <FaBirthdayCake className="mr-2 text-gray-400" /> Age
                </label>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  value={age}
                  min={BMI_LIMITS.ageMin}
                  max={BMI_LIMITS.ageMax}
                  step={1}
                  onChange={(e) => {
                    clearError(["age"]);
                    setAge(e.target.value);
                  }}
                  className={`w-full p-3 rounded-lg border focus:ring-1 focus:ring-green-500 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 border-gray-300'} ${inputErr(
                    "age"
                  )}`}
                />
                {fieldErrors.age && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.age}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <FaVenusMars className="mr-2 text-gray-400" /> Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full p-3 rounded-lg border focus:border-green-500 focus:ring-1 focus:ring-green-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <GiBodyHeight className="mr-2 text-gray-400" /> Height
                  </label>
                  <div className={`flex rounded-lg border p-1 ${darkMode ? 'border-gray-600 bg-gray-700/80' : 'border-gray-300 bg-gray-100'}`}>
                    <button
                      type="button"
                      onClick={() => switchHeightUnit("imperial")}
                      className={unitBtn(heightUnit === "imperial")}
                    >
                      ft / in
                    </button>
                    <button
                      type="button"
                      onClick={() => switchHeightUnit("metric")}
                      className={unitBtn(heightUnit === "metric")}
                    >
                      cm
                    </button>
                  </div>
                </div>
                {heightUnit === "imperial" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Feet"
                          value={heightFeet}
                          min={BMI_LIMITS.feetMin}
                          max={BMI_LIMITS.feetMax}
                          step={1}
                          onChange={(e) => {
                            clearError(["heightFeet", "height"]);
                            setHeightFeet(e.target.value);
                          }}
                          className={`w-full p-3 rounded-lg border focus:ring-1 focus:ring-green-500 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 border-gray-300'} ${inputErr(
                            "heightFeet"
                          )}`}
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
                          placeholder="Inches"
                          value={heightInches}
                          min={0}
                          max={11}
                          step={1}
                          onChange={(e) => {
                            clearError(["heightInches", "height"]);
                            setHeightInches(e.target.value);
                          }}
                          className={`w-full p-3 rounded-lg border focus:ring-1 focus:ring-green-500 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 border-gray-300'} ${inputErr(
                            "heightInches"
                          )}`}
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
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 175"
                      value={heightCm}
                      min={BMI_LIMITS.heightCmMin}
                      max={BMI_LIMITS.heightCmMax}
                      step="0.1"
                      onChange={(e) => {
                        clearError(["heightCm"]);
                        setHeightCm(e.target.value);
                      }}
                      className={`w-full p-3 rounded-lg bg-gray-700 border focus:ring-1 focus:ring-green-500 text-white pr-12 ${inputErr(
                        "heightCm"
                      )}`}
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
                )}
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <FaWeight className="mr-2 text-gray-400" /> Weight
                  </label>
                  <div className={`flex rounded-lg border p-1 ${darkMode ? 'border-gray-600 bg-gray-700/80' : 'border-gray-300 bg-gray-100'}`}>
                    <button
                      type="button"
                      onClick={() => switchWeightUnit("kg")}
                      className={unitBtn(weightUnit === "kg")}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => switchWeightUnit("lb")}
                      className={unitBtn(weightUnit === "lb")}
                    >
                      lb
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder={weightUnit === "kg" ? "e.g. 72.5" : "e.g. 160"}
                  value={weight}
                  min={weightUnit === "lb" ? weightLbMin : BMI_LIMITS.weightKgMin}
                  max={weightUnit === "lb" ? weightLbMax : BMI_LIMITS.weightKgMax}
                  step="0.01"
                  onChange={(e) => {
                    clearError(["weight"]);
                    setWeight(e.target.value);
                  }}
                  className={`w-full p-3 rounded-lg border focus:ring-1 focus:ring-green-500 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 border-gray-300'} ${inputErr(
                    "weight"
                  )}`}
                />
                {fieldErrors.weight && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.weight}</p>
                )}
              </div>

              <button
                onClick={calculateBMI}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Calculate BMI
              </button>
            </div>

            {bmi && (
              <div className={`mt-8 p-5 rounded-xl border overflow-hidden relative ${darkMode ? 'bg-gray-700/90 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" />
                <h3 className={`text-lg font-semibold mb-4 pt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your BMI result
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
                  Body Mass Index
                </p>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">BMI</p>
                    <p
                      className={`text-4xl font-black tabular-nums tracking-tight ${getBMIColor(
                        roundBmiOneDecimal(Number(bmi))
                      )}`}
                    >
                      {formatBmiOneDecimal(bmi)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-gray-400 text-sm mb-1">Category</p>
                    <p
                      className={`text-xl font-semibold ${getBMIColor(
                        roundBmiOneDecimal(Number(bmi))
                      )}`}
                    >
                      {category}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Section */}
          <div className={`rounded-xl shadow-md border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-2xl font-bold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <FaHistory className="mr-3 text-green-400" /> BMI History
            </h2>

            {history.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border hover:border-green-300 transition ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span
                          className={`text-lg font-semibold ${getBMIColor(
                            entry.bmi
                          )}`}
                        >
                          {formatBmiOneDecimal(entry.bmi)}
                        </span>
                        <span className="text-sm text-gray-400 ml-2">
                          ({entry.category})
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div
                        className={`h-2 rounded-full ${
                          entry.category === "Underweight"
                            ? "bg-blue-400"
                            : entry.category === "Normal weight"
                            ? "bg-green-400"
                            : entry.category === "Overweight"
                            ? "bg-yellow-400"
                            : entry.category === "Obese"
                            ? "bg-orange-400"
                            : "bg-red-400"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (parseFloat(entry.bmi) / 40) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaHistory className="text-5xl text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400">
                  No BMI History
                </h3>
                <p className="text-gray-500 mt-2">
                  Calculate your BMI to start tracking your progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} theme={darkMode ? "dark" : "light"} />
    </div>
  );
}
