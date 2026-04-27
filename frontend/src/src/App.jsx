import React, { useState, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { setUser } from "./redux/userSlice";
import Home from "./pages/HomePage/Home";
import Signin from "./pages/SigninPage/Signin";
import Report from "./pages/BMICalculator/Report.jsx";
import EnhancedBMICalculator from "./pages/BMICalculator/EnhancedBMICalculator.jsx";
import LostItems from "./pages/FitBot/LostItems.jsx";
import FoundItems from "./pages/VirtualTrainingAssistant/FoundItems.jsx";
import EditProfile from "./pages/EditProfilePage/EditProfile";
import MyListings from "./pages/WorkoutPlanGenerator/MyReports.jsx";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";
import VerificationPage from "./pages/VerficationPage/VerificationPage";
import UserLogsPage from "./pages/UserLogsPage/UserLogsPage.jsx";
import AllUserLogsPage from "./pages/AllUserLogsPage/AllUserLogsPage.jsx";
// import AdminLogsPage from "./pages/CalorieTracker/AdminLogsPage.jsx";
import CalorieTracker from "./pages/CalorieTracker/CalorieTracker.jsx";
import Contactus from "./pages/ContactusPage/Contactus.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx"; // Import ThemeProvider
import About from "./pages/AboutPage/About.jsx"; // Import About component
import Features from "./pages/FeaturesPage/a.jsx"; // Import Features component
import MyWorkoutPlan from "./pages/WorkoutPlanGenerator/MyWorkoutPlan.jsx";
import DietChartGenerator from "./pages/DietChartGenerator/DietChartGenerator.jsx";
import UserFeedback from "./pages/Feedback/UserFeedback.jsx";
import UserSupport from "./pages/Support/UserSupport.jsx";
import WeeklyReport from "./pages/WeeklyReportPage/WeeklyReport.jsx";

import Leaderboard from "./pages/Leaderboard/Leaderboard.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import PostureCoach from "./pages/PostureCoach/PostureCoach.jsx";
import PWAInstallBanner from "./Components/PWAInstallBanner.jsx";
import FitBotWidget from "./pages/FitBot/Section1.jsx";
import SplashScreen from "./Components/SplashScreen.jsx";
import ScrollToTopButton from "./Components/ScrollToTopButton.jsx";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "./Components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminAuditTrail from "./pages/Admin/AuditTrail";
import AdminFeedback from "./pages/Admin/Feedback";
import AdminSupport from "./pages/Admin/Support";
import AdminIncome from "./pages/Admin/Income";
import AdminChallenges from "./pages/Admin/Challenges";
import Community from "./pages/Community/Community.jsx";
import NoPageFound from "./pages/NoPageFound/NoPageFound.jsx";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLoginStatus = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("user");

    // Auto-hydrate Redux on startup if user exists in storage
    if (savedUser && savedUser !== "undefined") {
      try {
        dispatch(setUser(JSON.parse(savedUser)));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    return savedLoginStatus === "true";
  });

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);

    // Splash screen timer
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 2800); // 2.8 seconds loading overlay

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isSplashLoading) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname, isSplashLoading]);

  useEffect(() => {
    if (isSplashLoading) return;
    const storageKey = "genfit_daily_tick";
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(storageKey) === today) return;
    fetch(`${API_BASE_URL}/api/maintenance/daily-tick`, { method: "POST" })
      .then((res) => {
        if (res.ok) localStorage.setItem(storageKey, today);
      })
      .catch(() => {});
  }, [isSplashLoading]);

  if (isSplashLoading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      {" "}
      {/* Wrap the entire application with ThemeProvider */}
      <div className="w-screen min-h-screen">
        <PWAInstallBanner /> {/* Removed bg-white and text-black */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/CurrentBMI" element={<EnhancedBMICalculator />} />
          <Route path="/AiCoach" element={<LostItems />} />
          <Route path="/VirtualTA" element={<PostureCoach />} />
          <Route path="/EditProfile" element={<EditProfile />} />
          <Route path="/Workout" element={<MyListings />} />
          <Route path="/VerificationPage" element={<VerificationPage />} />
          <Route path="/ContactUs" element={<Contactus />} />
          <Route path="/Feedback" element={<UserFeedback />} />
          <Route path="/Support" element={<UserSupport />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />

          <Route path="/UserLogs" element={<UserLogsPage />} />
          <Route path="/calorie-tracker" element={<CalorieTracker />} />
          <Route path="/AllUsersLogs" element={<AllUserLogsPage />} />
          <Route path="/my-workout-plan" element={<MyWorkoutPlan />} />
          <Route path="/diet-chart" element={<DietChartGenerator />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/daily-steps" element={<NoPageFound />} />
          {/* Optional alias route for direct access */}
          <Route path="/posture-coach" element={<PostureCoach />} />
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
          {/* Features & product overview */}
          <Route path="/features" element={<Features />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit" element={<AdminAuditTrail />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="income" element={<AdminIncome />} />
            <Route path="challenges" element={<AdminChallenges />} />
          </Route>

          <Route path="/no-page-found" element={<NoPageFound />} />
          <Route path="*" element={<NoPageFound />} />
        </Routes>
        {!isAdminRoute && <FitBotWidget />}
        <ScrollToTopButton />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme="dark"
          limit={5}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
