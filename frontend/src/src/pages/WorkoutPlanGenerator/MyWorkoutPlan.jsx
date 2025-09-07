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
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(null);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [workoutSessionLogs, setWorkoutSessionLogs] = useState([]); // New state for session logs

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

  const handleLogWorkout = (dayPlan) => {
    setSelectedWorkoutDay(dayPlan);
    // Initialize session details with exercises from the dayPlan, all marked as not completed
    const initialSessionDetails = dayPlan.exercises.map(ex => ({ 
      exerciseName: ex.name, 
      sets: ex.sets, 
      reps: ex.reps, 
      weight: ex.weight, 
      notes: '', 
      completed: false 
    }));
    setSessionDetails(initialSessionDetails);
    setOverallNotes('');
    setPerceivedExertion(5);
    setDurationMinutes('');
    setShowLogModal(true);
  };

  const handleSessionDetailChange = (index, field, value) => {
    const updatedDetails = [...sessionDetails];
    updatedDetails[index][field] = value;
    setSessionDetails(updatedDetails);
  };

  const submitWorkoutLog = async () => {
    if (!user || !activePlan || !selectedWorkoutDay) {
      toast.error("Cannot log workout without an active plan and selected day.");
      return;
    }
    if (!durationMinutes || isNaN(durationMinutes) || durationMinutes <= 0) {
      toast.error("Please enter a valid workout duration in minutes.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH}/workout-session/log`, {
        userId: user._id,
        workoutPlanId: activePlan._id,
        date: new Date(),
        workoutDetails: sessionDetails.map(detail => ({
          ...detail,
          completed: detail.completed || false // Ensure completed status is sent
        })),
        overallNotes,
        perceivedExertion,
        durationMinutes: parseInt(durationMinutes, 10),
      });

      if (res.data.success) {
        toast.success("Workout session logged successfully!");
        setShowLogModal(false);
        setSelectedWorkoutDay(null);
        setSessionDetails([]);
        fetchPlans(); // Refresh plans to update session logs
      } else {
        toast.error("Failed to log workout session.");
      }
    } catch (err) {
      console.error("Error logging workout session:", err);
      toast.error("Failed to log workout session.");
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

        {/* Active Workout Plan */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
            <FiActivity className="mr-3 text-green-400" /> Active Plan
          </h2>
          {activePlan ? (
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
                <p className="text-gray-300 mb-4">
                  <span className="font-semibold">Plan Duration:</span> {activePlan.durationWeeks} weeks
                  ({activePlan.planContent.length * activePlan.durationWeeks} total workout days planned)
                </p>
                {/* Calculate totalLoggedDays and totalPlannedDays outside the map function */}
                {(() => {
                  const totalLoggedDays = workoutSessionLogs.length;
                  const totalPlannedDays = activePlan.planContent.length * activePlan.durationWeeks;

                  return (
                    <>
                      {activePlan.planContent.map((dayPlan, dayIndex) => {
                        // Check if this day has been logged in the current week
                        const loggedForThisDay = workoutSessionLogs.some(log => {
                          const logDate = new Date(log.date);
                          const today = new Date();
                          // Simple check: same day of week, and within current plan cycle (more complex logic needed for full week tracking)
                          return logDate.getDay() === (new Date().getDay() + dayIndex) % 7; // Needs more sophisticated weekly tracking
                        });

                        return (
                          <div key={dayIndex} className="mb-8 p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600">
                            <h4 className="text-xl font-bold text-white mb-3 flex items-center">
                              Day {dayIndex + 1}: {dayPlan.day} {dayPlan.focus && ` - ${dayPlan.focus}`}
                              {loggedForThisDay && <FaCheckCircle className="ml-3 text-green-400" title="Workout Logged" />}
                            </h4>
                            {dayPlan.warmup && (
                              <p className="text-gray-300 mb-2"><span className="font-semibold">Warmup:</span> {dayPlan.warmup}</p>
                            )}
                            <ul className="space-y-2 mb-3">
                              {dayPlan.exercises.map((exercise, exIndex) => (
                                <li key={exIndex} className="bg-gray-600 p-3 rounded-md border border-gray-500">
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
                                </li>
                              ))}
                            </ul>
                            {dayPlan.cooldown && (
                              <p className="text-gray-300 mt-3"><span className="font-semibold">Cooldown:</span> {dayPlan.cooldown}</p>
                            )}
                            <button
                              onClick={() => handleLogWorkout(dayPlan)}
                              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                              <FaDumbbell className="inline mr-2" /> Log This Workout
                            </button>
                          </div>
                        );
                      })}
                      <p className="text-gray-300 text-center mt-6">
                        Progress: <span className="font-bold text-green-400">{totalLoggedDays}</span> out of <span className="font-bold text-white">{totalPlannedDays}</span> planned workout days logged.
                      </p>
                    </>
                  );
                })()}
              </div>
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
        </div>

        {/* Workout History (Previous Plans) */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
            <FiClock className="mr-3 text-blue-400" /> History & Other Plans
          </h2>
          {historyPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyPlans.filter(plan => plan._id !== activePlan?._id).map((plan) => (
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
                  <div className="mt-auto p-5 border-t border-gray-700 flex justify-between">
                    <button
                      onClick={() => handleActivatePlan(plan._id)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Activate This Plan
                    </button>
                    <button
                      onClick={() => toast.info("Deletion not yet implemented!")}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                    >
                      <FiTrash2 className="inline mr-2" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-12 text-center">
              <FiClock className="text-5xl text-gray-600 mb-6" />
              <h3 className="text-2xl font-medium text-gray-400 mb-3">
                No Historical Plans
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                All your saved workout plans will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Log Workout Modal */}
      {showLogModal && selectedWorkoutDay && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white flex justify-between items-center">
              <h3 className="text-2xl font-bold">Log Workout: {selectedWorkoutDay.day}</h3>
              <button onClick={() => setShowLogModal(false)} className="text-white hover:text-gray-200"><FaTimesCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-gray-300">Record your performance for each exercise.</p>

              {sessionDetails.map((detail, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <p className="font-bold text-white text-lg mb-2">{detail.exerciseName}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Sets (Actual)</label>
                      <input
                        type="number"
                        value={detail.sets}
                        onChange={(e) => handleSessionDetailChange(index, 'sets', parseInt(e.target.value, 10))}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Reps (Actual)</label>
                      <input
                        type="text"
                        value={detail.reps}
                        onChange={(e) => handleSessionDetailChange(index, 'reps', e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Weight (Actual)</label>
                      <input
                        type="text"
                        value={detail.weight}
                        onChange={(e) => handleSessionDetailChange(index, 'weight', e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Notes</label>
                      <input
                        type="text"
                        value={detail.notes}
                        onChange={(e) => handleSessionDetailChange(index, 'notes', e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Felt easy, struggled with last set"
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={detail.completed}
                        onChange={(e) => handleSessionDetailChange(index, 'completed', e.target.checked)}
                        className="mr-2 h-4 w-4 text-green-600 border-gray-500 rounded focus:ring-green-500"
                      />
                      <label className="text-sm text-gray-300">Completed</label>
                    </div>
                  </div>
                </div>
              ))}

              <div className="space-y-4 pt-4 border-t border-gray-700 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Overall Notes</label>
                  <textarea
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Any additional comments about today's workout?"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Perceived Exertion (RPE 1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={perceivedExertion}
                    onChange={(e) => setPerceivedExertion(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                  />
                  <p className="text-center text-sm text-gray-400 mt-2">RPE: {perceivedExertion}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                    min="1"
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              <button
                onClick={submitWorkoutLog}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center"
              >
                <FaCheckCircle className="mr-2" /> Submit Workout Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWorkoutPlan;
