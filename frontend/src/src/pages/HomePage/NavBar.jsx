import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, setUser } from "../../redux/userSlice";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { FiMenu, FiX, FiUser, FiEdit2, FiLogOut } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext"; // Import useTheme
import { Brain, Sparkles } from "lucide-react"; // Import Lucide icons for logo
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

export default function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [role, setRole] = useState("user");

  const { darkMode } = useTheme(); // Access dark mode state

  const getUserInitials = (user) => {
    if (user && user.firstName) {
      return user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`
        : `${user.firstName[0]}`;
    }
    return "";
  };

  const handleLogout = async () => {
    try {
      dispatch(setUser(null));
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      setDropdownOpen(false);
      toast.success("Logged out successfully", {
        autoClose: 2000,
        onClose: () => navigate("/"),
      });
    } catch (error) {
      console.error("Error during logout", error);
      toast.error("Logout failed", { autoClose: 2000 });
    }
  };

  const handleLoginSuccess = async (response) => {
    try {
      const { credential } = response;

      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH}/login`,
        {
          token: credential,
          role,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            // Add these headers if needed
            Accept: "application/json",
          },
        }
      );

      dispatch(setUser(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("isLoggedIn", "true");
      setRole(res.data.user.role);

      toast.success("Logged in successfully", {
        autoClose: 1000,
        onClose: () => navigate("/CurrentBMI"),
      });
    } catch (error) {
      console.error("Error during login", error);

      // Better error handling
      let errorMessage = "Login failed";
      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "Network error. Please check your connection.";
      }

      toast.error(errorMessage, { autoClose: 2000 });
    }
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      dispatch(setUser(savedUser));
      setRole(savedUser.role);
    }
  }, [dispatch]);

  const navLinks = [
    { path: "/", label: "HOME" },
    ...(!user
      ? [
          { path: "/about", label: "ABOUT US" },
          { path: "/features", label: "FEATURES" }, // New tab for non-signed-in users
          { path: "/Contactus", label: "CONTACT US" },
        ]
      : [
          { path: "/Aicoach", label: "AI COACH" },
          { path: "/VirtualTA", label: "VIRTUAL TRAINING ASSISTANT" },
          { path: "/CurrentBMI", label: "CURRENT BMI" },
          { path: "/calorie-tracker", label: "CALORIE TRACKER" },
          { path: "/Workout", label: "WORKOUT" },
        ]),
  ];

  return (
    <>
      {/* Removed ToastContainer as it's now in App.jsx */}
      <GoogleOAuthProvider clientId="702465560392-1mu8j4kqafadep516m62oa5vf5klt7pu.apps.googleusercontent.com">
        <nav className="sticky top-0 left-0 w-full z-50 bg-gray-900 shadow-lg text-white">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <button
                className="md:hidden mr-4 text-gray-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
              <NavLink
                to="/"
                className="text-2xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Brain
                  className={`w-8 h-8 ${
                    darkMode ? "text-green-400" : "text-green-600"
                  } mr-1`}
                />
                <Sparkles
                  className={`w-5 h-5 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  } mr-2`}
                />
                <span
                  className={`bg-clip-text text-transparent ${
                    darkMode
                      ? "bg-gradient-to-r from-green-400 to-blue-500"
                      : "bg-gradient-to-r from-green-600 to-blue-800"
                  }`}
                >
                  GenFit AI
                </span>
              </NavLink>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* User Icons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <div
                    className="flex items-center space-x-2 cursor-pointer group"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium bg-blue-700 text-white">
                      {getUserInitials(user)}
                    </div>
                    <span className="hidden md:inline text-gray-200">
                      <b>
                        {user.firstName} {user.lastName ? user.lastName : ""}
                      </b>
                    </span>
                  </div>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 bg-gray-800 border border-gray-700">
                      <NavLink
                        to="/EditProfile"
                        className="block px-4 py-2 text-sm flex items-center text-gray-200 hover:bg-gray-700"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiEdit2 className="mr-2" /> Edit Profile
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm flex items-center text-gray-200 hover:bg-gray-700"
                      >
                        <FiLogOut className="mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() =>
                    toast.error("Login failed", { autoClose: 2000 })
                  }
                  theme="filled_blue"
                  shape="pill"
                  size="medium"
                  text="signin_with"
                />
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-gray-800 shadow-xl">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-base font-medium flex items-center ${
                        isActive
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </GoogleOAuthProvider>
    </>
  );
}
