import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArcReactorState, ReactorStyle } from "../types";
import { HOLOGRAPHIC_REACTOR_THEMES, normalizeReactorStyle } from "../lib/reactorThemes";
import { ArcReactorSvg } from "./ArcReactorSvg";
import { usePerformance } from "../context/PerformanceContext";

interface ArcReactorProps {
  state: ArcReactorState;
  onClick?: () => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  reactorStyle?: ReactorStyle;
  audioLevel?: number;
}

export const ArcReactorOrb: React.FC<ArcReactorProps> = ({
  state,
  onClick,
  size = "md",
  className,
  reactorStyle = "core-mark1-classic",
  audioLevel = 0,
}) => {
  const { fps, isLowEnd, mode } = usePerformance();
  const dimensionClass = 
    className ? className :
    size === "xs" ? "w-14 h-14 aspect-square flex-shrink-0" :
    size === "sm" ? "w-24 h-24 aspect-square flex-shrink-0" :
    size === "lg" ? "w-56 h-56 md:w-60 md:h-60 aspect-square flex-shrink-0" : 
    size === "xl" ? "w-64 h-64 md:w-72 md:h-72 aspect-square flex-shrink-0" : 
    "w-36 h-36 md:w-40 md:h-40 aspect-square flex-shrink-0";

  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";

  const validStyle = normalizeReactorStyle(reactorStyle);
  const currentTheme = 
    HOLOGRAPHIC_REACTOR_THEMES.find(t => t.id === validStyle) || 
    HOLOGRAPHIC_REACTOR_THEMES[0];

  // Dynamic glow color based on theme and audio states
  const getGlowColor = () => {
    if (isListening) return "#00f3ff"; // Cyan pulse on listen
    if (isProcessing) return "#a855f7"; // Purple reasoning
    if (isSpeaking) return "#10b981"; // Emerald speaking
    return currentTheme.color || "#00f3ff";
  };

  const glowColor = getGlowColor();

  // Dense 3D Holographic Particle Cloud Canvas throttled to current FPS setting
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const baseDensity = currentTheme.particleDensity || 60;
    const count = isLowEnd ? Math.min(22, Math.round(baseDensity * 0.4)) : baseDensity;
    
    // 3D Particles with depth (x, y, z)
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      radius: number;
      speed: number;
      angle: number;
      dist: number;
      color: string;
      alpha: number;
    }> = [];

    const baseColor = glowColor;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: 0,
        y: 0,
        z: Math.random() * 200 - 100,
        radius: Math.random() * 1.8 + 0.6,
        speed: (Math.random() * 0.025 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 75 + 15,
        color: baseColor,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    let frame = 0;
    let lastRenderTime = 0;
    const targetInterval = 1000 / Math.max(15, fps || 60);

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      const elapsed = time - lastRenderTime;
      if (elapsed < targetInterval - 1) return;
      lastRenderTime = time - (elapsed % targetInterval);

      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const audioMultiplier = isSpeaking ? 1 + audioLevel / 80 : isListening ? 1.2 : 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Orbit update
        p.angle += p.speed * (isProcessing ? 2.5 : 1);
        p.z += Math.sin(frame * 0.02 + i) * 0.4;

        // Perspective 3D projection
        const fov = 160;
        const scale = fov / (fov + p.z);
        const currentDist = p.dist * audioMultiplier;
        
        p.x = centerX + Math.cos(p.angle) * currentDist * scale;
        p.y = centerY + Math.sin(p.angle) * currentDist * 0.65 * scale; // tilted 3D elliptical plane

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.radius * scale), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, Math.max(0.1, p.alpha * scale * (isSpeaking ? 1.3 : 1)));
        ctx.shadowBlur = 6 * scale;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();

        // Connect nearby particles with subtle holographic laser threads
        for (let j = i + 1; j < Math.min(i + 4, particles.length); j++) {
          const p2 = particles[j];
          const distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
          if (distSq < 1200) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - distSq / 1200) * 0.25 * scale;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentTheme, glowColor, isSpeaking, isProcessing, isListening, audioLevel, fps, isLowEnd, mode]);

  return (
    <div 
      onClick={onClick}
      className={`relative ${dimensionClass} aspect-square flex-shrink-0 flex items-center justify-center cursor-pointer select-none group transition-transform duration-300 hover:scale-105 active:scale-95`}
      style={{ perspective: "1000px" }}
    >
      {/* 1. Volumetric Back Glow Aura */}
      <div 
        className="absolute inset-[-14px] rounded-full blur-2xl opacity-60 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor}80 0%, ${glowColor}25 50%, transparent 80%)`,
          transform: isSpeaking ? `scale(${1.15 + audioLevel / 100})` : "scale(1)",
        }}
      />

      {/* 2. Concentric Pulsing Sound Wave / Energy Dispersal Rings */}
      {isSpeaking && (
        <>
          <motion.div
            initial={{ scale: 0.85, opacity: 0.8 }}
            animate={{ scale: [0.88, 1.24], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            style={{ borderColor: glowColor }}
            className="absolute inset-0 rounded-full border border-cyan-400/80 pointer-events-none z-0 shadow-[0_0_15px_#00f3ff]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: [0.92, 1.10], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
            style={{ borderColor: glowColor }}
            className="absolute inset-0 rounded-full border border-dotted pointer-events-none z-0"
          />
        </>
      )}

      {/* 3. Outer Rotating Holographic HUD Compass & Tick Rings */}
      <div 
        className="absolute inset-[-4px] rounded-full border border-cyan-400/30 border-dashed pointer-events-none z-20 animate-[spin_24s_linear_infinite]"
        style={{ boxShadow: `0 0 8px ${glowColor}25` }}
      />
      <div 
        className="absolute inset-[-8px] rounded-full border border-cyan-500/20 pointer-events-none z-20 animate-[spin_16s_linear_infinite_reverse]"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-cyan-400" />
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400" />
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400" />
      </div>

      {/* 4. Core Holographic Chamber Container */}
      <div className="relative w-full h-full aspect-square rounded-full overflow-hidden flex items-center justify-center bg-black/85 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,243,255,0.35)] z-20 backdrop-blur-md flex-shrink-0">
        
        {/* Holographic Laser Scanline Sweep */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#00f3ff] animate-[scan_2.8s_ease-in-out_infinite] pointer-events-none z-40 opacity-90" />

        {/* Scanline CRT Grid Texture Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-30 opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 243, 255, 0.4) 3px, transparent 4px)",
          }}
        />

        {/* Dense Holographic Particle Cloud Canvas */}
        <canvas
          ref={canvasRef}
          width={220}
          height={220}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Authentic Holographic Reactor Core Design Rendering */}
        <div className="relative w-full h-full flex items-center justify-center p-1.5 z-10">
          <ArcReactorSvg
            styleId={validStyle}
            isListening={isListening}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
            glowColor={glowColor}
            audioLevel={audioLevel}
          />
        </div>
      </div>
    </div>
  );
};
