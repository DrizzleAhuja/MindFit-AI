// FitBot.js - Updated with professional styling
import React, { useState } from "react";
import axios from "axios";
import { FiCopy, FiRefreshCw } from "react-icons/fi";
import { FaDumbbell, FaHeartbeat, FaRunning } from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";

const FitBot = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi there! I\'m FitBot, your AI fitness assistant. How can I help you with your workout today? 💪",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 // FitBot.js (Frontend)
const sendMessage = async () => {
  if (!input.trim()) return;

  setLoading(true);
  setError(null);

  const userMessage = { role: "user", content: input };
  const updatedMessages = [...messages, userMessage];
  setMessages(updatedMessages);
  setInput("");

  try {
    const response = await axios.post(
      "https://mindfitaibackend.vercel.app/api/auth/chat",
      { messages: updatedMessages },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setMessages([...updatedMessages, { 
      role: "assistant", 
      content: response.data.response 
    }]);
  } catch (err) {
    setError(err.response?.data?.error || "Failed to connect to FitBot");
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BsRobot className="text-2xl mr-3" />
              <div>
                <h1 className="text-2xl font-bold">FITBOT</h1>
                <p className="text-sm opacity-90">Your AI Fitness Assistant</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                <FiRefreshCw className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="h-96 md:h-[32rem] overflow-y-auto p-4 bg-gray-900">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-700 text-white shadow-sm rounded-bl-none"
                }`}
              >
                <div className="flex items-center mb-1">
                  {msg.role === "assistant" ? (
                    <BsRobot className="mr-2 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
                  )}
                  <span className="text-xs font-medium text-gray-200">
                    {msg.role === "user" ? "You" : "FitBot"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-gray-100">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-700 text-gray-800 shadow-sm rounded-2xl rounded-bl-none p-4 max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-900 text-red-300 rounded-lg text-sm border border-red-700">
              {error}
            </div>
          )}
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 rounded-l-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-700 text-white"
              placeholder="Ask FitBot about workouts, nutrition, etc..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="px-6 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-r-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <IoMdSend className="text-xl" />
              )}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center space-x-4">
            <button className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full flex items-center text-gray-200">
              <FaDumbbell className="mr-1 text-green-400" /> Workout
            </button>
            <button className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full flex items-center text-gray-200">
              <FaHeartbeat className="mr-1 text-red-400" /> Nutrition
            </button>
            <button className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full flex items-center text-gray-200">
              <FaRunning className="mr-1 text-blue-400" /> Cardio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitBot;