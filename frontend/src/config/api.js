// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return "http://localhost:8000";
  }

  // For production, use your backend URL
  return "https://mindfitaibackend.vercel.app";
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to create full API URLs
export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    }`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  REPORTS: "/api/reports",
  AUTH: "/api/auth",
  BMI: "/api/bmi",
  USERS: "/api/users",
  LOGS: "/api/logs",
  SAVE_WORKOUT_PLAN: "/api/auth/workout-plan/save",
  ACTIVE_WORKOUT_PLAN: "/api/auth/workout-plan/active",
  WORKOUT_PLAN_HISTORY: "/api/auth/workout-plan/history",
  UPDATE_WORKOUT_PLAN: "/api/auth/workout-plan/update",
  LOG_WORKOUT_SESSION: "/api/auth/workout-session/log",
};
