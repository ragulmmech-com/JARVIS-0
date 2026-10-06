import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SuitAssemblyAnimation = ({ trigger }: { trigger: number }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setIsActive(true);
      playClankSound();
      const timer = setTimeout(() => {
        setIsActive(false);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const playClankSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const now = audioCtx.currentTime;
      
      const playClank = (time: number, freq: number) => {
        // Metallic plate clank hit
        const clank = audioCtx.createOscillator();
        const clankGain = audioCtx.createGain();
        clank.type = 'sawtooth';
        clank.frequency.setValueAtTime(freq, time);
        clank.frequency.exponentialRampToValueAtTime(60, time + 0.1);
        clankGain.gain.setValueAtTime(0, time);
        clankGain.gain.linearRampToValueAtTime(0.4, time + 0.02);
        clankGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        clank.connect(clankGain);
        clankGain.connect(audioCtx.destination);
        clank.start(time);
        clank.stop(time + 0.25);
        
        // Metallic ring
        const ring = audioCtx.createOscillator();
        const ringGain = audioCtx.createGain();
        ring.type = 'sine';
        ring.frequency.setValueAtTime(freq * 1.5, time);
        ringGain.gain.setValueAtTime(0, time);
        ringGain.gain.linearRampToValueAtTime(0.2, time + 0.02);
        ringGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        ring.connect(ringGain);
        ringGain.connect(audioCtx.destination);
        ring.start(time);
        ring.stop(time + 0.55);
      };

      // Sequenced Clanks matching suit plates assembly animation
      playClank(now + 0.1, 750); // Left/Right Plates
      playClank(now + 0.35, 550); // Bottom Thrusters
      playClank(now + 0.65, 420); // Top Visor
      playClank(now + 0.8, 850); // Suit Core Lock

      // Resonant Power Whir
      const hum = audioCtx.createOscillator();
      const humGain = audioCtx.createGain();
      hum.type = 'sine';
      hum.frequency.setValueAtTime(70, now + 0.8);
      hum.frequency.exponentialRampToValueAtTime(220, now + 1.6);
      humGain.gain.setValueAtTime(0, now + 0.8);
      humGain.gain.linearRampToValueAtTime(0.3, now + 1.0);
      humGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
      hum.connect(humGain);
      humGain.connect(audioCtx.destination);
      hum.start(now + 0.8);
      hum.stop(now + 2.05);
    } catch (e) {
      console.debug("Suit assembly audio notice:", e);
    }
  };

  const springConf = { type: "spring" as const, stiffness: 350, damping: 25 };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div 
          className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
          style={{ zIndex: 2147483647 }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 2, transition: { duration: 0.8, ease: "easeInOut", delay: 0.2 } }}
        >
          {/* Base darkening */}
          <motion.div 
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Left Plate */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-[#0a121a] to-[#122233] border-r border-[#00f3ff]/40 shadow-[10px_0_30px_rgba(0,0,0,0.9)]"
            style={{ 
              clipPath: 'polygon(0 0, 100% 10%, 80% 50%, 100% 90%, 0 100%)',
              WebkitClipPath: 'polygon(0 0, 100% 10%, 80% 50%, 100% 90%, 0 100%)'
            }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ ...springConf, delay: 0.1 }}
          />

          {/* Right Plate */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#0a121a] to-[#122233] border-l border-[#00f3ff]/40 shadow-[-10px_0_30px_rgba(0,0,0,0.9)]"
            style={{ 
              clipPath: 'polygon(100% 0, 0 10%, 20% 50%, 0 90%, 100% 100%)',
              WebkitClipPath: 'polygon(100% 0, 0 10%, 20% 50%, 0 90%, 100% 100%)'
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            transition={{ ...springConf, delay: 0.1 }}
          />

          {/* Bottom Jaw */}
          <motion.div
            className="absolute bottom-0 left-[5%] right-[5%] h-[50%] bg-gradient-to-t from-[#060c12] to-[#172c42] border-t border-[#00f3ff]/60 shadow-[0_-10px_40px_rgba(0,0,0,0.9)]"
            style={{ 
              clipPath: 'polygon(0 100%, 100% 100%, 100% 70%, 80% 20%, 70% 0, 30% 0, 20% 20%, 0 70%)',
              WebkitClipPath: 'polygon(0 100%, 100% 100%, 100% 70%, 80% 20%, 70% 0, 30% 0, 20% 20%, 0 70%)'
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ ...springConf, delay: 0.4 }}
          >
            {/* Jaw Details */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-3 bg-[#00f3ff] opacity-60 blur-md" />
          </motion.div>

          {/* Top Visor */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-[#060c12] to-[#1c3550] border-b-4 border-[#00f3ff] shadow-[0_15px_50px_rgba(0,243,255,0.3)]"
            style={{ 
              clipPath: 'polygon(0 0, 100% 0, 100% 30%, 80% 80%, 70% 100%, 30% 100%, 20% 80%, 0 30%)',
              WebkitClipPath: 'polygon(0 0, 100% 0, 100% 30%, 80% 80%, 70% 100%, 30% 100%, 20% 80%, 0 30%)'
            }}
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ ...springConf, delay: 0.7 }}
          >
            {/* HUD Eye Glow */}
            <motion.div 
              className="absolute bottom-12 left-[20%] w-40 h-8 bg-[#00f3ff] blur-2xl rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.2 }}
            />
            <motion.div 
              className="absolute bottom-12 right-[20%] w-40 h-8 bg-[#00f3ff] blur-2xl rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.2 }}
            />
          </motion.div>

          {/* Center HUD Boot sequence */}
          <motion.div
            className="absolute z-[2147483647] flex flex-col items-center justify-center text-[#00f3ff]"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5, type: "spring", bounce: 0.5 }}
          >
            <div className="text-4xl md:text-7xl font-black font-['Orbitron',sans-serif] tracking-[0.5em] drop-shadow-[0_0_30px_rgba(0,243,255,1)] text-center">
              SYSTEM ONLINE
            </div>
            <div className="mt-6 flex items-center gap-6">
               <div className="hidden md:block h-[2px] w-32 bg-[#00f3ff]/70 shadow-[0_0_10px_rgba(0,243,255,1)]" />
               <div className="text-sm md:text-lg font-['JetBrains_Mono',monospace] uppercase tracking-widest font-bold opacity-90 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]">
                 Suit Diagnostics: Optimal
               </div>
               <div className="hidden md:block h-[2px] w-32 bg-[#00f3ff]/70 shadow-[0_0_10px_rgba(0,243,255,1)]" />
            </div>
          </motion.div>

          {/* Scanline overlay */}
          <motion.div 
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9InJnYmEoMCwyNDMsMjU1LDAuMDUpIi8+PC9zdmc+')] pointer-events-none opacity-60"
            style={{ zIndex: 2147483647 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
