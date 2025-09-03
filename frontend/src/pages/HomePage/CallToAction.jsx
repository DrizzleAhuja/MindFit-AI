import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CallToAction() {
  const { darkMode } = useTheme();

  return (
    <section className={`py-16 ${darkMode ? 'bg-gray-800 text-white' : 'bg-blue-100 text-gray-900'}`}>
      <div className="container mx-auto px-4 text-center">
        <h2 className={`text-4xl font-bold mb-6 ${darkMode ? 'text-green-400' : 'text-blue-800'}`}>
          Ready to Transform Your Wellness Journey?
        </h2>
        <p className={`text-lg max-w-3xl mx-auto mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Join MindFit AI today and unlock personalized fitness, mindful living, and nutritional guidance all in one powerful platform.
        </p>
        <Link
          to="/signin"
          className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm transition-colors
            ${darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-blue-700 hover:bg-blue-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600'
            }`}
        >
          Get Started for Free
          <ArrowRight className="ml-3 -mr-1 h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
