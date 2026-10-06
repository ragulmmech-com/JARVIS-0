import React from 'react';
import { motion } from 'motion/react';
import { usePerformance } from '../context/PerformanceContext';

export interface ArcReactorProps {
  mark?: number;
  styleId?: string;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  glowColor?: string;
  pulseSpeed?: number;
  audioLevel?: number;
}

export const ArcReactorSvg = ({
  mark = 1,
  styleId,
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  glowColor = "#00f3ff",
  pulseSpeed = 2.5,
  audioLevel = 0,
}: ArcReactorProps) => {
  const { isLowEnd } = usePerformance();
  const cx = 100;
  const cy = 100;

  // Resolve design index 1 to 7
  let designNum = mark;
  if (styleId) {
    const styleMap: Record<string, number> = {
      "core-mark1-classic": 1,
      "core-mark6-triangular": 2,
      "core-grid-matrix-suit": 3,
      "core-stealth-orbital-orb": 4,
      "core-cyber-neon-gradient": 5,
      "core-tactical-mark7-hud": 6,
      "core-matrix-neon-arc": 7,
    };
    if (styleMap[styleId]) {
      designNum = styleMap[styleId];
    }
  }

  // Audio responsiveness multiplier
  const audioMultiplier = isSpeaking ? 1 + (audioLevel || 15) / 100 : isListening ? 1.15 : 1;

  const svgDefs = (
    <defs>
      <filter id={`hologram-glow-${designNum}`} x="-50%" y="-50%" width="200%" height="200%">
        {!isLowEnd && (
          <feGaussianBlur 
            stdDeviation={isSpeaking ? "6" : isListening ? "5" : "3.5"} 
            result="blur" 
          />
        )}
        {!isLowEnd && (
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        )}
      </filter>

      {/* Cyber gradient for Core 5 & 7 */}
      <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#00f3ff" />
      </linearGradient>

      {/* Radial plasma core */}
      <radialGradient id={`plasmaGrad-${designNum}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="40%" stopColor="#e0f7ff" stopOpacity="0.95" />
        <stop offset="70%" stopColor={glowColor} stopOpacity="0.8" />
        <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
      </radialGradient>

      {/* Metallic copper gradient for Mark I solenoids */}
      <linearGradient id="copperCoil" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="30%" stopColor="#f59e0b" />
        <stop offset="60%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
  );

  const renderDesign = () => {
    switch (designNum) {
      // ==============================================================
      // 1. CORE 01: MARK I PALLADIUM ARC REACTOR (OIP (7).webp)
      // 10-coil copper solenoid ring with circular metallic bezel & cyan plasma core
      // ==============================================================
      case 1:
      default:
        return (
          <g>
            {/* Outer metallic housing ring */}
            <circle cx={cx} cy={cy} r="92" fill="#030814" stroke="#1e293b" strokeWidth="6" />
            <circle cx={cx} cy={cy} r="88" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* 10 Copper Electromagnetic Solenoid Coils at 36-degree intervals */}
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={`solenoid-${i}`} transform={`rotate(${i * 36} ${cx} ${cy})`}>
                <rect x="88" y="10" width="24" height="20" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <rect x="91" y="13" width="18" height="14" rx="2" fill="url(#copperCoil)" />
                <line x1="91" y1="16" x2="109" y2="16" stroke="#fbbf24" strokeWidth="1" opacity="0.8" />
                <line x1="91" y1="19" x2="109" y2="19" stroke="#78350f" strokeWidth="1" opacity="0.8" />
                <line x1="91" y1="22" x2="109" y2="22" stroke="#fbbf24" strokeWidth="1" opacity="0.8" />
                <circle cx="100" cy="25" r="2" fill={glowColor} className="animate-pulse" />
              </g>
            ))}

            {/* Inner brushed metal slotted ring */}
            <circle cx={cx} cy={cy} r="65" fill="#020617" stroke="#475569" strokeWidth="3" />
            <circle cx={cx} cy={cy} r="60" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="8 4" opacity="0.7" className="animate-[spin_24s_linear_infinite]" style={{ transformOrigin: "100px 100px" }} />

            {/* Concentric cooling ring with tick slots */}
            {Array.from({ length: 20 }).map((_, i) => (
              <line 
                key={`vent-${i}`} 
                x1={cx} 
                y1="40" 
                x2={cx} 
                y2="46" 
                stroke={glowColor} 
                strokeWidth="1.5" 
                opacity="0.85"
                transform={`rotate(${i * 18} ${cx} ${cy})`} 
              />
            ))}

            {/* Center glowing plasma sphere */}
            <circle cx={cx} cy={cy} r="35" fill="#03152d" stroke={glowColor} strokeWidth="3" filter={`url(#hologram-glow-${designNum})`} />
            <motion.circle 
              cx={cx} 
              cy={cy} 
              r="24" 
              fill={`url(#plasmaGrad-${designNum})`} 
              animate={{ 
                scale: isSpeaking ? [1, 1.18 * audioMultiplier, 1] : [0.96, 1.04, 0.96],
                opacity: isSpeaking ? [0.9, 1, 0.9] : [0.8, 0.95, 0.8]
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "100px 100px" }}
            />
            {/* Center aperture notches */}
            <circle cx={cx} cy={cy} r="14" fill="none" stroke="#ffffff" strokeWidth="3.5" />
            <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
            <line x1={cx - 18} y1={cy} x2={cx - 10} y2={cy} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1={cx + 10} y1={cy} x2={cx + 18} y2={cy} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      // ==============================================================
      // 2. CORE 02: MARK VI TRI-ELEMENTAL HUD (OIP (6).webp)
      // Inverted triangular vibranium core inside circular HUD + suit telemetry
      // ==============================================================
      case 2:
        return (
          <g>
            {/* Concentric outer circular HUD reticle rings */}
            <circle cx={cx} cy={cy} r="88" fill="none" stroke="#00d2ff" strokeWidth="1.5" strokeDasharray="16 8 4 8" className="animate-[spin_30s_linear_infinite]" style={{ transformOrigin: "100px 100px" }} />
            <circle cx={cx} cy={cy} r="80" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="30 15 10 15" opacity="0.75" />
            <circle cx={cx} cy={cy} r="72" fill="#020a17" stroke="#00d2ff" strokeWidth="2" />

            {/* Lateral Cybernetic Clamps & red chevrons */}
            <path d="M 15 100 L 35 85 L 42 85 L 42 115 L 35 115 Z" fill="#071b30" stroke="#00d2ff" strokeWidth="1.5" />
            <polygon points="36,95 30,100 36,105" fill="#ef4444" />
            <path d="M 185 100 L 165 85 L 158 85 L 158 115 L 165 115 Z" fill="#071b30" stroke="#00d2ff" strokeWidth="1.5" />
            <polygon points="164,95 170,100 164,105" fill="#ef4444" />

            {/* Diagnostic red armor silhouette indicator on right flank */}
            <g transform="translate(170, 70) scale(0.2)" opacity="0.85">
              <path d="M 30 10 Q 50 10 70 10 L 80 40 L 70 90 L 75 140 L 60 140 L 50 100 L 40 140 L 25 140 L 30 90 L 20 40 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            </g>

            {/* Degree ticks & arc brackets */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`deg-${i}`} x1={cx} y1="30" x2={cx} y2="35" stroke="#00d2ff" strokeWidth="1.5" transform={`rotate(${i * 30} ${cx} ${cy})`} />
            ))}

            {/* Inverted Glowing Triangular Vibranium Core */}
            <g filter={`url(#hologram-glow-${designNum})`}>
              <polygon points="60,65 140,65 100,135" fill="#03162b" stroke="#00d2ff" strokeWidth="3" />
              
              {/* 3 Faceted Triangular Energy Petals */}
              <polygon points="70,72 96,72 83,95" fill="#00d2ff" opacity="0.85" />
              <polygon points="104,72 130,72 117,95" fill="#00d2ff" opacity="0.85" />
              <polygon points="85,99 115,99 100,125" fill="#00d2ff" opacity="0.85" />

              {/* Central inverted triangle plasma emitter */}
              <motion.polygon 
                points="84,80 116,80 100,108" 
                fill="#ffffff" 
                stroke="#00d2ff" 
                strokeWidth="1.5"
                animate={{ 
                  scale: isSpeaking ? [0.95, 1.15 * audioMultiplier, 0.95] : [0.98, 1.03, 0.98],
                  opacity: [0.9, 1, 0.9] 
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "100px 92px" }}
              />
            </g>
          </g>
        );

      // ==============================================================
      // 3. CORE 03: DIGITAL GRID SUIT WIREFRAME (OIP (4).webp)
      // 3D wireframe mesh suit + cyan eyes + crimson neck conduits + multi-tier chest unibeam
      // ==============================================================
      case 3:
        return (
          <g>
            <circle cx={cx} cy={cy} r="92" fill="#010611" stroke="#00f0ff" strokeWidth="1.5" opacity="0.6" />
            
            {/* Digital Grid Scanlines across background */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`grid-h-${i}`} x1="15" y1={30 + i * 16} x2="185" y2={30 + i * 16} stroke="#00f0ff" strokeWidth="0.5" opacity="0.25" strokeDasharray="3 3" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`grid-v-${i}`} x1={30 + i * 16} y1="15" x2={30 + i * 16} y2="185" stroke="#00f0ff" strokeWidth="0.5" opacity="0.25" strokeDasharray="3 3" />
            ))}

            {/* Wireframe Armor Bust Contour */}
            <path d="M 50 170 L 65 110 L 78 85 L 100 80 L 122 85 L 135 110 L 150 170" fill="none" stroke="#00f0ff" strokeWidth="1.8" />
            <path d="M 80 80 L 75 40 L 100 25 L 125 40 L 120 80 Z" fill="#041226" stroke="#00f0ff" strokeWidth="1.8" />
            
            {/* Glowing Cyan Eyes */}
            <line x1="82" y1="52" x2="94" y2="54" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" filter={`url(#hologram-glow-${designNum})`} />
            <line x1="118" y1="52" x2="106" y2="54" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" filter={`url(#hologram-glow-${designNum})`} />

            {/* Crimson Glowing Collar Conduits */}
            <path d="M 75 82 Q 100 95 125 82" fill="none" stroke="#ef4444" strokeWidth="2.5" filter={`url(#hologram-glow-${designNum})`} />
            <circle cx="85" cy="85" r="2" fill="#ef4444" />
            <circle cx="100" cy="88" r="2.5" fill="#ef4444" />
            <circle cx="115" cy="85" r="2" fill="#ef4444" />

            {/* Multi-Tier Chest Unibeam Arc Reactor */}
            <g transform="translate(0, 42)">
              <circle cx={cx} cy="100" r="32" fill="#020b18" stroke="#00f0ff" strokeWidth="2" />
              {/* Outer Gear Teeth on Unibeam */}
              {Array.from({ length: 16 }).map((_, i) => (
                <rect 
                  key={`gear-${i}`} 
                  x="98" 
                  y="70" 
                  width="4" 
                  height="6" 
                  fill="#00f0ff" 
                  transform={`rotate(${i * 22.5} ${cx} 100)`} 
                />
              ))}
              <circle cx={cx} cy="100" r="20" fill="#002447" stroke="#38bdf8" strokeWidth="2" />
              <motion.circle 
                cx={cx} 
                cy="100" 
                r="12" 
                fill="#ffffff" 
                filter={`url(#hologram-glow-${designNum})`}
                animate={{ 
                  scale: isSpeaking ? [1, 1.25 * audioMultiplier, 1] : [0.96, 1.04, 0.96] 
                }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ transformOrigin: "100px 100px" }}
              />
            </g>
          </g>
        );

      // ==============================================================
      // 4. CORE 04: STEALTH ORBITAL DEEP SCANNER (OIP (3).webp)
      // Minimalist deep-space stealth dual HUD rings + glowing cyan-blue orb
      // ==============================================================
      case 4:
        return (
          <g>
            <circle cx={cx} cy={cy} r="95" fill="#020610" />

            {/* Outer Precision HUD Tick Rings */}
            <circle cx={cx} cy={cy} r="75" fill="none" stroke="#0099ff" strokeWidth="1" strokeDasharray="3 6" opacity="0.6" className="animate-[spin_40s_linear_infinite]" style={{ transformOrigin: "100px 100px" }} />
            <circle cx={cx} cy={cy} r="68" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="30 10 15 10" className="animate-[spin_25s_linear_infinite_reverse]" style={{ transformOrigin: "100px 100px" }} />
            <circle cx={cx} cy={cy} r="58" fill="none" stroke="#0099ff" strokeWidth="0.8" opacity="0.4" />

            {/* Micro Ticks */}
            {Array.from({ length: 24 }).map((_, i) => (
              <line key={`stealth-tick-${i}`} x1={cx} y1="34" x2={cx} y2="38" stroke="#38bdf8" strokeWidth="1" transform={`rotate(${i * 15} ${cx} ${cy})`} opacity="0.7" />
            ))}

            {/* Glowing Deep Blue Sentient Orb */}
            <circle cx={cx} cy={cy} r="32" fill="#041836" stroke="#0099ff" strokeWidth="2" filter={`url(#hologram-glow-${designNum})`} />
            <motion.circle 
              cx={cx} 
              cy={cy} 
              r="22" 
              fill={`url(#plasmaGrad-${designNum})`}
              animate={{ 
                scale: isSpeaking ? [0.94, 1.2 * audioMultiplier, 0.94] : [0.97, 1.03, 0.97],
                opacity: [0.85, 1, 0.85]
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "100px 100px" }}
            />
            {/* Inner lens specular glint */}
            <circle cx={cx - 6} cy={cy - 6} r="4" fill="#ffffff" opacity="0.9" />
            <circle cx={cx} cy={cy} r="8" fill="#ffffff" />
          </g>
        );

      // ==============================================================
      // 5. CORE 05: CYBERPUNK NEON GRADIENT RING (OIP (2).webp)
      // Magenta-to-cyan neon gradient ring + background dot matrix + J.A.R.V.I.S.
      // ==============================================================
      case 5:
        return (
          <g>
            <circle cx={cx} cy={cy} r="92" fill="#0a0518" stroke="url(#cyberGradient)" strokeWidth="1" opacity="0.5" />

            {/* Inner Micro Dot Matrix Grid */}
            {Array.from({ length: 7 }).map((_, row) =>
              Array.from({ length: 7 }).map((_, col) => {
                const x = 70 + col * 10;
                const y = 70 + row * 10;
                const dist = Math.hypot(x - 100, y - 100);
                if (dist > 42) return null;
                return (
                  <circle key={`dot-${row}-${col}`} cx={x} cy={y} r="1.2" fill="#a855f7" opacity="0.6" />
                );
              })
            )}

            {/* Outer Segmented HUD Ring with Vibrant Magenta-to-Cyan Gradient */}
            <motion.circle 
              cx={cx} 
              cy={cy} 
              r="76" 
              fill="none" 
              stroke="url(#cyberGradient)" 
              strokeWidth="6" 
              strokeDasharray="60 15 40 20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
              filter={`url(#hologram-glow-${designNum})`}
            />
            <circle cx={cx} cy={cy} r="65" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.7" />

            {/* Center Futuristic J.A.R.V.I.S. Logo */}
            <text 
              x={cx} 
              y="102" 
              textAnchor="middle" 
              fill="#ffffff" 
              fontSize="14" 
              fontWeight="900" 
              fontFamily="'Orbitron', sans-serif" 
              letterSpacing="3"
              filter={`url(#hologram-glow-${designNum})`}
            >
              J.A.R.V.I.S.
            </text>
            <text 
              x={cx} 
              y="114" 
              textAnchor="middle" 
              fill="#00f3ff" 
              fontSize="7" 
              fontWeight="bold" 
              fontFamily="'JetBrains Mono', monospace" 
              letterSpacing="2"
            >
              J.A.R.V.I.S.
            </text>
          </g>
        );

      // ==============================================================
      // 6. CORE 06: TACTICAL MARK VII TARGETING MATRIX (OIP.webp)
      // Combat targeting reticle + inverted triangular core + red telemetry brackets
      // ==============================================================
      case 6:
        return (
          <g>
            {/* Concentric Multi-Axis Targeting Reticles */}
            <circle cx={cx} cy={cy} r="88" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="20 10 5 10" />
            <circle cx={cx} cy={cy} r="78" fill="#020914" stroke="#00e5ff" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="66" fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="6 6" className="animate-[spin_18s_linear_infinite]" style={{ transformOrigin: "100px 100px" }} />

            {/* 4-Corner Red Tactical Reticle Brackets */}
            <path d="M 40 55 L 40 40 L 55 40" fill="none" stroke="#ef4444" strokeWidth="2" />
            <path d="M 160 55 L 160 40 L 145 40" fill="none" stroke="#ef4444" strokeWidth="2" />
            <path d="M 40 145 L 40 160 L 55 160" fill="none" stroke="#ef4444" strokeWidth="2" />
            <path d="M 160 145 L 160 160 L 145 160" fill="none" stroke="#ef4444" strokeWidth="2" />

            {/* Inverted Triangular Combat Core with Internal Spokes */}
            <g filter={`url(#hologram-glow-${designNum})`}>
              <polygon points="65,68 135,68 100,132" fill="#031a33" stroke="#00e5ff" strokeWidth="3" />
              <line x1="100" y1="92" x2="65" y2="68" stroke="#00e5ff" strokeWidth="1.5" />
              <line x1="100" y1="92" x2="135" y2="68" stroke="#00e5ff" strokeWidth="1.5" />
              <line x1="100" y1="92" x2="100" y2="132" stroke="#00e5ff" strokeWidth="1.5" />

              {/* Glowing Triangular Core Center */}
              <motion.polygon 
                points="85,78 115,78 100,105" 
                fill="#ffffff" 
                stroke="#00e5ff" 
                strokeWidth="1.5"
                animate={{ 
                  scale: isSpeaking ? [0.95, 1.2 * audioMultiplier, 0.95] : [0.98, 1.02, 0.98] 
                }}
                transition={{ duration: 1.3, repeat: Infinity }}
                style={{ transformOrigin: "100px 90px" }}
              />
            </g>
          </g>
        );

      // ==============================================================
      // 7. CORE 07: NEO-TOKYO CYBER ARC CORE (th.webp)
      // Segmented outer arc rings + purple/cyan neon glow + central J.A.R.V.I.S.
      // ==============================================================
      case 7:
        return (
          <g>
            <circle cx={cx} cy={cy} r="90" fill="#080314" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />

            {/* Segmented Independent Rotating Orbital Arcs */}
            <motion.path 
              d="M 40 40 A 85 85 0 0 1 160 40" 
              fill="none" 
              stroke="#ec4899" 
              strokeWidth="6" 
              strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            />
            <motion.path 
              d="M 160 160 A 85 85 0 0 1 40 160" 
              fill="none" 
              stroke="#00f3ff" 
              strokeWidth="6" 
              strokeLinecap="round"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            />

            {/* Inner Ring with Tick Markers */}
            <circle cx={cx} cy={cy} r="65" fill="#0f0728" stroke="#a855f7" strokeWidth="2" strokeDasharray="12 6" />

            {/* Circuit Constellation Node Dots */}
            {Array.from({ length: 8 }).map((_, i) => (
              <circle key={`node-${i}`} cx={cx + Math.cos(i * 0.78) * 45} cy={cy + Math.sin(i * 0.78) * 45} r="2" fill="#00f3ff" className="animate-pulse" />
            ))}

            {/* Central J.A.R.V.I.S. Emblem */}
            <text 
              x={cx} 
              y="102" 
              textAnchor="middle" 
              fill="#ffffff" 
              fontSize="14" 
              fontWeight="900" 
              fontFamily="'Orbitron', sans-serif" 
              letterSpacing="3"
              filter={`url(#hologram-glow-${designNum})`}
            >
              J.A.R.V.I.S.
            </text>
            <text 
              x={cx} 
              y="115" 
              textAnchor="middle" 
              fill="#00f3ff" 
              fontSize="7" 
              fontWeight="bold" 
              fontFamily="'JetBrains Mono', monospace" 
              letterSpacing="2"
            >
              J.A.R.V.I.S.
            </text>
          </g>
        );
    }
  };

  return (
    <svg 
      viewBox="0 0 200 200" 
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full aspect-square drop-shadow-[0_0_18px_rgba(0,243,255,0.4)] select-none"
    >
      {svgDefs}
      {renderDesign()}
    </svg>
  );
};
