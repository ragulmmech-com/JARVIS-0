const fs = require('fs');

const content = `
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemEnvironment } from '../types';

interface LockScreenProps {
  onUnlock: () => void;
  env?: SystemEnvironment;
  isLowEnd?: boolean;
}

const CustomLockScreenReactor = ({ glowColor, isUnlocking }: { glowColor: string, isUnlocking: boolean }) => {
  const cx = 100;
  const cy = 100;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
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

      <circle cx={cx} cy={cy} r="95" fill="#01050a" />

      <motion.g 
        animate={{ rotate: -360 }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx={cx} cy={cy} r="88" fill="none" stroke={glowColor} strokeWidth="3" filter="url(#ringGlow)" opacity="0.6" />
        <circle cx={cx} cy={cy} r="84" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="4 8" opacity="0.8" />
        <circle cx={cx} cy={cy} r="92" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="1 4" opacity="0.5" />
      </motion.g>

      {Array.from({ length: 10 }).map((_, i) => (
        <g key={\`capacitor-\${i}\`} transform={\`rotate(\${i * 36} \${cx} \${cy})\`}>
          <rect x="90" y="6" width="20" height="14" fill="#010911" stroke={glowColor} strokeWidth="1.5" rx="2" />
          <line x1="94" y1="10" x2="106" y2="10" stroke={glowColor} strokeWidth="1" opacity="0.8" />
          <line x1="94" y1="13" x2="106" y2="13" stroke={glowColor} strokeWidth="1" opacity="0.8" />
          <circle cx="100" cy="17" r="1.5" fill="#ffffff" filter="url(#ringGlow)" />
        </g>
      ))}

      <motion.g 
        animate={{ rotate: 360 }} 
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx={cx} cy={cy} r="72" fill="none" stroke={glowColor} strokeWidth="4" filter="url(#ringGlow)" opacity="0.9" />
        <circle cx={cx} cy={cy} r="65" fill="none" stroke={glowColor} strokeWidth="8" strokeDasharray="2 12" opacity="0.7" />
        <circle cx={cx} cy={cy} r="58" fill="none" stroke={glowColor} strokeWidth="4" strokeDasharray="1 6" opacity="0.5" />
      </motion.g>

      <g filter="url(#ringGlow)">
        <polygon points="100,50 143.3,125 56.7,125" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.9" />
        <polygon points="100,150 56.7,75 143.3,75" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.9" />
      </g>

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

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, isLowEnd }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const glowColor = "#00f3ff";

  const handleTap = () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 450); 
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#01050b] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.08)_0%,transparent_60%)] z-0" />
      
      <AnimatePresence>
        {isUnlocking && (
          <motion.div
            className="absolute inset-0 z-50 rounded-full m-auto w-10 h-10 pointer-events-none bg-white"
            style={{ boxShadow: !isLowEnd ? \`0 0 140px 80px \${glowColor}\` : 'none' }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: isLowEnd ? 30 : 150, opacity: 0 }}
            transition={{ duration: 0.5, ease: "circIn" }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          className="relative cursor-pointer flex items-center justify-center w-64 h-64 md:w-80 md:h-80 lg:w-[350px] lg:h-[350px] pointer-events-auto"
          onClick={handleTap}
          initial={false}
          animate={isUnlocking ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }}
          whileHover={!isUnlocking ? { scale: 1.03 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <CustomLockScreenReactor glowColor={glowColor} isUnlocking={isUnlocking} />
          </div>
        </motion.div>

        <motion.div 
          className="absolute bottom-16 md:bottom-20 w-full text-center"
          animate={isUnlocking ? { y: 50, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.8em] text-[#00f3ff]/70 uppercase font-['Orbitron',sans-serif] font-medium">
            SYSTEM LOCKED // TAP TO AUTHENTICATE
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
`

fs.writeFileSync('src/components/LockScreen.tsx', content.trim());
