import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const faqs = [
  {
    q: "How does the AI Posture Coach (VTA) work?",
    a: "We use MoveNet, a high-speed computer vision model by Google, to track 17 key body points in real-time via your camera. The AI compares your joint angles against sports-science benchmarks and gives instant visual feedback — no wearable needed."
  },
  {
    q: "Is my camera data stored on your servers?",
    a: "No. All AI processing for the Virtual Training Assistant happens locally on your device (Edge AI). We never stream, upload, or store your video feed — your privacy is guaranteed by design."
  },
  {
    q: "Can I sync GenFit AI with my existing wearable or health app?",
    a: "Yes. Our mobile app supports Google Fit synchronisation, allowing you to pull in step counts and heart rate data to better inform your AI-generated workout and nutrition plans."
  },
  {
    q: "What is the 'Fit India Movement' alignment?",
    a: "The Fit India Movement is a government initiative launched by PM Narendra Modi on August 29, 2019 (National Sports Day). GenFit AI aligns its activity targets with ICMR-recommended weekly MET minutes, supporting this national mission for a healthier India."
  },
  {
    q: "Is GenFit AI free to use?",
    a: "Yes — GenFit AI is completely free to start. Sign up with your Google account and get instant access to workout planning, the virtual training assistant, calorie tracking, community features, and the AI FitBot chatbot."
  },
  {
    q: "Does GenFit AI work on mobile?",
    a: "Absolutely. GenFit AI has a dedicated React Native mobile app for Android (iOS coming soon) with full feature parity — AI coaching, diet charts, leaderboards, and admin features are all included."
  }
];

const HomeSec4 = () => {
  const { darkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className={`transition-colors duration-300 py-24 relative overflow-hidden ${darkMode ? "bg-[#020617]" : "bg-white"}`}>
      <div className="container mx-auto px-4 max-w-4xl relative z-10">

        <div className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 font-black text-[10px] uppercase tracking-[0.2em] ${
            darkMode ? "bg-white/5 border-white/10 text-[#22D3EE]" : "bg-blue-50 border-blue-100 text-blue-600"
          }`}>
            <HelpCircle size={14} />
            Support Center · 2026
          </div>
          <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-none ${darkMode ? "text-white" : "text-gray-900"}`}>
            Everything you <br /> need to know.
          </h2>
          <p className={`text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
            Quick answers to the questions we hear most from new athletes.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                darkMode ? "border-white/5 bg-white/[0.02] hover:border-white/10" : "bg-gray-50 border-gray-100 hover:border-purple-200"
              }`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className={`w-full p-6 text-left flex items-center justify-between transition-colors gap-4 ${
                  darkMode ? "hover:bg-white/[0.03]" : "hover:bg-white"
                }`}
              >
                <span className={`text-base font-semibold leading-snug ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{faq.q}</span>
                <div className={`p-2 rounded-full flex-shrink-0 ${darkMode ? "bg-white/5" : "bg-gray-200/50"}`}>
                  {openIndex === idx ? <Minus size={16} className="text-[#22D3EE]" /> : <Plus size={16} className={darkMode ? "text-gray-500" : "text-gray-400"} />}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={`px-6 pb-6 text-sm leading-relaxed border-t pt-4 ${
                      darkMode ? "text-gray-400 border-white/5" : "text-gray-600 border-gray-100"
                    }`}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HomeSec4;
