import React from 'react';
import { motion } from 'framer-motion';

export const CustomLockScreenReactor = ({ glowColor = "#00f3ff", isUnlocking = false }) => {
  const cx = 100;
  const cy = 100;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]">
      <defs>
        <radialGradient id="plasmaCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#40e0d0" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Dark background base */}
      <circle cx={cx} cy={cy} r="95" fill="#01050a" />

      {/* Outer rotating ring (Anticlockwise, Glowing instead of black) */}
      <motion.g 
        animate={{ rotate: -360 }} 
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx={cx} cy={cy} r="88" fill="none" stroke={glowColor} strokeWidth="3" filter="url(#ringGlow)" opacity="0.6" />
        {/* Dashed circular tracks on the outer ring */}
        <circle cx={cx} cy={cy} r="84" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="4 8" opacity="0.8" />
        <circle cx={cx} cy={cy} r="92" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="1 4" opacity="0.5" />
      </motion.g>

      {/* 10 rectangular metallic micro-capacitor blocks */}
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={`capacitor-${i}`} transform={`rotate(${i * 36} ${cx} ${cy})`}>
          {/* Metallic block outline glowing */}
          <rect x="90" y="6" width="20" height="14" fill="#010911" stroke={glowColor} strokeWidth="1.5" rx="2" />
          {/* Horizontal light slits */}
          <line x1="94" y1="10" x2="106" y2="10" stroke={glowColor} strokeWidth="1" opacity="0.8" />
          <line x1="94" y1="13" x2="106" y2="13" stroke={glowColor} strokeWidth="1" opacity="0.8" />
          {/* Glowing white indicator dots */}
          <circle cx="100" cy="17" r="1.5" fill="#ffffff" filter="url(#ringGlow)" />
        </g>
      ))}

      {/* Precision HUD telemetry dials and radial tick marks (Clockwise) */}
      <motion.g 
        animate={{ rotate: 360 }} 
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx={cx} cy={cy} r="72" fill="none" stroke={glowColor} strokeWidth="4" filter="url(#ringGlow)" opacity="0.9" />
        {/* Thick radial ticks */}
        <circle cx={cx} cy={cy} r="65" fill="none" stroke={glowColor} strokeWidth="8" strokeDasharray="2 12" opacity="0.7" />
        {/* Thin radial ticks */}
        <circle cx={cx} cy={cy} r="58" fill="none" stroke={glowColor} strokeWidth="4" strokeDasharray="1 6" opacity="0.5" />
      </motion.g>

      {/* Six-pointed star (Hexagram) superimposed */}
      <g filter="url(#ringGlow)">
        {/* Upward Triangle */}
        <polygon points="100,50 143.3,125 56.7,125" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.9" />
        {/* Downward Triangle */}
        <polygon points="100,150 56.7,75 143.3,75" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.9" />
      </g>

      {/* Center intense bright white circular plasma core with turquoise halo */}
      <motion.circle 
        cx={cx} 
        cy={cy} 
        r="22" 
        fill="url(#plasmaCore)" 
        filter="url(#coreGlow)"
        animate={isUnlocking ? { scale: [1, 2, 0], opacity: [1, 1, 0] } : { scale: [0.95, 1.05, 0.95] }}
        transition={isUnlocking ? { duration: 0.5 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx={cx} cy={cy} r="14" fill="#ffffff" filter="url(#coreGlow)" />

    </svg>
  );
};
