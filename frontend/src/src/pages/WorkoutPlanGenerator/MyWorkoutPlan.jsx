import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiActivity, FiArrowLeft, FiClock } from 'react-icons/fi';
import { FaDumbbell, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, API_ENDPOINTS } from '../../../config/api';

const MyWorkoutPlan = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [workoutSessionLogs, setWorkoutSessionLogs] = useState([]); // New state for session logs
  const [activeTab, setActiveTab] = useState('active-pending'); // 'active-pending' or 'completed'

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to view your workout plans.");
      navigate("/signin");
      return;
    }
    fetchPlans();
  }, [user, navigate]);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeRes = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/active/${user._id}`);
      console.log("Fetched active plan response:", activeRes.data);
      setActivePlan(activeRes.data.plan);
      setWorkoutSessionLogs(activeRes.data.sessionLogs || []); // Set session logs
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setActivePlan(null);
      } else {
        console.error("Error fetching active plan:", err);
        setError("Failed to load active workout plan.");
        toast.error("Failed to load active workout plan.");
      }
    }

    try {
      const historyRes = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/history/${user._id}`);
      setHistoryPlans(historyRes.data.history);
    } catch (err) {
      console.error("Error fetching history plans:", err);
      setError((prev) => prev || "Failed to load workout plan history."); // Only set if not already set
      toast.error("Failed to load workout plan history.");
    }
    setLoading(false);
  };

  const handleEditClick = (plan) => {
    setEditingPlanId(plan._id);
    setNewPlanName(plan.name);
    setNewPlanDescription(plan.description || '');
  };

  const handleSaveEdit = async (planId) => {
    if (!newPlanName.trim()) {
      toast.error("Plan name cannot be empty.");
      return;
    }
    try {
      const res = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/update/${planId}`, {
        name: newPlanName,
        description: newPlanDescription,
      });
      if (res.data.success) {
        toast.success("Plan updated successfully!");
        fetchPlans(); // Refresh plans
        setEditingPlanId(null);
      } else {
        toast.error("Failed to update plan.");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      toast.error("Failed to update plan.");
    }
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setNewPlanName('');
    setNewPlanDescription('');
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm("Are you sure you want to delete this workout plan? This action cannot be undone.")) {
      try {
        const res = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/delete/${planId}`);
        if (res.data.success) {
          toast.success("Workout plan deleted successfully!");
          fetchPlans(); // Refresh plans
        } else {
          toast.error("Failed to delete workout plan.");
        }
      } catch (err) {
        console.error("Error deleting plan:", err);
        toast.error("Failed to delete workout plan.");
      }
    }
  };

  const handleActivatePlan = async (planId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-plan/update/${planId}`, {
        isActive: true,
      });
      if (res.data.success) {
        toast.success("Plan set as active!");
        fetchPlans(); // Refresh plans to show new active plan
      } else {
        toast.error("Failed to activate plan.");
      }
    } catch (err) {
      console.error("Error activating plan:", err);
      toast.error("Failed to activate plan.");
    }
  };

  const handleExerciseCompletionToggle = async (dayPlan, dayIndex, exerciseName, isCompleted, weekNumber) => {
    if (!user || !activePlan) {
      toast.error("Please log in and have an active plan to mark exercises.");
      return;
    }

    // The weekNumber is now passed as an argument directly, or default to currentWeek from activePlan
    const currentWeekNumber = weekNumber !== undefined ? weekNumber : activePlan.currentWeek || 1;

    // Find existing log or prepare initial data
    let existingLog = workoutSessionLogs.find(
      (log) =>
        log.workoutPlanId === activePlan._id &&
        log.weekNumber === currentWeekNumber &&
        log.dayIndex === dayIndex
    );

    let updatedWorkoutDetails;
    if (existingLog) {
      updatedWorkoutDetails = existingLog.workoutDetails.map(ex =>
        ex.exerciseName === exerciseName ? { ...ex, completed: isCompleted } : ex
      );
      // If the exercise wasn't in the log before, add it (shouldn't happen with planned exercises)
      if (!updatedWorkoutDetails.some(ex => ex.exerciseName === exerciseName)) {
        const plannedEx = dayPlan.exercises.find(ex => ex.name === exerciseName);
        if (plannedEx) {
          updatedWorkoutDetails.push({ ...plannedEx, completed: isCompleted, notes: '', weight: plannedEx.weight || 'N/A' });
        }
      }
    } else {
      // Create new workout details based on the dayPlan, with the toggled exercise updated
      updatedWorkoutDetails = dayPlan.exercises.map(ex => ({
        exerciseName: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: '',
        completed: ex.name === exerciseName ? isCompleted : false,
      }));
    }

    // Calculate if all exercises for the current day are completed
    const allExercisesCompletedForDay = updatedWorkoutDetails.every(ex => ex.completed);

    try {
      const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-session/log`, {
        userId: user._id,
        workoutPlanId: activePlan._id,
        date: new Date(),
        dayIndex,
        weekNumber: currentWeekNumber, // Ensure weekNumber is sent with the log
        workoutDetails: updatedWorkoutDetails,
        overallNotes: existingLog?.overallNotes || '',
        perceivedExertion: existingLog?.perceivedExertion || 5,
        durationMinutes: existingLog?.durationMinutes || 0,
        isDayCompleted: allExercisesCompletedForDay, // Send completion status of the day
      });

      if (res.data.success) {
        toast.success(`Exercise '${exerciseName}' ${isCompleted ? 'completed' : 'unmarked'}!`);
        fetchPlans(); // Refresh plans to update UI with latest completion status
      } else {
        toast.error("Failed to update exercise completion.");
      }
    } catch (err) {
      console.error("Error toggling exercise completion:", err);
      toast.error("Failed to update exercise completion.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-xl text-gray-300">Loading your workout plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-red-400 p-6">
        <FaTimesCircle className="text-5xl mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Plans</h2>
        <p className="text-lg text-center">{error}</p>
        <button onClick={fetchPlans} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />

      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/workout")}
          className="mb-8 flex items-center text-green-400 hover:text-green-500 transition"
        >
          <FiArrowLeft className="mr-2" /> Back to Generator
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            My Workout Plans
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            View your active plan, track your progress, and manage your workout history.
          </p>
        </div>

        {/* Tabs for Active/Pending and Completed Plans */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveTab('active-pending')}
            className={`py-3 px-8 text-lg font-medium rounded-l-lg transition-colors duration-300 
              ${activeTab === 'active-pending' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Active & Pending Plans
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 px-8 text-lg font-medium rounded-r-lg transition-colors duration-300 
              ${activeTab === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Completed Plans
          </button>
        </div>

        {/* Conditional Rendering based on Active Tab */}
        {activeTab === 'active-pending' && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
              <FiActivity className="mr-3 text-green-400" /> Active Plan
            </h2>
            {activePlan && !activePlan.completed ? (
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white flex justify-between items-center">
                  <div>
                    {editingPlanId === activePlan._id ? (
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        className="bg-gray-700 text-white p-2 rounded mr-2"
                      />
                    ) : (
                      <h3 className="text-2xl font-bold">{activePlan.name}</h3>
                    )}
                    {editingPlanId === activePlan._id ? (
                      <input
                        type="text"
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                        className="bg-gray-700 text-white p-2 rounded mr-2 mt-2 block"
                        placeholder="Plan description"
                      />
                    ) : (
                      activePlan.description && <p className="text-gray-200 mt-1">{activePlan.description}</p>
                    )}
                    <p className="text-gray-300 text-sm mt-2">
                      Generated on: {new Date(activePlan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    {editingPlanId === activePlan._id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(activePlan._id)}
                          className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition"
                          title="Save Changes"
                        >
                          <FaCheckCircle className="text-lg" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
                          title="Cancel Edit"
                        >
                          <FaTimesCircle className="text-lg" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditClick(activePlan)}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                        title="Edit Plan Name/Description"
                      >
                        <FiEdit2 className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-8">
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">Plan Duration:</span> {activePlan.durationWeeks} weeks
                    ({(activePlan?.generatedParams?.daysPerWeek || activePlan.planContent.length) * activePlan.durationWeeks} total workout days planned)
                  </p>
                  {(() => {
                    const daysPerWeek = activePlan?.generatedParams?.daysPerWeek || activePlan.planContent.length;
                    const weekdaySets = {
                      3: ["Monday", "Wednesday", "Friday"],
                      4: ["Monday", "Tuesday", "Thursday", "Saturday"],
                      5: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      6: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    };
                    const fallback = weekdaySets[daysPerWeek] || activePlan.planContent.map((d) => d.day);
                    const isWeekday = (name) => /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(name || "");
                    const planHasWeekdays = activePlan.planContent.every((d) => isWeekday(d.day));
                    const scheduleDays = planHasWeekdays ? activePlan.planContent.map((d) => d.day) : fallback;
                    return (
                      <p className="text-gray-300 mb-4">
                        <span className="font-semibold">Weekly Schedule:</span> {scheduleDays.join(', ')}
                      </p>
                    );
                  })()}
                  {/* Calculate totalLoggedDays and totalPlannedDays outside the map function */}
                  {(() => {
                    const daysPerWeek = activePlan?.generatedParams?.daysPerWeek || activePlan.planContent.length;
                    const totalPlannedDays = daysPerWeek * activePlan.durationWeeks;
                    const currentWeekNumber = activePlan.currentWeek || 1;
                    const completedDaysInPlan = activePlan.dayCompletions || [];
                    const totalCompletedDays = completedDaysInPlan.length;

                    const currentWeekCompletions = completedDaysInPlan.filter(dc => dc.weekNumber === currentWeekNumber).length;
                    const currentWeekProgressPercentage = Math.min(100, Math.round((currentWeekCompletions / daysPerWeek) * 100));

                    const overallProgressPercentage = Math.min(100, Math.round((totalCompletedDays / (totalPlannedDays || 1)) * 100));

                    const currentWeekPlanContent = activePlan.weeklyContentOverrides?.[currentWeekNumber.toString()] || activePlan.planContent;

                    console.log("MyWorkoutPlan - currentWeekNumber:", currentWeekNumber);
                    console.log("MyWorkoutPlan - currentWeekPlanContent:", currentWeekPlanContent);
                    console.log("MyWorkoutPlan - workoutSessionLogs (overall):", workoutSessionLogs);

                    return (
                      <>
                        <div className="mb-6 p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600">
                          <h4 className="text-xl font-bold text-white mb-2">
                            Week {currentWeekNumber} of {activePlan.durationWeeks}
                          </h4>
                          <p className="text-gray-300 text-sm mb-2">
                            Progress this week: <span className="font-bold text-green-400">{currentWeekCompletions}</span> out of <span className="font-bold text-white">{daysPerWeek}</span> days completed ({currentWeekProgressPercentage}%)
                          </p>
                          <div className="w-full bg-gray-600 h-2 rounded">
                            <div
                              className="bg-green-500 h-2 rounded"
                              style={{ width: `${currentWeekProgressPercentage}%` }}
                            />
                          </div>
                          {currentWeekNumber < activePlan.durationWeeks && currentWeekCompletions === daysPerWeek && (
                            <p className="text-sm text-green-300 mt-2">Week {currentWeekNumber} completed! Next week's plan is ready.</p>
                          )}
                        </div>

                        {currentWeekPlanContent.map((dayPlan, dayIndex) => {
                          // Check if the current day in the current week is marked as completed
                          const isDayCompleted = completedDaysInPlan.some(
                            (dc) => dc.weekNumber === currentWeekNumber && dc.dayIndex === dayIndex
                          );

                          // Filter workoutSessionLogs to only include logs for the active plan and current week
                          const currentWeekSessionLogs = workoutSessionLogs.filter(
                            (log) => log.workoutPlanId === activePlan._id && log.weekNumber === currentWeekNumber
                          );
                          const loggedForThisDay = currentWeekSessionLogs.find(
                            (log) => log.dayIndex === dayIndex
                          );

                          const daysPerWeekInner = activePlan?.generatedParams?.daysPerWeek || activePlan.planContent.length;
                          const weekdaySetsInner = {
                            3: ["Monday", "Wednesday", "Friday"],
                            4: ["Monday", "Tuesday", "Thursday", "Saturday"],
                            5: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                            6: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                          };
                          const fallbackInner = weekdaySetsInner[daysPerWeekInner] || activePlan.planContent.map((d) => d.day);
                          const isWeekdayInner = (name) => /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(name || "");
                          const planHasWeekdaysInner = activePlan.planContent.every((d) => isWeekdayInner(d.day));
                          const scheduleDaysInner = planHasWeekdaysInner ? activePlan.planContent.map((d) => d.day) : fallbackInner;

                          return (
                            <div key={dayIndex} className="mb-8 p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600">
                              <h4 className="text-xl font-bold text-white mb-3 flex items-center">
                                Day {dayIndex + 1}: {scheduleDaysInner[dayIndex] || dayPlan.day} {dayPlan.focus && ` - ${dayPlan.focus}`}
                                {isDayCompleted && <FaCheckCircle className="ml-3 text-green-400" title="Workout Logged" />}
                              </h4>
                              {dayPlan.warmup && (
                                <p className="text-gray-300 mb-2"><span className="font-semibold">Warmup:</span> {dayPlan.warmup}</p>
                              )}
                              <ul className="space-y-2 mb-3">
                                {dayPlan.exercises.map((exercise, exIndex) => {
                                  const existingLogForExercise = workoutSessionLogs.find(
                                    (log) =>
                                      log.workoutPlanId === activePlan._id &&
                                      log.weekNumber === currentWeekNumber && // Use currentWeekNumber here
                                      log.dayIndex === dayIndex
                                  );
                                  const isExerciseCompleted = existingLogForExercise?.workoutDetails.some(
                                    (loggedEx) => loggedEx.exerciseName === exercise.name && loggedEx.completed
                                  );

                                  console.log(`Exercise ${exercise.name} (Week ${currentWeekNumber}, Day ${dayIndex}, ExIndex ${exIndex}): isExerciseCompleted = ${isExerciseCompleted}, Logged details:`, existingLogForExercise?.workoutDetails);

                                  return (
                                    <li key={exIndex} className="bg-gray-600 p-3 rounded-md border border-gray-500 flex items-center justify-between">
                                      <div>
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
                                      </div>
                                      {!activePlan.completed && (
                                        <input
                                          type="checkbox"
                                          checked={isExerciseCompleted || false}
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
                                    </li>
                                  );
                                })}
                              </ul>
                              {dayPlan.cooldown && (
                                <p className="text-gray-300 mt-3"><span className="font-semibold">Cooldown:</span> {dayPlan.cooldown}</p>
                              )}
                            </div>
                          );
                        })}
                        <p className="text-gray-300 text-center mt-6">
                          Total Progress: <span className="font-bold text-green-400">{totalCompletedDays}</span> out of <span className="font-bold text-white">{totalPlannedDays}</span> planned workout days completed ({overallProgressPercentage}%).
                        </p>
                        <div className="w-full bg-gray-700 h-2 rounded mt-2">
                          <div
                            className="bg-green-500 h-2 rounded"
                            style={{ width: `${overallProgressPercentage}%` }}
                          />
                        </div>
                        {!activePlan.completed && (
                          <p className="text-xs text-gray-400 text-center mt-2">Only count a day when all exercises are checked as completed. Missed or partial days don’t reduce progress — just complete them next chance.</p>
                        )}
                        {activePlan.completed && (
                          <p className="text-center mt-2 text-green-400 font-semibold">You have completed this program. 🎉</p>
                        )}
                      </>
                    );
                  })()}
                </div>
                {activePlan.completed && (
                  <div className="bg-green-700 text-white p-4 text-center font-bold text-lg">
                    This plan is 100% COMPLETED! Well done! 🎉
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-12 text-center">
                <FaDumbbell className="text-5xl text-gray-600 mb-6" />
                <h3 className="text-2xl font-medium text-gray-400 mb-3">
                  No Active Workout Plan
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Go to the Workout Plan Generator to create and save your first personalized plan!
                </p>
                <button
                  onClick={() => navigate("/workout")}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Generate New Plan
                </button>
              </div>
            )}

            {/* Other Pending Plans (from history that are not completed and not active) */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
                <FiClock className="mr-3 text-blue-400" /> Other Pending Plans
              </h2>
              {historyPlans.filter(plan => !plan.completed && plan._id !== activePlan?._id).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyPlans.filter(plan => !plan.completed && plan._id !== activePlan?._id).map((plan) => (
                    <div key={plan._id} className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden flex flex-col">
                      <div className="p-5">
                        <h3 className="font-bold text-xl text-white mb-2">{plan.name}</h3>
                        {plan.description && <p className="text-gray-300 text-sm mb-3">{plan.description}</p>}
                        <p className="text-gray-400 text-xs mb-1">
                          Generated: {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Type: {plan.generatedParams.workoutType}, Intensity: {plan.generatedParams.intensity}
                        </p>
                      </div>
                      <div className="mt-auto p-5 border-t border-gray-700 flex justify-between items-center">
                        {!plan.completed && (
                          <button
                            onClick={() => handleActivatePlan(plan._id)}
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          >
                            Activate This Plan
                          </button>
                        )}
                        {!plan.completed && (
                          <button
                            onClick={() => handleDeletePlan(plan._id)}
                            className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                          >
                            <FiTrash2 className="inline mr-2" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-12 text-center">
                  <FiClock className="text-5xl text-gray-600 mb-6" />
                  <h3 className="text-2xl font-medium text-gray-400 mb-3">
                    No Other Pending Plans
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    All your pending workout plans will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
              <FaCheckCircle className="mr-3 text-green-400" /> Completed Plans
            </h2>
            {historyPlans.filter(plan => plan.completed).length > 0 || (activePlan && activePlan.completed) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePlan && activePlan.completed && (
                  <div key={activePlan._id} className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-white mb-2">{activePlan.name}</h3>
                      {activePlan.description && <p className="text-gray-300 text-sm mb-3">{activePlan.description}</p>}
                      <p className="text-gray-400 text-xs mb-1">
                        Generated: {new Date(activePlan.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Type: {activePlan.generatedParams.workoutType}, Intensity: {activePlan.generatedParams.intensity}
                      </p>
                    </div>
                    <div className="mt-auto p-5 border-t border-gray-700 flex justify-between items-center">
                      <span className="text-green-400 font-bold text-lg">100% Completed!</span>
                    </div>
                  </div>
                )}
                {historyPlans.filter(plan => plan.completed).map((plan) => (
                  <div key={plan._id} className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-white mb-2">{plan.name}</h3>
                      {plan.description && <p className="text-gray-300 text-sm mb-3">{plan.description}</p>}
                      <p className="text-gray-400 text-xs mb-1">
                        Generated: {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Type: {plan.generatedParams.workoutType}, Intensity: {plan.generatedParams.intensity}
                      </p>
                    </div>
                    <div className="mt-auto p-5 border-t border-gray-700 flex justify-between items-center">
                      <span className="text-green-400 font-bold text-lg">100% Completed!</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-12 text-center">
                <FaCheckCircle className="text-5xl text-gray-600 mb-6" />
                <h3 className="text-2xl font-medium text-gray-400 mb-3">
                  No Completed Plans Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Finish a plan to see it here!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWorkoutPlan;
