import React, { useState, useEffect, useRef } from "react";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from "../../context/ThemeContext";
import { Footprints, Flame, MapPin, Timer as TimerIcon, Sparkles, Play, Square } from "lucide-react";

// Simple PWA-friendly step tracker:
// - Uses phone accelerometer (DeviceMotion) in browser
// - Tracks walking-only steps, duration, distance, calories
// - Persists today's steps + duration in localStorage and auto-resets each new day

const STORAGE_KEY = "daily_steps_tracker_v1";
const STEP_LENGTH_M = 0.78; // average stride length in meters
const CALORIES_PER_STEP = 0.04; // approx kcal per step for walking

const loadTodayState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { steps: 0, durationSeconds: 0 };
    const parsed = JSON.parse(raw);
    const todayKey = new Date().toISOString().slice(0, 10);
    if (parsed?.date === todayKey) {
      return {
        steps: typeof parsed.steps === "number" ? parsed.steps : 0,
        durationSeconds:
          typeof parsed.durationSeconds === "number" ? parsed.durationSeconds : 0,
      };
    }
    return { steps: 0, durationSeconds: 0 };
  } catch {
    return { steps: 0, durationSeconds: 0 };
  }
};

const saveTodayState = (steps, durationSeconds) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey, steps, durationSeconds })
    );
  } catch {
    // ignore storage errors (private / full storage)
  }
};

const formatDuration = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const DailyStepsTracker = () => {
  const { darkMode } = useTheme();
  const initial = loadTodayState();

  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(initial.steps);
  const [durationSeconds, setDurationSeconds] = useState(initial.durationSeconds);
  const [activity, setActivity] = useState("Idle");
  const [sensorError, setSensorError] = useState("");

  const lastAccelMagRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const timerIdRef = useRef(null);
  const motionHandlerRef = useRef(null);

  const distanceKm = Number(((steps * STEP_LENGTH_M) / 1000).toFixed(2));
  const calories = Number((steps * CALORIES_PER_STEP).toFixed(1));

  // Persist today's state whenever steps or duration change
  useEffect(() => {
    saveTodayState(steps, durationSeconds);
  }, [steps, durationSeconds]);

  const startTimer = () => {
    if (timerIdRef.current) return;
    timerIdRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const startTracking = async () => {
    setSensorError("");
    if (typeof window === "undefined" || typeof window.addEventListener === "undefined") {
      setSensorError("Motion sensors are not available in this environment.");
      return;
    }

    const DeviceMotion = window.DeviceMotionEvent || window.webkitDeviceMotionEvent;
    if (typeof DeviceMotion === "undefined") {
      setSensorError("Motion sensors not supported on this device.");
      return;
    }

    // iOS permission flow
    if (typeof DeviceMotion.requestPermission === "function") {
      try {
        const permission = await DeviceMotion.requestPermission();
        if (permission !== "granted") {
          setSensorError("Motion permission denied.");
          return;
        }
      } catch (error) {
        console.error("Motion permission error:", error);
        setSensorError("Failed to request motion permission.");
        return;
      }
    }

    lastAccelMagRef.current = 0;
    lastStepTimeRef.current = 0;
    setIsTracking(true);
    setActivity("Walking");
    startTimer();

    motionHandlerRef.current = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const diff = Math.abs(mag - lastAccelMagRef.current);
      lastAccelMagRef.current = mag;

      const now = event.timeStamp || Date.now();
      const sinceLast = now - lastStepTimeRef.current;

      // Heuristic tuned for walking:
      // - diff > 2.2: noticeable impact
      // - 300ms < interval < 2000ms: realistic step timing
      if (diff > 2.2 && sinceLast > 300 && sinceLast < 2000) {
        lastStepTimeRef.current = now;
        setSteps((prev) => prev + 1);
      }
    };

    window.addEventListener("devicemotion", motionHandlerRef.current);
  };

  const stopTracking = () => {
    setIsTracking(false);
    setActivity("Idle");
    stopTimer();
    if (motionHandlerRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
  };

  const resetToday = () => {
    setSteps(0);
    setDurationSeconds(0);
    setActivity("Idle");
    setSensorError("");
    stopTracking();
    saveTodayState(0, 0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (motionHandlerRef.current) {
        window.removeEventListener("devicemotion", motionHandlerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? "bg-[#05010d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <NavBar />

      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl ${darkMode ? 'opacity-30' : 'opacity-10'}`} />
            <div className={`absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl ${darkMode ? 'opacity-25' : 'opacity-10'}`} />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8 lg:mb-10">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                <span className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                  PWA Daily Walking Tracker
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Daily Steps
                </span>{" "}
                (Walking)
              </h1>
              <p className={`max-w-3xl mx-auto text-sm sm:text-base lg:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Start tracking and walk with your phone in your pocket. Designed for{" "}
                <span className="font-semibold text-[#22D3EE]">PWA</span> use on mobile.
              </p>
            </header>

            {/* Controls */}
            <div className="flex justify-center gap-3 flex-wrap mb-6 sm:mb-8">
              <button
                onClick={startTracking}
                disabled={isTracking}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] text-white font-semibold hover:opacity-95 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-[#22D3EE]/40"
              >
                <Play size={18} /> {isTracking ? "Tracking…" : "Start Walking"}
              </button>

              <button
                onClick={stopTracking}
                disabled={!isTracking}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-red-500/90 hover:bg-red-500 text-white font-semibold disabled:opacity-50 transition border border-white/10"
              >
                <Square size={18} /> Stop
              </button>

              <button
                onClick={resetToday}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/5 text-gray-200 font-semibold hover:bg:white/10 transition border border-white/10"
              >
                Reset Today
              </button>
            </div>

            {sensorError && (
              <div className="mb-4 text-center text-xs text-red-400 max-w-xl mx-auto">
                {sensorError}
              </div>
            )}

            {isTracking && (
              <div className={`relative rounded-2xl border backdrop-blur-xl p-5 sm:p-6 text-center mb-6 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white shadow-lg'}`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <p className="text-emerald-400 font-semibold animate-pulse text-sm sm:text-base">
                  Tracking walking steps in real time…
                </p>
              </div>
            )}

            {/* Stats cards */}
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10 sm:mb-12">
              <StatCard
                icon={<Footprints size={24} />}
                title="Steps Today"
                value={steps}
                color="text-[#22D3EE]"
              />
              <StatCard
                icon={<TimerIcon size={24} />}
                title="Active Time"
                value={formatDuration(durationSeconds)}
                color="text-[#FACC15]"
              />
              <StatCard
                icon={<MapPin size={24} />}
                title="Distance"
                value={`${distanceKm} km`}
                color="text-[#8B5CF6]"
              />
              <StatCard
                icon={<Flame size={24} />}
                title="Calories Burned"
                value={`${calories} kcal`}
                color="text-[#F97316]"
              />
            </div>

            {/* Activity info */}
            <div className={`relative rounded-2xl border backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white shadow-lg hover:shadow-xl'}`}>
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
              <h2 className={`text-lg sm:text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Walking activity only
              </h2>
              <p className={`text-sm sm:text-base mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                This tracker is tuned for <span className="font-semibold">walking</span> with
                your phone in your hand or pocket. It ignores most tiny shakes and counts only
                realistic step impacts.
              </p>
              <ul className={`text-sm sm:text-base space-y-2 list-disc list-inside ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>For best accuracy, keep the phone near your body while walking.</li>
                <li>Short tests (1–2 minutes) may vary; longer walks give more accurate counts.</li>
                <li>Steps, time, distance, and calories are saved for today and reset each day.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  // Note: StatCard needs its own useTheme since it's a separate component
  const { darkMode } = useTheme();
  return (
  <article className={`relative h-full rounded-2xl border backdrop-blur-xl p-5 sm:p-6 flex flex-col transition-transform duration-300 hover:-translate-y-1.5 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white shadow-lg hover:shadow-xl hover:border-[#8B5CF6]/40'}`}>
    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl border ${darkMode ? 'bg-[#020617] border-[#1F2937]' : 'bg-gray-50 border-gray-200'}`}>
          <div className={color || "text-[#22D3EE]"}>{icon}</div>
        </div>
        <span className="text-xs uppercase tracking-[0.18em] text-gray-400">
          {title}
        </span>
      </div>
    </div>
    <p className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
      {value}
    </p>
  </article>
  );
};

export default DailyStepsTracker;

