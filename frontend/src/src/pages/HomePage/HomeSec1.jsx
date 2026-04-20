import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  Shield,
  Globe,
  Dumbbell,
} from "lucide-react";
import { motion } from "framer-motion";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import GenFitLogo from "../../Components/GenFitLogo";
import WorkoutScene from "../../Components/GenFitAssistant";
import { useTheme } from "../../context/ThemeContext";

const HomeSec1 = ({ onLoginSuccess, onLoginError }) => {
  const { darkMode } = useTheme();
  return (
    <section className={`relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 transition-colors duration-300 ${
      darkMode ? "bg-[#05010d]" : "bg-gray-50"
    }`}>
      {/* Background blobs for premium feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-[#10B981] rounded-full blur-[140px] opacity-[0.07]"
          animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-0 w-[500px] h-[500px] bg-[#3B82F6] rounded-full blur-[140px] opacity-[0.07]"
          animate={{ scale: [1, 1.05, 1], x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column: Text & CTA */}
          <motion.div
            className="lg:col-span-7 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl mb-8 ${
              darkMode ? "bg-white/5 border-white/10" : "bg-emerald-50 border-emerald-200"
            }`}>
              <span className={`text-xs font-black tracking-widest uppercase ${
                darkMode ? "text-[#10B981]" : "text-emerald-600"
              }`}>
                India's #1 AI Fitness Platform · 2026
              </span>
            </div>

            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black mb-8 leading-[1.05] tracking-tight ${
              darkMode ? "text-white" : "text-gray-900"
            }`}>
              Train Smarter.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10B981] via-[#3B82F6] to-[#8B5CF6]">
                Live Better.
              </span>
            </h1>

            <div className="space-y-6 mb-12">
              <p className={`text-lg md:text-xl leading-relaxed font-medium ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}>
                GenFit AI is a full-stack health platform powered by real-time
                computer vision, agentic AI coaching, and verified sports
                science — built for India and the world.
              </p>
              <p className={`text-base md:text-lg leading-relaxed font-medium ${
                darkMode ? "text-gray-500" : "text-gray-500"
              }`}>
                From posture correction to personalised diet plans, our platform
                covers your entire fitness journey in one place —{" "}
                <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  completely free to start.
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-16 items-center">
              <div
                id="google-login"
                className="shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-shadow duration-300 rounded-full overflow-hidden"
              >
                <GoogleOAuthProvider clientId="210526097600-m437ldngthea5krkmo4e8k07k6iouv99.apps.googleusercontent.com">
                  <GoogleLogin
                    onSuccess={onLoginSuccess}
                    onError={onLoginError}
                    theme={darkMode ? "filled_black" : "outline"}
                    shape="pill"
                    size="large"
                    text="signin_with"
                  />
                </GoogleOAuthProvider>
              </div>
              <Link
                to="/features"
                className={`group flex items-center gap-2 font-bold transition-all px-8 py-3 rounded-full border ${
                  darkMode
                    ? "text-white hover:text-[#10B981] hover:bg-white/5 border-white/10"
                    : "text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 border-gray-200"
                }`}
              >
                Learn More{" "}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className={`pt-8 border-t ${darkMode ? "border-white/5" : "border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
                  Aligned With
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Fit India Movement", icon: Target },
                  { label: "ICMR Guidelines", icon: Shield },
                  { label: "WHO Health GAP 2026", icon: Globe },
                  { label: "MoveNet by Google", icon: Zap },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className={`flex items-center gap-3 px-5 py-3 border rounded-xl transition-all duration-300 group/pill cursor-default ${
                      darkMode
                        ? "bg-[#0a0a0f] border-white/10 hover:border-[#22D3EE]/50"
                        : "bg-white border-gray-200 hover:border-purple-300 shadow-sm"
                    }`}
                    whileHover={{ y: -2 }}
                  >
                    <item.icon className="w-4 h-4 text-[#22D3EE]" />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${
                      darkMode ? "text-white" : "text-gray-700"
                    }`}>
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Procedural Animation Element */}
          <motion.div
            className="lg:col-span-5 relative scale-110 lg:scale-125 origin-center lg:origin-right"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="relative flex justify-center items-center">
              {/* Dynamic Aura */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/20 via-[#3B82F6]/10 to-transparent blur-[120px] rounded-full animate-pulse" />

              {/* The AI Assistant Animation */}
              <div className="relative z-10 w-full transform transition-transform duration-700">
                <WorkoutScene size="large" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomeSec1;
