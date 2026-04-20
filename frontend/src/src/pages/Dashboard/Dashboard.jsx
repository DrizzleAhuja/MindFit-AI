import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useNavigate } from "react-router-dom";
import { 
  FaFire, FaTrophy, FaDumbbell, FaAppleAlt, FaRuler, 
  FaHeartbeat, FaBolt, FaArrowUp, FaArrowDown,
  FaLightbulb, FaChartLine, FaCalendarCheck, FaUtensils
} from "react-icons/fa";
import { 
  Sparkles, Target, TrendingUp, Activity, Zap, Award, Calendar, 
  Brain, Flame, Heart, Scale, Timer, ChevronRight, Clock,
  Sun, Moon, Sunrise, Coffee, Dumbbell, Footprints
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import GamifyBadge from "../../Components/GamifyBadge";

// Circular Progress Ring Component
const CircularProgress = ({ percentage, size = 140, strokeWidth = 10, color = "#84CC16" }) => {
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
          stroke="rgba(132, 204, 22, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
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
const AnimatedCounter = ({ value, duration = 1200 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) { setCount(0); return; }
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

// Weekly Bar Chart Component
// Weekly Bar Chart Component
const WeeklyBarChart = ({ data, title, icon: Icon, yAxisLabel = "min" }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => ({
    name: day,
    duration: data[i] || 0
  }));

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#84CC16]" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="text-[10px] text-gray-400">Values: [{data.join(', ')}]</span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis 
              stroke="#6B7280" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `${v}${yAxisLabel}`} 
              width={35} 
              domain={[0, 30]} // Fix bounds explicitly using constant to avoid scaling bugs!
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ color: '#9CA3AF' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar 
              dataKey="duration" 
              fill="#84CC16" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Line Chart Component for Calorie Intake
const CalorieBarChart = ({ intakeData, burnedData }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => ({
    name: day,
    Intake: intakeData[i] || 0,
    Burned: burnedData[i] || 0
  }));

  const totalBurned = burnedData.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#22D3EE]" />
          <h3 className="text-lg font-semibold text-white">Calories Burned</h3>
          <span className="text-xs text-gray-400">({Math.round(totalBurned)} cal this week)</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[10px] text-gray-500 mr-2">Val: [{chartData.map(d => d.Burned).join(', ')}]</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#84CC16]" />
            <span className="text-gray-400">Intake</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#22D3EE]" />
            <span className="text-gray-400">Burned</span>
          </div>
        </div>
      </div>
      
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis 
              stroke="#6B7280" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              width={35} 
              domain={[0, (dataMax) => Math.max(dataMax, 100)]} // Set min height domain
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ color: '#9CA3AF' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="Intake" fill="#84CC16" radius={[4, 4, 0, 0]} maxBarSize={15} />
            <Bar dataKey="Burned" fill="#22D3EE" radius={[4, 4, 0, 0]} maxBarSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// GitHub-style Streak Heatmap
const StreakHeatmap = ({ activityData }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#84CC16]" />
          <h3 className="text-lg font-semibold text-white">Consistency</h3>
        </div>
        <span className="text-xs text-gray-500">Last 4 weeks</span>
      </div>
      
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs text-gray-500 font-medium">{day}</div>
        ))}
      </div>
      
      {/* Heatmap Grid - 4 weeks */}
      <div className="space-y-2">
        {activityData.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((active, dayIndex) => (
              <div
                key={dayIndex}
                className={`aspect-square rounded-md transition-all duration-300 ${
                  active 
                    ? 'bg-[#84CC16] shadow-[0_0_8px_rgba(132,204,22,0.4)]' 
                    : 'bg-[#1F2937]/60'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#1F2937]/60" />
          <span className="text-gray-500">Rest</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#84CC16]" />
          <span className="text-gray-500">Active</span>
        </div>
      </div>
    </div>
  );
};

// BMI Trend Chart
const BMITrendChart = ({ bmiHistory }) => {
  if (!bmiHistory || bmiHistory.length === 0) return null;
  
  const data = [...bmiHistory].reverse().slice(-7);
  const maxBMI = Math.max(...data.map(b => b.bmi), 30);
  const minBMI = Math.min(...data.map(b => b.bmi), 15);
  const range = maxBMI - minBMI || 10;
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-[#EC4899]" />
        <h3 className="text-lg font-semibold text-white">BMI Trend</h3>
      </div>
      
      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((bmi, i) => {
          const height = ((bmi.bmi - minBMI) / range) * 100;
          const isNormal = bmi.category === 'Normal weight';
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <span className="text-xs text-gray-400 mb-1">{bmi.bmi}</span>
              <div 
                className={`w-full max-w-[24px] rounded-t transition-all duration-500 ${
                  isNormal ? 'bg-[#22C55E]' : 'bg-[#F97316]'
                }`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              <span className="text-[10px] text-gray-500 mt-1">
                {new Date(bmi.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* BMI Zones */}
      <div className="flex justify-between mt-3 text-[10px]">
        <span className="text-[#22C55E]">Normal: 18.5-24.9</span>
        <span className="text-[#F97316]">Overweight: 25+</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ points: 0, weeklyPoints: 0, streakCount: 0, badges: [], weeklyChallenge: {} });
  const [adherence, setAdherence] = useState({ active: false, adherenceThisWeek: 0, last4Weeks: [] });
  const [bmiHistory, setBmiHistory] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [calorieLogs, setCalorieLogs] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [workoutSessionLogs, setWorkoutSessionLogs] = useState([]);
  const [leaderboardRank, setLeaderboardRank] = useState(-1);
  const [loading, setLoading] = useState(true);

  const load = async (silent = false) => {
    if (!user?.email || !user?._id) { 
      if (!silent) setLoading(false);
      return; 
    }
    if (!silent) setLoading(true);
    try {
      const [s, a, b, w, c, p, l] = await Promise.all([
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/stats`, { params: { email: user.email, _t: Date.now() } }),
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/adherence`, { params: { userId: user._id, _t: Date.now() } }),
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.BMI}/history`, { params: { email: user.email, _t: Date.now() } }),
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/active/${user._id}`, { params: { _t: Date.now() } }).catch(() => ({ data: { plan: null, sessionLogs: [] } })),
        axios.get(`${API_BASE_URL}/api/auth/calorie-intake/history/${user._id}`, { params: { _t: Date.now() } }).catch(() => ({ data: { logs: [] } })),
        axios.get(`${API_BASE_URL}/api/posture/sessions/${user._id}`, { params: { _t: Date.now() } }).catch(() => ({ data: { sessions: [] } })),
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/leaderboard`, { params: { period: 'all', _t: Date.now() } }).catch(() => ({ data: { users: [] } })),
      ]);
      
      setStats(s.data || {});
      setAdherence(a.data || {});
      setBmiHistory((b.data || []).slice(0, 7));
      setWorkoutPlan(w.data?.plan || null);
      setWorkoutSessionLogs(w.data?.sessionLogs || []);
      setCalorieLogs(c.data?.logs || []);
      const vtaSessions = p.data?.sessions || [];
      setSessionLogs(vtaSessions);

      // Diagnostic logging
      console.log("[Dashboard] Loaded VTA sessions:", vtaSessions.length);
      if (vtaSessions.length > 0) {
        console.log("[Dashboard] Latest session:", vtaSessions[0]);
      }

      const lbUsers = l.data?.users || [];
      const rankIdx = lbUsers.findIndex(u => u.email === user.email);
      setLeaderboardRank(rankIdx);
    } catch (e) { 
      console.error("Dashboard load error:", e); 
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => load(true), 30000);
    
    // Refresh when user returns to tab
    const handleFocus = () => load(true);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?._id]);

  // Calculate metrics
  const weeklyGoalPercent = useMemo(() => {
    const target = stats.weeklyChallenge?.target || 5;
    const progress = stats.weeklyChallenge?.progress || 0;
    return Math.min(Math.round((progress / target) * 100), 100);
  }, [stats]);

  // Aggregate daily durations from both posture sessions and plan logs for the current week (since Mon)
  const weeklyExerciseData = useMemo(() => {
    const dataSeconds = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    (sessionLogs || []).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfWeek) {
        let dayIdx = logDate.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        dataSeconds[dayIdx] += (log.durationSeconds || 0);
      }
    });

    (workoutSessionLogs || []).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfWeek) {
        let dayIdx = logDate.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        dataSeconds[dayIdx] += (log.durationMinutes || 0) * 60;
      }
    });

    return dataSeconds.map(secs => secs > 0 ? Math.max(1, Math.round(secs / 60)) : 0);
  }, [sessionLogs, workoutSessionLogs]);

  // Sum up actual calories burned this week
  const calorieBurnedData = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    (sessionLogs || []).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfWeek) {
        let dayIdx = logDate.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        data[dayIdx] += (log.calories || 0);
      }
    });

    (workoutSessionLogs || []).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfWeek) {
        let dayIdx = logDate.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        data[dayIdx] += (log.calories || 0);
      }
    });

    return data.map(cal => Math.round(cal * 10) / 10);
  }, [sessionLogs, workoutSessionLogs]);

  const caloriesBurned = useMemo(() => {
    return Math.round(calorieBurnedData.reduce((a, b) => a + b, 0));
  }, [calorieBurnedData]);

  const workoutsThisWeek = useMemo(() => {
    return weeklyExerciseData.filter(m => m > 0).length;
  }, [weeklyExerciseData]);

  // Sum up actual calorie intake for this week
  const calorieIntakeData = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    (calorieLogs || []).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfWeek) {
        let dayIdx = logDate.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        data[dayIdx] += Math.round(log.totalCalories || 0);
      }
    });
    return data;
  }, [calorieLogs]);

  const calorieGoal = 2000;

  // Compute 4-week grid from active dates back from current week's Monday
  const streakHeatmapData = useMemo(() => {
    const allLogs = [...(sessionLogs || []), ...(workoutSessionLogs || [])];
    const activeDates = new Set(allLogs.map(log => new Date(log.date).toDateString()));
    const result = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    const currentDay = today.getDay();
    const diffToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() + diffToMon);

    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(startOfThisWeek);
      weekStart.setDate(startOfThisWeek.getDate() - w * 7);
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dDate = new Date(weekStart);
        dDate.setDate(weekStart.getDate() + d);
        week.push(activeDates.has(dDate.toDateString()));
      }
      result.push(week);
    }
    const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    console.log("[Dashboard] Sunday Metrics State:", { 
      duration: weeklyExerciseData[6], 
      calories: calorieBurnedData[6] 
    });

    return result;
  }, [sessionLogs, workoutSessionLogs, weeklyExerciseData, calorieBurnedData]);

  const consistencyScore = useMemo(() => {
    const totalActive = streakHeatmapData.flat().filter(Boolean).length;
    return Math.round((totalActive / 28) * 100);
  }, [streakHeatmapData]);

  const getAIInsight = () => {
    if (stats.streakCount >= 7) return { title: "Excellent Momentum!", text: `Your ${stats.streakCount}-day streak shows remarkable dedication. You're in the top 10% of consistent users!` };
    if (adherence.adherenceThisWeek < 50) return { title: "Optimize Rest Days", text: "Your calorie intake on rest days was 7% above goal. Consider reducing carb intake on rest days to maintain a deficit." };
    if (stats.streakCount >= 3) return { title: "Building Habits", text: "You're developing a solid routine! 3 more days to unlock the 7-day streak badge." };
    return { title: "Start Strong", text: "Begin your fitness journey today! Even 15 minutes of activity can boost your metabolism by 10%." };
  };

  const insight = getAIInsight();

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? "bg-[#0A0F1C] text-white" : "bg-gray-50 text-gray-900"}`}>
        <NavBar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#84CC16] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">Loading analytics...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? "bg-[#0A0F1C] text-white" : "bg-gray-50 text-gray-900"}`}>
      <NavBar />
      
      {/* Weekly Challenge Banner */}
      {stats?.weeklyChallenge?.title && (
        <div className="bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#A855F7] text-white p-3 font-bold text-center text-sm z-40 shadow-lg border-b border-[#22D3EE]/30 relative overflow-hidden group">
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center justify-center bg-white/20 p-1.5 rounded-lg animate-pulse">🏆</span>
            <span className="truncate">
              <span className="text-[#FACC15]">Active Weekly Challenge:</span> {stats.weeklyChallenge.title} — {stats.weeklyChallenge.progress || 0}/{stats.weeklyChallenge.target || 3} workouts!
            </span>
            {stats.weeklyChallenge.weekEndAt && (
              <span className="text-xs bg-black/30 border border-white/20 px-3 py-1 rounded-full shrink-0">
                Ends: {new Date(stats.weeklyChallenge.weekEndAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      <main className="flex-grow">
        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-8 h-8 text-[#84CC16]" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">FitSync</h1>
                </div>
                <p className="text-gray-400">Smart Analytics Dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => load(false)}
                  className="p-2 rounded-xl bg-[#1F2937] border border-[#374151] text-gray-400 hover:text-white transition-all overflow-hidden relative group"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#84CC16]/10 border border-[#84CC16]/30">
                  <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
                  <span className="text-sm text-[#84CC16] font-medium">AI-Powered</span>
                </div>
              </div>
            </div>

            {/* Primary Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Calories Burned */}
              <div className={`relative rounded-2xl p-5 transition-all group border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#84CC16]/10 group-hover:bg-[#84CC16]/20 transition-colors">
                    <Flame className="w-5 h-5 text-[#84CC16]" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] font-semibold flex items-center gap-1">
                    <FaArrowUp className="w-2 h-2" /> 12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={caloriesBurned} />
                </div>
                <p className="text-sm text-gray-400">Calories Burned</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>

              {/* Workouts */}
              <div className={`relative rounded-2xl p-5 transition-all group border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#84CC16]/10 group-hover:bg-[#84CC16]/20 transition-colors">
                    <Dumbbell className="w-5 h-5 text-[#84CC16]" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] font-semibold flex items-center gap-1">
                    <FaArrowUp className="w-2 h-2" /> 20%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={workoutsThisWeek} />
                </div>
                <p className="text-sm text-gray-400">Workouts</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>

              {/* Day Streak */}
              <div className={`relative rounded-2xl p-5 transition-all group border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#F97316]/10 group-hover:bg-[#F97316]/20 transition-colors">
                    <Zap className="w-5 h-5 text-[#F97316]" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={stats.streakCount || 0} />
                </div>
                <p className="text-sm text-gray-400">Day Streak</p>
                <p className="text-xs text-[#F97316] mt-1">Keep going! 🔥</p>
              </div>

              {/* Consistency Score */}
              <div className={`relative rounded-2xl p-5 transition-all group border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#EC4899]/10 group-hover:bg-[#EC4899]/20 transition-colors">
                    <Heart className="w-5 h-5 text-[#EC4899]" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] font-semibold flex items-center gap-1">
                    <FaArrowUp className="w-2 h-2" /> 3%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {consistencyScore}<span className="text-lg">%</span>
                </div>
                <p className="text-sm text-gray-400">Consistency Score</p>
                <p className="text-xs text-gray-500 mt-1">Last 4 weeks</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Weekly Exercise Chart */}
              <div className={`lg:col-span-2 rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <WeeklyBarChart 
                  data={weeklyExerciseData} 
                  title="Weekly Exercise" 
                  icon={Dumbbell}
                  yAxisLabel="m"
                />
              </div>

              {/* Weekly Goal */}
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-[#84CC16]" />
                  <h3 className="text-lg font-semibold text-white">Weekly Goal</h3>
                </div>
                
                <div className="flex justify-center mb-6">
                  <CircularProgress percentage={weeklyGoalPercent} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className={`text-center p-3 rounded-xl border ${darkMode ? 'bg-[#1F2937]/50 border-[#374151]' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xl font-bold text-white">
                      {Math.round(weeklyExerciseData.reduce((a, b) => a + b, 0))}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Minutes</div>
                  </div>
                  <div className={`text-center p-3 rounded-xl border ${darkMode ? 'bg-[#1F2937]/50 border-[#374151]' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xl font-bold text-white">
                      {workoutsThisWeek}/7
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Workouts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Calorie Intake Chart */}
              <div className={`lg:col-span-2 rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <CalorieBarChart 
                  intakeData={calorieIntakeData}
                  burnedData={calorieBurnedData}
                />
              </div>

              {/* Streak Heatmap */}
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <StreakHeatmap activityData={streakHeatmapData} />
              </div>
            </div>

            {/* AI Insights Section */}
            <div className={`rounded-2xl p-6 mb-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#84CC16]/10">
                  <Brain className="w-5 h-5 text-[#84CC16]" />
                </div>
                <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse ml-1" />
              </div>
              
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937]/30 border-[#374151]/50' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#F97316]/10 flex-shrink-0">
                    <FaLightbulb className="w-4 h-4 text-[#F97316]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-400">{insight.text}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Workout Plan Section */}
            {workoutPlan && (
              <div className={`rounded-2xl p-6 mb-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-[#3B82F6]/10">
                    <Dumbbell className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Active Workout Plan</h3>
                </div>
                
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937]/30 border-[#374151]/50' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{workoutPlan.name}</h4>
                      <p className="text-sm text-gray-400 capitalize">Goal: {workoutPlan.generatedParams?.fitnessGoal?.replace(/_/g, ' ') || 'N/A'}</p>
                    </div>
                    <div className="flex-1 max-w-xs w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-[#3B82F6] font-semibold">{workoutPlan.completedDayCount || 0} days</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full bg-[#3B82F6] transition-all duration-500" 
                          style={{ width: `${Math.min(100, ((workoutPlan.completedDayCount || 0) / (workoutPlan.generatedParams?.daysPerWeek * workoutPlan.durationWeeks || 28)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Section: BMI Trend + Quick Actions + Badges */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* BMI Trend */}
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                {bmiHistory.length > 0 ? (
                  <BMITrendChart bmiHistory={bmiHistory} />
                ) : (
                  <div className="text-center py-8">
                    <Scale className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No BMI data yet</p>
                    <button 
                      onClick={() => navigate('/CurrentBMI')}
                      className="px-4 py-2 rounded-lg bg-[#84CC16] text-black text-sm font-semibold hover:bg-[#A3E635] transition-colors"
                    >
                      Calculate BMI
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#FACC15]" />
                  <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: FaRuler, label: 'BMI', path: '/CurrentBMI', color: 'bg-[#EC4899]' },
                    { icon: FaDumbbell, label: 'Workout', path: '/Workout', color: 'bg-[#3B82F6]' },
                    { icon: FaUtensils, label: 'Diet', path: '/diet-chart', color: 'bg-[#F97316]' },
                    { icon: FaBolt, label: 'Posture coach', path: '/VirtualTA', color: 'bg-[#22C55E]' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(action.path)}
                      className={`${action.color} p-3 rounded-xl text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm`}
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[#FACC15]" />
                  <h3 className="text-lg font-semibold text-white">Badges</h3>
                </div>
                
                {/* Leaderboard/Rank Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl bg-[#1F2937]/30 border border-[#374151]/30">
                  {leaderboardRank === 0 && <GamifyBadge type="top1" />}
                  {leaderboardRank > 0 && leaderboardRank < 10 && <GamifyBadge type="top10" />}
                  {leaderboardRank >= 10 && leaderboardRank < 50 && <GamifyBadge type="top50" />}
                  {(stats.streakCount || 0) >= 7 && <GamifyBadge type="beast" />}
                  {!(leaderboardRank >= 0 && leaderboardRank < 50) && !((stats.streakCount || 0) >= 7) && (
                    <span className="text-xs text-gray-400">No leaderboard badges yet</span>
                  )}
                </div>

                {(stats.badges || []).length > 0 ? (
                  <div className="space-y-2">
                    {(stats.badges || []).slice(0, 3).map((badge, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#1F2937]/50 border border-[#FACC15]/20">
                        <FaTrophy className="w-4 h-4 text-[#FACC15]" />
                        <span className="text-sm text-white font-medium">{badge}</span>
                      </div>
                    ))}
                    <button 
                      onClick={() => navigate('/leaderboard')}
                      className="w-full py-2 text-sm text-[#84CC16] hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">Complete challenges to earn badges!</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
