import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/HomePage/Home";
import Signin from "./pages/SigninPage/Signin";
import Report from "./pages/BMICalculator/Report.jsx";
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
import AdminLogsPage from "./pages/CalorieTracker/AdminLogsPage.jsx";
import  Contactus from './pages/ContactusPage/Contactus.jsx'
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true";
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLoginStatus = localStorage.getItem("isLoggedIn");
    return savedLoginStatus === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`w-screen min-h-screen bg-gray-900${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <Routes>
        <Route
          path="/"
          element={<Home darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/home"
          element={<Home darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/signin"
          element={
            <Signin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/notifications"
          element={
            <NotificationsPage
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
        <Route
          path="/CurrentBMI"
          element={
            <Report darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/AiCoach"
          element={
            <LostItems darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/VirtualTA"
          element={
            <FoundItems darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/EditProfile"
          element={
            <EditProfile darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/Workout"
          element={
            <MyListings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/VerificationPage"
          element={
            <VerificationPage
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
         <Route
          path="/ContactUs"
          element={
            <Contactus
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
       
        <Route
          path="/UserLogs"
          element={
            <UserLogsPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/AllUsersLogs"
          element={
            <AllUserLogsPage
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
        <Route
          path="/Calorietracker"
          element={
            <AdminLogsPage
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
      </Routes>
      <ToastContainer
        theme={darkMode ? "dark" : "light"}
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
