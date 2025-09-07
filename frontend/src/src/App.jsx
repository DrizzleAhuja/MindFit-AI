import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/HomePage/Home";
import Signin from "./pages/SigninPage/Signin";
import Report from "./pages/BMICalculator/Report.jsx";
import EnhancedBMICalculator from "./pages/BMICalculator/EnhancedBMICalculator.jsx";
import LostItems from "./pages/FitBot/LostItems.jsx";
import FoundItems from "./pages/VirtualTrainingAssistant/FoundItems.jsx";
import EditProfile from "./pages/EditProfilePage/EditProfile";
import MyListings from "./pages/WorkoutPlanGenerator/MyReports.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";
import VerificationPage from "./pages/VerficationPage/VerificationPage";
import UserLogsPage from "./pages/UserLogsPage/UserLogsPage.jsx";
import AllUserLogsPage from "./pages/AllUserLogsPage/AllUserLogsPage.jsx";
// import AdminLogsPage from "./pages/CalorieTracker/AdminLogsPage.jsx";
import CalorieTracker from "./pages/CalorieTracker/CalorieTracker.jsx";
import Contactus from "./pages/ContactusPage/Contactus.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx"; // Import ThemeProvider
import About from "./pages/AboutPage/About.jsx"; // Import About component
import Features from "./pages/FeaturesPage/Features.jsx"; // Import Features component
import MyWorkoutPlan from "./pages/WorkoutPlanGenerator/MyWorkoutPlan.jsx";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLoginStatus = localStorage.getItem("isLoggedIn");
    return savedLoginStatus === "true";
  });

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  return (
    <ThemeProvider>
      {" "}
      {/* Wrap the entire application with ThemeProvider */}
      <div className="w-screen min-h-screen">
        {" "}
        {/* Removed bg-white and text-black */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/CurrentBMI" element={<EnhancedBMICalculator />} />
          <Route path="/AiCoach" element={<LostItems />} />
          <Route path="/VirtualTA" element={<FoundItems />} />
          <Route path="/EditProfile" element={<EditProfile />} />
          <Route path="/Workout" element={<MyListings />} />
          <Route path="/VerificationPage" element={<VerificationPage />} />
          <Route path="/ContactUs" element={<Contactus />} />

          <Route path="/UserLogs" element={<UserLogsPage />} />
          <Route path="/calorie-tracker" element={<CalorieTracker />} />
          <Route path="/AllUsersLogs" element={<AllUserLogsPage />} />
          <Route path="/my-workout-plan" element={<MyWorkoutPlan />} />
          {/* <Route path="/admin-calorie-tracker" element={<CalorieTracker />} />
          <Route path="/admin-calorie-tracker" element={<CalorieTracker />} />
          <Route path="/admin-calorie-tracker" element={<CalorieTracker />} />
          <Route path="/admin-calorie-tracker" element={<CalorieTracker />} />
          <Route path="/admin-calorie-tracker" element={<CalorieTracker />} />
          <Route path="/admin-calorie-tracker" element={<CalorieTracker />} />
          <Route path="/admin-calorie */}
          <Route
            path="/admin-calorie-tracker"
            // element={
            // <AdminLogsPage/>
            // }
          />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
        </Routes>
        <ToastContainer
          theme="dark"
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
