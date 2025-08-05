// API Configuration
const API_BASE_URL = import.meta.env.PROD
    ? '' // In production, use relative URLs
    : 'http://localhost:8000'; // In development, use localhost

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
    RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    CHAT: `${API_BASE_URL}/api/auth/chat`,
    HISTORY: `${API_BASE_URL}/api/auth/history`,
    GENERATE_PLAN: `${API_BASE_URL}/api/auth/generate-plan`,

    // User endpoints
    USER_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}`,
    UPDATE_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}`,

    // BMI endpoints
    BMI_HISTORY: `${API_BASE_URL}/api/bmi/history`,
    BMI_SAVE: `${API_BASE_URL}/api/bmi/save`,

    // Report endpoints
    REPORTS: `${API_BASE_URL}/api/reports`,
    REPORT_BY_ID: (reportId) => `${API_BASE_URL}/api/reports/${reportId}`,
    REPORT_VERIFY: (reportId) => `${API_BASE_URL}/api/reports/${reportId}/verify`,
    REPORT_RESET: (reportId) => `${API_BASE_URL}/api/reports/${reportId}/reset`,
    REPORT_SEND_OTP: (reportId) => `${API_BASE_URL}/api/reports/${reportId}/send-otp`,
    REPORT_CLAIM: (reportId) => `${API_BASE_URL}/api/reports/${reportId}/claim`,
    NOTIFICATION_READ: (notificationId) => `${API_BASE_URL}/api/reports/notification/${notificationId}/read`,

    // Log endpoints
    USER_LOGS: `${API_BASE_URL}/api/logs/user-logs`,
    ADMIN_LOGS: `${API_BASE_URL}/api/logs/admin-logs`,

    // Contact endpoints
    CONTACT: `${API_BASE_URL}/api/contact`,
};

export default API_BASE_URL; 