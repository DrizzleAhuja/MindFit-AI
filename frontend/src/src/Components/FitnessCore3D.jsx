import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const FitnessCore3D = ({ size = 'large' }) => {
  const isLarge = size === 'large';
  const containerSize = isLarge ? 550 : 380;

  return (
    <div className="relative flex items-center justify-center select-none group perspective-1000">
      {/* Deep Atmos Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent blur-[140px] rounded-full animate-pulse" />
      
      <svg
        width={containerSize}
        height={containerSize}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 overflow-visible"
      >
        <defs>
          <filter id="glassGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <radialGradient id="sphereGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#22D3EE" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.3" />
          </radialGradient>

          <linearGradient id="ringPath" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>

          <filter id="synapseGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 3D ROTATING INTERNAL SILHOUETTE */}
        <motion.g 
          transform="translate(200, 200)"
          animate={{ rotateY: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          {/* Humanoid Silhouette */}
          <motion.path 
            d="M0 -120 C-20 -120 -20 -80 -20 -60 L-40 -60 L-60 0 L-70 60 L-20 60 L-25 120 L-20 160 L20 160 L25 120 L20 60 L70 60 L60 0 L40 -60 L20 -60 C20 -80 20 -120 0 -120 Z" 
            fill="rgba(34, 211, 238, 0.2)" 
            stroke="#22D3EE" 
            strokeWidth="0.5" 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Synaptic Pulsing Nodes */}
          {[
            { x: 0, y: -100 }, { x: -30, y: -40 }, { x: 30, y: -40 },
            { x: -50, y: 30 }, { x: 50, y: 30 }, { x: 0, y: 50 },
            { x: -20, y: 140 }, { x: 20, y: 140 }
          ].map((node, i) => (
            <motion.circle
              key={i}
              cx={node.x}
              cy={node.y}
              r="3"
              fill="#22D3EE"
              filter="url(#synapseGlow)"
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.g>

        {/* THE BIO-CORE GLASS SPHERE */}
        <g transform="translate(200, 200)">
          {/* Main Sphere Body */}
          <circle r="180" fill="url(#sphereGrad)" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="1" />
          
          {/* Reflective Glint */}
          <ellipse cx="-40" cy="-80" rx="40" ry="20" fill="white" opacity="0.1" transform="rotate(-30, -40, -80)" />
          
          {/* Perimeter Glow */}
          <circle r="180" stroke="#22D3EE" strokeWidth="0.5" opacity="0.1" />
        </g>

        {/* SINGLE HIGH-TECH ORBITING RING (HUD STYLE) */}
        <motion.g
          transform="translate(200, 200) rotateX(75)"
          animate={{ rotateZ: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle r="220" stroke="url(#ringPath)" strokeWidth="2" strokeDasharray="10 20" />
          
          {/* Ring Hub Data Node */}
          <g transform="translate(220, 0)">
            <rect x="-15" y="-8" width="30" height="16" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#22D3EE" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" fill="#22D3EE" fontSize="6" fontWeight="black" className="uppercase tracking-widest">98%</text>
          </g>
        </motion.g>

        {/* CORE STATUS HUD (Integrated into geometry) */}
        <g transform="translate(200, 340)" opacity="0.8">
          <rect x="-50" y="0" width="100" height="25" rx="5" fill="rgba(15, 23, 42, 0.8)" stroke="#22D3EE" strokeWidth="0.5" />
          <text x="0" y="15" textAnchor="middle" fill="white" fontSize="10" fontWeight="black" className="italic uppercase tracking-widest">Bio-Core Active</text>
        </g>
      </svg>

      {/* AMBIENT DATA VAPOR (Floating indicators) */}
      <div className="absolute top-[30%] right-0 translate-x-[-15%] flex flex-col items-end pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] drop-shadow-2xl">Vitals Sync</span>
        </div>
        <div className="w-24 h-1 bg-cyan-500/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-400" 
            animate={{ width: ['20%', '80%', '20%'] }} 
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};

export default FitnessCore3D;
