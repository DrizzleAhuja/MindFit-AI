import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, setUser } from "../../redux/userSlice";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  useGoogleLogin,
} from "@react-oauth/google";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import {
  FiMenu,
  FiX,
  FiUser,
  FiEdit2,
  FiLogOut,
  FiBell,
  FiCheck,
  FiMessageSquare,
  FiHelpCircle,
  FiUsers,
  FiBarChart2,
  FiSun,
  FiMoon,
} from "react-icons/fi";

import { io } from "socket.io-client";
import {
  LayoutDashboard,
  Users as UsersIcon,
  Info,
  Sparkles,
  Mail,
  Bot,
  Scale,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Trophy,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import { isPWAInstalled } from "../../utils/pwaInstall";
import { getOAuthErrorMessage, isPWAMode } from "../../utils/googleOAuthPWA";
import GenFitLogo from "../../Components/GenFitLogo";

export default function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [role, setRole] = useState("user");
  const [isStandalone, setIsStandalone] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const { darkMode, toggleDarkMode } = useTheme();

  // Check if running as PWA
  useEffect(() => {
    setIsStandalone(isPWAInstalled());
  }, []);

  // Sunday Auto-Report Trigger
  useEffect(() => {
    const triggerAutoReport = async () => {
      if (user?._id && new Date().getDay() === 0) {
        const hasCheckedToday = sessionStorage.getItem(
          `sunday_report_check_${user._id}`,
        );
        if (!hasCheckedToday) {
          try {
            await axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/weekly-report/auto-trigger`,
              { userId: user._id },
            );
            sessionStorage.setItem(`sunday_report_check_${user._id}`, "true");
          } catch (e) {
            console.error("Auto-report trigger failed", e);
          }
        }
      }
    };
    triggerAutoReport();
  }, [user?._id]);

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

      if (!credential) {
        toast.error("No credential received from Google", { autoClose: 2000 });
        return;
      }

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
            Accept: "application/json",
          },
        },
      );

      dispatch(setUser(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("isLoggedIn", "true");
      setRole(res.data.user.role);

      toast.success("Logged in successfully", {
        autoClose: 1000,
        onClose: () => navigate("/"),
      });
    } catch (error) {
      console.error("Error during login", error);

      let errorMessage = "Login failed";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      toast.error(errorMessage, { autoClose: 2000 });
    }
  };

  const handleLoginError = (error) => {
    console.error("Google login error:", error);

    const errorInfo = getOAuthErrorMessage(error);

    toast.error(`${errorInfo.title}: ${errorInfo.message}`, {
      autoClose: 5000,
    });

    setTimeout(() => {
      toast.info(errorInfo.action, {
        autoClose: 6000,
      });
    }, 2500);

    if (isPWAMode() && error?.error !== "popup_closed_by_user") {
      setTimeout(() => {
        toast.info(
          "💡 Tip: For better sign-in experience, open this site in Chrome browser",
          { autoClose: 7000 },
        );
      }, 4000);
    }
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      dispatch(setUser(savedUser));
      setRole(savedUser.role);
    }
  }, [dispatch]);

  useEffect(() => {
    if (user && user._id) {
      // Weekly Report Trigger (Every Sunday)
      const checkWeeklyReport = async () => {
        const today = new Date();
        if (today.getDay() === 0) {
          // Sunday
          try {
            // We can just call generate. The backend handles "already generated" logic.
            await axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/weekly-report/generate`,
              {
                userId: user._id,
              },
            );
          } catch (e) {
            console.error("Auto Weekly Report failed", e);
          }
        }
      };

      const fetchNotifications = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
            withCredentials: true,
            headers: { email: user.email },
          });
          setNotifications(res.data);
        } catch (error) {
          console.error("Error fetching notifications", error);
        }
      };

      fetchNotifications();

      const socket = io(API_BASE_URL, {
        query: { userId: user._id },
      });

      socket.on("newNotification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast.info(`🔔 ${notification.title}`, { autoClose: 4000 });
      });

      const handleNotificationsUpdated = () => {
        fetchNotifications();
      };

      window.addEventListener(
        "notificationsUpdated",
        handleNotificationsUpdated,
      );

      return () => {
        socket.disconnect();
        window.removeEventListener(
          "notificationsUpdated",
          handleNotificationsUpdated,
        );
      };
    }
  }, [user]);

  const navLinks = [
    ...(user && user.role !== "admin"
      ? [{ path: "/", label: "Dashboard", icon: LayoutDashboard }]
      : []),
    ...(user && user.role === "admin"
      ? [
          {
            path: "/admin/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          { path: "/admin/users", label: "Users", icon: UsersIcon },
        ]
      : []),
    ...(!user
      ? [
          { path: "/about", label: "About", icon: Info },
          { path: "/features", label: "Features", icon: Sparkles },
          { path: "/Contactus", label: "Contact", icon: Mail },
          { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
        ]
      : user.role === "admin"
        ? [] // Hide user pages for Admin
        : [
            { path: "/VirtualTA", label: "VTA", icon: Bot },
            { path: "/CurrentBMI", label: "Current BMI", icon: Scale },
            { path: "/calorie-tracker", label: "Calorie", icon: Flame },
            { path: "/Workout", label: "Workout", icon: Dumbbell },
            { path: "/diet-chart", label: "Diet", icon: UtensilsCrossed },
            { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
          ]),
  ];

  return (
    <>
      <GoogleOAuthProvider
        clientId="210526097600-m437ldngthea5krkmo4e8k07k6iouv99.apps.googleusercontent.com"
        onScriptLoadError={() => {
          console.error("Google OAuth script failed to load");
          toast.error(
            "Google sign-in unavailable. Please check your connection.",
            {
              autoClose: 3000,
            },
          );
        }}
        onScriptLoadSuccess={() => {
          console.log("Google OAuth script loaded successfully");
        }}
      >
        {/* Desktop Navbar */}
        <nav
          className={`hidden lg:block sticky top-0 left-0 w-full z-50 backdrop-blur-xl shadow-lg transition-colors duration-300 ${darkMode ? "bg-[#05010d]/95 border-b border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.35)] text-white" : "bg-white/95 border-b border-gray-200 text-gray-900"}`}
        >
          <div className="container mx-auto px-6 py-3 flex justify-between items-center">
            {/* Logo */}
            <GenFitLogo size="default" isHeader={true} />

            {/* Desktop Navigation Links */}
            <div className="flex items-center gap-2 xl:gap-3 max-w-[56vw] overflow-x-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `group relative inline-flex items-center justify-center h-12 px-5 rounded-2xl text-[13px] xl:text-sm leading-none font-semibold tracking-[0.02em] whitespace-nowrap border overflow-hidden transition-all duration-300 ${
                      isActive
                        ? darkMode
                          ? "text-white border-[#22D3EE]/70 shadow-[0_10px_24px_rgba(34,211,238,0.22)]"
                          : "text-[#1e293b] border-[#8B5CF6]/50 shadow-[0_10px_24px_rgba(139,92,246,0.16)]"
                        : darkMode
                          ? "text-gray-200 bg-white/[0.04] border-[#2b3548] hover:text-white hover:border-[#22D3EE]/55 hover:shadow-[0_8px_18px_rgba(34,211,238,0.14)]"
                          : "text-gray-700 bg-white border-gray-200 hover:text-gray-900 hover:border-[#8B5CF6]/45 hover:shadow-[0_8px_18px_rgba(139,92,246,0.12)]"
                    }`
                  }
                >
                  {({ isActive }) => {
                    const Icon = link.icon;
                    return (
                      <>
                        <span
                          className={`absolute inset-0 transition-opacity duration-300 ${
                            isActive
                              ? darkMode
                                ? "bg-gradient-to-r from-[#8B5CF6]/35 to-[#22D3EE]/30 opacity-100"
                                : "bg-gradient-to-r from-[#8B5CF6]/18 to-[#22D3EE]/22 opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        <span className="relative z-10 inline-flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 ${isActive ? "text-[#22D3EE]" : "text-gray-400 group-hover:text-[#22D3EE]"}`}
                          />
                          <span>{link.label}</span>
                        </span>
                      </>
                    );
                  }}
                </NavLink>
              ))}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-6">
                  {/* Notifications Bell */}
                  <div className="relative">
                    <div
                      className="relative cursor-pointer text-gray-300 hover:text-white transition-colors"
                      onClick={() => {
                        navigate("/notifications");
                        setDropdownOpen(false);
                      }}
                    >
                      <FiBell size={22} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <div
                      className="flex items-center space-x-2 cursor-pointer group"
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                      }}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-[#8B5CF6]/50 shadow-[0_0_10px_rgba(139,92,246,0.3)] bg-[#0f172a]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium bg-[#8B5CF6] text-white">
                          {getUserInitials(user)}
                        </div>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-gray-200">
                          <b>
                            {user.firstName}{" "}
                            {user.lastName ? user.lastName : ""}
                          </b>
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 mt-0.5 rounded-sm shadow-sm ${user.plan === "pro" ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black" : "bg-gray-600 text-gray-200"}`}
                        >
                          {user.plan === "pro" ? "PRO" : "FREE"}
                        </span>
                      </div>
                    </div>
                    {dropdownOpen && (
                      <div
                        className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 backdrop-blur-xl border ${darkMode ? "bg-[#020617]/95 border-[#1F2937]" : "bg-white border-gray-200"}`}
                      >
                        <NavLink
                          to="/EditProfile"
                          className={`flex px-4 py-2 text-sm items-center ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiUser className="mr-2" /> My Profile
                        </NavLink>
                        <NavLink
                          to="/community"
                          className={`flex px-4 py-2 text-sm items-center ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiUsers className="mr-2" /> Community
                        </NavLink>
                        <NavLink
                          to="/weekly-report"
                          className={`flex px-4 py-2 text-sm items-center font-bold text-[#22D3EE] ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiBarChart2 className="mr-2" /> Weekly AI Report
                        </NavLink>
                        <NavLink
                          to="/Feedback"
                          className={`flex px-4 py-2 text-sm items-center ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiMessageSquare className="mr-2" /> Feedback
                        </NavLink>
                        <NavLink
                          to="/Support"
                          className={`flex px-4 py-2 text-sm items-center ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiHelpCircle className="mr-2" /> Support
                        </NavLink>

                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          <FiLogOut className="mr-2" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  theme="filled_blue"
                  shape="pill"
                  size="medium"
                  text="signin_with"
                  useOneTap={false}
                  auto_select={false}
                />
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Header with Menu Button */}
        <div
          className={`lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-colors duration-300 ${darkMode ? "bg-[#05010d]/95 border-b border-purple-500/40 shadow-[0_0_20px_rgba(139,92,246,0.35)] text-white" : "bg-white/95 border-b border-gray-200 shadow-md text-gray-900"}`}
        >
          <div className="flex justify-between items-center px-4 py-3">
            <button
              className="text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>

            <GenFitLogo size="small" isHeader={true} />

            {user && (
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-medium bg-[#8B5CF6] text-white text-sm cursor-pointer shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover bg-[#0f172a]"
                    />
                  ) : (
                    getUserInitials(user)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div
          className={`lg:hidden fixed top-0 left-0 h-full w-72 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${darkMode ? "bg-[#040011] border-r border-purple-500/30" : "bg-white border-r border-gray-200"} ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div
              className={`flex justify-between items-center p-4 border-b ${darkMode ? "border-purple-500/40" : "border-gray-200"}`}
            >
              <div onClick={() => setMobileMenuOpen(false)}>
                <GenFitLogo size="small" isHeader={true} />
              </div>
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiX size={24} />
              </button>
            </div>

            {/* User Info Section */}
            {user && (
              <div
                className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-medium bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover bg-[#0f172a]"
                      />
                    ) : (
                      getUserInitials(user)
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {user.firstName} {user.lastName ? user.lastName : ""}
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm shadow-sm ${user.plan === "pro" ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black" : "bg-gray-600 text-gray-200"}`}
                      >
                        {user.plan === "pro" ? "PRO" : "FREE"}
                      </span>
                    </p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-3 sm:px-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        `shrink-0 inline-flex items-center h-11 px-4 rounded-xl text-[13px] leading-none font-semibold tracking-[0.02em] whitespace-nowrap border transition-all duration-300 ${
                          isActive
                            ? darkMode
                              ? "text-white bg-gradient-to-r from-[#8B5CF6]/30 to-[#22D3EE]/25 border-[#22D3EE]/60 shadow-[0_8px_18px_rgba(34,211,238,0.18)]"
                              : "text-[#1e293b] bg-gradient-to-r from-[#8B5CF6]/12 to-[#22D3EE]/18 border-[#8B5CF6]/35 shadow-[0_8px_18px_rgba(139,92,246,0.12)]"
                            : darkMode
                              ? "text-gray-200 bg-white/[0.03] border-[#243044] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/50"
                              : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50 hover:border-[#8B5CF6]/35"
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {({ isActive }) => {
                        const Icon = link.icon;
                        return (
                          <span className="inline-flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${isActive ? "text-[#22D3EE]" : "text-gray-400"}`}
                            />
                            <span>{link.label}</span>
                          </span>
                        );
                      }}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div
              className={`border-t p-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              {user ? (
                <div className="space-y-2">
                  <NavLink
                    to="/EditProfile"
                    className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#020617]/60 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUser className="mr-3" /> My Profile
                  </NavLink>
                  <NavLink
                    to="/community"
                    className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#020617]/60 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUsers className="mr-3" /> Community
                  </NavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-gray-200 hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <FiLogOut className="mr-3" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    theme="filled_blue"
                    shape="pill"
                    size="medium"
                    text="signin_with"
                    useOneTap={false}
                    auto_select={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* User Dropdown for Mobile Top Bar */}
        {user && dropdownOpen && (
          <div
            className={`lg:hidden fixed top-16 right-4 w-48 rounded-md shadow-lg py-1 z-50 backdrop-blur-xl border ${darkMode ? "bg-[#020617]/95 border-[#1F2937]" : "bg-white border-gray-200"}`}
          >
            <NavLink
              to="/EditProfile"
              className="flex px-4 py-2 text-sm items-center text-gray-200 hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              <FiUser className="mr-2" /> My Profile
            </NavLink>
            <NavLink
              to="/community"
              className="flex px-4 py-2 text-sm items-center text-gray-200 hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              <FiUsers className="mr-2" /> Community
            </NavLink>
            <NavLink
              to="/Feedback"
              className="flex px-4 py-2 text-sm items-center text-gray-200 hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              <FiMessageSquare className="mr-2" /> Feedback
            </NavLink>
            <NavLink
              to="/Support"
              className="flex px-4 py-2 text-sm items-center text-gray-200 hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              <FiHelpCircle className="mr-2" /> Support
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm flex items-center text-gray-200 hover:bg-gray-700"
            >
              <FiLogOut className="mr-2" /> Logout
            </button>
          </div>
        )}
      </GoogleOAuthProvider>
    </>
  );
}
