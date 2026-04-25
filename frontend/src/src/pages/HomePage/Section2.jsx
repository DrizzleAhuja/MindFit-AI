// Section2.js - Updated with professional styling
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Activity, Target, Users, Check, Heart, Dumbbell, ArrowRight } from "lucide-react";
import { useTheme } from '../../context/ThemeContext'; // Corrected Import useTheme path

const Section2 = () => {
  const features = [
    {
      icon: <Activity className="w-6 h-6 text-[#22D3EE]" />,
      title: "Holistic Wellness",
      description: "Balance mind and body with guided habits for resilience and vitality."
    },
    {
      icon: <Target className="w-6 h-6 text-[#8B5CF6]" />,
      title: "Personalized Coaching",
      description: "Adaptive plans for workouts, recovery, and mindfulness—tailored to you."
    },
    {
      icon: <Users className="w-6 h-6 text-[#22D3EE]" />,
      title: "Supportive Community",
      description: "Stay motivated with programs designed for sustainable progress."
    }
  ];

  const { darkMode } = useTheme(); // Access dark mode state

  return (
    <section className={`py-20 transition-colors duration-300 ${
      darkMode
        ? 'bg-[#05010d] text-gray-100'
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
            MindFit
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Where mental wellness meets fitness. Train your body, strengthen your mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`p-8 rounded-xl shadow-lg transition-all hover:shadow-xl ${
                darkMode
                  ? 'bg-[#0B1020] border border-[#1F2937]'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {feature.icon}
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className={`rounded-2xl overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-br from-[#020617] via-[#05010d] to-[#020617] border border-[#1F2937]'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-12 flex flex-col justify-center">
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Start your MindFit journey</h2>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Build routines that improve focus, mood, and physical performance—together.
              </p>
              <Link 
                to="/signup" 
                className="flex items-center justify-center w-full md:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-white font-medium hover:opacity-90 transition-all"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className={`hidden md:flex items-center justify-center p-8 ${
              darkMode ? 'bg-[#020617]' : 'bg-gray-50'
            }`}>
              <div className="relative w-full h-64">
                <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-xl opacity-20 bg-[#8B5CF6]"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-xl opacity-20 bg-[#22D3EE]"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <div className={`p-6 rounded-2xl shadow-lg ${
                    darkMode ? 'bg-[#05010d] border border-[#1F2937]' : 'bg-[#020617] border border-[#1F2937]'
                  }`}>
                    <div className="flex items-center mb-4">
                      <Dumbbell className="text-[#22D3EE] mr-3" />
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-100'}`}>Today's MindFit Plan</span>
                    </div>
                    <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex justify-between">
                        <span>Breathing Practice</span>
                        <span className="font-medium">5 min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Strength Circuit</span>
                        <span className="font-medium">3 rounds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gratitude Note</span>
                        <span className="font-medium">2 min</span>
                      </div>
                    </div>
                    <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'} flex items-center justify-between`}>
                      <div className="flex items-center">
                        <Heart className="text-[#8B5CF6] mr-2" />
                        <span className="text-sm">Rest & Recovery</span>
                      </div>
                      <span className="text-sm font-medium text-[#22D3EE]">Balanced</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Section2;