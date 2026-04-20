import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  BarChart3,
  Database,
  Workflow,
  Clock,
  ArrowRight,
  Brain,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useTheme } from "../../context/ThemeContext";

const FitnessGraph = ({ darkMode }) => {
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const data = [30, 45, 42, 58, 72, 85, 94]; // Success rate / Adoption %
  const [hoveredPoint, setHoveredPoint] = React.useState(null);

  // Generating smooth path coordinates for the line chart
  const points = data
    .map((val, i) => `${(i / (data.length - 1)) * 100},${100 - val}`)
    .join(" ");

  return (
    <div className={`w-full border rounded-[2rem] p-8 md:p-12 overflow-hidden relative group transition-colors duration-300 ${
      darkMode ? "bg-[#020617] border-white/5" : "bg-white border-gray-100 shadow-xl"
    }`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-[#10B981]/5 to-transparent pointer-events-none ${darkMode ? "opacity-100" : "opacity-30"}`} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative z-10">
        <div>
          <h3 className={`text-xl md:text-2xl font-black mb-2 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
            Global Fitness Adoption, 2020–2026
          </h3>
          <p className="text-gray-500 text-sm font-medium">
            Verified autonomous training sessions successfully completed — the
            urgency for precision has never been greater.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl md:text-4xl font-black text-[#10B981] tracking-tighter">
            94%
          </div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
            Protocol Success Rate
          </div>
        </div>
      </div>

      {/* Modern Line Graph UI */}
      <div className="relative h-64 w-full mt-8">
        {/* Interactive Tooltip Overlay */}
        <AnimatePresence>
          {hoveredPoint !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-50 bg-[#1E293B]/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl pointer-events-none"
              style={{
                left: `${(hoveredPoint / (data.length - 1)) * 100}%`,
                top: `${100 - data[hoveredPoint] - 15}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="text-[10px] font-black text-gray-400 uppercase mb-1">
                {years[hoveredPoint]} Data
              </div>
              <div className="text-lg font-black text-white flex items-center gap-2">
                {data[hoveredPoint]}%{" "}
                <span className="text-[10px] text-[#10B981] font-bold">
                  SUCCESS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Subtle Grid Lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="0.5"
            />
          ))}

          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* Vertical Guide Line on Hover */}
          {hoveredPoint !== null && (
            <motion.line
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              x1={(hoveredPoint / (data.length - 1)) * 100}
              y1="0"
              x2={(hoveredPoint / (data.length - 1)) * 100}
              y2="100"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          )}

          <motion.polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))" }}
          />

          {/* Data Points */}
          {data.map((val, i) => (
            <motion.circle
              key={i}
              cx={(i / (data.length - 1)) * 100}
              cy={100 - val}
              r={hoveredPoint === i ? "2.5" : "1.5"}
              fill={hoveredPoint === i ? "#fff" : "rgba(255,255,255,0.6)"}
              className="cursor-pointer transition-all duration-300"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.1 }}
            />
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between mt-6 px-1">
          {years.map((year, i) => (
            <span
              key={i}
              className={`text-[10px] font-black tracking-tighter transition-colors duration-300 ${hoveredPoint === i ? "text-[#10B981]" : (darkMode ? "text-gray-600" : "text-gray-400")}`}
            >
              {year}
            </span>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t ${darkMode ? "border-white/5" : "border-gray-100"}`}>
        <div>
          <div className={`text-2xl font-black mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>37.8B</div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
            Global Reps in 2024
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Near all-time high healthcare burden — IEA, 2024
          </p>
        </div>
        <div>
          <div className="text-2xl font-black text-[#10B981]">−65.4%</div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
            Injury reduction
          </div>
          <p className="text-xs text-gray-500 mt-2">
            With AI-verified joint alignment vs unguided
          </p>
        </div>
        <div>
          <div className={`text-2xl font-black mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>$3.5T</div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
            Fit-Tech projected by 2030
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mordor Intelligence, 2025 Market Report
          </p>
        </div>
      </div>
    </div>
  );
};

const HomeSec3 = ({ onLoginSuccess, onLoginError }) => {
  const { darkMode } = useTheme();
  const googleLoginContainerRef = React.useRef(null);

  const handleGetStartedClick = () => {
    const container = googleLoginContainerRef.current;
    if (!container) return;

    container.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const googleButton = container.querySelector(
        "div[role='button'], iframe, button",
      );
      if (googleButton) {
        googleButton.click();
      }
    }, 250);
  };

  const features = [
    {
      title: "Verified Protocols only",
      desc: "Every workout follows peer-reviewed clinical benchmarks. We only accept sessions that meet ICMR and WHO physiological criteria.",
      icon: <ShieldCheck className="text-emerald-500" size={24} />,
    },
    {
      title: "Aligned with Fit India",
      desc: "Our platform supports India's National Health goals and helps entities meet BEE-mandated metabolic intensity targets.",
      icon: <Workflow className="text-blue-500" size={24} />,
    },
    {
      title: "Direct AI Coaching",
      desc: "Real-time MoveNet tracking at 30 FPS. Direct feedback from the engine means 100% precision with no middle-man errors.",
      icon: <Brain className="text-[#10B981]" size={24} />,
    },
    {
      title: "Live Posture Data",
      desc: "Real-time joint-angle feeds by exercise type. Know exactly how your biomechanics are performing before the session ends.",
      icon: <Activity className="text-cyan-500" size={24} />,
    },
    {
      title: "Clinical Exercises",
      desc: "Browse 50+ specialized physical protocols. Filter by muscle group, equipment, and verified impact metrics.",
      icon: <Database className="text-violet-500" size={24} />,
    },
    {
      title: "Instant Sync",
      desc: "Google Fit and local biometrics settle the same day. Your progress curves update in real-time, 24/7/365.",
      icon: <Clock className="text-rose-500" size={24} />,
    },
  ];

  return (
    <section className={`transition-colors duration-300 py-32 relative ${darkMode ? "bg-[#05010d]" : "bg-white"}`}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-100 uppercase tracking-[0.2em]"}`}>
            <span className={`text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? "text-[#22D3EE]" : "text-blue-600"}`}>
              Platform Excellence · 2026
            </span>
          </div>
          <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-none ${darkMode ? "text-white" : "text-gray-900"}`}>
            Built for serious <br /> results.
          </h2>
          <p className={`max-w-2xl text-lg md:text-xl font-medium leading-relaxed ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
            Everything you need to train with professional confidence — nothing
            you don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-40">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className={`relative h-full p-12 rounded-[2.5rem] border transition-all duration-500 group flex flex-col ${
                darkMode 
                  ? "border-white/5 bg-[#020617]/50 hover:border-[#22D3EE]/30" 
                  : "bg-gray-50 border-gray-100 hover:border-purple-300 hover:bg-white hover:shadow-2xl hover:shadow-purple-500/10"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            >
              <div className={`mb-10 flex items-center justify-center w-16 h-16 rounded-2xl border transition-colors ${
                darkMode ? "bg-[#020617] border-white/10 group-hover:border-[#22D3EE]/40" : "bg-white border-gray-200 group-hover:border-purple-300"
              }`}>
                {f.icon}
              </div>
              <h3 className={`text-2xl font-black mb-6 tracking-tight transition-colors leading-tight ${
                darkMode ? "text-white group-hover:text-[#22D3EE]" : "text-gray-900 group-hover:text-purple-600"
              }`}>
                {f.title}
              </h3>
              <p className={`text-base leading-relaxed font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Global Fitness Trends & Data Graph */}
        <div className="mb-40">
          <FitnessGraph darkMode={darkMode} />
        </div>

        {/* Platform at a Glance (CarbonEase style) */}
        <div className="mb-40">
          <div className="text-center mb-16">
            <h3 className={`text-4xl font-black mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Platform at a glance
            </h3>
            <p className="text-gray-500 font-medium">
              Real numbers from active autonomous sessions on GenFit AI
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                val: "500,000+",
                label: "Reps tracked",
                sub: "Tons exercise volume",
              },
              {
                val: "8,500+",
                label: "Active athletes",
                sub: "Verified weekly users",
              },
              {
                val: "12+",
                label: "Clinical exercises",
                sub: "Verified protocols",
              },
              {
                val: "99%",
                label: "Accuracy rate",
                sub: "Independently verified",
              },
            ].map((m, i) => (
              <div
                key={i}
                className={`text-center border-l pl-8 py-4 ${darkMode ? "border-white/5" : "border-gray-100"}`}
              >
                <div className={`text-3xl md:text-4xl font-black mb-2 tracking-tighter ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {m.val}
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {m.label}
                </div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Step Onboarding */}
        <div className={`pt-32 border-t ${darkMode ? "border-white/5" : "border-gray-100"}`}>
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <h3 className={`text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-none ${darkMode ? "text-white" : "text-gray-900"}`}>
                From sign-up to <br /> first trade.
              </h3>
              <p className="text-gray-500 text-lg font-medium leading-relaxed opacity-80">
                No complex onboarding. No hidden steps. Just a straightforward
                path to trading verified fitness sessions.
              </p>
            </div>
            <div className="hidden lg:block pb-4">
              <button
                onClick={handleGetStartedClick}
                className={`px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all ${
                  darkMode ? "bg-white text-black hover:bg-emerald-50" : "bg-purple-600 text-white hover:bg-purple-700 shadow-xl shadow-purple-500/20"
                }`}
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
            {[
              {
                step: "01",
                title: "Create an account",
                desc: "Sign up in under 2 minutes with GitHub or Google. Complete your health profile to unlock protocols.",
              },
              {
                step: "02",
                title: "Browse Protocols",
                desc: "Filter listings by muscle group, certification standard, equipment, and location.",
              },
              {
                step: "03",
                title: "Buy or List Credits",
                desc: "Access premium programs or list your own verified sessions. Direct P2P value for everyone.",
              },
              {
                step: "04",
                title: "Track Portfolio",
                desc: "View transaction history, certificates, and health performance curves in one dashboard.",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                className={`relative h-full p-12 rounded-[2.5rem] border group transition-all duration-300 ${
                  darkMode ? "border-white/5 bg-[#020617]/50" : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200"
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className={`text-8xl font-black absolute -top-4 -right-2 select-none z-0 transition-colors uppercase leading-none ${
                  darkMode ? "text-white/[0.02] group-hover:text-[#22D3EE]/5" : "text-gray-100 group-hover:text-purple-100"
                }`}>
                  {s.step}
                </div>
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-10 ${
                    darkMode ? "bg-[#020617] border-white/10" : "bg-purple-50 border-purple-100"
                  }`}>
                    <span className={`text-sm font-black ${darkMode ? "text-[#22D3EE]" : "text-purple-600"}`}>
                      {s.step}
                    </span>
                  </div>
                  <h4 className={`text-xl font-black mb-6 uppercase tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {s.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            id="ready-to-start-training"
            className="p-12 md:p-20 rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-[#10B981] to-[#3B82F6] flex flex-col items-center justify-center gap-8 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-x-0 h-full w-full bg-[radial-gradient(circle_at_center,white_0.2,transparent_0.2)] bg-[size:40px_40px] opacity-10" />
            <h4 className="text-3xl md:text-5xl lg:text-6xl font-black text-white text-center tracking-tighter leading-none z-10 max-w-4xl">
              Ready to start training?
            </h4>
            <div
              ref={googleLoginContainerRef}
              className="z-10 shadow-2xl rounded-full overflow-hidden hover:scale-105 transition-transform duration-500"
            >
              <div className={`p-1 rounded-full border ${darkMode ? "bg-black/90 border-white/10" : "bg-white border-purple-100"}`}>
                <GoogleOAuthProvider clientId="210526097600-m437ldngthea5krkmo4e8k07k6iouv99.apps.googleusercontent.com">
                  <GoogleLogin
                    onSuccess={onLoginSuccess}
                    onError={onLoginError}
                    theme={darkMode ? "filled_black" : "outline"}
                    shape="pill"
                    size="large"
                    text="signup_with"
                  />
                </GoogleOAuthProvider>
              </div>
            </div>
            <p className="text-[#E2E8F0] text-sm font-black uppercase tracking-[0.2em] z-10">
              Join 12,000+ athletes leading the health revolution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeSec3;
