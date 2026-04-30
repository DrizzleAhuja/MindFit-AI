// FitBot.js - Updated with professional styling
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FiCopy, FiRefreshCw } from "react-icons/fi";
import { FaDumbbell, FaHeartbeat, FaRunning, FaMicrophone, FaMicrophoneSlash, FaImage, FaVolumeUp, FaStop } from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL } from "../../../config/api";
import { useTheme } from "../../context/ThemeContext";
import { LIMITS } from "../../utils/formValidation";

const FitBot = ({ defaultOpen = false }) => {
  const user = useSelector(selectUser);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: user
        ? `Hi ${
            user.firstName || "there"
          }! I'm FitBot, your AI Agent! I don't just answer questions—I can operate your dashboard. You can ask me to:
            
- Log your food (send me a picture of your dish!)
- Log your workout 
- Create a workout plan
- Create a diet chart
- Update your Profile/BMI

Example: "Log that I ate 2 apples for breakfast" or "Create a 4-week workout plan"

Try using the microphone 🎤 or attaching an image 🖼️! 💪`
        : "Hi there! I'm FitBot, your AI Agent. I can generate diet charts, create workout routines, and analyze pictures of your food! Please login so I can personalize your experience. 💪",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState(null); // New state for active workout plan
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const [imageBase64, setImageBase64] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-IN');
  const [interimInput, setInterimInput] = useState("");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const isHindi = (text) => /[\u0900-\u097F]/.test(text);

  const handleSpeak = (text, index) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHindi(text) ? 'hi-IN' : 'en-US';
    
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Update initial message when user data changes
  useEffect(() => {
    const fetchActiveWorkoutPlan = async () => {
      if (!isOpen) return;
      if (user && user._id) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/workout-plan/active/${user._id}`);
          if (response.data.success) {
            setActiveWorkoutPlan(response.data.plan);
          }
        } catch (err) {
          console.error("Error fetching active workout plan:", err);
          setActiveWorkoutPlan(null);
        }
      }
    };

    fetchActiveWorkoutPlan();
  }, [user, isOpen]);

  // Update initial message when user data or activeWorkoutPlan changes
  useEffect(() => {
    if (user && messages.length === 1) {
      const personalizedMessage = `Hi ${
        user.firstName || "there"
      }! I'm FitBot, your AI Agent! I don't just answer questions—I can operate your dashboard. You can ask me to:

- Log your food (send me a picture of your dish!)
- Log your workout 
- Create a workout plan
- Create a diet chart
- Update your Profile/BMI

Example: "Log that I ate 2 apples for breakfast" or "Create a 4-week workout plan"

${activeWorkoutPlan ? `✅ Your current active plan is: ${activeWorkoutPlan.name}.` : ""} 

Try using the microphone 🎤 or attaching an image 🖼️! 💪`;
      setMessages([
        {
          role: "assistant",
          content: personalizedMessage,
        },
      ]);
    }
  }, [user, activeWorkoutPlan]);

  // FitBot.js (Frontend)
  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;
      recognition.onstart = () => {
        setIsListening(true);
        setInterimInput("");
      };
      recognition.onend = () => {
        setIsListening(false);
        setInterimInput("");
      };
      recognition.onresult = (event) => {
        let currentInterim = "";
        let newFinal = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        if (currentInterim) {
          setInterimInput(currentInterim);
        } else {
          setInterimInput("");
        }
        if (newFinal) {
          setInput((prev) => prev.trim() + (prev ? " " : "") + newFinal.trim() + " ");
        }
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          setInterimInput("");
        }
      };
      recognitionRef.current = recognition;
    }
  }, [speechLang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInterimInput("");
      recognitionRef.current?.start();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !imageBase64) return;
    const text = input.trim();
    if (text.length > LIMITS.FITBOT_MESSAGE_MAX) {
      setError(`Message is too long (max ${LIMITS.FITBOT_MESSAGE_MAX} characters).`);
      return;
    }

    setLoading(true);
    setError(null);

    const userMessage = { role: "user", content: text, imageBase64 };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setImageBase64(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/chat`,
        {
          messages: updatedMessages,
          userEmail: user?.email || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: response.data.response,
          },
        ]);
        setError(null); // Clear any previous errors
      } else {
        setError("Failed to get response from FitBot");
      }
    } catch (err) {
      console.error("FitBot error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to connect to FitBot. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  const { darkMode } = useTheme();

  const quickActions = useMemo(() => ([
    { key: "workout", label: "Workout", icon: <FaDumbbell className="mr-1 text-[#22D3EE]" /> },
    { key: "nutrition", label: "Nutrition", icon: <FaHeartbeat className="mr-1 text-[#8B5CF6]" /> },
    { key: "cardio", label: "Cardio", icon: <FaRunning className="mr-1 text-[#22D3EE]" /> },
  ]), []);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [isOpen, messages.length, loading]);

  const toggleOpen = () => setIsOpen((v) => !v);

  return (
    <>
      {/* Floating widget button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] shadow-lg hover:opacity-95 transition flex items-center justify-center"
          aria-label="Open FitBot chat"
        >
          <BsRobot className="text-2xl text-white" />
        </button>
      )}

      {/* Floating widget panel */}
      {isOpen && (
        <div className={`fixed bottom-5 right-5 z-[9999] w-[92vw] max-w-[420px] h-[70vh] max-h-[620px] rounded-2xl border backdrop-blur-xl overflow-hidden flex flex-col ${darkMode ? 'border-[#1F2937] bg-[#020617]/90 shadow-[0_18px_45px_rgba(15,23,42,0.85)]' : 'border-gray-200 bg-white shadow-2xl'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BsRobot className="text-2xl mr-3" />
              <div>
                <h1 className="text-2xl font-bold">FITBOT</h1>
                <p className="text-sm opacity-90">
                  Your AI Fitness Assistant
                  {user && (
                    <span className="ml-2 px-2 py-1 bg-white/20 text-white rounded-full text-xs">
                      Personalized
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setMessages((prev) => prev.slice(0, 1));
                  setError(null);
                }}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                aria-label="Reset chat"
                type="button"
              >
                <FiRefreshCw className="text-lg" />
              </button>
              <button
                onClick={toggleOpen}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                aria-label="Close chat"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div
          className={`flex-1 overflow-y-auto p-4 ${
            darkMode ? "bg-[#05010d]" : "bg-gray-50"
          }`}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] text-white rounded-br-none"
                    : darkMode ? "bg-[#020617]/80 border border-[#1F2937] text-white shadow-sm rounded-bl-none" : "bg-gray-100 border border-gray-200 text-gray-900 shadow-sm rounded-bl-none"
                }`}
              >
                <div className="flex items-center mb-1">
                  {msg.role === "assistant" ? (
                    <BsRobot className="mr-2 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
                  )}
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>
                    {msg.role === "user" ? "You" : "FitBot"}
                  </span>
                  <button
                    onClick={() => handleSpeak(msg.content, index)}
                    className={`ml-auto p-1 rounded-full transition-colors ${
                      darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'
                    } ${speakingIndex === index ? 'text-cyan-400' : ''}`}
                    title={speakingIndex === index ? "Stop Narration" : "Listen to Message"}
                  >
                    {speakingIndex === index ? <FaStop size={12} /> : <FaVolumeUp size={12} />}
                  </button>
                </div>
                <p className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          {imageBase64 && !loading && (
            <div className={`flex mb-4 justify-end`}>
              <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-4 bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] text-white rounded-br-none">
                 <img src={imageBase64} alt="Attached" className="max-w-full h-auto rounded-lg mb-2" />
                 {input && <p className="whitespace-pre-wrap">{input}</p>}
              </div>
            </div>
          )}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className={`border shadow-sm rounded-2xl rounded-bl-none p-4 max-w-xs ${darkMode ? 'bg-[#020617]/80 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t p-4 relative ${darkMode ? 'border-[#1F2937] bg-[#020617]/80' : 'border-gray-200 bg-white'}`}>
          {isListening && interimInput && (
            <div className="absolute -top-12 left-4 bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl animate-pulse max-w-[85%] whitespace-nowrap overflow-hidden text-ellipsis z-50">
              🗣️ "{interimInput}"
            </div>
          )}
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-900 text-red-300 rounded-lg text-sm border border-red-700">
              {error}
            </div>
          )}
          <div className={`flex rounded-lg border focus-within:ring-2 focus-within:ring-[#22D3EE] focus-within:border-transparent items-center ${darkMode ? 'bg-[#020617]/80 border-[#1F2937]' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setSpeechLang(prev => prev === 'en-IN' ? 'hi-IN' : 'en-IN')}
                className={`text-[9px] font-bold px-1 rounded border transition-colors ${
                  darkMode ? 'border-[#1F2937] text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-900'
                }`}
                title="Switch Language"
              >
                {speechLang === 'en-IN' ? 'EN' : 'HI'}
              </button>
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 text-gray-400 hover:text-white transition ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                title="Start/Stop Voice Input"
              >
                {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-white transition relative"
            >
              <FaImage />
              {imageBase64 && <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <input
              type="text"
              maxLength={LIMITS.FITBOT_MESSAGE_MAX}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`flex-1 px-2 py-3 bg-transparent focus:outline-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
              placeholder={imageBase64 ? "Image attached. Add a message..." : "Ask FitBot..."}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="px-6 h-full py-3 bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] text-white rounded-r-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center ml-auto"
              disabled={loading || (!input.trim() && !imageBase64)}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <IoMdSend className="text-xl" />
              )}
            </button>
          </div>
          {imageBase64 && (
            <div className="mt-2 text-xs text-green-400 flex items-center justify-between">
              <span>Image attached for analysis.</span>
              <button className="text-red-400 hover:text-red-300" onClick={() => setImageBase64(null)}>Remove</button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center space-x-3">
            {quickActions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => {
                  setInput(`Help me with ${a.label.toLowerCase()}.`);
                }}
                className={`text-xs border px-3 py-1 rounded-full flex items-center ${darkMode ? 'bg-[#020617]/80 border-[#1F2937] hover:bg-[#020617] text-gray-200' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'}`}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          {user && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400">
                💡 I can see your BMI data and workout plan for personalized
                advice
              </p>
            </div>
          )}
        </div>
        </div>
      )}
    </>
  );
};

export default FitBot;
