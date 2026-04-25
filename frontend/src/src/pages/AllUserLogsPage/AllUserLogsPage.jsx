import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1"; // This will display user logs
import Footer from "../HomePage/Footer";
import { useTheme } from "../../context/ThemeContext";

export default function AllUserLogsPage() {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? "bg-[#020617] text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <NavBar />
      <div>
        <Section1 />
        <Footer />
      </div>
    </div>
  );
}
