import React from 'react';
import NavBar from '../HomePage/NavBar';
import Footer from '../HomePage/Footer';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Target, Users } from 'lucide-react';

const featuresList = [
  {
    title: "Personalized Workout Plans",
    description: "AI-driven plans tailored to your fitness level, goals, and preferences.",
    icon: <Activity className="w-8 h-8 text-blue-500" />,
  },
  {
    title: "Mindfulness & Meditation",
    description: "Guided exercises to improve focus, reduce stress, and enhance mental clarity.",
    icon: <Target className="w-8 h-8 text-green-500" />,
  },
  {
    title: "Nutritional Guidance",
    description: "Smart recommendations and calorie tracking to support your diet goals.",
    icon: <Users className="w-8 h-8 text-purple-500" />,
  },
  {
    title: "Progress Tracking & Analytics",
    description: "Visualize your journey with detailed insights and performance metrics.",
    icon: <Activity className="w-8 h-8 text-yellow-500" />,
  },
];

export default function Features() {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar />
      <div className="flex-grow container mx-auto px-4 py-12">
        <h1 className={`text-center text-4xl font-bold mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Our Features</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feature, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-center mb-4">
                {feature.icon}
                <h2 className={`text-xl font-semibold ml-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h2>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
