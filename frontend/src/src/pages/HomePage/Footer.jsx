import React from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaEnvelope,
  FaMapMarkerAlt,
  FaApple,
  FaAndroid,
  FaDesktop,
  FaProjectDiagram,
  FaTasks,
  FaQuestionCircle,
  FaFileContract,
  FaChartLine,
  FaFileAlt,
  FaShieldAlt,
  FaLock
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useTheme } from '../../context/ThemeContext'; // Corrected Import useTheme path
import { Brain, Sparkles } from 'lucide-react'; // Import Lucide icons for logo

export default function Footer() {
  const { darkMode } = useTheme();

  const footerLinks = {
    "Download & Projects": [
      { icon: <FaAndroid className="mr-2" />, label: "Android App", href: "#" },
      { icon: <FaApple className="mr-2" />, label: "iOS App", href: "#" },
      { icon: <FaDesktop className="mr-2" />, label: "Desktop", href: "#" },
      { icon: <FaProjectDiagram className="mr-2" />, label: "Projects", href: "#" },
      { icon: <FaTasks className="mr-2" />, label: "My Tasks", href: "#" }
    ],
    "Help & Documentation": [
      { icon: <FaQuestionCircle className="mr-2" />, label: "FAQ", href: "#" },
      { icon: <FaFileContract className="mr-2" />, label: "Terms & Conditions", href: "#" },
      { icon: <FaChartLine className="mr-2" />, label: "Reporting", href: "#" },
      { icon: <FaFileAlt className="mr-2" />, label: "Documentation", href: "#" },
      { icon: <FaShieldAlt className="mr-2" />, label: "Support Policy", href: "#" },
      { icon: <FaLock className="mr-2" />, label: "Privacy", href: "#" }
    ]
  };

  return (
    <footer className={`py-12 ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-1">
            <NavLink
              to="/"
              className="text-2xl font-bold mb-4 flex items-center gap-2"
            >
              <Brain className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'} mr-1`} />
              <Sparkles className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
              <span className={`bg-clip-text text-transparent ${darkMode ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gradient-to-r from-green-600 to-blue-800'}`}>
                GenFit AI
              </span>
            </NavLink>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Empowering your mind and body with AI-driven wellness personalized for you.
            </p>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="lg:col-span-1">
              <h5 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h5>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className={`flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                    >
                      {link.icon}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social Links */}
          <div className="lg:col-span-1">
            <h5 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Follow Us
            </h5>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className={`p-2 rounded-full shadow-sm transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'}`}
                aria-label="Facebook"
              >
                <FaFacebook size={18} />
              </a>
              <a
                href="#"
                className={`p-2 rounded-full shadow-sm transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'}`}
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="#"
                className={`p-2 rounded-full shadow-sm transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'}`}
                aria-label="LinkedIn"
              >
                <FaLinkedin size={18} />
              </a>
            </div>
            <div className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
              <FaEnvelope className="mr-2" />
              <a href="mailto:genfitai@example.com" className="hover:underline">
                genfitai@example.com
              </a>
            </div>
          </div>
        </div>

        <div className={`border-t mt-12 pt-8 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`text-sm mb-4 md:mb-0 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              &copy; {new Date().getFullYear()} GenFit AI. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Privacy Policy
              </a>
              <a href="#" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Terms of Service
              </a>
              <a href="#" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}