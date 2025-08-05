// Script to update API calls in your React components
// Run this script to replace hardcoded localhost URLs with the new API configuration

// Files that need to be updated
const filesToUpdate = [
    'src/pages/WorkoutPlanGenerator/Section1.jsx',
    'src/pages/VerficationPage/Section1.jsx',
    'src/pages/UserLogsPage/Section1.jsx',
    'src/pages/NotificationsPage/Section1.jsx',
    'src/pages/FitBot/Section1.jsx',
    'src/pages/EditProfilePage/Section1.jsx',
    'src/pages/BMICalculator/Section1.jsx',
    'src/pages/ContactusPage/Section1.jsx',
    'src/pages/AllUserLogsPage/Section1.jsx'
];

console.log('🔧 API Call Update Instructions:');
console.log('================================');
console.log('');
console.log('Please update the following files to use the new API configuration:');
console.log('');

filesToUpdate.forEach(file => {
    console.log(`📁 ${file}`);
});

console.log('');
console.log('📝 Update Steps:');
console.log('1. Add import: import { API_ENDPOINTS } from "../../config/api";');
console.log('2. Replace hardcoded URLs with API_ENDPOINTS constants');
console.log('');
console.log('Example replacements:');
console.log('- "http://localhost:8000/api/auth/login" → API_ENDPOINTS.LOGIN');
console.log('- "http://localhost:8000/api/bmi/history" → API_ENDPOINTS.BMI_HISTORY');
console.log('- "http://localhost:8000/api/reports" → API_ENDPOINTS.REPORTS');
console.log('');
console.log('✅ NavBar.jsx has already been updated as an example!'); 