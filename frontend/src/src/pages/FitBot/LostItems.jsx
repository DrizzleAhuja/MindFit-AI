import React from "react";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Sparkles } from 'lucide-react';

export default function LostItems() {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <NavBar />
      <main>
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8 lg:mb-10">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                <span className="text-xs sm:text-sm font-semibold text-gray-100">
                  AI-Powered Coaching
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                AI{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Coach
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300">
                Get personalized fitness guidance powered by advanced AI. Your intelligent training companion.
              </p>
            </header>
          </div>
        </section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pb-10">
          <div className="rounded-2xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-5 sm:p-6 text-center">
            <p className="text-gray-200 text-sm sm:text-base">
              FitBot is now available on <b>every page</b>.
              Use the <b>bottom-right chat button</b> to open it anytime.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
