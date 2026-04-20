import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import GenFitLogo from "../../Components/GenFitLogo";
import { useTheme } from "../../context/ThemeContext";
import { Brain, Target, Heart, TrendingUp, Award } from "lucide-react";

export default function About() {
  const { darkMode } = useTheme();

  const features = [
    {
      icon: <Brain className="w-7 h-7 text-[#22D3EE]" />,
      title: "AI-Powered Insights",
      description:
        "Personalized recommendations based on your unique health data and goals",
      tag: "Intelligence",
    },
    {
      icon: <Target className="w-7 h-7 text-[#8B5CF6]" />,
      title: "Custom Workouts",
      description:
        "Tailored exercise plans that adapt to your fitness level and preferences",
      tag: "Training",
    },
    {
      icon: <Heart className="w-7 h-7 text-[#22D3EE]" />,
      title: "Mindfulness & Meditation",
      description:
        "Guided sessions to reduce stress and improve mental clarity",
      tag: "Wellness",
    },
    {
      icon: <TrendingUp className="w-7 h-7 text-[#8B5CF6]" />,
      title: "Nutrition Tracking",
      description:
        "Smart meal planning and nutritional insights for optimal health",
      tag: "Nutrition",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50K+", label: "Workouts Completed" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "24/7", label: "AI Support" },
  ];

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
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8 lg:mb-10">
              <div className="flex flex-col items-center justify-center mb-4">
                <GenFitLogo size="large" className="mb-2" />
                <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  About the Platform
                </h1>
              </div>

              <p className={`max-w-3xl mx-auto text-sm sm:text-base lg:text-lg ${darkMode ? "text-gray-300" : "text-gray-500 font-medium"}`}>
                Revolutionizing personal wellness through intelligent,
                data-driven solutions designed for real-world results.
              </p>
            </header>

            {/* Mission Statement */}
            <div className="mb-12 sm:mb-16">
              <div className={`rounded-2xl border backdrop-blur-xl p-6 sm:p-8 lg:p-12 shadow-xl ${
                darkMode ? "bg-[#020617]/80 border-[#1F2937]" : "bg-white border-gray-100"
              }`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                  <div>
                    <h2 className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Our Mission
                    </h2>
                    <p className={`text-sm sm:text-base lg:text-lg leading-relaxed mb-4 ${darkMode ? "text-gray-300" : "text-gray-600 font-medium"}`}>
                      We empower individuals to achieve optimal mental and
                      physical health through personalized guidance,
                      cutting-edge AI technology, and a supportive community.
                    </p>
                    <p className={`text-sm sm:text-base lg:text-lg leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600 font-medium"}`}>
                      Our platform integrates innovative solutions to help you
                      build sustainable habits for a balanced and fulfilling
                      life.
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className={`w-full h-48 sm:h-56 lg:h-64 rounded-xl flex items-center justify-center text-6xl sm:text-7xl lg:text-8xl border ${
                      darkMode ? "bg-gradient-to-br from-[#020617] via-[#05010d] to-[#020617] border-[#1F2937]" : "bg-purple-50 border-purple-100"
                    }`}>
                      🎯
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mb-12 sm:mb-16">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 ${darkMode ? "text-white" : "text-gray-900"}`}>
                What We Offer
              </h2>
              <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                {features.map((feature, idx) => (
                  <article
                    key={feature.title}
                    className={`relative h-full rounded-2xl border backdrop-blur-xl p-5 sm:p-6 flex flex-col shadow-xl transition-all duration-300 hover:-translate-y-1.5 ${
                      darkMode ? "bg-[#020617]/80 border-[#1F2937] hover:border-[#22D3EE]/60" : "bg-white border-gray-100 hover:border-purple-300 shadow-purple-500/5"
                    }`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-11 h-11 rounded-xl border ${
                          darkMode ? "bg-[#020617] border-[#1F2937]" : "bg-purple-50 border-purple-100"
                        }`}>
                          {feature.icon}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-600"}`}>
                        {feature.tag}
                      </span>
                    </div>

                    <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm sm:text-base flex-1 ${darkMode ? "text-gray-300" : "text-gray-500 font-medium"}`}>
                      {feature.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {/* Stats Section */}
            <div className="mb-10 sm:mb-14">
              <div className={`rounded-2xl border backdrop-blur-xl px-5 sm:px-8 py-6 sm:py-7 shadow-xl ${
                darkMode ? "bg-gradient-to-r from-[#020617] via-[#020617] to-[#020617] border-[#1F2937]" : "bg-white border-gray-100"
              }`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  GenFit AI by the Numbers
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {stat.value}
                      </div>
                      <div className={`text-sm sm:text-base lg:text-lg ${darkMode ? "text-gray-300" : "text-gray-500 font-medium"}`}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <section className="text-center">
              <div className={`inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-5 rounded-2xl border backdrop-blur-xl px-6 sm:px-8 py-6 sm:py-7 ${
                darkMode ? "border-[#22D3EE]/40 bg-gradient-to-r from-[#020617]/90 via-[#05010d]/90 to-[#020617]/90" : "bg-white border-purple-100 shadow-xl"
              }`}>
                <div className="text-left">
                  <h3 className={`text-lg sm:text-xl font-bold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Ready to Transform Your Life?
                  </h3>
                  <p className={`text-sm sm:text-base max-w-md ${darkMode ? "text-gray-300" : "text-gray-500 font-medium"}`}>
                    Join thousands of users who are already on their journey to
                    better health and wellness.
                  </p>
                </div>
                <Link
                  to="/home#ready-to-start-training"
                  className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] hover:opacity-95 transition-all duration-300 shadow-lg hover:shadow-[#22D3EE]/40"
                >
                  Get Started Today
                  <Award className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
