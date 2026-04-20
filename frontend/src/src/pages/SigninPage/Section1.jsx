import React from "react";
import { useTheme } from "../../context/ThemeContext";

const Section1 = () => {
  const { darkMode } = useTheme();
  return (
    <div>
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      <div
        className={`p-10 rounded-lg shadow-lg text-center max-w-lg w-full border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <h2 className="text-3xl mb-6">Sign in to your Lost & Found - NCU Account</h2>
      </div>
    </div>
    </div>
  );
};

export default Section1;
