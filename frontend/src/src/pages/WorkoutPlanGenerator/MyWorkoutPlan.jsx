import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiEdit2,
  FiTrash2,
  FiActivity,
  FiArrowLeft,
  FiClock,
  FiPlay,
  FiX,
} from "react-icons/fi";
import { FaDumbbell, FaCheckCircle, FaRegCircle, FaTimesCircle } from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Sparkles } from 'lucide-react';

const MyWorkoutPlan = () => {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [activePlan, setActivePlan] = useState(null);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [workoutSessionLogs, setWorkoutSessionLogs] = useState([]); // New state for session logs
  const [activeTab, setActiveTab] = useState("active-pending"); // 'active-pending' or 'completed'
  const [todayWorkout, setTodayWorkout] = useState(null); // Today's scheduled workout
  const [nextWorkoutDate, setNextWorkoutDate] = useState(null); // Next workout date
  const [missedWorkouts, setMissedWorkouts] = useState(0); // Count of missed workouts
  const [missedWorkoutDetails, setMissedWorkoutDetails] = useState([]); // Details of missed workouts
  const processedMarkCompleteRef = useRef(false);
  const [planDeleteId, setPlanDeleteId] = useState(null);
  const [planActionNotice, setPlanActionNotice] = useState(null);
  const [skipDayLoading, setSkipDayLoading] = useState(false);

  // When returning from Virtual TA with "mark complete", mark the exercise once and clear state
  const pendingMarkComplete = location.state?.markExerciseComplete && location.state?.exerciseName;
  useEffect(() => {
    if (!pendingMarkComplete) {
      processedMarkCompleteRef.current = false;
      return;
    }
    if (!user || !activePlan) return;
    if (processedMarkCompleteRef.current) return;
    processedMarkCompleteRef.current = true;
    const state = location.state;
    let cancelled = false;
    (async () => {
      try {
        await handleToggleExercise(
          state.dayIndex,
          state.weekNumber,
          state.exerciseName,
          state.sets,
          state.reps,
          state.weight,
          false,
          true, // silentRefresh: no loading blink, single refresh
          state.durationMinutes || 0, // Pass duration back from VTA!
          state.calories || 0 // Pass calories back!
        );
        if (!cancelled) navigate("/my-workout-plan", { replace: true, state: {} });
      } catch (_) {
        processedMarkCompleteRef.current = false;
        // handleToggleExercise already sets planActionNotice on error
      }
    })();
    return () => { cancelled = true; };
  }, [pendingMarkComplete, user, activePlan]);

  // Fetch plans only when user id changes (not on every location/navigate change)
  useEffect(() => {
    if (user?._id) {
      fetchPlans();
      fetchTodayWorkout();
    } else {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!planActionNotice) return;
    const t = setTimeout(() => setPlanActionNotice(null), 8000);
    return () => clearTimeout(t);
  }, [planActionNotice]);

  // Fetch today's workout only
  const fetchTodayWorkout = async () => {
    if (!user?._id) return;
    
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/today/${user._id}`
      );
      if (res.data.success) {
        setTodayWorkout(res.data.todayWorkout);
        setNextWorkoutDate(res.data.nextWorkoutDate);
        setMissedWorkouts(res.data.missedWorkouts || 0);
        setMissedWorkoutDetails(res.data.missedWorkoutDetails || []);
      }
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        console.error("Error fetching today's workout:", err);
      }
      setTodayWorkout(null);
    }
  };

  const handleSkipToday = async (reason) => {
    if (!user?._id) return;
    setSkipDayLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/skip-today`,
        { userId: user._id, reason }
      );
      if (res.data?.success) {
        setPlanActionNotice({ type: "success", text: res.data.message || "Updated." });
        await fetchTodayWorkout();
        await fetchPlans(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Could not update today.";
      setPlanActionNotice({ type: "error", text: msg });
    } finally {
      setSkipDayLoading(false);
    }
  };

  const handleUnskipToday = async () => {
    if (!user?._id) return;
    setSkipDayLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/unskip-today`,
        { userId: user._id }
      );
      if (res.data?.success) {
        setPlanActionNotice({ type: "success", text: res.data.message || "Today's workout is back on." });
        await fetchTodayWorkout();
        await fetchPlans(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Could not undo.";
      setPlanActionNotice({ type: "error", text: msg });
    } finally {
      setSkipDayLoading(false);
    }
  };

  const fetchPlans = async (silent = false) => {
    if (!user?._id) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const activeRes = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/active/${user._id}`
      );
      console.log("Fetched active plan response:", activeRes.data);
      setActivePlan(activeRes.data.plan);
      setWorkoutSessionLogs(activeRes.data.sessionLogs || []); // Set session logs
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setActivePlan(null);
      } else {
        console.error("Error fetching active plan:", err);
        setError("Failed to load active workout plan.");
      }
    }

    try {
      const historyRes = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/history/${user._id}`
      );
      setHistoryPlans(historyRes.data.history);
    } catch (err) {
      console.error("Error fetching history plans:", err);
      setError((prev) => prev || "Failed to load workout plan history."); // Only set if not already set
    }
    if (!silent) setLoading(false);
  };

  const handleEditClick = (plan) => {
    setEditingPlanId(plan._id);
    setNewPlanName(plan.name);
    setNewPlanDescription(plan.description || "");
  };

  const handleSaveEdit = async (planId) => {
    if (!newPlanName.trim()) {
      setPlanActionNotice({
        type: "error",
        text: "Plan name cannot be empty.",
      });
      return;
    }
    try {
      const res = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/update/${planId}`,
        {
          name: newPlanName,
          description: newPlanDescription,
        }
      );
      if (res.data.success) {
        setPlanActionNotice({
          type: "success",
          text: "Plan updated successfully.",
        });
        fetchPlans(); // Refresh plans
        setEditingPlanId(null);
      } else {
        setPlanActionNotice({
          type: "error",
          text: "Failed to update plan.",
        });
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      setPlanActionNotice({
        type: "error",
        text: "Failed to update plan.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setNewPlanName("");
    setNewPlanDescription("");
  };

  const handleDeletePlan = (planId) => {
    setPlanDeleteId(planId);
  };

  const confirmDeletePlan = async () => {
    if (!planDeleteId) return;
    const planId = planDeleteId;
    setPlanDeleteId(null);
    try {
      const res = await axios.delete(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/delete/${planId}`
      );
      if (res.data.success) {
        setPlanActionNotice({
          type: "success",
          text: "Workout plan deleted successfully.",
        });
        fetchPlans();
      } else {
        setPlanActionNotice({
          type: "error",
          text: "Failed to delete workout plan.",
        });
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      setPlanActionNotice({
        type: "error",
        text: "Failed to delete workout plan.",
      });
    }
  };

  const handleActivatePlan = async (planId) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/update/${planId}`,
        {
          isActive: true,
        }
      );
      if (res.data.success) {
        setPlanActionNotice({
          type: "success",
          text: "Plan set as active.",
        });
        fetchPlans(); // Refresh plans to show new active plan
      } else {
        setPlanActionNotice({
          type: "error",
          text: "Failed to activate plan.",
        });
      }
    } catch (err) {
      console.error("Error activating plan:", err);
      setPlanActionNotice({
        type: "error",
        text: "Failed to activate plan.",
      });
    }
  };

  // Handle toggle exercise for today's workout. silentRefresh = true when returning from VTA to avoid loading blink and duplicate fetches.
  const handleToggleExercise = async (
    dayIndex,
    weekNumber,
    exerciseName,
    sets,
    reps,
    weight,
    isCompleted,
    silentRefresh = false,
    passedDurationMinutes = 0,
    passedCalories = 0 // Added!
  ) => {
    if (!user || !activePlan) {
      setPlanActionNotice({
        type: "error",
        text: "Please log in and have an active plan to mark exercises.",
      });
      return;
    }

    const currentWeekNumber = weekNumber || activePlan.currentWeek || 1;
    const dayPlan = activePlan.planContent[dayIndex];
    
    // Find existing log
    let existingLog = workoutSessionLogs.find(
      (log) =>
        log.workoutPlanId === activePlan._id &&
        log.weekNumber === currentWeekNumber &&
        log.dayIndex === dayIndex
    );

    let updatedWorkoutDetails;
    if (existingLog) {
      updatedWorkoutDetails = existingLog.workoutDetails.map((ex) =>
        ex.exerciseName === exerciseName
          ? { ...ex, completed: !isCompleted }
          : ex
      );
      // If exercise not in log, add it
      if (!updatedWorkoutDetails.some((ex) => ex.exerciseName === exerciseName)) {
        updatedWorkoutDetails.push({
          exerciseName: exerciseName,
          sets: sets,
          reps: reps,
          weight: weight || "N/A",
          notes: "",
          completed: !isCompleted,
        });
      }
    } else {
      // Create new workout details
      updatedWorkoutDetails = dayPlan.exercises.map((ex) => ({
        exerciseName: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || "N/A",
        notes: "",
        completed: ex.name === exerciseName ? !isCompleted : false,
      }));
    }

    const allExercisesCompletedForDay = updatedWorkoutDetails.every(
      (ex) => ex.completed
    );

    try {
      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-session/log`,
        {
          userId: user._id,
          workoutPlanId: activePlan._id,
          date: new Date(),
          dayIndex,
          weekNumber: currentWeekNumber,
          workoutDetails: updatedWorkoutDetails,
          overallNotes: existingLog?.overallNotes || "",
          perceivedExertion: existingLog?.perceivedExertion || 5,
          durationMinutes: Math.max(0, (existingLog?.durationMinutes || 0) + (passedDurationMinutes || 0) + (!passedDurationMinutes && !passedCalories ? (!isCompleted ? 10 : -10) : 0)),
          calories: Math.max(0, (existingLog?.calories || 0) + (passedCalories || 0) + (!passedDurationMinutes && !passedCalories ? (!isCompleted ? 60 : -60) : 0)), // Added!
          isDayCompleted: allExercisesCompletedForDay,
        }
      );

      if (res.data.success) {
        setPlanActionNotice({
          type: "success",
          text: `Exercise '${exerciseName}' ${!isCompleted ? "completed" : "unmarked"}.`,
        });
        if (silentRefresh) {
          await fetchPlans(true);
          await fetchTodayWorkout();
        } else {
          await fetchPlans();
          await fetchTodayWorkout();
        }
      }
      return res;
    } catch (err) {
      console.error("Error toggling exercise:", err);
      setPlanActionNotice({
        type: "error",
        text: "Failed to update exercise completion.",
      });
      throw err;
    }
  };

  // Mark entire workout as complete
  const handleCompleteWorkout = async () => {
    if (!user || !activePlan || !todayWorkout) {
      setPlanActionNotice({
        type: "error",
        text: "No workout available to complete.",
      });
      return;
    }

    if (todayWorkout.isCompleted) {
      setPlanActionNotice({
        type: "info",
        text: "Workout is already completed.",
      });
      return;
    }

    const dayPlan = activePlan.planContent[todayWorkout.dayIndex];
    const currentWeekNumber = todayWorkout.weekNumber;
    
    // Mark all exercises as completed
    const allExercisesCompleted = dayPlan.exercises.map((ex) => ({
      exerciseName: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight || "N/A",
      notes: "",
      completed: true,
    }));

    try {
      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-session/log`,
        {
          userId: user._id,
          workoutPlanId: activePlan._id,
          date: new Date(),
          dayIndex: todayWorkout.dayIndex,
          weekNumber: currentWeekNumber,
          workoutDetails: allExercisesCompleted,
          overallNotes: "",
          perceivedExertion: 5,
          durationMinutes: dayPlan.exercises.length * 10,
          calories: dayPlan.exercises.length * 60,
        }
      );

      if (res.data.success) {
        setPlanActionNotice({
          type: "success",
          text: "Workout completed. Great job!",
        });
        fetchPlans();
        fetchTodayWorkout();
      }
    } catch (err) {
      console.error("Error completing workout:", err);
      setPlanActionNotice({
        type: "error",
        text: "Failed to complete workout.",
      });
    }
  };

  const handleExerciseCompletionToggle = async (
    dayPlan,
    dayIndex,
    exerciseName,
    isCompleted,
    weekNumber
  ) => {
    if (!user || !activePlan) {
      setPlanActionNotice({
        type: "error",
        text: "Please log in and have an active plan to mark exercises.",
      });
      return;
    }

    // The weekNumber is now passed as an argument directly, or default to currentWeek from activePlan
    const currentWeekNumber =
      weekNumber !== undefined ? weekNumber : activePlan.currentWeek || 1;

    // Find existing log or prepare initial data
    let existingLog = workoutSessionLogs.find(
      (log) =>
        log.workoutPlanId === activePlan._id &&
        log.weekNumber === currentWeekNumber &&
        log.dayIndex === dayIndex
    );

    let updatedWorkoutDetails;
    if (existingLog) {
      updatedWorkoutDetails = existingLog.workoutDetails.map((ex) =>
        ex.exerciseName === exerciseName
          ? { ...ex, completed: isCompleted }
          : ex
      );
      // If the exercise wasn't in the log before, add it (shouldn't happen with planned exercises)
      if (
        !updatedWorkoutDetails.some((ex) => ex.exerciseName === exerciseName)
      ) {
        const plannedEx = dayPlan.exercises.find(
          (ex) => ex.name === exerciseName
        );
        if (plannedEx) {
          updatedWorkoutDetails.push({
            ...plannedEx,
            completed: isCompleted,
            notes: "",
            weight: plannedEx.weight || "N/A",
          });
        }
      }
    } else {
      // Create new workout details based on the dayPlan, with the toggled exercise updated
      updatedWorkoutDetails = dayPlan.exercises.map((ex) => ({
        exerciseName: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: "",
        completed: ex.name === exerciseName ? isCompleted : false,
      }));
    }

    // Calculate if all exercises for the current day are completed
    const allExercisesCompletedForDay = updatedWorkoutDetails.every(
      (ex) => ex.completed
    );

    try {
      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-session/log`,
        {
          userId: user._id,
          workoutPlanId: activePlan._id,
          date: new Date(),
          dayIndex,
          weekNumber: currentWeekNumber, // Ensure weekNumber is sent with the log
          workoutDetails: updatedWorkoutDetails,
          overallNotes: existingLog?.overallNotes || "",
          perceivedExertion: existingLog?.perceivedExertion || 5,
          durationMinutes: Math.max(0, (existingLog?.durationMinutes || 0) + (isCompleted ? 10 : -10)),
          calories: Math.max(0, (existingLog?.calories || 0) + (isCompleted ? 60 : -60)),
          isDayCompleted: allExercisesCompletedForDay, // Send completion status of the day
        }
      );

      if (res.data.success) {
        setPlanActionNotice({
          type: "success",
          text: `Exercise '${exerciseName}' ${
            isCompleted ? "completed" : "unmarked"
          }.`,
        });
        fetchPlans(); // Refresh plans to update UI with latest completion status
        fetchTodayWorkout(); // Refresh today's workout to update completion status
      } else {
        setPlanActionNotice({
          type: "error",
          text: "Failed to update exercise completion.",
        });
      }
    } catch (err) {
      console.error("Error toggling exercise completion:", err);
      setPlanActionNotice({
        type: "error",
        text: "Failed to update exercise completion.",
      });
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${
        darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <NavBar />
        <div className="flex flex-col items-center justify-center flex-grow px-4">
          <div className="relative">
            <div className="rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-75"></div>
            </div>
          </div>
          <p className="mt-6 text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-semibold">
            Loading your workout plans...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col ${
        darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <NavBar />
        <div className="flex flex-col items-center justify-center min-h-screen text-red-400 p-4 sm:p-6">
          <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 rounded-2xl p-8 sm:p-12 max-w-md w-full shadow-2xl">
            <FaTimesCircle className="text-5xl sm:text-6xl mb-4 mx-auto" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Error Loading Plans</h2>
            <p className="text-base sm:text-lg text-center mb-6">{error}</p>
            <button
              onClick={fetchPlans}
              className="w-full bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105 shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
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
                  Your Plans
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                My{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Workout Plans
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300">
                Manage your active and completed workout plans. Track progress and stay consistent.
              </p>
            </header>
          </div>

          <div className="relative z-10 container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/workout")}
            className="mb-6 sm:mb-8 flex items-center text-purple-400 hover:text-purple-300 transition group"
          >
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            <span className="font-medium">Back to Generator</span>
          </button>

          {planActionNotice && (
            <div
              className={`mb-6 rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 shadow-lg ${
                planActionNotice.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/35 text-emerald-100"
                  : planActionNotice.type === "info"
                    ? "bg-sky-950/40 border-sky-500/35 text-sky-100"
                    : "bg-red-950/40 border-red-500/35 text-red-100"
              }`}
              role="status"
            >
              <p className="text-sm leading-relaxed pr-2">{planActionNotice.text}</p>
              <button
                type="button"
                onClick={() => setPlanActionNotice(null)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <FiX className="w-4 h-4 opacity-80" />
              </button>
            </div>
          )}

          {/* <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient">
              My Workout Plans
            </h1>
            <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              View your active plan, track your progress, and manage your
              workout history.
            </p>
          </div> */}

          {/* Tabs for Active/Pending and Completed Plans */}
          <div className="flex justify-center mb-6 sm:mb-8 px-4">
className={`inline-flex rounded-2xl backdrop-blur-xl p-1.5 shadow-xl border ${darkMode ? 'bg-[#020617]/80 border-[#1F2937]' : 'bg-white border-gray-200'}`}
              <button
                onClick={() => setActiveTab("active-pending")}
                className={`py-2.5 sm:py-3 px-4 sm:px-8 text-sm sm:text-lg font-medium rounded-xl transition-all duration-300 transform
                ${
                  activeTab === "active-pending"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                    ? "text-blue-600 bg-blue-50 font-semibold" : (darkMode ? "text-gray-300 hover:text-white hover:bg-[#020617]/60" : "text-gray-600 hover:bg-gray-100")
                }`}
              >
                <span className="hidden sm:inline">Active & Pending Plans</span>
                <span className="sm:hidden">Active</span>
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`py-2.5 sm:py-3 px-4 sm:px-8 text-sm sm:text-lg font-medium rounded-xl transition-all duration-300 transform
                ${
                  activeTab === "completed"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                    ? "text-blue-600 bg-blue-50 font-semibold" : (darkMode ? "text-gray-300 hover:text-white hover:bg-[#020617]/60" : "text-gray-600 hover:bg-gray-100")
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Conditional Rendering based on Active Tab */}
          {activeTab === "active-pending" && (
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center text-white px-4">
                <FiActivity className="mr-3 text-purple-400" /> Active Plan
              </h2>
              {activePlan && !activePlan.completed ? (
                <div className={`relative rounded-2xl sm:rounded-3xl border backdrop-blur-xl overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.8)] ${darkMode ? 'border-[#1F2937] bg-[#020617]/80' : 'border-gray-200 bg-white'}`}>
                  <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 p-4 sm:p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex-1">
                        {editingPlanId === activePlan._id ? (
                          <input
                            type="text"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            className={`backdrop-blur-sm p-2 sm:p-3 rounded-xl w-full border focus:border-purple-400 focus:outline-none transition ${darkMode ? 'bg-[#020617]/80 text-white border-[#1F2937]' : 'bg-white text-gray-900 border-gray-300'}`}
                          />
                        ) : (
                          <h3 className="text-xl sm:text-2xl font-bold">
                            {activePlan.name}
                          </h3>
                        )}
                        {editingPlanId === activePlan._id ? (
                          <input
                            type="text"
                            value={newPlanDescription}
                            onChange={(e) =>
                              setNewPlanDescription(e.target.value)
                            }
                            className={`backdrop-blur-sm p-2 sm:p-3 rounded-xl mt-2 block w-full border focus:border-purple-400 focus:outline-none transition ${darkMode ? 'bg-[#020617]/80 text-white border-[#1F2937]' : 'bg-white text-gray-900 border-gray-300'}`}
                            placeholder="Plan description"
                          />
                        ) : (
                          activePlan.description && (
                            <p className="text-purple-100 mt-1 text-sm sm:text-base">
                              {activePlan.description}
                            </p>
                          )
                        )}
                        <p className="text-purple-200 text-xs sm:text-sm mt-2">
                          Generated on:{" "}
                          {new Date(activePlan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 sm:space-x-3 justify-end">
                        {editingPlanId === activePlan._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(activePlan._id)}
                              className="p-2 sm:p-3 bg-green-500 rounded-xl hover:bg-green-600 transition transform hover:scale-110 shadow-lg"
                              title="Save Changes"
                            >
                              <FaCheckCircle className="text-base sm:text-lg" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 sm:p-3 bg-red-500 rounded-xl hover:bg-red-600 transition transform hover:scale-110 shadow-lg"
                              title="Cancel Edit"
                            >
                              <FaTimesCircle className="text-base sm:text-lg" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditClick(activePlan)}
                            className="p-2 sm:p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition transform hover:scale-110 shadow-lg border border-white/20"
                            title="Edit Plan Name/Description"
                          >
                            <FiEdit2 className="text-base sm:text-lg" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                    <div className="rounded-xl sm:rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 sm:p-5">
                      <h4 className="text-cyan-200 font-bold text-sm sm:text-base mb-1 flex items-center gap-2">
                        <FiClock className="text-cyan-400" />
                        Rest &amp; deload
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 mb-3 leading-relaxed">
                        Coaching tips only — the app does not auto-adjust your plan. Use lighter loads or fewer sets in the gym when you need recovery.
                      </p>
                      <ul className="text-xs sm:text-sm text-gray-300 space-y-1.5 list-disc pl-4 marker:text-cyan-500/80 mb-3">
                        <li>After 2–3 heavy weeks, use a deload: same exercises, ~10–20% less weight or one fewer set.</li>
                        <li>Poor sleep or high stress? Cut session volume ~30% instead of skipping entirely.</li>
                        <li>
                          {
                            "Missed days? Pick up with today's session — avoid stacking every missed workout into one day."
                          }
                        </li>
                      </ul>
                      {todayWorkout ? (
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("my-plan-todays-workout")
                              ?.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                          className="text-xs sm:text-sm font-semibold text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 rounded-lg px-3 py-2 w-full sm:w-auto transition-colors hover:border-cyan-400/70 bg-cyan-950/30"
                        >
                          Jump to today&apos;s workout ↓
                        </button>
                      ) : null}
                    </div>
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-purple-500/20">
                      <p className="text-gray-200 mb-2 text-sm sm:text-base">
                        <span className="font-semibold text-purple-300">Plan Duration:</span>{" "}
                        {activePlan.durationWeeks} weeks (
                        {(activePlan?.generatedParams?.daysPerWeek ||
                          activePlan.planContent.length) *
                          activePlan.durationWeeks}{" "}
                        total workout days planned)
                      </p>
                      {(() => {
                        const daysPerWeek =
                          activePlan?.generatedParams?.daysPerWeek ||
                          activePlan.planContent.length;
                        const weekdaySets = {
                          3: ["Monday", "Wednesday", "Friday"],
                          4: ["Monday", "Tuesday", "Thursday", "Saturday"],
                          5: [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                          ],
                          6: [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ],
                        };
                        const fallback =
                          weekdaySets[daysPerWeek] ||
                          activePlan.planContent.map((d) => d.day);
                        const isWeekday = (name) =>
                          /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(
                            name || ""
                          );
                        const planHasWeekdays = activePlan.planContent.every(
                          (d) => isWeekday(d.day)
                        );
                        const scheduleDays = planHasWeekdays
                          ? activePlan.planContent.map((d) => d.day)
                          : fallback;
                        return (
                          <p className="text-gray-200 text-sm sm:text-base">
                            <span className="font-semibold text-purple-300">
                              Weekly Schedule:
                            </span>{" "}
                            {scheduleDays.join(", ")}
                          </p>
                        );
                      })()}
                    </div>
                    {/* Calculate totalLoggedDays and totalPlannedDays outside the map function */}
                    {(() => {
                      const daysPerWeek =
                        activePlan?.generatedParams?.daysPerWeek ||
                        activePlan.planContent.length;
                      const totalPlannedDays =
                        daysPerWeek * activePlan.durationWeeks;
                      const currentWeekNumber = activePlan.currentWeek || 1;
                      const completedDaysInPlan =
                        activePlan.dayCompletions || [];
                      const totalCompletedDays = completedDaysInPlan.length;

                      const currentWeekCompletions = completedDaysInPlan.filter(
                        (dc) => dc.weekNumber === currentWeekNumber
                      ).length;
                      const currentWeekProgressPercentage = Math.min(
                        100,
                        Math.round((currentWeekCompletions / daysPerWeek) * 100)
                      );

                      const overallProgressPercentage = Math.min(
                        100,
                        Math.round(
                          (totalCompletedDays / (totalPlannedDays || 1)) * 100
                        )
                      );

                      const currentWeekPlanContent =
                        activePlan.weeklyContentOverrides?.[
                          currentWeekNumber.toString()
                        ] || activePlan.planContent;

                      console.log(
                        "MyWorkoutPlan - currentWeekNumber:",
                        currentWeekNumber
                      );
                      console.log(
                        "MyWorkoutPlan - currentWeekPlanContent:",
                        currentWeekPlanContent
                      );
                      console.log(
                        "MyWorkoutPlan - workoutSessionLogs (overall):",
                        workoutSessionLogs
                      );

                      return (
                        <>
                          <div className={`mb-6 p-4 sm:p-6 backdrop-blur-xl rounded-xl sm:rounded-2xl border shadow-[0_18px_45px_rgba(15,23,42,0.8)] ${darkMode ? 'bg-[#020617]/80 border-[#1F2937]' : 'bg-white border-gray-200'}`}>
                            <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                              Week {currentWeekNumber} of{" "}
                              {activePlan.durationWeeks}
                            </h4>
                            <p className="text-gray-200 text-xs sm:text-sm mb-3">
                              Progress this week:{" "}
                              <span className="font-bold text-purple-400">
                                {currentWeekCompletions}
                              </span>{" "}
                              out of{" "}
                              <span className="font-bold text-white">
                                {daysPerWeek}
                              </span>{" "}
                              days completed ({currentWeekProgressPercentage}%)
                            </p>
                            <div className={`w-full h-3 rounded-full overflow-hidden border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                                style={{
                                  width: `${currentWeekProgressPercentage}%`,
                                }}
                              />
                            </div>
                            {currentWeekNumber < activePlan.durationWeeks &&
                              currentWeekCompletions === daysPerWeek && (
                                <p className="text-xs sm:text-sm text-green-300 mt-3 flex items-center">
                                  <FaCheckCircle className="mr-2" />
                                  Week {currentWeekNumber} completed! Next
                                  week's plan is ready.
                                </p>
                              )}
                          </div>

                          {/* Show only today's workout instead of all days */}
                          {todayWorkout ? (
                            <div
                              id="my-plan-todays-workout"
                              className="mb-8 p-4 sm:p-6 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-blue-900/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-blue-500/30 scroll-mt-24"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                                <h4 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                                  <FaDumbbell className="mr-2 sm:mr-3 text-yellow-300 text-lg sm:text-xl" />
                                  <span className="text-sm sm:text-2xl">Today's Workout</span>
                                </h4>
                                {todayWorkout.isCompleted && (
                                  <span className="px-3 sm:px-4 py-2 bg-green-500 rounded-xl text-white text-sm sm:text-base font-bold flex items-center w-fit shadow-lg">
                                    <FaCheckCircle className="mr-2" /> Completed!
                                  </span>
                                )}
                                {todayWorkout.isSkipped && !todayWorkout.isCompleted && (
                                  <span className="px-3 sm:px-4 py-2 bg-emerald-600/90 rounded-xl text-white text-sm sm:text-base font-bold flex items-center w-fit shadow-lg border border-emerald-400/40">
                                    Rest day logged
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-purple-200 text-xs sm:text-sm mb-4">
                                {new Date(todayWorkout.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                              
                              {missedWorkouts > 0 && (
                                <div className="mb-4 p-3 sm:p-4 bg-yellow-900/30 backdrop-blur border-2 border-yellow-500/50 rounded-xl sm:rounded-2xl">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center">
                                      <FaTimesCircle className="text-yellow-400 text-lg sm:text-xl mr-2 flex-shrink-0" />
                                      <p className="text-yellow-200 font-bold text-sm sm:text-lg">
                                        {missedWorkouts} Missed Workout{missedWorkouts > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-yellow-200 text-xs sm:text-sm mb-3">
                                    Don't worry! Missing workouts happens to everyone. Just continue with today's workout and stay consistent!
                                  </p>
                                  {missedWorkoutDetails.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-yellow-700/50">
                                      <p className="text-yellow-300 text-xs font-semibold mb-2">Missed on:</p>
                                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                                        {missedWorkoutDetails.map((missed, idx) => (
                                          <li key={idx} className="text-yellow-200 text-xs">
                                            • {new Date(missed.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - {missed.focus}
                                          </li>
                                        ))}
                                      </ul>
                                      <p className="text-yellow-300 text-xs mt-3 italic">
                                        💡 Tip: Focus on today's workout. You cannot make up missed workouts in bulk, but consistency going forward matters most!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {todayWorkout.isSkipped ? (
                                <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-emerald-500/35 bg-emerald-950/25 space-y-3">
                                  <p className="text-emerald-100 font-semibold text-sm sm:text-base">
                                    You told us you can&apos;t train today — that&apos;s logged as a planned rest, not a missed workout.
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                    {todayWorkout.skipReason === "sick" &&
                                      "Focus on recovery. When you feel better, pick up with your next scheduled session."}
                                    {todayWorkout.skipReason === "low_mood" &&
                                      "Low-energy days happen. A short walk or light stretch is enough if you want movement later."}
                                    {(todayWorkout.skipReason === "rest" ||
                                      todayWorkout.skipReason === "other" ||
                                      !todayWorkout.skipReason) &&
                                      "Your plan keeps going — use the next workout day when you are ready."}
                                  </p>
                                  {nextWorkoutDate && (
                                    <p className="text-sm text-emerald-200/90">
                                      Next session:{" "}
                                      <strong>
                                        {new Date(nextWorkoutDate).toLocaleDateString("en-US", {
                                          weekday: "long",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </strong>
                                    </p>
                                  )}
                                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={skipDayLoading}
                                      onClick={handleUnskipToday}
                                      className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                                    >
                                      {skipDayLoading ? "Updating…" : "I can train today — undo rest day"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate("/VirtualTA")}
                                      className="text-sm font-semibold px-4 py-2.5 rounded-xl border border-emerald-500/50 text-emerald-200 hover:bg-emerald-950/50 transition-colors"
                                    >
                                      Posture Coach (gentle movement)
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {!todayWorkout.isCompleted && (
                                    <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-slate-600/60 bg-[#0b1220]/90">
                                      <p className="text-white font-semibold text-sm sm:text-base mb-1">
                                        Can&apos;t do today&apos;s workout?
                                      </p>
                                      <p className="text-[11px] sm:text-xs text-gray-500 mb-3 leading-relaxed">
                                        Choose one option — we mark today as a <span className="text-gray-400">planned rest</span>. That is separate from sessions you skip without logging (those may show as missed after the day passes).
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          disabled={skipDayLoading}
                                          onClick={() => handleSkipToday("rest")}
                                          className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-500/50 disabled:opacity-50"
                                        >
                                          Rest / busy
                                        </button>
                                        <button
                                          type="button"
                                          disabled={skipDayLoading}
                                          onClick={() => handleSkipToday("sick")}
                                          className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-500/50 disabled:opacity-50"
                                        >
                                          Sick
                                        </button>
                                        <button
                                          type="button"
                                          disabled={skipDayLoading}
                                          onClick={() => handleSkipToday("low_mood")}
                                          className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-500/50 disabled:opacity-50"
                                        >
                                          Low energy
                                        </button>
                                      </div>
                                    </div>
                                  )}

                              {todayWorkout.workoutContent ? (
                                <>
                                  {/* Progress Indicator */}
                                  {(() => {
                                    const exercises = todayWorkout.workoutContent.exercises || [];
                                    const existingLog = todayWorkout.completedSessionLog;
                                    const completedCount = exercises.filter(ex => 
                                      existingLog?.workoutDetails?.some(
                                        loggedEx => loggedEx.exerciseName === ex.name && loggedEx.completed
                                      )
                                    ).length;
                                    const totalCount = exercises.length;
                                    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                                    
                                    return (
                                      <div className={`mb-6 p-3 sm:p-4 backdrop-blur-xl rounded-xl sm:rounded-2xl border ${darkMode ? 'bg-[#020617]/80 border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-white font-semibold text-sm sm:text-lg">
                                            Progress: {completedCount} of {totalCount} exercises
                                          </p>
                                          <span className="text-purple-400 font-bold text-sm sm:text-base">
                                            {Math.round(progressPercentage)}%
                                          </span>
                                        </div>
                                        <div className={`w-full rounded-full h-2.5 sm:h-3 overflow-hidden border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                                          <div
                                            className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 shadow-lg"
                                            style={{ width: `${progressPercentage}%` }}
                                          ></div>
                                        </div>
                                        {completedCount === totalCount && totalCount > 0 && !todayWorkout.isCompleted && (
                                          <p className="text-green-300 text-xs sm:text-sm mt-2 flex items-center">
                                            <FaCheckCircle className="mr-2" />
                                            All exercises done! Click "Complete Workout" below to finalize.
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {todayWorkout.workoutContent.focus && (
                                    <div className="mb-4 p-3 bg-blue-900/30 backdrop-blur rounded-xl border border-blue-500/20">
                                      <p className="text-blue-100 text-sm sm:text-lg">
                                        <span className="font-semibold text-blue-300">Focus:</span> {todayWorkout.workoutContent.focus}
                                      </p>
                                    </div>
                                  )}
                                  {todayWorkout.workoutContent.warmup && (
                                    <div className="mb-4 p-3 bg-purple-900/30 backdrop-blur rounded-xl border border-purple-500/20">
                                      <p className="text-purple-100 text-xs sm:text-sm">
                                        <span className="font-semibold text-purple-300">Warmup:</span> {todayWorkout.workoutContent.warmup}
                                      </p>
                                    </div>
                                  )}
                                  <ul className="space-y-3 mb-4">
                                    {todayWorkout.workoutContent.exercises?.map((exercise, exIndex) => {
                                      const existingLog = todayWorkout.completedSessionLog;
                                      const isExerciseCompleted = existingLog?.workoutDetails?.some(
                                        (loggedEx) => loggedEx.exerciseName === exercise.name && loggedEx.completed
                                      ) || false;
                                      
                                      return (
                                        <li
                                          key={exIndex}
                                          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 backdrop-blur-lg transition-all duration-300 ${
                                            isExerciseCompleted 
                                              ? 'bg-green-900/30 border-green-500/50 shadow-lg shadow-green-500/20' 
                                              : (darkMode ? 'bg-[#020617]/80 border-[#1F2937] hover:border-[#22D3EE]/60' : 'bg-white border-gray-200 hover:border-blue-400 text-gray-900')
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <p className="font-bold text-white text-base sm:text-lg mb-1 truncate">
                                                {exercise.name}
                                              </p>
                                              <p className="text-gray-300 text-xs sm:text-sm">
                                                Sets: {exercise.sets} | Reps: {exercise.reps} | Weight: {exercise.weight || 'N/A'}
                                              </p>
                                              {exercise.rest && (
                                                <p className="text-gray-400 text-xs mt-1">Rest: {exercise.rest}</p>
                                              )}
                                              {exercise.notes && (
                                                <p className="text-gray-400 text-xs mt-1 italic line-clamp-2">{exercise.notes}</p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {!isExerciseCompleted && !todayWorkout.isCompleted && (
                                                <button
                                                  onClick={() => navigate("/VirtualTA", {
                                                    state: {
                                                      fromWorkoutPlan: true,
                                                      exercise: {
                                                        name: exercise.name,
                                                        sets: exercise.sets,
                                                        reps: exercise.reps,
                                                        weight: exercise.weight,
                                                      },
                                                      dayIndex: todayWorkout.dayIndex,
                                                      weekNumber: todayWorkout.weekNumber,
                                                      workoutPlanId: activePlan._id,
                                                    },
                                                  })}
                                                  className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-1.5"
                                                  title="Train with Virtual Assistant until reps are done"
                                                >
                                                  <FiPlay className="text-lg sm:text-xl" />
                                                  <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Train</span>
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleToggleExercise(
                                                  todayWorkout.dayIndex,
                                                  todayWorkout.weekNumber,
                                                  exercise.name,
                                                  exercise.sets,
                                                  exercise.reps,
                                                  exercise.weight,
                                                  isExerciseCompleted
                                                )}
                                                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                                                  isExerciseCompleted
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                                    : (darkMode ? 'bg-[#020617]/80 hover:bg-[#1F2937] text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600')
                                                }`}
                                                disabled={todayWorkout.isCompleted}
                                                title={isExerciseCompleted ? "Mark as not done" : "Mark as done"}
                                              >
                                                {isExerciseCompleted ? (
                                                  <FaCheckCircle className="text-lg sm:text-xl" />
                                                ) : (
                                                  <FaRegCircle className="text-lg sm:text-xl text-gray-400" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  
                                  {/* Complete Workout Button */}
                                  {!todayWorkout.isCompleted && (
                                    <div className="mt-6 flex justify-center">
                                      <button
                                        onClick={handleCompleteWorkout}
                                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                                      >
                                        <FaCheckCircle className="text-xl sm:text-2xl" />
                                        <span>Complete Workout</span>
                                      </button>
                                    </div>
                                  )}
                                  
                                  {todayWorkout.workoutContent.cooldown && (
                                    <div className="mt-4 p-3 bg-purple-900/30 backdrop-blur rounded-xl border border-purple-500/20">
                                      <p className="text-purple-100 text-xs sm:text-sm">
                                        <span className="font-semibold text-purple-300">Cooldown:</span> {todayWorkout.workoutContent.cooldown}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Completion Message */}
                                  {todayWorkout.isCompleted && (
                                    <div className="mt-6 p-4 sm:p-6 bg-green-900/30 backdrop-blur-lg border-2 border-green-500/50 rounded-2xl text-center shadow-xl">
                                      <FaCheckCircle className="text-green-400 text-4xl sm:text-5xl mx-auto mb-3 animate-bounce" />
                                      <p className="text-green-300 text-lg sm:text-xl font-bold mb-2">
                                        🎉 Workout Completed! Great job!
                                      </p>
                                      <p className="text-green-200 text-xs sm:text-sm">
                                        You've successfully completed all exercises for today.
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-gray-300 text-sm sm:text-base">No workout content available for today.</p>
                              )}
                                </>
                              )}
                              
                              {nextWorkoutDate && (
                                <div className={`mt-4 p-3 backdrop-blur-xl rounded-xl border ${darkMode ? 'bg-[#020617]/80 border-[#1F2937]' : 'bg-gray-50 border-gray-200'}`}>
                                  <p className="text-gray-200 text-xs sm:text-sm">
                                    <strong className="text-purple-300">Next Workout:</strong> {new Date(nextWorkoutDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mb-8 p-6 sm:p-8 bg-gradient-to-r from-slate-800/40 to-purple-900/30 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-purple-500/20 text-center shadow-xl">
                              <div className="text-6xl sm:text-7xl mb-4">🎉</div>
                              <p className="text-xl sm:text-2xl text-gray-200 mb-2 font-bold">No workout scheduled for today!</p>
                              <p className="text-gray-400 text-sm sm:text-base">Enjoy your rest day.</p>
                              {nextWorkoutDate && (
                                <p className="text-gray-200 mt-4 text-sm sm:text-base">
                                  Your next workout is on <strong className="text-purple-400">{new Date(nextWorkoutDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* OLD CODE - Keep for reference but hide it */}
                          {false && currentWeekPlanContent.map((dayPlan, dayIndex) => {
                            // Check if the current day in the current week is marked as completed
                            const isDayCompleted = completedDaysInPlan.some(
                              (dc) =>
                                dc.weekNumber === currentWeekNumber &&
                                dc.dayIndex === dayIndex
                            );

                            // Filter workoutSessionLogs to only include logs for the active plan and current week
                            const currentWeekSessionLogs =
                              workoutSessionLogs.filter(
                                (log) =>
                                  log.workoutPlanId === activePlan._id &&
                                  log.weekNumber === currentWeekNumber
                              );
                            const loggedForThisDay =
                              currentWeekSessionLogs.find(
                                (log) => log.dayIndex === dayIndex
                              );

                            const daysPerWeekInner =
                              activePlan?.generatedParams?.daysPerWeek ||
                              activePlan.planContent.length;
                            const weekdaySetsInner = {
                              3: ["Monday", "Wednesday", "Friday"],
                              4: ["Monday", "Tuesday", "Thursday", "Saturday"],
                              5: [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                              ],
                              6: [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                              ],
                            };
                            const fallbackInner =
                              weekdaySetsInner[daysPerWeekInner] ||
                              activePlan.planContent.map((d) => d.day);
                            const isWeekdayInner = (name) =>
                              /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(
                                name || ""
                              );
                            const planHasWeekdaysInner =
                              activePlan.planContent.every((d) =>
                                isWeekdayInner(d.day)
                              );
                            const scheduleDaysInner = planHasWeekdaysInner
                              ? activePlan.planContent.map((d) => d.day)
                              : fallbackInner;

                            return (
                              <div
                                key={dayIndex}
                                className="mb-8 p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600"
                              >
                                <h4 className="text-xl font-bold text-white mb-3 flex items-center">
                                  Day {dayIndex + 1}:{" "}
                                  {scheduleDaysInner[dayIndex] || dayPlan.day}{" "}
                                  {dayPlan.focus && ` - ${dayPlan.focus}`}
                                  {isDayCompleted && (
                                    <FaCheckCircle
                                      className="ml-3 text-green-400"
                                      title="Workout Logged"
                                    />
                                  )}
                                </h4>
                                {dayPlan.warmup && (
                                  <p className="text-gray-300 mb-2">
                                    <span className="font-semibold">
                                      Warmup:
                                    </span>{" "}
                                    {dayPlan.warmup}
                                  </p>
                                )}
                                <ul className="space-y-2 mb-3">
                                  {dayPlan.exercises.map(
                                    (exercise, exIndex) => {
                                      const existingLogForExercise =
                                        workoutSessionLogs.find(
                                          (log) =>
                                            log.workoutPlanId ===
                                              activePlan._id &&
                                            log.weekNumber ===
                                              currentWeekNumber && // Use currentWeekNumber here
                                            log.dayIndex === dayIndex
                                        );
                                      const isExerciseCompleted =
                                        existingLogForExercise?.workoutDetails.some(
                                          (loggedEx) =>
                                            loggedEx.exerciseName ===
                                              exercise.name &&
                                            loggedEx.completed
                                        );

                                      console.log(
                                        `Exercise ${exercise.name} (Week ${currentWeekNumber}, Day ${dayIndex}, ExIndex ${exIndex}): isExerciseCompleted = ${isExerciseCompleted}, Logged details:`,
                                        existingLogForExercise?.workoutDetails
                                      );

                                      return (
                                        <li
                                          key={exIndex}
                                          className="bg-gray-600 p-3 rounded-md border border-gray-500 flex items-center justify-between"
                                        >
                                          <div>
                                            <p className="font-semibold text-white">
                                              {exercise.name}
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                              Sets: {exercise.sets}, Reps:{" "}
                                              {exercise.reps}, Weight:{" "}
                                              {exercise.weight || "N/A"}, Rest:{" "}
                                              {exercise.rest || "N/A"}
                                            </p>
                                            {exercise.notes && (
                                              <p className="text-gray-400 text-xs mt-1">
                                                Notes: {exercise.notes}
                                              </p>
                                            )}
                                            {exercise.demonstrationLink && (
                                              <a
                                                href={
                                                  exercise.demonstrationLink
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 text-xs hover:underline mt-1 block"
                                              >
                                                Watch Demo
                                              </a>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {!activePlan.completed && (
                                              <button
                                                type="button"
                                                onClick={() => navigate("/VirtualTA", {
                                                  state: {
                                                    fromWorkoutPlan: true,
                                                    exercise: {
                                                      name: exercise.name,
                                                      sets: exercise.sets,
                                                      reps: exercise.reps,
                                                      weight: exercise.weight,
                                                    },
                                                    dayIndex,
                                                    weekNumber: currentWeekNumber,
                                                    workoutPlanId: activePlan._id,
                                                  },
                                                })}
                                                className="p-2 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1"
                                                title="Train with Virtual Assistant"
                                              >
                                                <FiPlay className="text-sm" />
                                                Train
                                              </button>
                                            )}
                                            {!activePlan.completed && (
                                            <input
                                              type="checkbox"
                                              checked={
                                                isExerciseCompleted || false
                                              }
                                              onChange={(e) =>
                                                handleExerciseCompletionToggle(
                                                  dayPlan,
                                                  dayIndex,
                                                  exercise.name,
                                                  e.target.checked,
                                                  currentWeekNumber // Use currentWeekNumber from activePlan
                                                )
                                              }
                                              className="h-6 w-6 text-green-600 border-gray-500 rounded focus:ring-green-500"
                                            />
                                            )}
                                          </div>
                                        </li>
                                      );
                                    }
                                  )}
                                </ul>
                                {dayPlan.cooldown && (
                                  <p className="text-gray-300 mt-3">
                                    <span className="font-semibold">
                                      Cooldown:
                                    </span>{" "}
                                    {dayPlan.cooldown}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-500/20 shadow-xl">
                            <p className="text-gray-200 text-center text-sm sm:text-base mb-3">
                              Total Progress:{" "}
                              <span className="font-bold text-purple-400">
                                {totalCompletedDays}
                              </span>{" "}
                              out of{" "}
                              <span className="font-bold text-white">
                                {totalPlannedDays}
                              </span>{" "}
                              planned workout days completed (
                              {overallProgressPercentage}%).
                            </p>
                            <div className={`w-full h-3 rounded-full overflow-hidden border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                                style={{ width: `${overallProgressPercentage}%` }}
                              />
                            </div>
                            {!activePlan.completed && (
                              <p className="text-xs text-gray-400 text-center mt-3">
                                Only count a day when all exercises are checked as
                                completed. Missed or partial days don't reduce
                                progress — just complete them next chance.
                              </p>
                            )}
                            {activePlan.completed && (
                              <p className="text-center mt-3 text-green-400 font-semibold">
                                You have completed this program. 🎉
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {activePlan.completed && (
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6 text-center font-bold text-base sm:text-lg rounded-b-2xl sm:rounded-b-3xl shadow-lg">
                      This plan is 100% COMPLETED! Well done! 🎉
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl sm:rounded-3xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] p-8 sm:p-12 text-center">
                  <FaDumbbell className="text-5xl sm:text-6xl text-purple-500 mb-6 mx-auto opacity-50" />
                  <h3 className="text-xl sm:text-2xl font-medium text-gray-300 mb-3">
                    No Active Workout Plan
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-6">
                    Go to the Workout Plan Generator to create and save your
                    first personalized plan!
                  </p>
                  <button
                    onClick={() => navigate("/workout")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Generate New Plan
                  </button>
                </div>
              )}

              {/* Other Pending Plans (from history that are not completed and not active) */}
              <div className="mt-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center text-white px-4">
                  <FiClock className="mr-3 text-blue-400" /> Other Pending Plans
                </h2>
                {historyPlans.filter(
                  (plan) => !plan.completed && plan._id !== activePlan?._id
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
                    {historyPlans
                      .filter(
                        (plan) =>
                          !plan.completed && plan._id !== activePlan?._id
                      )
                      .map((plan) => (
                        <div
                          key={plan._id}
                          className="relative rounded-xl sm:rounded-2xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] overflow-hidden flex flex-col hover:border-[#22D3EE]/60 transition-all duration-300 hover:shadow-2xl"
                        >
                          <div className="p-4 sm:p-5 flex-1">
                            <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                              {plan.name}
                            </h3>
                            {plan.description && (
                              <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                                {plan.description}
                              </p>
                            )}
                            <p className="text-gray-400 text-xs mb-1">
                              Generated:{" "}
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Type: {plan.generatedParams.workoutType},
                              Intensity: {plan.generatedParams.intensity}
                            </p>
                          </div>
                          <div className="mt-auto p-4 sm:p-5 border-t border-[#1F2937] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 bg-[#020617]/60">
                            {!plan.completed && (
                              <>
                                <button
                                  onClick={() => handleActivatePlan(plan._id)}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex-1 sm:flex-initial"
                                >
                                  Activate
                                </button>
                                <button
                                  onClick={() => handleDeletePlan(plan._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
                                >
                                  <FiTrash2 className="inline mr-2" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="relative rounded-2xl sm:rounded-3xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] p-8 sm:p-12 text-center mx-4 sm:mx-0">
                    <FiClock className="text-5xl sm:text-6xl text-purple-500 mb-6 mx-auto opacity-50" />
                    <h3 className="text-xl sm:text-2xl font-medium text-gray-300 mb-3">
                      No Other Pending Plans
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                      All your pending workout plans will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "completed" && (
            <div className="mt-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center text-white px-4">
                <FaCheckCircle className="mr-3 text-green-400" /> Completed
                Plans
              </h2>
              {historyPlans.filter((plan) => plan.completed).length > 0 ||
              (activePlan && activePlan.completed) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
                  {activePlan && activePlan.completed && (
                    <div
                      key={activePlan._id}
                      className="relative rounded-xl sm:rounded-2xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] overflow-hidden flex flex-col hover:border-[#22D3EE]/60 transition-all duration-300"
                    >
                      <div className="p-4 sm:p-5 flex-1">
                        <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                          {activePlan.name}
                        </h3>
                        {activePlan.description && (
                          <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                            {activePlan.description}
                          </p>
                        )}
                        <p className="text-gray-400 text-xs mb-1">
                          Generated:{" "}
                          {new Date(activePlan.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Type: {activePlan.generatedParams.workoutType},
                          Intensity: {activePlan.generatedParams.intensity}
                        </p>
                      </div>
                      <div className="mt-auto p-4 sm:p-5 border-t border-green-500/30 bg-green-900/20">
                        <span className="text-green-400 font-bold text-base sm:text-lg flex items-center justify-center">
                          <FaCheckCircle className="mr-2" /> 100% Completed!
                        </span>
                      </div>
                    </div>
                  )}
                  {historyPlans
                    .filter((plan) => plan.completed)
                    .map((plan) => (
                      <div
                        key={plan._id}
                        className="relative rounded-xl sm:rounded-2xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] overflow-hidden flex flex-col hover:border-[#22D3EE]/60 transition-all duration-300"
                      >
                        <div className="p-4 sm:p-5 flex-1">
                          <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                            {plan.name}
                          </h3>
                          {plan.description && (
                            <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                              {plan.description}
                            </p>
                          )}
                          <p className="text-gray-400 text-xs mb-1">
                            Generated:{" "}
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Type: {plan.generatedParams.workoutType}, Intensity:{" "}
                            {plan.generatedParams.intensity}
                          </p>
                        </div>
                        <div className="mt-auto p-4 sm:p-5 border-t border-green-500/30 bg-green-900/20">
                          <span className="text-green-400 font-bold text-base sm:text-lg flex items-center justify-center">
                            <FaCheckCircle className="mr-2" /> 100% Completed!
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="relative rounded-2xl sm:rounded-3xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] p-8 sm:p-12 text-center mx-4 sm:mx-0">
                  <FaCheckCircle className="text-5xl sm:text-6xl text-purple-500 mb-6 mx-auto opacity-50" />
                  <h3 className="text-xl sm:text-2xl font-medium text-gray-300 mb-3">
                    No Completed Plans Yet
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                    Finish a plan to see it here!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
          </div>
        </section>
      </main>

      {planDeleteId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-plan-title"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              darkMode
                ? "bg-[#0f172a] border-[#334155] text-white"
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <h2 id="delete-plan-title" className="text-lg font-bold mb-2">
              Delete workout plan?
            </h2>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              This cannot be undone. Your plan will be removed from your list.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setPlanDeleteId(null)}
                className={`px-4 py-2.5 rounded-xl font-medium border transition ${
                  darkMode
                    ? "border-[#475569] text-gray-200 hover:bg-white/5"
                    : "border-gray-300 text-gray-800 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePlan}
                className="px-4 py-2.5 rounded-xl font-medium bg-red-600 text-white hover:bg-red-500 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyWorkoutPlan;