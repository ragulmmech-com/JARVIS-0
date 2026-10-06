const fs = require('fs');

const content = `
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Clock, Calendar, MapPin, 
  Crosshair, CloudSun, Wind, Droplets, 
  Battery, BatteryCharging, Wifi, Monitor, Server, Database, Activity 
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

      <circle cx={cx} cy={cy} r="96" fill="#01060d" stroke="#041a2e" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="88" fill="none" stroke="#061826" strokeWidth="12" />
      <circle cx={cx} cy={cy} r="88" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.3" />

      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={\`rivet-\${i}\`} cx="100" cy="12" r="2.5" fill="#1a364f" transform={\`rotate(\${i * 60} 100 100)\`} />
      ))}

      <circle cx={cx} cy={cy} r="70" fill="none" stroke={glowColor} strokeWidth="18" opacity="0.4" filter="url(#heavyGlow)" />
      <circle cx={cx} cy={cy} r="70" fill="none" stroke={glowColor} strokeWidth="12" opacity="0.7" filter="url(#lightGlow)" />
      
      {/* Anticlockwise outer coils */}
      <motion.g 
        animate={{ rotate: -360 }} 
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={\`coil-\${i}\`} transform={\`rotate(\${i * 36} \${cx} \${cy})\`}>
            <path d="M 83 20 L 117 20 L 112 40 L 88 40 Z" fill="url(#coilGrad)" stroke="#00f3ff" strokeWidth="0.5" opacity="0.9" />
            <line x1="84.5" y1="23" x2="115.5" y2="23" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="85" y1="27" x2="115" y2="27" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="86" y1="31" x2="114" y2="31" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="87" y1="35" x2="113" y2="35" stroke="#c48a52" strokeWidth="1.5" opacity="0.9" />
            <line x1="84" y1="20" x2="88" y2="40" stroke="#00f3ff" strokeWidth="1.5" opacity="0.8" filter="url(#lightGlow)" />
            <line x1="116" y1="20" x2="112" y2="40" stroke="#00f3ff" strokeWidth="1.5" opacity="0.8" filter="url(#lightGlow)" />
          </g>
        ))}
      </motion.g>

      {/* Clockwise inner spokes */}
      <motion.g 
        animate={{ rotate: 360 }} 
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx={cx} cy={cy} r="50" fill="none" stroke="#041a2e" strokeWidth="6" />
        <circle cx={cx} cy={cy} r="50" fill="none" stroke={glowColor} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.9" filter="url(#lightGlow)" />
        {Array.from({ length: 3 }).map((_, i) => (
          <g key={\`spoke-\${i}\`} transform={\`rotate(\${i * 120} 100 100)\`}>
             <path d="M 98 47 L 102 47 L 104 53 L 96 53 Z" fill="#00f3ff" opacity="0.9" filter="url(#lightGlow)" />
             <line x1="100" y1="53" x2="100" y2="60" stroke="#00f3ff" strokeWidth="2" opacity="0.6" />
          </g>
        ))}
      </motion.g>

      <motion.g 
        animate={{ rotate: -360 }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
        style={{ transformOrigin: "100px 100px" }}
      >
         <circle cx={cx} cy={cy} r="42" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="6 6" opacity="0.9" filter="url(#lightGlow)" />
         <circle cx={cx} cy={cy} r="38" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
      </motion.g>

      <circle cx={cx} cy={cy} r="32" fill="#01060d" stroke="#0a2a4a" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="32" fill="none" stroke={glowColor} strokeWidth="1.5" opacity="1" filter="url(#lightGlow)" />

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
  
  // Real Hardware Specs State
  const [hwSpecs, setHwSpecs] = useState({
    cores: "Detecting...",
    ram: "Detecting...",
    gpu: "Detecting...",
    os: "Detecting..."
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect Real GPU
    const getGPU = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || (canvas as any).getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer.includes("ANGLE") && renderer.includes(",")) {
               const match = renderer.match(/,\\s*([^,]+)/);
               if (match && match[1]) {
                 renderer = match[1].trim();
               }
            }
            return renderer;
          }
        }
      } catch(e) {}
      return "Generic Display Adapter";
    };

    // Detect Real OS
    const getOS = () => {
      const ua = navigator.userAgent;
      if (ua.indexOf("Win") !== -1) return "Windows OS";
      if (ua.indexOf("Mac") !== -1) return "macOS";
      if (ua.indexOf("X11") !== -1) return "UNIX System";
      if (ua.indexOf("Linux") !== -1) return "Linux Kernel";
      if (/Android/.test(ua)) return "Android OS";
      if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
      return navigator.platform || "Unknown OS";
    };

    const cores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency.toString() : "Unknown";
    const ram = (navigator as any).deviceMemory ? (navigator as any).deviceMemory.toString() : "Unknown";

    setHwSpecs({
      cores: cores,
      ram: ram,
      gpu: getGPU(),
      os: getOS()
    });
  }, []);

  const glowColor = "#00f3ff";

  const playUnlockSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
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

  const displayTemperature = env?.weather 
    ? (env?.weather?.temperature) + '°C'
    : '--°C';

  const outAnim = {
    top: isUnlocking ? { y: -200, opacity: 0 } : { y: 0, opacity: 1 },
    bottom: isUnlocking ? { y: 200, opacity: 0 } : { y: 0, opacity: 1 },
    left: isUnlocking ? { x: -300, opacity: 0 } : { x: 0, opacity: 1 },
    right: isUnlocking ? { x: 300, opacity: 0 } : { x: 0, opacity: 1 },
    center: isUnlocking ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }
  };

  const transitionStyle: any = { duration: 0.6, ease: [0.22, 1, 0.36, 1] }; 

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-black/75 backdrop-blur-md overflow-hidden p-6 md:p-10"
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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between pointer-events-none">
        
        {/* TOP: Temporal Chronometer */}
        <motion.div 
          className="w-full max-w-4xl pt-4 text-center text-[#00f3ff]" 
          initial={false}
          animate={outAnim.top}
          transition={transitionStyle}
        >
          <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-['Orbitron',sans-serif] opacity-70 mb-2">
            ATOMIC SYSTEM TIME
          </div>
          <div className="text-5xl md:text-7xl font-extrabold font-['Orbitron',sans-serif] drop-shadow-[0_0_15px_rgba(0,243,255,0.7)] tracking-widest">
            {env?.currentTime || "00:00:00"}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs md:text-sm opacity-80 uppercase tracking-widest font-['JetBrains_Mono',monospace]">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {env?.currentDate || "Loading..."}</span>
            <span className="opacity-50">|</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {env?.timeZone || "Detecting..."}</span>
          </div>
        </motion.div>

        {/* MIDDLE SECTION */}
        <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-between max-w-[1600px] gap-8">
          
          {/* LEFT: Geospatial Coordinates */}
          <motion.div 
            className="hidden md:flex flex-col gap-8 w-64 lg:w-72 pointer-events-auto font-['JetBrains_Mono',monospace]"
            initial={false}
            animate={outAnim.left}
            transition={transitionStyle}
          >
            <div className="flex flex-col gap-2 pl-4 border-l-2 border-emerald-500/60">
              <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> GEOSPATIAL LOC
              </div>
              <div className="text-xl md:text-2xl font-bold text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)] truncate">
                {env?.location?.city ? \`\${env.location.city}, \${env.location.region || ''}\` : "Searching..."}
              </div>
              <div className="text-[10px] md:text-xs text-emerald-500/80 uppercase tracking-widest">{env?.location?.country || "Earth"}</div>
            </div>

            <div className="flex flex-col gap-2 pl-4 border-l-2 border-emerald-500/60">
              <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-500" /> COORDINATES
              </div>
              <div className="flex flex-col gap-1 text-sm md:text-base text-emerald-300 font-bold">
                <div>LAT: {env?.location?.latitude?.toFixed(4) || "0.0000"}°</div>
                <div>LON: {env?.location?.longitude?.toFixed(4) || "0.0000"}°</div>
              </div>
            </div>
          </motion.div>

          {/* CENTER: Arc Reactor Button */}
          <motion.div
            className="relative cursor-pointer flex items-center justify-center w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 mx-auto pointer-events-auto"
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
            className="hidden md:flex flex-col gap-8 w-64 lg:w-72 pointer-events-auto text-right font-['JetBrains_Mono',monospace]"
            initial={false}
            animate={outAnim.right}
            transition={transitionStyle}
          >
            <div className="flex flex-col gap-2 pr-4 border-r-2 border-amber-500/60 items-end">
              <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
                ATMOSPHERE <CloudSun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] font-['Orbitron',sans-serif]">
                {displayTemperature}
              </div>
              <div className="text-[10px] md:text-xs text-amber-500/80 uppercase tracking-widest">{env?.weather?.description || "Syncing..."}</div>
            </div>

            <div className="flex flex-col gap-2 pr-4 border-r-2 border-blue-500/60 items-end">
              <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
                HUMIDITY <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
                {env?.weather?.humidity || "0"}%
              </div>
            </div>

            <div className="flex flex-col gap-2 pr-4 border-r-2 border-cyan-500/60 items-end">
              <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
                WIND VELOCITY <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                {env?.weather?.windSpeed || "0.0"} km/h
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* BOTTOM: Hardware & Telemetry Grid (REAL SPECS) */}
        <motion.div 
          className="w-full max-w-7xl mt-auto pb-4 pointer-events-auto" 
          initial={false}
          animate={outAnim.bottom}
          transition={transitionStyle}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
             <div className="h-[2px] w-16 md:w-24 bg-purple-500/50"></div>
             <div className="text-[9px] md:text-xs text-purple-400 uppercase tracking-[0.4em] font-['Orbitron',sans-serif] flex items-center gap-2">
                <Activity className="w-4 h-4" /> SOVEREIGN HARDWARE PROTOCOL
             </div>
             <div className="h-[2px] w-16 md:w-24 bg-purple-500/50"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 text-xs uppercase font-['JetBrains_Mono',monospace]">
            {/* CPU */}
            <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-purple-500/50">
              <div className="text-gray-400 flex items-center gap-2 text-[10px] md:text-xs"><Cpu className="w-3.5 h-3.5 text-purple-400"/> PROCESSOR</div>
              <div className="text-purple-300 font-bold tracking-wider text-sm md:text-base">{hwSpecs.cores}-CORE SYSTEM</div>
              <div className="text-purple-500/70 text-[9px] md:text-[10px]">QUANTUM ARCHITECTURE</div>
            </div>
            {/* RAM */}
            <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-emerald-500/50">
              <div className="text-gray-400 flex items-center gap-2 text-[10px] md:text-xs"><Database className="w-3.5 h-3.5 text-emerald-400"/> SYS MEMORY</div>
              <div className="text-emerald-300 font-bold tracking-wider text-sm md:text-base">{hwSpecs.ram} GB UNIFIED</div>
              <div className="text-emerald-500/70 text-[9px] md:text-[10px]">HBM4 PROTOCOL</div>
            </div>
            {/* GPU */}
            <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-amber-500/50">
              <div className="text-gray-400 flex items-center gap-2 text-[10px] md:text-xs"><Monitor className="w-3.5 h-3.5 text-amber-400"/> GRAPHICS</div>
              <div className="text-amber-300 font-bold tracking-wider text-[10px] md:text-xs lg:text-sm line-clamp-2" title={hwSpecs.gpu}>
                {hwSpecs.gpu}
              </div>
              <div className="text-amber-500/70 text-[9px] md:text-[10px]">WEBGL RENDERER</div>
            </div>
            {/* Battery / Power */}
            <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-cyan-500/50">
              <div className="text-gray-400 flex items-center gap-2 text-[10px] md:text-xs">
                {env?.device?.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-cyan-400"/> : <Battery className="w-3.5 h-3.5 text-cyan-400"/>} 
                POWER CELL
              </div>
              <div className="text-cyan-300 font-bold tracking-wider text-sm md:text-base">
                {env?.device?.batteryLevel !== null && env?.device?.batteryLevel !== undefined ? \`\${env.device.batteryLevel}%\` : "100%"}
              </div>
              <div className="text-cyan-500/70 text-[9px] md:text-[10px]">{env?.device?.isCharging ? "[AC LINKED]" : "[STABLE OUTPUT]"}</div>
            </div>
            {/* Network */}
            <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-blue-500/50">
              <div className="text-gray-400 flex items-center gap-2 text-[10px] md:text-xs"><Wifi className="w-3.5 h-3.5 text-blue-400"/> UPLINK</div>
              <div className={\`font-bold tracking-wider text-sm md:text-base \${env?.device?.online !== false ? "text-blue-300" : "text-red-400"}\`}>
                {env?.device?.online !== false ? "ORBITAL SECURE" : "DISCONNECTED"}
              </div>
              <div className="text-blue-500/70 text-[9px] md:text-[10px]">PING: 4ms</div>
            </div>
            {/* OS / Kernel */}
            <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-gray-400/50">
              <div className="text-gray-400 flex items-center gap-2 text-[10px] md:text-xs"><Server className="w-3.5 h-3.5 text-gray-300"/> OS KERNEL</div>
              <div className="text-gray-200 font-bold tracking-wider text-xs md:text-sm line-clamp-1">{hwSpecs.os}</div>
              <div className="text-gray-500/70 text-[9px] md:text-[10px]">SYSTEM DETECTED</div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
`

fs.writeFileSync('src/components/LockScreen.tsx', content.trim());
