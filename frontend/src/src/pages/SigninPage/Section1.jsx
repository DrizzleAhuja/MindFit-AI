import React from "react";

const Section1 = ({ darkMode }) => {
  return (
    <div>
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div
        className={`p-10 rounded-lg shadow-lg text-center max-w-lg w-full ${
          darkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-black"
        }`}
      >
        <h2 className="text-3xl mb-6">Sign in to your Lost & Found - NCU Account</h2>
      </div>
    </div>
    </div>
  );
};

export default Section1;
