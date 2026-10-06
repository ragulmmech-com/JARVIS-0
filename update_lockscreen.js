const fs = require('fs');

const content = `
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  Cpu, 
  Globe, 
  Zap, 
  Clock, 
  Calendar, 
  MapPin, 
  Globe2, 
  Crosshair, 
  CloudSun, 
  Sun, 
  Wind, 
  Droplets, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  Monitor, 
  Laptop, 
  ExternalLink 
} from 'lucide-react';
import { SystemEnvironment } from '../types';

interface LockScreenProps {
  onUnlock: () => void;
  env?: SystemEnvironment;
  isLowEnd?: boolean;
}

const CustomLockScreenReactor = ({ glowColor, isUnlocking }: { glowColor: string, isUnlocking: boolean }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 z-0">
        <polygon 
          points="50,5 93,25 93,75 50,95 7,75 7,25" 
          fill="none" 
          stroke={glowColor} 
          strokeWidth="1.5"
          opacity="0.6"
          className="animate-pulse"
        />
        <polygon 
          points="50,15 80,32 80,68 50,85 20,68 20,32" 
          fill="none" 
          stroke={glowColor} 
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
      <div className="relative z-10 w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center bg-[#010a18]/60 backdrop-blur-sm" style={{ boxShadow: \`0 0 30px \${glowColor}30\` }}>
        <div className="w-16 h-16 rounded-full border border-cyan-400/50 flex items-center justify-center">
          <div 
            className={\`w-10 h-10 rounded-full transition-all duration-1000 \${isUnlocking ? 'scale-150 opacity-0' : 'scale-100 opacity-100 animate-pulse'}\`}
            style={{ 
              background: \`radial-gradient(circle, \${glowColor} 0%, transparent 70%)\`,
              boxShadow: \`0 0 20px \${glowColor}\`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, env, isLowEnd }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const glowColor = "#00f3ff";

  const handleTap = () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    // Play unlock sound here if needed
    setTimeout(() => {
      onUnlock();
    }, 800); // Wait for animations to finish
  };

  const shadowStyle = { textShadow: \`0 0 10px \${glowColor}\` };

  // Derived environmental data defaults
  const is24Hour = false;
  const tempUnit = 'C';
  const displayTemperature = env?.weather 
    ? (tempUnit === 'C' ? env.weather.temperature : Math.round((env.weather.temperature * 9/5) + 32)) + '°' + tempUnit
    : '--°C';

  // Animation states for parts flying out
  const outAnim = {
    top: isUnlocking ? { y: -200, opacity: 0 } : { y: 0, opacity: 1 },
    bottom: isUnlocking ? { y: 200, opacity: 0 } : { y: 0, opacity: 1 },
    left: isUnlocking ? { x: -300, opacity: 0 } : { x: 0, opacity: 1 },
    right: isUnlocking ? { x: 300, opacity: 0 } : { x: 0, opacity: 1 },
    center: isUnlocking ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }
  };

  const transitionStyle: any = { duration: 0.6, ease: [0.22, 1, 0.36, 1] }; // smooth cinematic ease

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#01050b] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      {/* Background Matrix/Grid (fades out slightly) */}
      <motion.svg 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        animate={{ opacity: isUnlocking ? 0 : 0.2 }}
        transition={{ duration: 0.4 }}
      >
        <pattern id="lock-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={glowColor} strokeWidth="0.5" opacity="0.3" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#lock-grid)" />
        
        {/* Subtle crosshairs */}
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke={glowColor} strokeWidth="1" opacity="0.4" />
        <line x1="75%" y1="0" x2="75%" y2="100%" stroke={glowColor} strokeWidth="1" opacity="0.4" />
        <line x1="0" y1="20%" x2="100%" y2="20%" stroke={glowColor} strokeWidth="1" opacity="0.2" />
        <line x1="0" y1="80%" x2="100%" y2="80%" stroke={glowColor} strokeWidth="1" opacity="0.2" />
        <circle cx="50%" cy="50%" r="40%" stroke={glowColor} strokeWidth="1" fill="none" opacity="0.1" strokeDasharray="10 20" />
      </motion.svg>

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

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden pointer-events-none">
        
        {/* TOP: Temporal Chronometer (Flies UP) */}
        <motion.div 
          className="w-full max-w-4xl" 
          initial={false}
          animate={outAnim.top}
          transition={transitionStyle}
        >
          <div className="bg-[#051329]/40 border border-[#00f3ff]/20 rounded-xl p-3 md:p-4 backdrop-blur-sm pointer-events-auto shadow-[0_0_15px_rgba(0,243,255,0.05)]">
            <div className="flex items-center justify-between mb-3 border-b border-[#00f3ff]/15 pb-2">
              <div className="flex items-center gap-2 text-[#00f3ff] font-bold text-xs md:text-sm">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
                <span className="font-['Orbitron',sans-serif] tracking-wider">TEMPORAL CHRONOMETER</span>
              </div>
              <div className="text-[#00f3ff]/60 text-[8px] md:text-[10px] tracking-widest uppercase font-['JetBrains_Mono',monospace]">
                FORMAT: {is24Hour ? "24-HOUR" : "12-HOUR (AM/PM)"}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 font-['JetBrains_Mono',monospace]">
              {/* Primary Time Display */}
              <div className="md:col-span-2 bg-[#020712]/60 border border-cyan-500/30 rounded-lg p-3 md:p-4 flex flex-col justify-center">
                <div className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  ATOMIC SYSTEM TIME
                </div>
                <div className="text-2xl md:text-4xl font-extrabold font-['Orbitron',sans-serif] text-cyan-300 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] tracking-wider">
                  {env?.currentTime || "00:00:00"}
                </div>
                <div className="flex items-center gap-2 mt-1 md:mt-2 text-[10px] md:text-xs text-cyan-400/90 font-medium">
                  <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400" />
                  <span>{env?.currentDate || "Loading..."} ({env?.dayOfWeek || "---"})</span>
                </div>
              </div>
              {/* Secondary Time Data */}
              <div className="hidden md:flex flex-col gap-2">
                <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-2.5">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">TIMEZONE</div>
                  <div className="text-xs font-bold text-gray-300 truncate mt-1">{env?.timezone || "Detecting..."}</div>
                </div>
                <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-2.5">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">UNIX EPOCH</div>
                  <div className="text-xs text-gray-400 truncate mt-1">{Date.now()}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE SECTION: Left (Geospatial), Center (Reactor), Right (Weather) */}
        <div className="flex-1 w-full flex items-center justify-between max-w-[1400px]">
          
          {/* LEFT: Geospatial Coordinates (Flies LEFT) */}
          <motion.div 
            className="hidden xl:block w-80 2xl:w-96 pointer-events-auto"
            initial={false}
            animate={outAnim.left}
            transition={transitionStyle}
          >
            <div className="bg-[#051329]/40 border border-[#00f3ff]/20 rounded-xl p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,243,255,0.05)] font-['JetBrains_Mono',monospace]">
              <div className="flex items-center justify-between mb-3 border-b border-[#00f3ff]/15 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="font-['Orbitron',sans-serif]">GEOSPATIAL COORDINATES</span>
                </div>
                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">GPS</span>
              </div>
              <div className="space-y-3">
                <div className="bg-[#020712]/60 border border-emerald-500/30 rounded-lg p-3">
                  <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1 mb-1.5">
                    <Globe2 className="w-3 h-3 text-emerald-400" /> DETECTED TERRITORY
                  </div>
                  <div className="text-base font-bold text-emerald-300 truncate font-['Orbitron',sans-serif]">
                    {env?.location?.city ? \`\${env.location.city}, \${env.location.region || ''}\` : "Searching..."}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1">
                    {env?.location?.country || "Earth"}
                    {env?.location?.countryCode && (
                      <span className="bg-gray-800 text-gray-300 px-1 py-0.5 rounded text-[8px] font-bold">
                        {env.location.countryCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-3 relative overflow-hidden">
                  <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1 mb-2 relative z-10">
                    <Crosshair className="w-3 h-3 text-emerald-500" /> COORDINATE MAPPING
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative z-10">
                    <div className="bg-black/50 border border-gray-800 rounded p-1.5">
                      <div className="text-[8px] text-gray-500">LATITUDE</div>
                      <div className="text-xs text-emerald-300 font-bold">{env?.location?.latitude?.toFixed(5) || "0.00000"}°</div>
                    </div>
                    <div className="bg-black/50 border border-gray-800 rounded p-1.5">
                      <div className="text-[8px] text-gray-500">LONGITUDE</div>
                      <div className="text-xs text-emerald-300 font-bold">{env?.location?.longitude?.toFixed(5) || "0.00000"}°</div>
                    </div>
                  </div>
                  {/* Map overlay effect */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen" 
                       style={{ backgroundImage: \`radial-gradient(circle at center, #10b981 1px, transparent 1px)\`, backgroundSize: '10px 10px' }}></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CENTER: Reactor Button */}
          <motion.div
            className="relative cursor-pointer flex items-center justify-center w-56 h-56 md:w-72 md:h-72 mx-auto pointer-events-auto"
            onClick={handleTap}
            initial={false}
            animate={outAnim.center}
            whileHover={!isUnlocking ? { scale: 1.05 } : {}}
            transition={{ ...transitionStyle, duration: 0.5 }}
          >
            {/* Decorative outer rings for arc reactor */}
            <motion.div 
              className="absolute inset-[-40px] md:inset-[-50px] border border-dashed border-[#00f3ff]/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <motion.div 
              className="absolute inset-[-20px] md:inset-[-25px] border-[2px] border-[#00f3ff]/10 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <motion.div 
              className="absolute inset-[-60px] md:inset-[-80px] border-[1px] border-[#00f3ff]/5 rounded-full"
              animate={{ rotate: 180 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            ></motion.div>

            <div className="absolute inset-0 pointer-events-none">
              <CustomLockScreenReactor glowColor={glowColor} isUnlocking={isUnlocking} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-10 flex-col opacity-90 mt-40 md:mt-48 pointer-events-none">
              <Fingerprint size={28} md-size={32} style={{ color: glowColor, ...shadowStyle }} className="animate-pulse" />
              <div className="text-xs uppercase tracking-[0.4em] mt-3 font-bold font-['Orbitron',sans-serif] bg-[#010911]/90 px-4 py-1.5 rounded border border-[#00f3ff]/30 backdrop-blur" style={{ color: glowColor }}>Unlock</div>
            </div>
          </motion.div>

          {/* RIGHT: Atmospheric Metrics (Flies RIGHT) */}
          <motion.div 
            className="hidden xl:block w-80 2xl:w-96 pointer-events-auto"
            initial={false}
            animate={outAnim.right}
            transition={transitionStyle}
          >
            <div className="bg-[#051329]/40 border border-[#00f3ff]/20 rounded-xl p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,243,255,0.05)] font-['JetBrains_Mono',monospace]">
              <div className="flex items-center justify-between mb-3 border-b border-[#00f3ff]/15 pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <CloudSun className="w-4 h-4 text-amber-400" />
                  <span className="font-['Orbitron',sans-serif]">ATMOSPHERIC METRICS</span>
                </div>
                <div className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {env?.weather?.isDay ? 'DAY' : 'NIGHT'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Temperature */}
                <div className="bg-[#020712]/60 border border-amber-500/30 rounded-lg p-3">
                  <div className="text-[9px] text-gray-400 uppercase">TEMPERATURE</div>
                  <div className="text-xl font-bold text-amber-300 font-['Orbitron',sans-serif] mt-1">
                    {displayTemperature}
                  </div>
                  <div className="text-[9px] text-amber-400/80 truncate mt-0.5 font-medium">
                    {env?.weather?.description || "Syncing..."}
                  </div>
                </div>
                {/* Humidity */}
                <div className="bg-[#020712]/60 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> HUMIDITY
                  </div>
                  <div className="text-xl font-bold text-blue-300 font-['Orbitron',sans-serif] mt-1">
                    {env?.weather?.humidity || "0"}%
                  </div>
                  <div className="text-[9px] text-blue-400/80 mt-0.5">Atm. Moisture</div>
                </div>
                {/* Wind Velocity */}
                <div className="col-span-2 bg-[#020712]/60 border border-cyan-500/30 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1">
                      <Wind className="w-3 h-3 text-cyan-400" /> WIND VELOCITY
                    </div>
                    <div className="text-lg font-bold text-cyan-300 font-['Orbitron',sans-serif] mt-1">
                      {env?.weather?.windSpeed || "0.0"} <span className="text-[10px] text-gray-400">km/h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-gray-400 uppercase">LIGHT MATRIX</div>
                    <div className="text-sm font-bold text-yellow-300 mt-1 flex items-center justify-end gap-1.5">
                      {env?.weather?.isDay ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <CloudSun className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{env?.weather?.isDay ? "DIURNAL" : "NOCTURNAL"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* BOTTOM: Hardware & Telemetry Profile (Flies DOWN) */}
        <motion.div 
          className="w-full max-w-4xl mt-auto" 
          initial={false}
          animate={outAnim.bottom}
          transition={transitionStyle}
        >
          <div className="bg-[#051329]/40 border border-[#00f3ff]/20 rounded-xl p-3 md:p-4 backdrop-blur-sm pointer-events-auto shadow-[0_0_15px_rgba(0,243,255,0.05)] font-['JetBrains_Mono',monospace]">
            <div className="flex items-center justify-between mb-3 border-b border-[#00f3ff]/15 pb-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs md:text-sm">
                <Cpu className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                <span className="font-['Orbitron',sans-serif] tracking-wider">HARDWARE & TELEMETRY PROFILE</span>
              </div>
              <span className="text-[8px] md:text-[10px] text-gray-400 tracking-widest uppercase">SOVEREIGN PROTOCOL</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] md:text-[11px]">
              {/* Battery */}
              <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-2.5">
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  {env?.device?.isCharging ? <BatteryCharging className="w-3 h-3 text-emerald-400" /> : <Battery className="w-3 h-3 text-cyan-400" />}
                  POWER CELL
                </div>
                <div className="text-sm md:text-base font-bold text-emerald-300 mt-1">
                  {env?.device?.batteryLevel !== null && env?.device?.batteryLevel !== undefined ? \`\${env.device.batteryLevel}%\` : "100% Core"}
                </div>
                <div className="text-[9px] md:text-[10px] text-gray-400">
                  {env?.device?.isCharging ? "Charging Linked" : "Battery Mode"}
                </div>
              </div>
              {/* Network */}
              <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-2.5">
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" /> NETWORK
                </div>
                <div className={\`text-sm md:text-base font-bold mt-1 \${env?.device?.online ? "text-emerald-300" : "text-red-400"}\`}>
                  {env?.device?.online !== false ? "ONLINE" : "OFFLINE"}
                </div>
                <div className="text-[9px] md:text-[10px] text-gray-400 truncate">
                  {env?.device?.networkType || "Matrix Link"}
                </div>
              </div>
              {/* Screen Display */}
              <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-2.5">
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-cyan-400" /> DISPLAY
                </div>
                <div className="text-sm md:text-base font-bold text-cyan-200 mt-1 truncate">
                  {env?.device?.screenResolution || "Auto"}
                </div>
                <div className="text-[9px] md:text-[10px] text-gray-400">Hardware Canvas</div>
              </div>
              {/* Platform / OS */}
              <div className="bg-[#020712]/60 border border-gray-800 rounded-lg p-2.5">
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-purple-400" /> PLATFORM
                </div>
                <div className="text-sm md:text-base font-bold text-purple-200 mt-1 truncate">
                  {env?.device?.platform || "Unknown OS"}
                </div>
                <div className="text-[9px] md:text-[10px] text-gray-400 truncate">Lang: {env?.device?.language || "en"}</div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
`

fs.writeFileSync('src/components/LockScreen.tsx', content.trim());
