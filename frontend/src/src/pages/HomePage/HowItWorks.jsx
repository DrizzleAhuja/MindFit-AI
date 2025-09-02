import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Brain, TrendingUp, Users } from 'lucide-react';

const steps = [
  {
    icon: <Brain className="w-10 h-10 text-blue-500" />,
    title: "Personalized AI Assessment",
    description: "Our intelligent AI analyzes your unique goals and preferences to create a tailored wellness plan just for you.",
  },
  {
    icon: <TrendingUp className="w-10 h-10 text-green-500" />,
    title: "Track & Progress Smarter",
    description: "Effortlessly log your activities, nutrition, and mindfulness sessions. Watch your progress unfold with intuitive analytics.",
  },
  {
    icon: <Users className="w-10 h-10 text-purple-500" />,
    title: "Achieve Your Wellness Goals",
    description: "Follow your personalized plan, stay motivated with our community, and achieve sustainable results for a healthier mind and body.",
  },
];

export default function HowItWorks() {
  const { darkMode } = useTheme();

  return (
    <section className={`py-16 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 text-center">
        <h2 className={`text-4xl font-bold mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          How MindFit AI Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{step.title}</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
