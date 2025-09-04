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
  return `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  REPORTS: "/api/reports",
  AUTH: "/api/auth",
  BMI: "/api/bmi",
  USERS: "/api/users",
  LOGS: "/api/logs",
};
