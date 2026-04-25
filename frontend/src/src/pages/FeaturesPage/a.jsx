import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import GenFitLogo from "../../Components/GenFitLogo";
import { useTheme } from "../../context/ThemeContext";
import { Brain, Activity, ShieldCheck, Trophy, LineChart } from "lucide-react";

const coreFeatures = [
  {
    icon: <Brain className="w-7 h-7 text-[#22D3EE]" />,
    title: "Adaptive AI Coaching",
    description:
      "Session-by-session adjustments to your plan based on performance, recovery, and goals.",
    tag: "Smart workouts",
  },
  {
    icon: <Activity className="w-7 h-7 text-[#8B5CF6]" />,
    title: "Real-Time Form & Posture",
    description:
      "Computer-vision–powered insights to keep every rep safe, efficient, and effective.",
    tag: "Posture coach",
  },
  {
    icon: <LineChart className="w-7 h-7 text-[#22D3EE]" />,
    title: "Progress Intelligence",
    description:
      "Clean charts and trends that show exactly what’s working so you can double down.",
    tag: "Insights",
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-[#8B5CF6]" />,
    title: "Built-In Recovery & Mindfit",
    description:
      "Guided breathing, light sessions, and recovery recommendations to avoid burnout.",
    tag: "Mind & body",
  },
  {
    icon: <Trophy className="w-7 h-7 text-[#FACC15]" />,
    title: "Gamified Motivation",
    description:
      "Streaks, badges, and leaderboards that make consistency feel like a game, not a chore.",
    tag: "Motivation",
  },
];

export default function Features() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? "bg-[#05010d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <NavBar />

      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl ${darkMode ? 'opacity-30' : 'opacity-10'}`} />
            <div className={`absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl ${darkMode ? 'opacity-25' : 'opacity-10'}`} />
          </div>
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8 lg:mb-10">
              <div className="flex flex-col items-center justify-center mb-4">
                <GenFitLogo size="xllarge" className="mb-2" />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
                  The Complete{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                    AI Training Stack
                  </span>
                </h1>
              </div>

              <p className={`max-w-3xl mx-auto text-sm sm:text-base lg:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Precision coaching, form tracking, and smart nutrition—powered
                by AI, designed for real humans.
              </p>
            </header>

            {/* Feature grid */}
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
              {coreFeatures.map((feature, idx) => (
                <article
                  key={feature.title}
                  className={`relative h-full rounded-2xl border backdrop-blur-xl p-5 sm:p-6 flex flex-col transition-transform duration-300 hover:-translate-y-1.5 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white shadow-lg hover:border-[#8B5CF6]/40 hover:shadow-xl'}`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-11 h-11 rounded-xl border ${darkMode ? 'bg-[#020617] border-[#1F2937]' : 'bg-gray-50 border-gray-200'}`}>
                        {feature.icon}
                      </div>
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Feature {String(idx + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      {feature.tag}
                    </span>
                  </div>

                  <h2 className={`text-lg sm:text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h2>
                  <p className={`text-sm sm:text-base flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>

            {/* Metrics strip */}
            <section className="mb-10 sm:mb-14">
              <div className={`rounded-2xl border backdrop-blur-xl px-5 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-5 ${darkMode ? 'border-[#1F2937] bg-gradient-to-r from-[#020617] via-[#020617] to-[#020617]' : 'border-gray-200 bg-white shadow-lg'}`}>
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Built for long-term progress
                  </h3>
                  <p className={`text-sm sm:text-base max-w-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    No more random programs. Every block builds on the last so
                    you can see steady strength, energy, and confidence gains.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm">
                  <div className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>+32%</div>
                    <div className="text-gray-400 text-[11px]">
                      Avg. adherence
                    </div>
                  </div>
                  <div className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>4.9/5</div>
                    <div className="text-gray-400 text-[11px]">User rating</div>
                  </div>
                  <div className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>24/7</div>
                    <div className="text-gray-400 text-[11px]">AI support</div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center">
              <div className={`inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-5 rounded-2xl border backdrop-blur-xl px-6 sm:px-8 py-6 sm:py-7 ${darkMode ? 'border-[#22D3EE]/40 bg-gradient-to-r from-[#020617]/90 via-[#05010d]/90 to-[#020617]/90' : 'border-purple-200 bg-white shadow-xl'}`}>
                <div className="text-left">
                  <h3 className={`text-lg sm:text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    See these features in action
                  </h3>
                  <p className={`text-sm sm:text-base max-w-md ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Create your free GenFit AI profile and get a personalized
                    starting plan in under 60 seconds.
                  </p>
                </div>
                <Link
                  to="/home#ready-to-start-training"
                  className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] hover:opacity-95 transition-all duration-300 shadow-lg hover:shadow-[#22D3EE]/40"
                >
                  Get Started
                </Link>
              </div>
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
