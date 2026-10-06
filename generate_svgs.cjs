const fs = require('fs');

const svgCases = [];
for (let i = 1; i <= 25; i++) {
  let geometry = '';
  // Generate slightly different math for each to ensure 25 unique designs
  const rings = 1 + (i % 4);
  const spokes = 3 + (i % 7);
  const coilCount = 6 + (i % 10);
  
  if (i === 1) {
    geometry = `
      <circle cx={cx} cy={cy} r="95" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
        {Array.from({length: 10}).map((_, i) => (
          <g key={i} transform={\`rotate(\${i * 36} \${cx} \${cy})\`}>
            <rect x={cx - 8} y={10} width="16" height="30" fill="none" stroke={glowColor} strokeWidth="2" />
            <line x1={cx - 10} y1={25} x2={cx + 10} y2={25} stroke="#fff" strokeWidth="1" strokeOpacity="0.5" />
          </g>
        ))}
      </motion.g>
      <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
    `;
  } else if (i === 6) {
    geometry = `
      <motion.polygon points="100,15 25,145 175,145" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" animate={{ rotate: 360 }} transition={{ duration: spinDur*3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
      <motion.polygon points="100,25 35,135 165,135" fill="none" stroke={glowColor} strokeWidth="2" strokeDasharray="15 10" animate={{ rotate: -360 }} transition={{ duration: spinDur*2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
      <motion.polygon points="100,45 55,125 145,125" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
    `;
  } else if (i >= 21) {
      geometry = `
        <motion.circle cx={cx} cy={cy} r="85" fill="none" stroke={glowColor} strokeWidth="4" strokeDasharray="40 20 10 20" animate={{ rotate: 360, r: [85, 90, 85] }} transition={{ duration: spinDur, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "100px 100px" }} filter={\`url(#glow-\${mark})\`} />
        <motion.circle cx={cx} cy={cy} r="65" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="${i} 30" animate={{ rotate: -360, r: [65, 60, 65] }} transition={{ duration: spinDur*1.2, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "100px 100px" }} />
        <motion.path d="M100,20 Q180,20 180,100 Q180,180 100,180 Q20,180 20,100 Q20,20 100,20 Z" fill="none" stroke={glowColor} strokeWidth="1" animate={{ rotate: 360 }} transition={{ duration: spinDur*2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} />
        <motion.circle cx={cx} cy={cy} r="${30 + (i%15)}" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.95, 1.15, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
      `;
  } else {
    // Procedurally generated unique layout for each
    geometry = `
      {Array.from({length: ${rings}}).map((_, i) => (
        <motion.circle key={i} cx={cx} cy={cy} r={90 - (i*12)} fill="none" stroke={glowColor} strokeWidth={1 + (i%2)} strokeDasharray={i%2===0 ? "${i*5} ${i*2}" : ""} animate={{ rotate: i%2===0 ? 360 : -360 }} transition={{ duration: spinDur * (1 + i*0.5), repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }} opacity={0.3 + (i*0.2)} />
      ))}
      <motion.g animate={{ rotate: ${i%2===0 ? 360 : -360} }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
        {Array.from({length: ${coilCount}}).map((_, idx) => (
          <g key={idx} transform={\`rotate(\${(360/${coilCount}) * idx} \${cx} \${cy})\`}>
            <rect x={cx - 4} y={15} width="8" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1={cx} y1={15} x2={cx} y2={35} stroke={glowColor} strokeWidth="2" opacity="0.8" />
          </g>
        ))}
      </motion.g>
      <motion.g animate={{ rotate: ${i%2===0 ? -360 : 360} }} transition={{ duration: spinDur*1.5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
        {Array.from({length: ${spokes}}).map((_, idx) => (
          <line key={idx} x1={cx} y1={cy - 40} x2={cx} y2={cy - 85} stroke={glowColor} strokeWidth="1" strokeOpacity="0.5" transform={\`rotate(\${(360/${spokes}) * idx} \${cx} \${cy})\`} />
        ))}
      </motion.g>
      <motion.circle cx={cx} cy={cy} r="${35 + (i%10)}" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: isSpeaking ? [0.8, 1.1, 0.8] : [0.95, 1.05, 0.95] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
    `;
  }
  
  svgCases.push(`
      case ${i}:
        return (
          <>
            ${geometry}
          </>
        );
  `);
}

const componentStr = `
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
${svgCases.join('\n')}
      default:
        return (
          <>
            <motion.circle cx={cx} cy={cy} r="10" fill="none" stroke={glowColor} strokeWidth="4" filter={\`url(#glow-\${mark})\`} animate={{ r: [10, 95], opacity: [1, 0] }} transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeOut" }} />
            <motion.circle cx={cx} cy={cy} r="10" fill="none" stroke={glowColor} strokeWidth="4" filter={\`url(#glow-\${mark})\`} animate={{ r: [10, 95], opacity: [1, 0] }} transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeOut", delay: pulseSpeed/3 }} />
            <motion.circle cx={cx} cy={cy} r="35" fill={\`url(#coreGrad-\${mark})\`} filter={\`url(#glow-\${mark})\`} animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: pulseSpeed, repeat: Infinity }} />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-visible">
      {svgDefs}
      {/* 3D Glass Surface Base */}
      <circle cx={cx} cy={cy} r="98" fill="rgba(0, 10, 20, 0.2)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="98" fill="url(#glassReflect)" />
      
      {getGeometry()}

      {/* Front Glass Glare (creates the transparent shell effect) */}
      <path d="M 10 100 A 90 90 0 0 1 190 100 A 90 40 0 0 0 10 100 Z" fill="rgba(255,255,255,0.1)" />
      <circle cx={cx} cy={cy} r="98" fill="none" stroke={\`\${glowColor}40\`} strokeWidth="4" />
    </svg>
  );
};
`;

fs.writeFileSync('src/components/ArcReactorSvg.tsx', componentStr);
console.log('Generated ArcReactorSvg.tsx successfully!');
