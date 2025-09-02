import React from "react";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { Mail, Phone, MapPin } from 'lucide-react'; // Import Lucide icons

export default function Contactus() {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className={`text-center text-4xl font-bold mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Information */}
          <div className={`p-8 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className={`w-6 h-6 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>info@mindfitai.com</p>
              </div>
              <div className="flex items-center">
                <Phone className={`w-6 h-6 mr-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>+1 (555) 123-4567</p>
              </div>
              <div className="flex items-center">
                <MapPin className={`w-6 h-6 mr-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>123 AI Wellness St, Future City, FW 98765</p>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className={`p-8 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Send us a Message</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  id="name"
                  className={`w-full p-3 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  id="email"
                  className={`w-full p-3 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="your@example.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                <input
                  type="text"
                  id="subject"
                  className={`w-full p-3 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Subject of your message"
                />
              </div>
              <div>
                <label htmlFor="message" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
                <textarea
                  id="message"
                  rows="5"
                  className={`w-full p-3 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Your message..."
                ></textarea>
              </div>
              <button
                type="submit"
                className={`w-full py-3 rounded-md font-semibold ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'} transition-colors`}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
