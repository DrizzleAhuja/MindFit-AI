import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkoutScene = ({ size = 'large' }) => {
  const [reps, setReps] = useState(1);
  const [feedback, setFeedback] = useState('Perfect Alignment');
  
  // Animation cycle for reps and feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setReps(prev => (prev % 3) + 1);
    }, 3500); // Slower, more deliberate motion

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reps === 1) setFeedback('Perfect Alignment');
    if (reps === 2) setFeedback('Core Engaged');
    if (reps === 3) setFeedback('Maximum Peak!');
  }, [reps]);

  const isLarge = size === 'large';
  const width = isLarge ? 600 : 400;
  const height = isLarge ? 600 : 400;

  return (
    <div className="relative flex items-center justify-center select-none group">
      {/* Cinematic Blue Aura */}
      <div className="absolute inset-0 bg-blue-500/5 blur-[150px] rounded-full" />
      
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          {/* Korean Humanoid Glossy White Material */}
          <linearGradient id="armorWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          {/* Internal Mechanical Frame Material */}
          <linearGradient id="innerFrame" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          {/* Intense Cyan Neon */}
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="ultraGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="innerShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Scanning Background Grid (Subtle) */}
        <g opacity="0.1">
          <line x1="50" y1="200" x2="350" y2="200" stroke="#22D3EE" strokeWidth="0.5" />
          <line x1="200" y1="50" x2="200" y2="350" stroke="#22D3EE" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="100" stroke="#22D3EE" strokeWidth="0.5" strokeDasharray="5 5" />
        </g>

        {/* AI SKELETON GHOST (Matches Motion) */}
        <g opacity="0.1">
           <line x1="200" y1="120" x2="200" y2="280" stroke="#22D3EE" strokeWidth="1" strokeDasharray="10 5" />
        </g>

        {/* MAIN TORSO - Humanoid Segmented Armor */}
        <g transform="translate(150, 100)">
          {/* Neck / Inner Waist */}
          <rect x="35" y="-10" width="30" height="20" rx="5" fill="url(#innerFrame)" />
          <rect x="25" y="100" width="50" height="40" rx="10" fill="url(#innerFrame)" />
          
          {/* Main Chest Plate */}
          <path d="M10 20 C10 0 90 0 90 20 L95 100 C95 115 5 115 5 100 Z" fill="url(#armorWhite)" filter="url(#innerShadow)" />
          
          {/* Armor Panel Lines */}
          <path d="M15 40 Q50 35 85 40" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
          <path d="M20 70 Q50 65 80 70" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
          
          {/* Core Reactor Glow */}
          <circle cx="50" cy="55" r="12" fill="rgba(34, 211, 238, 0.05)" />
          <circle cx="50" cy="55" r="4" fill="#22D3EE" filter="url(#ultraGlow)" />
        </g>

        {/* HEAD - Sleek Humanoid Visor */}
        <motion.g 
          transform="translate(175, 45)"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Helmet Base */}
          <path d="M0 25 C0 5 50 5 50 25 L45 60 C45 70 5 70 5 60 Z" fill="url(#armorWhite)" filter="url(#innerShadow)" />
          
          {/* Side Sensors / Ears */}
          <rect x="-5" y="30" width="8" height="20" rx="4" fill="url(#armorWhite)" />
          <rect x="47" y="30" width="8" height="20" rx="4" fill="url(#armorWhite)" />
          
          {/* Wide Cyan Visor */}
          <rect x="8" y="25" width="34" height="12" rx="6" fill="#0F172A" />
          <motion.rect 
            x="10" y="29" width="30" height="4" rx="2" fill="#22D3EE" filter="url(#ultraGlow)"
            animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.9, 1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.g>

        {/* LEFT ARM (Stationary Detail) */}
        <g transform="translate(245, 120)" opacity="0.4">
          <circle cx="0" cy="0" r="16" fill="url(#innerFrame)" />
          <path d="M0 0 L35 60 L25 130" stroke="url(#armorWhite)" strokeWidth="20" strokeLinecap="round" />
        </g>

        {/* RIGHT ARM (MECHANICAL CURL) */}
        <g transform="translate(155, 120)">
            {/* Shoulder Joint Housing */}
            <circle cx="0" cy="0" r="20" fill="url(#armorWhite)" />
            <circle cx="0" cy="0" r="14" fill="url(#innerFrame)" />
            <circle cx="0" cy="0" r="4" fill="#22D3EE" filter="url(#ultraGlow)" />

            {/* BICEP - UPPER ARM ASSEMBLY */}
            <motion.g
              animate={{ rotate: [0, -25, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect x="-14" y="0" width="28" height="70" rx="14" fill="url(#armorWhite)" filter="url(#innerShadow)" />
              {/* Internal Bicep Detail */}
              <rect x="-4" y="15" width="8" height="40" rx="4" fill="url(#innerFrame)" opacity="0.3" />

              {/* ELBOW JOINT CAPSULE */}
              <g transform="translate(0, 70)">
                <circle cx="0" cy="0" r="15" fill="url(#armorWhite)" />
                <circle cx="0" cy="0" r="10" fill="url(#innerFrame)" />
                
                {/* FOREARM - MECHANICAL ASSEMBLY */}
                <motion.g
                  animate={{ rotate: [0, -100, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <rect x="-12" y="0" width="24" height="80" rx="12" fill="url(#armorWhite)" filter="url(#innerShadow)" />
                  {/* Piston Detail */}
                  <rect x="-3" y="10" width="6" height="60" rx="3" fill="url(#innerFrame)" opacity="0.2" />
                  
                  {/* WRIST & HEAVY DUMBBELL */}
                  <g transform="translate(0, 80) rotate(-15)">
                    {/* Robotic Hand */}
                    <rect x="-10" y="0" width="20" height="15" rx="5" fill="url(#innerFrame)" />
                    
                    {/* PREMIUM HEAVY DUMBBELL */}
                    <g transform="translate(0, 20)">
                      {/* Handle */}
                      <rect x="-45" y="-5" width="90" height="10" rx="5" fill="url(#innerFrame)" />
                      {/* Hex Weight Blocks */}
                      <path d="M-50 -20 L-30 -20 L-25 0 L-30 20 L-50 20 L-55 0 Z" fill="#0F172A" stroke="#22D3EE" strokeWidth="1.5" />
                      <path d="M50 -20 L30 -20 L25 0 L30 20 L50 20 L55 0 Z" fill="#0F172A" stroke="#22D3EE" strokeWidth="1.5" />
                      {/* Glowing Weight Lines */}
                      <motion.rect 
                        x="-48" y="-12" width="2" height="24" fill="#22D3EE" 
                        animate={{ opacity: [0.3, 1, 0.3] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        filter="url(#ultraGlow)"
                      />
                      <motion.rect 
                        x="46" y="-12" width="2" height="24" fill="#22D3EE" 
                        animate={{ opacity: [0.3, 1, 0.3] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        filter="url(#ultraGlow)"
                      />
                    </g>
                  </g>

                  {/* Motion Path Arc */}
                  <motion.path
                    d="M 30 0 A 30 30 0 0 1 0 -30"
                    stroke="#22D3EE"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                  />
                </motion.g>
              </g>
            </motion.g>
        </g>

        {/* HUD DATA ELEMENTS */}
        <g transform="translate(280, 60)" opacity="0.9">
          <rect width="90" height="45" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
          <text x="12" y="18" fill="#67E8F9" fontSize="7" fontWeight="bold" className="uppercase tracking-[0.2em]">Stability</text>
          <motion.text 
            x="12" y="35" fill="white" fontSize="14" fontWeight="black"
            animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 1, repeat: Infinity }}
          >
            98.4<tspan fontSize="8" fill="#67E8F9">%</tspan>
          </motion.text>
        </g>
      </svg>

      {/* PREMIUM OVERLAYS */}
      <div className="absolute top-[15%] right-[10%] text-right pointer-events-none">
        <div className="text-[14px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-1 drop-shadow-2xl">REP COUNT</div>
        <motion.div
          key={reps}
          initial={{ scale: 0.7, opacity: 0, x: 30 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          className="text-8xl font-black text-white italic leading-none"
          style={{ textShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }}
        >
          0{reps}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={feedback}
           initial={{ opacity: 0, y: 20, rotateX: 45 }}
           animate={{ opacity: 1, y: 0, rotateX: 0 }}
           exit={{ opacity: 0, y: -20, rotateX: -45 }}
           className="absolute bottom-16 left-12 bg-slate-950/90 backdrop-blur-2xl border-l-[6px] border-cyan-500 p-6 rounded-r-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] z-20 min-w-[220px]"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em]">AI BIOMETRICS</span>
            </div>
            <span className="text-lg font-black text-white italic uppercase tracking-tight">{feedback}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WorkoutScene;
