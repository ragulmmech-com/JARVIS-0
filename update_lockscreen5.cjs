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
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_45px_rgba(0,243,255,1)]">
      <defs>
        <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor="#e0ffff" stopOpacity="1" />
          <stop offset="60%" stopColor={glowColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coilGrad" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#041220" stopOpacity="1" />
          <stop offset="100%" stopColor="#0a2a4a" stopOpacity="1" />
        </radialGradient>
        <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lightGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background casing */}
      <circle cx={cx} cy={cy} r="96" fill="#01060d" stroke="#041a2e" strokeWidth="2" />
      
      {/* Outer casing ring */}
      <circle cx={cx} cy={cy} r="88" fill="none" stroke="#061826" strokeWidth="12" />
      <circle cx={cx} cy={cy} r="88" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.3" />

      {/* Screws/Rivets on outer ring */}
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={\`rivet-\${i}\`} cx="100" cy="12" r="2.5" fill="#1a364f" transform={\`rotate(\${i * 60} 100 100)\`} />
      ))}

      {/* Main glowing track under the coils */}
      <circle cx={cx} cy={cy} r="70" fill="none" stroke={glowColor} strokeWidth="18" opacity="0.4" filter="url(#heavyGlow)" />
      <circle cx={cx} cy={cy} r="70" fill="none" stroke={glowColor} strokeWidth="12" opacity="0.7" filter="url(#lightGlow)" />
      
      {/* 10 Thick Copper/Metal Coils - NOW ROTATING ANTICLOCKWISE */}
      <motion.g 
        animate={{ rotate: -360 }} 
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={\`coil-\${i}\`} transform={\`rotate(\${i * 36} \${cx} \${cy})\`}>
            {/* Coil base block */}
            <path d="M 83 20 L 117 20 L 112 40 L 88 40 Z" fill="url(#coilGrad)" stroke="#00f3ff" strokeWidth="0.5" opacity="0.9" />
            
            {/* Wire wrappings (horizontal lines) to simulate copper wire */}
            <line x1="84.5" y1="23" x2="115.5" y2="23" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="85" y1="27" x2="115" y2="27" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="86" y1="31" x2="114" y2="31" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="87" y1="35" x2="113" y2="35" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            
            {/* Side brackets */}
            <line x1="84" y1="20" x2="88" y2="40" stroke="#00f3ff" strokeWidth="1.5" opacity="0.8" filter="url(#lightGlow)" />
            <line x1="116" y1="20" x2="112" y2="40" stroke="#00f3ff" strokeWidth="1.5" opacity="0.8" filter="url(#lightGlow)" />
          </g>
        ))}
      </motion.g>

      {/* Inner mechanical dial */}
      <motion.g 
        animate={{ rotate: 360 }} 
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx={cx} cy={cy} r="50" fill="none" stroke="#041a2e" strokeWidth="6" />
        <circle cx={cx} cy={cy} r="50" fill="none" stroke={glowColor} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.9" filter="url(#lightGlow)" />
        {/* 3 spokes from original inner ring */}
        {Array.from({ length: 3 }).map((_, i) => (
          <g key={\`spoke-\${i}\`} transform={\`rotate(\${i * 120} 100 100)\`}>
             <path d="M 98 47 L 102 47 L 104 53 L 96 53 Z" fill="#00f3ff" opacity="0.9" filter="url(#lightGlow)" />
             <line x1="100" y1="53" x2="100" y2="60" stroke="#00f3ff" strokeWidth="2" opacity="0.6" />
          </g>
        ))}
      </motion.g>

      {/* Fast counter-rotating inner dashed ring */}
      <motion.g 
        animate={{ rotate: -360 }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
         <circle cx={cx} cy={cy} r="42" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="6 6" opacity="0.9" filter="url(#lightGlow)" />
         <circle cx={cx} cy={cy} r="38" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
      </motion.g>

      {/* The palladium core casing */}
      <circle cx={cx} cy={cy} r="32" fill="#01060d" stroke="#0a2a4a" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="32" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="1" filter="url(#lightGlow)" />

      {/* Central Bright Palladium Core */}
      <motion.circle 
        cx={cx} cy={cy} r="28" 
        fill="url(#coreGrad)" 
        filter="url(#heavyGlow)"
        animate={isUnlocking ? { scale: [1, 5, 0], opacity: [1, 1, 0] } : { scale: [0.95, 1.05, 0.95] }}
        transition={isUnlocking ? { duration: 0.8, ease: "easeInOut" } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx={cx} cy={cy} r="18" fill="#ffffff" filter="url(#heavyGlow)" opacity="1" />
      <circle cx={cx} cy={cy} r="8" fill="#ffffff" />
    </svg>
  );
};

// --- SPIDER LEG WIDGET COMPONENT ---
const SpiderLeg = ({ leg, isUnlocking, env }: any) => {
  return (
    <motion.div 
      className={\`absolute left-0 top-1/2 flex items-center \${leg.radiusClass}\`}
      style={{ 
        originX: 0, 
        originY: 0.5, 
        rotate: leg.angle,
        marginTop: '-0.5px' 
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isUnlocking ? 0 : 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Connecting Line */}
      <motion.div 
        className="h-[1px] bg-gradient-to-r from-[#00f3ff]/10 via-[#00f3ff]/50 to-[#00f3ff] w-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ originX: 0 }}
      />
      {/* Dot */}
      <motion.div 
        className="absolute right-0 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      
      {/* Widget Content (Counter-rotated to remain upright) */}
      <motion.div 
        className="absolute right-0 translate-x-1/2"
        style={{ rotate: -leg.angle }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <div className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.9)]">
          {leg.render(env)}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, env, isLowEnd }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const glowColor = "#00f3ff";

  const playUnlockSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      // High beep
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.2);

      // Power down hum
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.6);
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      osc2.connect(filter);
      filter.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.start(audioCtx.currentTime + 0.1);
      osc2.stop(audioCtx.currentTime + 0.7);
    } catch (e) {
      console.warn("Audio not supported or blocked");
    }
  };

  const handleTap = () => {
    if (isUnlocking) return;
    playUnlockSound();
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 800); 
  };

  const legs = [
    { id: 'time', angle: -90, radiusClass: 'spider-leg-short', render: (env: any) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">ATOMIC TIME</div>
        <div className="text-sm md:text-xl font-bold font-['Orbitron',sans-serif]">{env?.currentTime || "00:00:00"}</div>
      </div>
    )},
    { id: 'os', angle: -40, radiusClass: 'spider-leg-long', render: (env: any) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">KERNEL</div>
        <div className="text-xs md:text-sm font-bold font-['JetBrains_Mono',monospace]">JARVIS v4.2</div>
        <div className="text-[5px] md:text-[7px] opacity-60">SYS LINKED</div>
      </div>
    )},
    { id: 'weather', angle: 0, radiusClass: 'spider-leg-long', render: (env: any) => {
      const displayTemperature = env?.weather 
        ? (env?.weather?.temperature) + '°C'
        : '--°C';
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">ATMOSPHERE</div>
          <div className="text-xs md:text-sm font-bold font-['Orbitron',sans-serif]">{displayTemperature}</div>
          <div className="text-[5px] md:text-[7px] opacity-60">{env?.weather?.description || "Syncing"}</div>
        </div>
      );
    }},
    { id: 'network', angle: 40, radiusClass: 'spider-leg-long', render: (env: any) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">UPLINK</div>
        <div className={\`text-xs md:text-sm font-bold font-['JetBrains_Mono',monospace] \${env?.device?.online !== false ? "text-[#00f3ff]" : "text-red-400"}\`}>
          {env?.device?.online !== false ? "SECURE" : "OFFLINE"}
        </div>
        <div className="text-[5px] md:text-[7px] opacity-60">PING: 4ms</div>
      </div>
    )},
    { id: 'gpu', angle: 90, radiusClass: 'spider-leg-short', render: () => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">GRAPHICS</div>
        <div className="text-xs md:text-sm font-bold font-['JetBrains_Mono',monospace]">NEURAL GPU</div>
        <div className="text-[5px] md:text-[7px] opacity-60">144 TFLOPS</div>
      </div>
    )},
    { id: 'power', angle: 140, radiusClass: 'spider-leg-long', render: (env: any) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">POWER CELL</div>
        <div className="text-xs md:text-sm font-bold font-['JetBrains_Mono',monospace]">
          {env?.device?.batteryLevel !== null && env?.device?.batteryLevel !== undefined ? \`\${env.device.batteryLevel}%\` : "100%"}
        </div>
        <div className="text-[5px] md:text-[7px] opacity-60">{env?.device?.isCharging ? "AC LINKED" : "DISCHARGING"}</div>
      </div>
    )},
    { id: 'geo', angle: 180, radiusClass: 'spider-leg-long', render: (env: any) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">LOCATION</div>
        <div className="text-xs md:text-sm font-bold font-['JetBrains_Mono',monospace] truncate max-w-[100px] text-center">
          {env?.location?.city || "Unknown"}
        </div>
        <div className="text-[5px] md:text-[7px] opacity-60">{env?.location?.latitude?.toFixed(2) || "0.00"}, {env?.location?.longitude?.toFixed(2) || "0.00"}</div>
      </div>
    )},
    { id: 'cpu', angle: 220, radiusClass: 'spider-leg-long', render: () => {
      const hwCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;
      const hwMem = typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 8 : 64;
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] opacity-70">CORE SYSTEM</div>
          <div className="text-xs md:text-sm font-bold font-['JetBrains_Mono',monospace]">{hwCores}-CORE AI</div>
          <div className="text-[5px] md:text-[7px] opacity-60">{hwMem}TB UNIFIED RAM</div>
        </div>
      );
    }},
  ];

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <style>{\`
        .spider-leg-long { width: 120px; }
        .spider-leg-short { width: 100px; }
        @media (min-width: 768px) {
           .spider-leg-long { width: 220px; }
           .spider-leg-short { width: 160px; }
        }
        @media (min-width: 1024px) {
           .spider-leg-long { width: 320px; }
           .spider-leg-short { width: 220px; }
        }
      \`}</style>
      
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

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        
        {/* SPIDER LEGS (WIDGETS) */}
        {legs.map(leg => (
          <SpiderLeg key={leg.id} leg={leg} isUnlocking={isUnlocking} env={env} />
        ))}
        
        {/* CENTRAL ARC REACTOR */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 z-20 pointer-events-auto"
          onClick={handleTap}
          whileHover={!isUnlocking ? { scale: 1.05 } : {}}
          animate={isUnlocking ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <CustomLockScreenReactor glowColor={glowColor} isUnlocking={isUnlocking} />
        </motion.div>

      </div>
    </motion.div>
  );
};
`

fs.writeFileSync('src/components/LockScreen.tsx', content.trim());
