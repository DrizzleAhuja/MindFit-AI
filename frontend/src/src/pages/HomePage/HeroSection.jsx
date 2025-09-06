import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext'; // Corrected Import useTheme path

const HeroSection = () => {
  const { darkMode } = useTheme();

  return (
    <section className={`relative overflow-hidden py-24 md:py-32 lg:py-40 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo Placeholder - Will be replaced by actual image later */}
          <div className="flex justify-center items-center mb-6">
            <Brain className={`w-16 h-16 ${darkMode ? 'text-green-400' : 'text-green-600'} mr-3`} />
            <Sparkles className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h1 className={`text-4xl md:text-6xl font-extrabold mb-6 leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <span className={`bg-clip-text text-transparent ${darkMode ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gradient-to-r from-green-600 to-blue-800'}`}>
              GenFit AI
              
            </span>
            : Train Your Mind, Optimize Your Life
          </h1>
          <p className={`text-lg md:text-xl mb-10 max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Harness the power of AI to personalize your wellness journey, blending mental resilience with physical performance for a balanced and fulfilling life.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/signup"
              className={`flex items-center px-8 py-3 rounded-full text-lg font-semibold transition-all shadow-lg ${darkMode ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white' : 'bg-gradient-to-r from-green-600 to-blue-800 hover:from-green-700 hover:to-blue-900 text-white'}`}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/learn-more"
              className={`flex items-center px-8 py-3 rounded-full text-lg font-semibold transition-all border ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}`}
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
      {/* Background shapes for visual interest */}
      <div className={`absolute top-0 left-0 w-full h-full ${darkMode ? 'opacity-10' : 'opacity-5'}`}>
        <div className={`absolute -left-1/4 -top-1/4 w-1/2 h-1/2 rounded-full blur-3xl ${darkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
        <div className={`absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 rounded-full blur-3xl ${darkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
      </div>
    </section>
  );
};

export default HeroSection;
