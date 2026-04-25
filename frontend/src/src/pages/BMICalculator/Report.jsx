import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3 from "./Section3";
import Section4 from "./Section4";
import Footer from "../HomePage/Footer";
import { useTheme } from "../../context/ThemeContext";

export default function Report() {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? "bg-[#020617] text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <NavBar />
      <div>
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Footer />
      </div>
    </div>
  );
}
