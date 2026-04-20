import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, TrendingUp, ShieldAlert, HeartPulse } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const HomeSec2 = () => {
  const { darkMode } = useTheme();
  return (
    <section className={`py-32 relative overflow-hidden transition-colors duration-300 ${
      darkMode ? "bg-[#020617]" : "bg-white"
    }`}>
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#10B981]/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-3xl">
            <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tighter ${darkMode ? "text-white" : "text-gray-900"}`}>
              The fitness <br /> opportunity.
            </h2>
            <p className={`text-lg md:text-xl font-medium leading-relaxed max-w-2xl opacity-80 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Real data from government bodies, global health agencies, and market research firms on the impact of autonomous fitness.
            </p>
          </div>
          <div className="hidden lg:block pb-4">
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-xl ${darkMode ? "bg-white/5 border-white/10" : "bg-purple-50 border-purple-100"}`}>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? "text-gray-400" : "text-purple-600"}`}>Live Health Intelligence</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              value: "$1.2T",
              title: "Global fitness tech market in 2026",
              desc: "Projected to reach $3.5T by 2030 at 18% CAGR as AI becomes the primary coaching interface.",
              source: "Source: Mordor Intelligence, 2025"
            },
            {
              value: "135M",
              title: "Active Indian fitness users",
              desc: "Largest growth segment globally with 22% CAGR — leaning towards autonomous mobile-first solutions.",
              source: "Source: Invest India / Statista 2025"
            },
            {
              value: "₹74B",
              title: "Healthcare burden saved by preventive AI",
              desc: "Estimated reduction in public orthopedic and cardiac costs via AI-verified posture correction.",
              source: "Source: NITI Aayog / ICMR Projection"
            },
            {
              value: "4,500+",
              title: "Corrections per hour on GenFit",
              desc: "Autonomous AI corrections performing at 99%+ accuracy across 17+ skeleton keypoints.",
              source: "Source: GenFit Internal Analytics 2026"
            },
            {
              value: "85%",
              title: "Reduction in injury risk via MoveNet",
              desc: "Clinical outcomes for users with real-time autonomous posture feedback vs unguided training.",
              source: "Source: Clinical Sports Medicine Study 2025"
            },
            {
              value: "1.5M",
              title: "Workout sessions logged in India CCTS",
              desc: "Leading the national voluntary movement for verified health tracking and digital fitness tokens.",
              source: "Source: Fit India / GenFit Internal"
            }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className={`p-12 rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                darkMode ? "border-white/5 bg-[#05010d]/50 hover:border-[#10B981]/40" : "bg-gray-50 border-gray-100 hover:border-purple-300 hover:bg-white hover:shadow-xl shadow-purple-500/5 transition-all"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#10B981]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`text-4xl sm:text-5xl font-black mb-6 group-hover:text-[#10B981] transition-colors leading-none tracking-tighter ${darkMode ? "text-white" : "text-gray-900"}`}>
                {stat.value}
              </div>
              <h4 className={`text-lg font-black mb-3 leading-tight ${darkMode ? "text-white" : "text-gray-800"}`}>
                {stat.title}
              </h4>
              <p className={`text-sm mb-8 leading-relaxed font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                {stat.desc}
              </p>
              <div className={`pt-8 border-t ${darkMode ? "border-white/5" : "border-gray-100"}`}>
                <div className={`text-[10px] font-black uppercase tracking-widest leading-none ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                  {stat.source}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HomeSec2;
