const fs = require('fs');

const distinctGeometries = `
      case 1: // Original Cave MK1
        return (
          <>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <motion.g animate={{ rotate: 360 }} transition={{ duration: spinDur * 5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 10}).map((_, i) => (
                <g key={i} transform={\`rotate(\${i * 36} \${cx} \${cy})\`}>
                  <rect x={cx - 8} y={5} width="16" height="25" fill="none" stroke={glowColor} strokeWidth="3" />
                  <rect x={cx - 12} y={15} width="24" height="4" fill={glowColor} opacity="0.8" />
                </g>
              ))}
            </motion.g>
            <circle cx={cx} cy={cy} r="65" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.4" />
            <motion.circle cx={cx} cy={cy} r="45" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 2: // Sleek Palladium MK2
        return (
          <>
            <circle cx={cx} cy={cy} r="90" fill="none" stroke={glowColor} strokeWidth="4" opacity="0.5" />
            <circle cx={cx} cy={cy} r="82" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="5 5" />
            <motion.g animate={{ rotate: -360 }} transition={{ duration: spinDur * 3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 3}).map((_, i) => (
                <path key={i} d="M 100 20 A 80 80 0 0 1 169 60" fill="none" stroke={glowColor} strokeWidth="6" transform={\`rotate(\${i * 120} \${cx} \${cy})\`} />
              ))}
            </motion.g>
            <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.2, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 3: // 8-Segmented Armor MK3
        return (
          <>
            <motion.g animate={{ rotate: 360 }} transition={{ duration: spinDur * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 8}).map((_, i) => (
                <path key={i} d="M 100 10 L 120 30 L 100 40 L 80 30 Z" fill="none" stroke={glowColor} strokeWidth="2" transform={\`rotate(\${i * 45} \${cx} \${cy})\`} />
              ))}
            </motion.g>
            <circle cx={cx} cy={cy} r="60" fill="none" stroke={glowColor} strokeWidth="8" strokeDasharray="1 10" opacity="0.7" />
            <motion.circle cx={cx} cy={cy} r="40" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.98, 1.02, 0.98] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 4: // 4-Cross Brackets
        return (
          <>
            {Array.from({length: 4}).map((_, i) => (
              <g key={i} transform={\`rotate(\${i * 90} \${cx} \${cy})\`}>
                <rect x={cx - 15} y={5} width="30" height="20" fill="none" stroke={glowColor} strokeWidth="4" />
                <line x1={cx} y1={25} x2={cx} y2={60} stroke={glowColor} strokeWidth="4" opacity="0.6" />
              </g>
            ))}
            <motion.circle cx={cx} cy={cy} r="50" fill="none" stroke={glowColor} strokeWidth="2" animate={{ rotate: 360 }} strokeDasharray="20 20" transition={{ duration: spinDur, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 5: // Suitcase MK5 (Slitted Vents)
        return (
          <>
            <ellipse cx={cx} cy={cy} rx="95" ry="75" fill="none" stroke={glowColor} strokeWidth="6" opacity="0.6" />
            <motion.g animate={{ scaleY: isSpeaking ? [0.8, 1.1, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 7}).map((_, i) => (
                <line key={i} x1={cx - 60} y1={55 + i*15} x2={cx + 60} y2={55 + i*15} stroke={glowColor} strokeWidth="3" opacity={0.3 + (i%3)*0.2} />
              ))}
            </motion.g>
            <motion.circle cx={cx} cy={cy} r="40" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} />
          </>
        );

      case 6: // Vibranium Triangle MK6
        return (
          <>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <motion.polygon points="100,20 30,140 170,140" fill="none" stroke={glowColor} strokeWidth="8" strokeLinejoin="round" animate={{ rotate: 360 }} transition={{ duration: spinDur * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.polygon points="100,45 55,125 145,125" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} strokeLinejoin="round" animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.97, 1.03, 0.97] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
          </>
        );

      case 7: // Avengers MK7 (Circular with 6 notches)
        return (
          <>
            <circle cx={cx} cy={cy} r="90" fill="none" stroke={glowColor} strokeWidth="6" opacity="0.4" />
            <motion.g animate={{ rotate: -360 }} transition={{ duration: spinDur * 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 6}).map((_, i) => (
                <polygon key={i} points="100,10 115,30 85,30" fill={glowColor} transform={\`rotate(\${i * 60} \${cx} \${cy})\`} opacity="0.8" />
              ))}
            </motion.g>
            <circle cx={cx} cy={cy} r="65" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="4 8" />
            <motion.circle cx={cx} cy={cy} r="48" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 8: // Star Shape Inner
        return (
          <>
            <motion.circle cx={cx} cy={cy} r="85" fill="none" stroke={glowColor} strokeWidth="3" strokeDasharray="30 15" animate={{ rotate: 360 }} transition={{ duration: spinDur * 3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.polygon points="100,30 115,70 160,70 125,95 140,140 100,115 60,140 75,95 40,70 85,70" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.85, 1.15, 0.85] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
          </>
        );

      case 9: // Hexagon Outer, Circular Inner
        return (
          <>
            <polygon points="100,10 177,55 177,145 100,190 22,145 22,55" fill="none" stroke={glowColor} strokeWidth="5" opacity="0.7" />
            <motion.polygon points="100,25 165,62 165,137 100,175 35,137 35,62" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="10 5" animate={{ rotate: -360 }} transition={{ duration: spinDur * 5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.circle cx={cx} cy={cy} r="45" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.96, 1.04, 0.96] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 10: // Diamond Core
        return (
          <>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.3" />
            <motion.polygon points="100,20 180,100 100,180 20,100" fill="none" stroke={glowColor} strokeWidth="6" animate={{ rotate: 360 }} transition={{ duration: spinDur * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.polygon points="100,45 155,100 100,155 45,100" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.1, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
          </>
        );

      case 11: // Gear Shape
        return (
          <>
            <motion.g animate={{ rotate: 360 }} transition={{ duration: spinDur * 6, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              <circle cx={cx} cy={cy} r="80" fill="none" stroke={glowColor} strokeWidth="15" strokeDasharray="20 10" />
              <circle cx={cx} cy={cy} r="72" fill="none" stroke={glowColor} strokeWidth="2" />
            </motion.g>
            <motion.circle cx={cx} cy={cy} r="40" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 12: // Spiral Core
        return (
          <>
            <motion.g animate={{ rotate: -360 }} transition={{ duration: spinDur * 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 4}).map((_, i) => (
                <path key={i} d="M 100 100 Q 150 20 190 100" fill="none" stroke={glowColor} strokeWidth="4" transform={\`rotate(\${i * 90} \${cx} \${cy})\`} opacity="0.8" />
              ))}
            </motion.g>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="2 6" />
            <motion.circle cx={cx} cy={cy} r="30" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.3, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 13: // Crosshairs / Scope
        return (
          <>
            <circle cx={cx} cy={cy} r="90" fill="none" stroke={glowColor} strokeWidth="4" opacity="0.6" />
            <motion.g animate={{ rotate: 360 }} transition={{ duration: spinDur * 5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              <line x1="10" y1="100" x2="60" y2="100" stroke={glowColor} strokeWidth="3" />
              <line x1="140" y1="100" x2="190" y2="100" stroke={glowColor} strokeWidth="3" />
              <line x1="100" y1="10" x2="100" y2="60" stroke={glowColor} strokeWidth="3" />
              <line x1="100" y1="140" x2="100" y2="190" stroke={glowColor} strokeWidth="3" />
            </motion.g>
            <circle cx={cx} cy={cy} r="65" fill="none" stroke={glowColor} strokeWidth="1" />
            <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 14: // 12-Pointed Burst
        return (
          <>
            <motion.g animate={{ rotate: 360 }} transition={{ duration: spinDur * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 12}).map((_, i) => (
                <polygon key={i} points="95,40 105,40 100,10" fill={glowColor} opacity="0.7" transform={\`rotate(\${i * 30} \${cx} \${cy})\`} />
              ))}
            </motion.g>
            <circle cx={cx} cy={cy} r="45" fill="none" stroke={glowColor} strokeWidth="4" />
            <motion.circle cx={cx} cy={cy} r="30" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.2, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 15: // Oval / Eye Shaped
        return (
          <>
            <motion.ellipse cx={cx} cy={cy} rx="95" ry="50" fill="none" stroke={glowColor} strokeWidth="5" animate={{ rotate: 360 }} transition={{ duration: spinDur * 6, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.ellipse cx={cx} cy={cy} rx="50" ry="95" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.6" animate={{ rotate: -360 }} transition={{ duration: spinDur * 6, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 16: // Octagonal
        return (
          <>
            <motion.polygon points="65,15 135,15 185,65 185,135 135,185 65,185 15,135 15,65" fill="none" stroke={glowColor} strokeWidth="4" animate={{ rotate: 360 }} transition={{ duration: spinDur * 7, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <circle cx={cx} cy={cy} r="70" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="5 5" />
            <motion.circle cx={cx} cy={cy} r="45" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 17: // Heartbreaker (Oversized dome)
        return (
          <>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke={glowColor} strokeWidth="15" opacity="0.3" strokeDasharray="40 10" />
            <motion.circle cx={cx} cy={cy} r="65" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.97, 1.03, 0.97] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
            <motion.g animate={{ rotate: -360 }} transition={{ duration: spinDur * 3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 6}).map((_, i) => (
                <line key={i} x1={cx} y1={35} x2={cx} y2={10} stroke="#000" strokeWidth="4" transform={\`rotate(\${i * 60} \${cx} \${cy})\`} />
              ))}
            </motion.g>
          </>
        );

      case 18: // Dual Intertwined Rings
        return (
          <>
            <motion.circle cx={cx - 20} cy={cy} r="60" fill="none" stroke={glowColor} strokeWidth="4" animate={{ rotate: 360 }} transition={{ duration: spinDur * 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "80px 100px" }} />
            <motion.circle cx={cx + 20} cy={cy} r="60" fill="none" stroke={glowColor} strokeWidth="4" opacity="0.6" animate={{ rotate: -360 }} transition={{ duration: spinDur * 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "120px 100px" }} />
            <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 19: // Bio-organic / Webbed
        return (
          <>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke={glowColor} strokeWidth="2" />
            <motion.g animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 8}).map((_, i) => (
                <path key={i} d={\`M \${cx} \${cy} Q \${cx - 40} \${cy - 60} \${cx} 5\`} fill="none" stroke={glowColor} strokeWidth="3" transform={\`rotate(\${i * 45} \${cx} \${cy})\`} opacity="0.7" />
              ))}
            </motion.g>
            <circle cx={cx} cy={cy} r="25" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} />
          </>
        );

      case 20: // Triangle inside Hexagon
        return (
          <>
            <polygon points="100,10 177,55 177,145 100,190 22,145 22,55" fill="none" stroke={glowColor} strokeWidth="6" opacity="0.6" />
            <motion.polygon points="100,35 45,135 155,135" fill="none" stroke={glowColor} strokeWidth="4" animate={{ rotate: 360 }} transition={{ duration: spinDur * 5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.polygon points="100,60 70,115 130,115" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.2, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
          </>
        );

      case 21: // Three Overlapping Circles (Venn)
        return (
          <>
            <motion.g animate={{ rotate: 360 }} transition={{ duration: spinDur * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              <circle cx={cx} cy={cy - 25} r="60" fill="none" stroke={glowColor} strokeWidth="3" />
              <circle cx={cx - 22} cy={cy + 15} r="60" fill="none" stroke={glowColor} strokeWidth="3" opacity="0.7" />
              <circle cx={cx + 22} cy={cy + 15} r="60" fill="none" stroke={glowColor} strokeWidth="3" opacity="0.4" />
            </motion.g>
            <motion.circle cx={cx} cy={cy} r="30" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 22: // X-Brace over Circle
        return (
          <>
            <circle cx={cx} cy={cy} r="85" fill="none" stroke={glowColor} strokeWidth="8" opacity="0.5" />
            <motion.g animate={{ rotate: -360 }} transition={{ duration: spinDur * 6, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              <line x1="20" y1="20" x2="180" y2="180" stroke={glowColor} strokeWidth="12" strokeLinecap="round" />
              <line x1="180" y1="20" x2="20" y2="180" stroke={glowColor} strokeWidth="12" strokeLinecap="round" />
            </motion.g>
            <motion.circle cx={cx} cy={cy} r="40" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 23: // Diamond inside Circle
        return (
          <>
            <circle cx={cx} cy={cy} r="95" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="10 10" />
            <motion.polygon points="100,25 175,100 100,175 25,100" fill="none" stroke={glowColor} strokeWidth="6" animate={{ rotate: 360 }} transition={{ duration: spinDur * 3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.polygon points="100,45 155,100 100,155 45,100" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.2, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
          </>
        );

      case 24: // Hexagonal Honeycomb Grid
        return (
          <>
            <polygon points="100,10 177,55 177,145 100,190 22,145 22,55" fill="none" stroke={glowColor} strokeWidth="3" />
            <motion.g animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed * 2, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }}>
              <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.6" />
              <polygon points="100,50 143,75 143,125 100,150 57,125 57,75" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.4" />
            </motion.g>
            <motion.circle cx={cx} cy={cy} r="45" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.98, 1.02, 0.98] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );

      case 25: // Nanotech MK85 (Endgame Hexagon + T-Brackets)
        return (
          <>
            <motion.polygon points="100,15 173,57 173,143 100,185 27,143 27,57" fill="none" stroke={glowColor} strokeWidth="5" animate={{ rotate: 360 }} transition={{ duration: spinDur * 8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
            <motion.g animate={{ rotate: -360 }} transition={{ duration: spinDur * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
              {Array.from({length: 3}).map((_, i) => (
                <g key={i} transform={\`rotate(\${i * 120} \${cx} \${cy})\`}>
                  <path d="M 85 25 L 115 25 L 115 45 L 85 45 Z" fill="none" stroke={glowColor} strokeWidth="3" />
                  <line x1="100" y1="45" x2="100" y2="70" stroke={glowColor} strokeWidth="3" />
                </g>
              ))}
            </motion.g>
            <motion.polygon points="100,50 143,75 143,125 100,150 57,125 57,75" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.85, 1.15, 0.85] : [0.96, 1.04, 0.96] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
          </>
        );
`;

const newFileContent = `
import React from 'react';
import { motion } from 'motion/react';

export const ArcReactorSvg = ({ mark, isListening, isProcessing, isSpeaking, glowColor, pulseSpeed }: any) => {
  const spinDur = isProcessing ? 3 : 15;
  const cx = 100;
  const cy = 100;

  const svgDefs = (
    <defs>
      <filter id={\`glow-\${mark}\`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={isSpeaking ? "8" : isListening ? "6" : "4"} result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id={\`coreGrad-\${mark}\`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="30%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="70%" stopColor={glowColor} stopOpacity="0.8" />
        <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={\`glassReflect\`} cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  const getGeometry = () => {
    switch(mark) {
${distinctGeometries}
      default:
        return (
          <>
            <circle cx={cx} cy={cy} r="90" fill="none" stroke={glowColor} strokeWidth="2" opacity="0.5" />
            <motion.circle cx={cx} cy={cy} r="45" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
      {svgDefs}
      
      {/* Outer Ring Glass Bevel */}
      <circle cx={cx} cy={cy} r="98" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
      <circle cx={cx} cy={cy} r="98" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.3" />
      
      {getGeometry()}

      {/* Center Reflection Glass */}
      <circle cx={cx} cy={cy} r="40" fill="url(#glassReflect)" pointerEvents="none" />
      
      {/* Inner Ring Glass Edge */}
      <circle cx={cx} cy={cy} r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
};
`;

fs.writeFileSync('src/components/ArcReactorSvg.tsx', newFileContent);
console.log('Successfully wrote ArcReactorSvg.tsx');
