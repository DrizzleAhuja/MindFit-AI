import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function NoPageFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();

  const reason = location.state?.reason;

  useEffect(() => {
    // Keep title helpful for users sharing the page
    document.title = "No Page Found | GenFit AI";
  }, []);

  const subtitle =
    reason === "access"
      ? "You don’t have access to this page."
      : "The page you’re looking for doesn’t exist.";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#05010d] text-white" : "bg-gray-50 text-gray-900"}`}>
      <NavBar />
      <main className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl text-center rounded-2xl border border-[#1F2937] bg-[#020617]/60 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] p-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 font-bold">
            !
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold">No Page Found</h1>
          <p className="mt-3 text-sm sm:text-base text-gray-300">{subtitle}</p>

          <div className="mt-7">
            <button
              onClick={() => navigate("/")}
              className="px-7 py-3 rounded-full bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] text-white font-semibold hover:opacity-95 transition"
            >
              Go back to home page
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

