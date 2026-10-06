const fs = require('fs');

const content = `
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, Cpu, Globe, Zap, Clock, Calendar, MapPin, 
  Globe2, Crosshair, CloudSun, Sun, Wind, Droplets, 
  Battery, BatteryCharging, Wifi, Monitor, Laptop, Server, Database, Activity 
} from 'lucide-react';
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
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_35px_rgba(0,243,255,0.9)]">
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
        {/* Increased standard deviation for MORE GLOW */}
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

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, env, isLowEnd }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const glowColor = "#00f3ff";

  const handleTap = () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 800); 
  };

  const shadowStyle = { textShadow: \`0 0 10px \${glowColor}\` };

  const is24Hour = false;
  const tempUnit = 'C';
  const displayTemperature = env?.weather 
    ? (tempUnit === 'C' ? env?.weather?.temperature : Math.round(((env?.weather?.temperature || 0) * 9/5) + 32)) + '°' + tempUnit
    : '--°C';

  const outAnim = {
    top: isUnlocking ? { y: -200, opacity: 0 } : { y: 0, opacity: 1 },
    bottom: isUnlocking ? { y: 200, opacity: 0 } : { y: 0, opacity: 1 },
    left: isUnlocking ? { x: -300, opacity: 0 } : { x: 0, opacity: 1 },
    right: isUnlocking ? { x: 300, opacity: 0 } : { x: 0, opacity: 1 },
    center: isUnlocking ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }
  };

  const transitionStyle: any = { duration: 0.6, ease: [0.22, 1, 0.36, 1] }; 
  
  // Hardware mocks
  const hwCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;
  const hwMem = typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 8 : 64;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden pointer-events-none text-[#00f3ff]">
        
        {/* TOP: Temporal Chronometer */}
        <motion.div 
          className="w-full max-w-3xl pointer-events-auto" 
          initial={false}
          animate={outAnim.top}
          transition={transitionStyle}
        >
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-['Orbitron',sans-serif] opacity-70 mb-2">
              ATOMIC SYSTEM TIME
            </div>
            <div className="text-3xl md:text-5xl font-extrabold font-['Orbitron',sans-serif] drop-shadow-[0_0_12px_rgba(0,243,255,0.6)] tracking-widest">
              {env?.currentTime || "00:00:00"}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[8px] md:text-[9px] opacity-80 uppercase tracking-widest font-['JetBrains_Mono',monospace]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {env?.currentDate || "Loading..."}</span>
              <span className="opacity-50">|</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {env?.timeZone || "Detecting..."}</span>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE SECTION */}
        <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-between max-w-[1400px] gap-2">
          
          {/* LEFT: Geospatial Coordinates */}
          <motion.div 
            className="hidden md:flex flex-col gap-4 w-48 lg:w-56 pointer-events-auto font-['JetBrains_Mono',monospace]"
            initial={false}
            animate={outAnim.left}
            transition={transitionStyle}
          >
            <div className="flex flex-col gap-1 border-l border-emerald-500/50 pl-3">
              <div className="text-[7px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-emerald-400" /> GEOSPATIAL LOC
              </div>
              <div className="text-xs font-bold text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] truncate">
                {env?.location?.city ? \`\${env.location.city}, \${env.location.region || ''}\` : "Searching..."}
              </div>
              <div className="text-[8px] text-emerald-500/70">{env?.location?.country || "Earth"}</div>
            </div>

            <div className="flex flex-col gap-1 border-l border-emerald-500/50 pl-3">
              <div className="text-[7px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Crosshair className="w-2.5 h-2.5 text-emerald-500" /> COORDINATES
              </div>
              <div className="flex gap-3 text-[9px] text-emerald-300 font-bold">
                <div>LAT: {env?.location?.latitude?.toFixed(4) || "0.0000"}°</div>
                <div>LON: {env?.location?.longitude?.toFixed(4) || "0.0000"}°</div>
              </div>
            </div>
          </motion.div>

          {/* CENTER: Arc Reactor Button */}
          <motion.div
            className="relative cursor-pointer flex items-center justify-center w-56 h-56 md:w-72 md:h-72 lg:w-[400px] lg:h-[400px] mx-auto pointer-events-auto mt-4 md:mt-0"
            onClick={handleTap}
            initial={false}
            animate={outAnim.center}
            whileHover={!isUnlocking ? { scale: 1.05 } : {}}
            transition={{ ...transitionStyle, duration: 0.5 }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <CustomLockScreenReactor glowColor={glowColor} isUnlocking={isUnlocking} />
            </div>
          </motion.div>

          {/* RIGHT: Atmospheric Metrics */}
          <motion.div 
            className="hidden md:flex flex-col gap-4 w-48 lg:w-56 pointer-events-auto text-right font-['JetBrains_Mono',monospace]"
            initial={false}
            animate={outAnim.right}
            transition={transitionStyle}
          >
            <div className="flex flex-col gap-1 border-r border-amber-500/50 pr-3 items-end">
              <div className="text-[7px] text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1">
                ATMOSPHERE <CloudSun className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] font-['Orbitron',sans-serif]">
                {displayTemperature}
              </div>
              <div className="text-[8px] text-amber-500/70">{env?.weather?.description || "Syncing..."}</div>
            </div>

            <div className="flex flex-col gap-1 border-r border-blue-500/50 pr-3 items-end">
              <div className="text-[7px] text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1">
                HUMIDITY <Droplets className="w-2.5 h-2.5 text-blue-400" />
              </div>
              <div className="text-xs font-bold text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                {env?.weather?.humidity || "0"}%
              </div>
            </div>

            <div className="flex flex-col gap-1 border-r border-cyan-500/50 pr-3 items-end">
              <div className="text-[7px] text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1">
                WIND VELOCITY <Wind className="w-2.5 h-2.5 text-cyan-400" />
              </div>
              <div className="text-xs font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                {env?.weather?.windSpeed || "0.0"} km/h
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* BOTTOM: Expanded Hardware & Telemetry Profile */}
        <motion.div 
          className="w-full max-w-5xl mt-auto pb-2 pointer-events-auto" 
          initial={false}
          animate={outAnim.bottom}
          transition={transitionStyle}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="h-[1px] w-12 bg-purple-500/50"></div>
             <div className="text-[7px] md:text-[8px] text-purple-400 uppercase tracking-[0.4em] font-['Orbitron',sans-serif] flex items-center gap-2">
                <Activity className="w-3 h-3" /> SOVEREIGN HARDWARE PROTOCOL
             </div>
             <div className="h-[1px] w-12 bg-purple-500/50"></div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-[7px] md:text-[8px] uppercase font-['JetBrains_Mono',monospace]">
            {/* CPU */}
            <div className="flex flex-col gap-1 border-l border-purple-500/40 pl-2">
              <div className="text-gray-400 flex items-center gap-1"><Cpu className="w-2.5 h-2.5 text-purple-400"/> PROCESSOR</div>
              <div className="text-purple-300 font-bold tracking-wider mt-0.5">{hwCores}-CORE QUANTUM AI</div>
              <div className="text-purple-500/70">3.2 THz OVERCLOCK</div>
            </div>
            {/* RAM */}
            <div className="flex flex-col gap-1 border-l border-emerald-500/40 pl-2">
              <div className="text-gray-400 flex items-center gap-1"><Database className="w-2.5 h-2.5 text-emerald-400"/> SYS_MEMORY</div>
              <div className="text-emerald-300 font-bold tracking-wider mt-0.5">{hwMem} TB UNIFIED</div>
              <div className="text-emerald-500/70">HBM4 PROTOCOL</div>
            </div>
            {/* GPU */}
            <div className="flex flex-col gap-1 border-l border-amber-500/40 pl-2">
              <div className="text-gray-400 flex items-center gap-1"><Monitor className="w-2.5 h-2.5 text-amber-400"/> GRAPHICS</div>
              <div className="text-amber-300 font-bold tracking-wider mt-0.5">TACTICAL NEURAL GPU</div>
              <div className="text-amber-500/70">144 TERAFLOPS</div>
            </div>
            {/* Battery / Power */}
            <div className="flex flex-col gap-1 border-l border-cyan-500/40 pl-2">
              <div className="text-gray-400 flex items-center gap-1">
                {env?.device?.isCharging ? <BatteryCharging className="w-2.5 h-2.5 text-cyan-400"/> : <Battery className="w-2.5 h-2.5 text-cyan-400"/>} 
                POWER CELL
              </div>
              <div className="text-cyan-300 font-bold tracking-wider mt-0.5">
                {env?.device?.batteryLevel !== null && env?.device?.batteryLevel !== undefined ? \`\${env.device.batteryLevel}%\` : "100% Core"}
              </div>
              <div className="text-cyan-500/70">{env?.device?.isCharging ? "[AC LINKED]" : "[STABLE OUTPUT]"}</div>
            </div>
            {/* Network */}
            <div className="flex flex-col gap-1 border-l border-blue-500/40 pl-2">
              <div className="text-gray-400 flex items-center gap-1"><Wifi className="w-2.5 h-2.5 text-blue-400"/> UPLINK</div>
              <div className={\`font-bold tracking-wider mt-0.5 \${env?.device?.online !== false ? "text-blue-300" : "text-red-400"}\`}>
                {env?.device?.online !== false ? "ORBITAL SECURE" : "DISCONNECTED"}
              </div>
              <div className="text-blue-500/70">PING: 4ms</div>
            </div>
            {/* OS / Kernel */}
            <div className="flex flex-col gap-1 border-l border-gray-400/40 pl-2">
              <div className="text-gray-400 flex items-center gap-1"><Server className="w-2.5 h-2.5 text-gray-300"/> SYSTEM KERNEL</div>
              <div className="text-gray-200 font-bold tracking-wider mt-0.5">JARVIS OS v4.2.0</div>
              <div className="text-gray-500/70">{env?.device?.platform || 'NEURAL NET'}</div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
`

fs.writeFileSync('src/components/LockScreen.tsx', content.trim());
