import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Sparkles } from 'lucide-react';

export default function MyReports() {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <NavBar />
      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-6 sm:mb-8 lg:mb-10">
            {/* Header */}
            <header className="text-center">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                <span className="text-xs sm:text-sm font-semibold text-gray-100">
                  Workout Plans
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                Generate{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Workout Plan
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300">
                Create personalized workout plans tailored to your fitness goals and schedule.
              </p>
            </header>
          </div>
        </section>
      </main>
      <div>
        <Section1 />
      </div>
      <Footer />
    </div>
  );
}
