import React, { useState, useEffect } from "react";
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
import GenFitLogo from "../../Components/GenFitLogo";
import { toast } from 'react-toastify';
import {
  getInstallPrompt,
  onInstallPromptAvailable,
  triggerInstall,
  isPWAInstalled,
  isAndroid,
  isIOS,
  isMobile,
  shouldShowInstallPrompt
} from '../../utils/pwaInstall';

export default function Footer() {
  const { darkMode } = useTheme();
  const [hasInstallPrompt, setHasInstallPrompt] = useState(false);
  const [shouldShowInstall, setShouldShowInstall] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isStandalone: false
  });

  useEffect(() => {
    // Function to update device info and install prompt state
    const updateInstallState = () => {
      const isStandalone = isPWAInstalled();
      const deviceInfoUpdate = {
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        isMobile: isMobile(),
        isStandalone: isStandalone
      };

      setDeviceInfo(deviceInfoUpdate);

      // Show install options if:
      // 1. Not installed AND (has prompt OR should show based on dismissal state)
      if (!isStandalone) {
        const prompt = getInstallPrompt();
        const shouldShow = shouldShowInstallPrompt();
        console.log('🔄 Updating install state:', {
          hasPrompt: !!prompt,
          shouldShow,
          isStandalone
        });
        setHasInstallPrompt(!!prompt);
        setShouldShowInstall(shouldShow);
      } else {
        console.log('🚫 App is installed, hiding install options');
        setHasInstallPrompt(false);
        setShouldShowInstall(false);
      }
    };

    // Initial check
    updateInstallState();

    // Check if install prompt is already available
    if (getInstallPrompt()) {
      setHasInstallPrompt(true);
    }

    // Listen for when install prompt becomes available
    const cleanupPrompt = onInstallPromptAvailable((prompt) => {
      console.log('🎉 Install prompt became available in Footer!', prompt);
      setHasInstallPrompt(true);
      setShouldShowInstall(true);
    });

    // Listen for app installation
    const cleanupInstalled = window.addEventListener('appinstalled', () => {
      updateInstallState();
    });

    // Periodically check install state (in case app was uninstalled)
    const checkInterval = setInterval(() => {
      updateInstallState();
    }, 2000); // Check every 2 seconds

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateInstallState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanupPrompt();
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cleanupInstalled) {
        window.removeEventListener('appinstalled', cleanupInstalled);
      }
    };
  }, []);

  const handleAndroidInstall = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Install button clicked');

    if (deviceInfo.isStandalone) {
      toast.info('App is already installed!', { autoClose: 2000 });
      return;
    }

    // Try to get the install prompt - check multiple times as it might not be immediately available
    let prompt = getInstallPrompt();
    console.log('📦 Initial prompt check:', prompt ? 'Available' : 'Not available');

    // If no prompt, wait a bit and check again (sometimes it takes a moment)
    if (!prompt) {
      console.log('⏳ Waiting for prompt...');
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        prompt = getInstallPrompt();
        if (prompt) {
          console.log(`✅ Prompt found after ${(i + 1) * 200}ms`);
          break;
        }
      }
    }

    if (prompt) {
      try {
        console.log('✅ Prompt available, triggering install...');
        // Trigger the install prompt immediately
        const accepted = await triggerInstall();

        if (accepted) {
          toast.success('Installing GenFit AI...', { autoClose: 2000 });
        } else {
          toast.info('Installation cancelled', { autoClose: 2000 });
        }
        // Update state after prompt is used
        setTimeout(() => {
          const newPrompt = getInstallPrompt();
          console.log('🔄 Checking for new prompt after use:', newPrompt ? 'Available' : 'Not available');
          setHasInstallPrompt(!!newPrompt);
          setShouldShowInstall(shouldShowInstallPrompt());
        }, 1000);
      } catch (error) {
        console.error('❌ Error showing install prompt:', error);
        console.error('Error details:', error.message, error.stack);
        // Show manual instructions as fallback
        showManualInstallInstructions();
      }
    } else {
      console.log('⚠️ No prompt available after waiting, showing manual instructions');
      // If no prompt available, show manual instructions
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    if (deviceInfo.isAndroid) {
      toast.info(
        'Android: Tap menu (⋮) → "Install app" or "Add to Home screen"',
        { autoClose: 6000 }
      );
    } else if (deviceInfo.isIOS) {
      toast.info(
        'iOS: Tap Share button → "Add to Home Screen"',
        { autoClose: 6000 }
      );
    } else {
      toast.info(
        'Desktop: Click menu (⋮) → "Install GenFit AI"',
        { autoClose: 6000 }
      );
    }
  };

  const handleIOSInstall = (e) => {
    e.preventDefault();
    if (deviceInfo.isStandalone) {
      toast.info('App is already installed!', { autoClose: 2000 });
      return;
    }
    toast.info(
      'To install: Tap the Share button, then "Add to Home Screen"',
      { autoClose: 5000 }
    );
  };

  const handleDesktopInstall = async (e) => {
    e.preventDefault();
    if (deviceInfo.isStandalone) {
      toast.info('App is already installed!', { autoClose: 2000 });
      return;
    }
    // Desktop install works the same way
    await handleAndroidInstall(e);
  };

  const navLinks = [
    { path: "/about", label: "ABOUT US" },
    { path: "/features", label: "FEATURES" },
    { path: "/Contactus", label: "CONTACT US" },
    { path: "/leaderboard", label: "LEADERBOARD" },
  ];

  return (
    <footer className={`border-t transition-colors duration-300 py-16 ${
      darkMode ? "bg-[#020617] border-white/5" : "bg-white border-gray-100"
    }`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand & Social */}
          <div className="space-y-6">
            <GenFitLogo size="large" />
            <p className={`text-sm max-w-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500 font-medium"}`}>
              Precision coaching, posture tracking, and smart nutrition—powered by AI, designed for real humans.
            </p>
            <div className="flex space-x-4">
              {[FaFacebook, FaInstagram, FaLinkedin, FaEnvelope].map((Icon, i) => (
                <a key={i} href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                  darkMode ? "bg-white/5 text-gray-400 border-white/5 hover:bg-emerald-500/10 hover:text-[#10B981]" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-purple-50 hover:text-purple-600"
                }`}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h5 className={`font-bold mb-6 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>NAVIGATION</h5>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink to={link.path} className={`text-sm font-medium transition-colors ${
                    darkMode ? "text-gray-400 hover:text-[#10B981]" : "text-gray-500 hover:text-purple-600"
                  }`}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h5 className={`font-bold mb-6 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>CONTACT INFO</h5>
            <ul className="space-y-4 text-sm">
              <li className={`flex items-center gap-3 ${darkMode ? "text-gray-400" : "text-gray-500 font-medium"}`}>
                <FaEnvelope className={darkMode ? "text-[#10B981]" : "text-purple-600"} />
                <span>support@genfit.ai</span>
              </li>
              <li className={`flex items-center gap-3 ${darkMode ? "text-gray-400" : "text-gray-500 font-medium"}`}>
                <FaMapMarkerAlt className={darkMode ? "text-[#10B981]" : "text-purple-600"} />
                <span>Innovation Hub, Tech City</span>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div className="space-y-6">
            <h5 className={`font-bold mb-6 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>DOWNLOAD APP</h5>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500 font-medium"}`}>
              Get the best experience by installing our app on your device.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAndroidInstall}
                className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 group ${
                  darkMode 
                    ? "bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-400" 
                    : "bg-gray-50 border-gray-200 hover:bg-purple-50 hover:border-purple-200 text-gray-700 hover:text-purple-600"
                }`}
              >
                <FaAndroid size={20} className="transition-transform group-hover:scale-110" />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Get it for</div>
                  <div className="text-sm font-bold">Android</div>
                </div>
              </button>

              <button
                onClick={handleIOSInstall}
                className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 group ${
                  darkMode 
                    ? "bg-white/5 border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400" 
                    : "bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 text-gray-700 hover:text-indigo-600"
                }`}
              >
                <FaApple size={20} className="transition-transform group-hover:scale-110" />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Download on</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 ${darkMode ? "border-white/5" : "border-gray-100"}`}>
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} GenFit AI. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}