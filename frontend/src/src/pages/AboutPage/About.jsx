import React from 'react';
import NavBar from '../HomePage/NavBar';
import Footer from '../HomePage/Footer';
import { useTheme } from '../../context/ThemeContext';

export default function About() {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar />
      <div className="flex-grow container mx-auto px-4 py-12 text-center">
        <h1 className={`text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About MindFit AI</h1>
        <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          GenFit AI is dedicated to revolutionizing personal wellness through intelligent, data-driven solutions. We empower you to achieve optimal mental and physical health with personalized guidance and a supportive community.
        </p>
        <p className={`text-lg mt-4 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Our platform integrates cutting-edge AI technology to provide tailored workout plans, mindfulness exercises, and nutritional insights, helping you build sustainable habits for a balanced and fulfilling life.
        </p>
      </div>
      <Footer />
    </div>
  );
}
