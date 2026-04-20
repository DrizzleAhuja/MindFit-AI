import React, { useEffect, useState, useMemo } from "react";
import NavBar from "./NavBar";
import HomeSec1 from "./HomeSec1";
import HomeSec2 from "./HomeSec2";
import HomeSec3 from "./HomeSec3";
import HomeSec4 from "./HomeSec4";
import Footer from "./Footer";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, setUser } from "../../redux/userSlice";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import { formatBmiOneDecimal } from "../BMICalculator/bmiFormValidation";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { toast } from "react-toastify";
import {
  FaTrophy,
  FaDumbbell,
  FaRuler,
  FaLightbulb,
  FaUtensils,
} from "react-icons/fa";
import {
  Sparkles,
  Target,
  Zap,
  Award,
  Calendar,
  Brain,
  Flame,
  Heart,
  Scale,
  ChevronRight,
  Dumbbell,
  LineChart,
  ListOrdered,
} from "lucide-react";
import OnboardingGuide from "../../Components/OnboardingGuide";
import { useTheme } from "../../context/ThemeContext";

// Features page colors: #8B5CF6, #22D3EE, #FACC15, bg #020617 / #05010d, border #1F2937
const COLORS = {
  accent: "#22D3EE",
  purple: "#8B5CF6",
  purpleMid: "#A855F7",
  yellow: "#FACC15",
  border: "#1F2937",
  cardBg: "#020617",
  text: "text-white",
  muted: "text-gray-400",
  gradient: "from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]",
};

// Circular Progress Ring
const CircularProgress = ({ percentage, size = 140, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(34, 211, 238, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-gray-400">Complete</span>
      </div>
    </div>
  );
};

// Animated Counter
const AnimatedCounter = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);
  const end = parseInt(value, 10) || 0;
  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count}</span>;
};

// Weekly Bar Chart – real data only (minutes per day Mon–Sun)
const WeeklyBarChart = ({ data, title }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxValue = Math.max(...data, 1);
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const yLabels = maxValue <= 30 ? [0, 10, 20, 30] : [0, 30, 60, 90];
  const scaleMax = maxValue <= 30 ? 30 : maxValue; // Use standard scaleMax for height proportions!

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-5 h-5 text-[#22D3EE]" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="flex h-48">
        <div className="flex flex-col justify-between text-xs text-gray-500 pr-2 py-1">
          {[...yLabels].reverse().map((label, i) => (
            <span key={i}>{label}m</span>
          ))}
        </div>
        <div className="flex-1 flex items-end justify-between gap-2 border-l border-b border-[#1F2937] pl-2 pb-1">
          {days.map((day, i) => {
            const height = scaleMax > 0 ? (data[i] / scaleMax) * 100 : 0;
            const isToday = i === todayIndex;
            return (
              <div
                key={day}
                className="flex flex-col items-center flex-1 h-full justify-end group relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#020617] border border-[#1F2937] px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap shadow-md z-20">
                  {data[i]}m
                </div>
                <div
                  className={`w-full max-w-[32px] rounded-t-md transition-all duration-700 ${
                    isToday
                      ? "bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE]"
                      : "bg-[#22D3EE]/60"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span
                  className={`text-xs mt-2 ${isToday ? "text-[#22D3EE] font-bold" : "text-gray-500"}`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Calorie Burned (real) – only show when we have workout data; otherwise empty state
const CalorieBurnedSection = ({
  caloriesBurnedThisWeek,
  weeklyBurnedPerDay,
}) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hasData = (weeklyBurnedPerDay || []).some((v) => v > 0);
  const maxVal = Math.max(...(weeklyBurnedPerDay || [0, 0, 0, 0, 0, 0, 0]), 1);
  const scaleMax = maxVal <= 500 ? 500 : maxVal; // Use fixed 500 target boundary fallback!

  if (!hasData) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-[#22D3EE]" />
          <h3 className="text-lg font-semibold text-white">Calories Burned</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-[#020617]/60 border border-[#1F2937] py-6">
          <Flame className="w-10 h-10 text-gray-600 mb-2" />
          <p className="text-gray-400 text-sm">No workout data this week</p>
          <p className="text-gray-500 text-xs mt-1 text-center">
            Log workouts to see calories burned (estimated from duration)
          </p>
        </div>
      </div>
    );
  }

  const yLabels =
    scaleMax <= 500 ? [0, 250, 500] : [0, Math.round(scaleMax / 2), scaleMax];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-[#22D3EE]" />
        <h3 className="text-lg font-semibold text-white">Calories Burned</h3>
        <span className="text-sm text-gray-400 ml-auto">
          {caloriesBurnedThisWeek} cal this week
        </span>
      </div>
      <div className="flex-1 flex min-h-[120px]">
        <div className="flex flex-col justify-between text-[10px] text-gray-500 pr-2 py-1">
          {[...yLabels].reverse().map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div className="flex-1 flex items-end justify-between gap-2 border-l border-b border-[#1F2937] pl-2 pb-1">
          {days.map((day, i) => {
            const val = (weeklyBurnedPerDay || [])[i] || 0;
            const h = scaleMax > 0 ? (val / scaleMax) * 100 : 0;
            return (
              <div
                key={day}
                className="flex flex-col items-center flex-1 h-full justify-end group relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#020617] border border-[#1F2937] px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap shadow-md z-20">
                  {Math.round(val)} cal
                </div>
                <div
                  className="w-full max-w-[24px] rounded-t bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE] transition-all duration-500"
                  style={{ height: `${val > 0 ? Math.max(h, 10) : 0}%` }}
                />
                <span className="text-[10px] text-gray-500 mt-1">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Calorie Intake – from backend history (last 15 days, visualizing last 7)
const CalorieIntakeSection = ({ navigate, calorieHistory }) => {
  // Build map of date (YYYY-MM-DD) -> totalCalories
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayKey = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt.toISOString().slice(0, 10);
  };
  const map = new Map();
  (calorieHistory || []).forEach((log) => {
    const key = dayKey(log.date);
    const existing = map.get(key) || 0;
    map.set(key, existing + (log.totalCalories || 0));
  });

  // Last 7 days including today
  const days = [];
  const values = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(
      d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    );
    values.push(map.get(key) || 0);
  }
  const hasData = values.some((v) => v > 0);
  const maxVal = Math.max(...values, 1);
  const scaleMax = maxVal <= 2000 ? 2000 : maxVal; // Use fixed 2000 kcal target boundary fallback!

  const yLabels =
    scaleMax <= 2000
      ? [0, 1000, 2000]
      : [0, Math.round(scaleMax / 2), scaleMax];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <LineChart className="w-5 h-5 text-[#22D3EE]" />
        <h3 className="text-lg font-semibold text-white">
          Calorie Intake (last 7 days)
        </h3>
      </div>
      {!hasData && (
        <p className="text-xs text-gray-500 mb-2">
          No calorie logs yet. Use Calorie Tracker to log meals and see them
          here.
        </p>
      )}
      <div className="flex-1 flex min-h-[120px] mb-3">
        <div className="flex flex-col justify-between text-[10px] text-gray-500 pr-2 py-1">
          {[...yLabels].reverse().map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div className="flex-1 flex items-end justify-between gap-2 border-l border-b border-[#1F2937] pl-2 pb-1">
          {days.map((label, i) => {
            const h = scaleMax > 0 ? (values[i] / scaleMax) * 100 : 0;
            return (
              <div
                key={label}
                className="flex flex-col items-center flex-1 h-full justify-end group relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#020617] border border-[#1F2937] px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap shadow-md z-20">
                  {Math.round(values[i])} kcal
                </div>
                <div
                  className={`w-full max-w-[24px] rounded-t transition-all duration-500 ${
                    values[i] > 0
                      ? "bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE]"
                      : "bg-[#1F2937]/60"
                  }`}
                  style={{ height: `${values[i] > 0 ? Math.max(h, 10) : 4}%` }}
                />
                <span className="text-[10px] text-gray-500 mt-1">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/calorie-tracker")}
        className="mt-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white text-xs font-medium hover:opacity-90"
      >
        Open Calorie Tracker
      </button>
    </div>
  );
};

// Heatmap from real session dates (last 4 weeks, 7 days each)
const StreakHeatmap = ({ activityData, darkMode }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#22D3EE]" />
          <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Consistency</h3>
        </div>
        <span className="text-xs text-gray-500">Last 4 weeks</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {days.map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] text-gray-500 font-medium"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {(activityData || []).map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {(week || []).map((active, di) => (
              <div
                key={di}
                className={`aspect-square rounded transition-all ${
                  active
                    ? "bg-[#22D3EE] border border-[#22D3EE]/50"
                    : (darkMode ? "bg-[#1F2937]/60 border border-[#1F2937]" : "bg-gray-100 border border-gray-200")
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 mt-2 text-[10px]">
        <span className="text-gray-500">Less</span>
        <div className="flex gap-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((op, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded bg-[#22D3EE]"
              style={{ opacity: op }}
            />
          ))}
        </div>
        <span className="text-gray-500">More</span>
      </div>
    </div>
  );
};

// BMI Trend – real data only
const BMITrendChart = ({ bmiHistory, navigate, darkMode }) => {
  if (!bmiHistory || bmiHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <Scale className={`w-12 h-12 mx-auto mb-3 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
        <p className="text-gray-400 mb-4">No BMI data yet</p>
        <button
          type="button"
          onClick={() => navigate("/CurrentBMI")}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white text-sm font-semibold hover:opacity-90"
        >
          Calculate BMI
        </button>
      </div>
    );
  }
  const data = [...bmiHistory].reverse().slice(-7);
  const maxBMI = Math.max(...data.map((b) => b.bmi), 30);
  const minBMI = Math.min(...data.map((b) => b.bmi), 15);
  const range = maxBMI - minBMI || 10;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-[#22D3EE]" />
        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>BMI Trend</h3>
      </div>
      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((bmi, i) => {
          const height = ((bmi.bmi - minBMI) / range) * 100;
          const isNormal = bmi.category === "Normal weight";
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <span className="text-xs text-gray-400 mb-1">
                {formatBmiOneDecimal(bmi.bmi)}
              </span>
              <div
                className={`w-full max-w-[24px] rounded-t transition-all ${isNormal ? "bg-[#22C55E]" : "bg-[#F97316]"}`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              <span className="text-[10px] text-gray-500 mt-1">
                {new Date(bmi.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-[10px]">
        <span className="text-[#22C55E]">Normal: 18.5–24.9</span>
        <span className="text-[#F97316]">25+</span>
      </div>
    </div>
  );
};

// Helpers for real data
function getStartOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekdayIndex(d) {
  const day = new Date(d).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0, Sun=6
}

export default function Home() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { darkMode } = useTheme();

  const handleLoginSuccess = async (response) => {
    try {
      const { credential } = response;
      if (!credential) {
        toast.error("No credential received from Google");
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/login`,
        { token: credential, role: "user" },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      dispatch(setUser(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("isLoggedIn", "true");

      toast.success("Logged in successfully!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const handleLoginError = (error) => {
    console.error("Google login error:", error);
    toast.error("Google sign-in failed. Please try again.");
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (!user?._id || !user?.email) {
      toast.error("Please sign in to upgrade to PRO.");
      return;
    }
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // 1. Create order
      const { data } = await axios.post(
        `${API_BASE_URL}/api/payment/create-order`,
        {
          userId: user._id,
        },
        {
          withCredentials: true,
        },
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "YOUR_KEY_ID_HERE", // Fallback for safety
        amount: data.order.amount, // Updated from data.amount to data.order.amount
        currency: data.order.currency, // Updated from data.currency
        name: "GenFit AI",
        description: "GenFit PRO Subscription",
        order_id: data.order.id, // Updated from data.orderId to data.order.id
        handler: async function (response) {
          try {
            if (
              !response?.razorpay_order_id ||
              !response?.razorpay_payment_id ||
              !response?.razorpay_signature
            ) {
              toast.error(
                "Payment response was incomplete. Please contact support if you were charged.",
              );
              return;
            }
            const verifyRes = await axios.post(
              `${API_BASE_URL}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user._id,
              },
              { withCredentials: true },
            );

            if (verifyRes.data.success) {
              toast.success("Payment successful! Upgraded to PRO.");
              // Update local user state
              const updatedUser = { ...user, plan: "pro" };
              dispatch(setUser(updatedUser));
              localStorage.setItem("user", JSON.stringify(updatedUser));
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            toast.error("Error verifying payment.");
          }
        },
        prefill: {
          name: user.firstName,
          email: user.email,
        },
        theme: {
          color: "#8B5CF6",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error initializing payment.");
    }
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-[#8B5CF6]" />,
      title: "Adaptive AI Coaching",
      description:
        "Session-by-session adjustments to your plan based on performance, recovery, and goals.",
      color: "from-[#8B5CF6]/20 to-[#A855F7]/20",
      borderColor: "border-[#8B5CF6]/30 hover:border-[#8B5CF6]",
    },
    {
      icon: <Target className="w-8 h-8 text-[#22D3EE]" />,
      title: "Real-Time Form & Posture",
      description:
        "Computer-vision–powered insights to keep every rep safe, efficient, and effective.",
      color: "from-[#22D3EE]/20 to-[#0EA5E9]/20",
      borderColor: "border-[#22D3EE]/30 hover:border-[#22D3EE]",
    },
    {
      icon: <Zap className="w-8 h-8 text-[#FACC15]" />,
      title: "Progress Intelligence",
      description:
        "Clean charts and trends that show exactly what’s working so you can double down.",
      color: "from-[#FACC15]/20 to-[#E11D48]/20",
      borderColor: "border-[#FACC15]/30 hover:border-[#FACC15]",
    },
  ];
  const [stats, setStats] = useState({
    points: 0,
    weeklyPoints: 0,
    streakCount: 0,
    badges: [],
    weeklyChallenge: {},
  });
  const [adherence, setAdherence] = useState({
    adherenceThisWeek: 0,
    last4Weeks: [],
  });
  const [bmiHistory, setBmiHistory] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [calorieHistory, setCalorieHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  const load = async (silent = false) => {
    if (!user?.email && !user?._id) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const promises = [];
      if (user?.email)
        promises.push(
          axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/stats`, {
            params: { email: user.email, _t: Date.now() },
          }),
        );
      else promises.push(Promise.resolve({ data: {} }));

      if (user?._id)
        promises.push(
          axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/adherence`, {
            params: { userId: user._id, _t: Date.now() },
          }),
        );
      else promises.push(Promise.resolve({ data: {} }));

      if (user?.email)
        promises.push(
          axios.get(`${API_BASE_URL}${API_ENDPOINTS.BMI}/history`, {
            params: { email: user.email, _t: Date.now() },
          }),
        );
      else promises.push(Promise.resolve({ data: [] }));

      if (user?._id) {
        promises.push(
          axios
            .get(
              `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/active/${user._id}`,
              { params: { _t: Date.now() } },
            )
            .then((r) => ({ data: { sessionLogs: r.data?.sessionLogs || [] } }))
            .catch(() => ({ data: { sessionLogs: [] } })),
        );
        promises.push(
          axios
            .get(
              `${API_BASE_URL}/api/auth/calorie-intake/history/${user._id}?days=15&_t=${Date.now()}`,
            )
            .catch(() => ({ data: { logs: [] } })),
        );
        // Added Posture Session (VTA) fetch!
        promises.push(
          axios
            .get(`${API_BASE_URL}/api/posture/sessions/${user._id}`, {
              params: { _t: Date.now() },
            })
            .catch(() => ({ data: { sessions: [] } })),
        );
      } else {
        promises.push(Promise.resolve({ data: { sessionLogs: [] } }));
        promises.push(Promise.resolve({ data: { logs: [] } }));
        promises.push(Promise.resolve({ data: { sessions: [] } }));
      }

      const [s, a, b, plan, calories, vta] = await Promise.all(promises);
      setStats(s.data || {});
      setAdherence(a.data || {});
      setBmiHistory((b.data || []).slice(0, 7));

      // Merge plan logs and standalone VTA logs
      const combinedLogs = [
        ...(plan.data?.sessionLogs || []),
        ...(vta.data?.sessions || []),
      ].filter(Boolean);

      setSessionLogs(combinedLogs);
      setCalorieHistory(calories.data?.logs || []);

      console.log("[Home] Loaded Sessions count:", combinedLogs.length);
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    const handleFocus = () => load(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?._id]);

  // Handle Google Fit OAuth Redirect status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gfStatus = params.get("googleFit");
    const reason = params.get("reason");
    const msg = params.get("msg");

    if (gfStatus) {
      console.log("🔗 [Google Fit] Status from URL:", gfStatus, {
        reason,
        msg,
      });

      if (gfStatus === "linked") {
        toast.success("Google Fit linked successfully! 🏃‍♂️");
      } else if (gfStatus === "error") {
        const errorDetail = reason || msg || "Unknown error";
        toast.error(`Failed to link Google Fit: ${errorDetail}`);
        console.error("❌ [Google Fit] Link Error:", errorDetail);
      }

      // Clean up URL parameters without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    if (location.hash !== "#ready-to-start-training") return;

    const scrollToTarget = () => {
      const target = document.getElementById("ready-to-start-training");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const timeoutId = setTimeout(scrollToTarget, 120);
    return () => clearTimeout(timeoutId);
  }, [location.hash, user]);

  // Real: workouts this week from session logs
  const thisWeekStart = useMemo(() => getStartOfWeek(new Date()), []);
  const sessionsThisWeek = useMemo(() => {
    return (sessionLogs || []).filter((log) => {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      return d >= thisWeekStart;
    });
  }, [sessionLogs, thisWeekStart]);

  const workoutsThisWeek = sessionsThisWeek.length;

  // Real: minutes per day (Mon–Sun) from session logs this week
  const weeklyExerciseMinutes = useMemo(() => {
    const mins = [0, 0, 0, 0, 0, 0, 0];
    sessionsThisWeek.forEach((log) => {
      const idx = getWeekdayIndex(log.date);
      // Handle both durationMinutes (plans) and durationSeconds (VTA)
      const durationMins =
        log.durationMinutes ||
        (log.durationSeconds
          ? Math.max(1, Math.round(log.durationSeconds / 60))
          : 0);
      mins[idx] += durationMins;
    });
    return mins;
  }, [sessionsThisWeek]);

  // Real: calories burned this week (estimate fallback to ~5 cal/min from duration if log.calories is missing)
  const caloriesBurnedThisWeek = useMemo(() => {
    return sessionsThisWeek.reduce(
      (sum, log) => sum + (log.calories || (log.durationMinutes || 0) * 5),
      0,
    );
  }, [sessionsThisWeek]);

  const weeklyBurnedPerDay = useMemo(() => {
    const cal = [0, 0, 0, 0, 0, 0, 0];
    sessionsThisWeek.forEach((log) => {
      const idx = getWeekdayIndex(log.date);
      // Handle calories explicitly, fall back to duration estimation only if missing
      const durMins =
        log.durationMinutes ||
        (log.durationSeconds ? log.durationSeconds / 60 : 0);
      cal[idx] += log.calories || durMins * 5;
    });
    return cal;
  }, [sessionsThisWeek]);

  // Real: weekly goal % from gamify
  const weeklyGoalPercent = useMemo(() => {
    const target = stats.weeklyChallenge?.target || 3;
    const progress = stats.weeklyChallenge?.progress ?? workoutsThisWeek;
    return Math.min(Math.round((progress / target) * 100), 100);
  }, [stats, workoutsThisWeek]);

  const totalMinutesThisWeek = useMemo(
    () => weeklyExerciseMinutes.reduce((a, b) => a + b, 0),
    [weeklyExerciseMinutes],
  );

  // Real: heatmap from session logs – 4 rows = last 4 weeks (Mon–Sun each)
  const heatmapData = useMemo(() => {
    const grid = [];
    const weekStart = getStartOfWeek(new Date()); // this week's Monday
    const sessionDates = new Set(
      (sessionLogs || []).map((log) => {
        const d = new Date(log.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );
    for (let w = 0; w < 4; w++) {
      const row = [];
      const start = new Date(weekStart);
      start.setDate(start.getDate() - w * 7);
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + d);
        date.setHours(0, 0, 0, 0);
        row.push(sessionDates.has(date.getTime()));
      }
      grid.push(row);
    }
    return grid;
  }, [sessionLogs]);

  // Real: consistency score = average of last4Weeks adherence, or 0
  const consistencyScore = useMemo(() => {
    const weeks = adherence.last4Weeks || [];
    if (weeks.length === 0) return 0;
    const sum = weeks.reduce((a, w) => a + (w.percent ?? 0), 0);
    return Math.round(sum / weeks.length);
  }, [adherence]);

  // AI insight only when we have real data
  const aiInsight = useMemo(() => {
    const streak = stats.streakCount || 0;
    const hasBmi = (bmiHistory || []).length > 0;
    const hasWorkouts = workoutsThisWeek > 0;

    if (streak >= 7)
      return {
        title: "Excellent momentum!",
        text: `Your ${streak}-day streak shows real dedication. Keep it up!`,
      };
    if (streak >= 3)
      return {
        title: "Building habits",
        text: "You're building a routine. Log a few more days to unlock the 7-day streak badge.",
      };
    if (hasBmi && hasWorkouts)
      return {
        title: "On track",
        text: "You've logged BMI and workouts. Keep logging to see trends and insights.",
      };
    if (hasBmi)
      return {
        title: "Next step",
        text: "You've added BMI. Log a workout to see calories burned and weekly progress.",
      };
    if (hasWorkouts)
      return {
        title: "Add your BMI",
        text: "Calculate your BMI once to get personalized insights and diet tips.",
      };
    return {
      title: "Get started",
      text: "Add your BMI, log a workout, or track meals in Calorie Tracker to see personalized AI insights here.",
    };
  }, [stats.streakCount, bmiHistory, workoutsThisWeek]);

  const cardClass = `relative rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-xl ${
    darkMode 
      ? "border-[#1F2937] bg-[#020617]/80 hover:border-[#22D3EE]/60 shadow-[0_18px_45px_rgba(15,23,42,0.8)]" 
      : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-500/10"
  }`;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? "bg-[#020617]" : "bg-gray-50"
      }`}
    >
      <NavBar />

      {!user && (
        <main className="flex-grow">
          <HomeSec1
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
          />
          <HomeSec2 />
          <HomeSec3
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
          />
          <HomeSec4 />
        </main>
      )}

      {user && (
        <main className="flex-grow">
          <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
              <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
              {/* Upgrade Banner for Free Users */}
              {(!user.plan || user.plan === "free") && (
                <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                      <Zap className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Upgrade to GenFit PRO
                      </h3>
                      <p className="text-sm text-yellow-100/70">
                        Unlock unlimited AI Coach and Photo Calorie Scans.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="whitespace-nowrap px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold rounded-full shadow-lg transition-transform hover:scale-105"
                  >
                    Upgrade for ₹199
                  </button>
                </div>
              )}

              <OnboardingGuide
                loading={loading}
                bmiHistory={bmiHistory}
                sessionLogs={sessionLogs}
                calorieHistory={calorieHistory}
              />

              {/* Header – Features style */}
              <header className="text-center md:text-left mb-6 sm:mb-8 lg:mb-10">
                <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                  <span className={`text-xs sm:text-sm font-semibold ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                    Smart Analytics Dashboard
                  </span>
                </div>
                <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Ready to train,{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                    {user.firstName || "Athlete"}
                  </span>
                  ? 🚀
                </h1>
                <p className={`max-w-3xl text-sm sm:text-base lg:text-lg ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                  Track your progress, log workouts, and check your AI insights
                  here.
                </p>
              </header>

              {/* Top Stats – all real */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
                <div className={`${cardClass} p-4 sm:p-5 md:p-6`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className={`rounded-lg p-2 sm:p-3 border ${darkMode ? "bg-[#020617] border-[#1F2937]" : "bg-purple-50 border-purple-100"}`}>
                      <Flame className="text-[#22D3EE] text-xl sm:text-2xl" />
                    </div>
                    <span className="text-[#22D3EE]/80 text-xs font-medium">
                      This week
                    </span>
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    <AnimatedCounter value={caloriesBurnedThisWeek} />
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Calories burned (from workouts)
                  </p>
                </div>

                <div className={`${cardClass} p-4 sm:p-5 md:p-6`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className={`rounded-lg p-2 sm:p-3 border ${darkMode ? "bg-[#020617] border-[#1F2937]" : "bg-purple-50 border-purple-100"}`}>
                      <Dumbbell className="text-[#22D3EE] text-xl sm:text-2xl" />
                    </div>
                    <span className="text-[#22D3EE]/80 text-xs font-medium">
                      This week
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter value={workoutsThisWeek} />
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Workouts completed
                  </p>
                </div>

                <div className={`${cardClass} p-4 sm:p-5 md:p-6`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="rounded-lg p-2 sm:p-3 bg-[#020617] border border-[#1F2937]">
                      <Zap className="text-[#FACC15] text-xl sm:text-2xl" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1 flex items-center">
                    <AnimatedCounter value={stats.streakCount || 0} />{" "}
                    <span className="text-2xl ml-1">🔥</span>
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">Day streak</p>
                </div>

                <div className={`${cardClass} p-4 sm:p-5 md:p-6`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="rounded-lg p-2 sm:p-3 bg-[#020617] border border-[#1F2937]">
                      <Heart className="text-[#22D3EE] text-xl sm:text-2xl" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {consistencyScore}%
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Consistency (last 4 weeks)
                  </p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
                <div className={`lg:col-span-2 ${cardClass} p-4 sm:p-6`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <WeeklyBarChart
                    data={weeklyExerciseMinutes}
                    title="Weekly exercise (minutes)"
                  />
                </div>
                <div className={cardClass + " p-4 sm:p-6"}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-[#22D3EE]" />
                    <h3 className="text-lg font-semibold text-white">
                      Weekly goal
                    </h3>
                  </div>
                  <div className="flex justify-center mb-4">
                    <CircularProgress percentage={weeklyGoalPercent} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-xl bg-[#020617]/60 border border-[#1F2937]">
                      <div className="text-xl font-bold text-white">
                        {totalMinutesThisWeek}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">
                        Minutes
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#020617]/60 border border-[#1F2937]">
                      <div className="text-xl font-bold text-white">
                        {workoutsThisWeek}/{stats.weeklyChallenge?.target || 3}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">
                        Workouts
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calorie sections + Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
                <div className={`lg:col-span-2 ${cardClass} p-4 sm:p-6`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <CalorieBurnedSection
                    caloriesBurnedThisWeek={caloriesBurnedThisWeek}
                    weeklyBurnedPerDay={weeklyBurnedPerDay}
                  />
                </div>
                <div className={cardClass + " p-4 sm:p-6"}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <StreakHeatmap activityData={heatmapData} />
                </div>
              </div>

              <div className={`${cardClass} p-4 sm:p-6 mb-6 md:mb-8`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <CalorieIntakeSection
                  navigate={navigate}
                  calorieHistory={calorieHistory}
                />
              </div>

              {/* AI Insights – real only */}
              <div className={`${cardClass} p-4 sm:p-6 mb-6 md:mb-8`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg p-2 bg-[#020617] border border-[#1F2937]">
                    <Brain className="w-5 h-5 text-[#22D3EE]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    AI Insights
                  </h3>
                </div>
                <div className="p-4 rounded-xl bg-[#020617]/60 border border-[#1F2937]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#FACC15]/10 flex-shrink-0">
                      <FaLightbulb className="w-4 h-4 text-[#FACC15]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        {aiInsight.title}
                      </h4>
                      <p className="text-sm text-gray-400">{aiInsight.text}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: BMI + Quick Actions + Badges */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                <div className={cardClass + " p-4 sm:p-6"}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <BMITrendChart bmiHistory={bmiHistory} navigate={navigate} />
                </div>
                <div className={cardClass + " p-4 sm:p-6"}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[#FACC15]" />
                    <h3 className="text-lg font-semibold text-white">
                      Quick Actions
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: FaRuler, label: "BMI", path: "/CurrentBMI" },
                      { icon: FaDumbbell, label: "Workout", path: "/Workout" },
                      { icon: FaUtensils, label: "Diet", path: "/diet-chart" },
                      {
                        icon: Brain,
                        label: "Posture coach",
                        path: "/VirtualTA",
                      },
                    ].map((action, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(action.path)}
                        className="p-3 rounded-xl bg-white/5 border border-[#1F2937] hover:border-[#22D3EE]/60 text-white font-medium flex items-center justify-center gap-2 text-sm transition-colors"
                      >
                        <action.icon className="w-4 h-4 text-[#22D3EE]" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={cardClass + " p-4 sm:p-6"}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-[#FACC15]" />
                    <h3 className="text-lg font-semibold text-white">
                      Badges ({(stats.badges || []).length})
                    </h3>
                  </div>
                  {(stats.badges || []).length > 0 ? (
                    <div className="space-y-2">
                      {(stats.badges || []).slice(0, 3).map((badge, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[#020617]/60 border border-[#1F2937]"
                        >
                          <FaTrophy className="w-4 h-4 text-[#FACC15]" />
                          <span className="text-sm text-white font-medium">
                            {badge}
                          </span>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => navigate("/leaderboard")}
                        className="w-full py-2 text-sm text-[#22D3EE] hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        View All <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">
                        Complete challenges to earn badges!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      <Footer />
    </div>
  );
}
