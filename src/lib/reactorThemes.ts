import { ReactorStyle } from "../types";

export interface HolographicReactorTheme {
  id: ReactorStyle;
  name: string;
  category: "J.A.R.V.I.S. VR" | "Stark Labs";
  tag: string;
  color: string;
  badge: string;
  description: string;
  particleDensity: number;
}

export const HOLOGRAPHIC_REACTOR_THEMES: HolographicReactorTheme[] = [
  // 1. Image 1: OIP (7).webp - Iconic 10-coil copper solenoid palladium arc reactor
  {
    id: "core-mark1-classic",
    name: "MARK I PALLADIUM ARC REACTOR",
    category: "Stark Labs",
    tag: "Original Iron Man • 10-Coil Solenoid Palladium Core",
    color: "#00f3ff",
    badge: "CORE 01",
    description: "Authentic 10-coil copper-wound electromagnetic solenoid ring in brushed steel bezel with blinding cyan-white plasma center.",
    particleDensity: 65,
  },
  // 2. Image 2: OIP (6).webp - Mark VI triangular core HUD with red armor telemetry
  {
    id: "core-mark6-triangular",
    name: "MARK VI TRI-ELEMENTAL HUD",
    category: "Stark Labs",
    tag: "Iron Man 2 & Avengers • Inverted Triangular Vibranium Core",
    color: "#00d2ff",
    badge: "CORE 02",
    description: "Inverted triangular vibranium arc reactor with concentric circular HUD reticles, lateral cybernetic clamp arms, and diagnostic suit readout.",
    particleDensity: 55,
  },
  // 3. Image 4: OIP (4).webp - Digital grid scanline wireframe suit with multi-tier unibeam
  {
    id: "core-grid-matrix-suit",
    name: "DIGITAL GRID SUIT WIREFRAME",
    category: "J.A.R.V.I.S. VR",
    tag: "3D Scanline Wireframe • Multi-Tier Chest Unibeam",
    color: "#00f0ff",
    badge: "CORE 03",
    description: "Full-body digital grid scanline wireframe of Mark armor with glowing cyan eye visors, crimson neck conduits, and multi-tier chest Unibeam matrix.",
    particleDensity: 60,
  },
  // 4. Image 6: OIP (3).webp - Minimalist deep-space stealth dual HUD rings & glowing orb
  {
    id: "core-stealth-orbital-orb",
    name: "STEALTH ORBITAL DEEP SCANNER",
    category: "Stark Labs",
    tag: "Deep-Space Minimalist • High-Precision Orbital HUD",
    color: "#0099ff",
    badge: "CORE 04",
    description: "Ultra-clean deep-space stealth reactor with twin concentric precision HUD rings, delicate micro-ticks, and glowing cyan-blue sentient orb.",
    particleDensity: 45,
  },
  // 5. Image 7: OIP (2).webp - Magenta to cyan neon gradient ring with dot matrix & J.A.R.V.I.S.
  {
    id: "core-cyber-neon-gradient",
    name: "CYBERPUNK NEON GRADIENT RING",
    category: "J.A.R.V.I.S. VR",
    tag: "Neon Magenta-to-Cyan Spectrum • Matrix Dot Glyph",
    color: "#d946ef",
    badge: "CORE 05",
    description: "Vibrant neon spectrum ring shifting from electric purple to cyber cyan, layered with a dense background dot matrix and centered 'J.A.R.V.I.S.' insignia.",
    particleDensity: 60,
  },
  // 6. Image 9: OIP.webp - Tactical triangular core with red reticle brackets & side servos
  {
    id: "core-tactical-mark7-hud",
    name: "TACTICAL MARK VII TARGETING MATRIX",
    category: "Stark Labs",
    tag: "Combat Targeting Reticle • Triangular Arc Core & HUD",
    color: "#00e5ff",
    badge: "CORE 06",
    description: "Full combat targeting display with inverted triangular arc core, multi-axis target lock brackets, crimson range rings, lateral hydraulic struts, and tactical telemetry.",
    particleDensity: 50,
  },
  // 7. Image 10: th.webp - Cyberpunk segmented arc ring with starlight matrix & J.A.R.V.I.S.
  {
    id: "core-matrix-neon-arc",
    name: "NEO-TOKYO CYBER ARC CORE",
    category: "J.A.R.V.I.S. VR",
    tag: "Segmented Outer Arc Rings • High-Contrast HUD Core",
    color: "#a855f7",
    badge: "CORE 07",
    description: "High-contrast cyberpunk variant with segmented orbital arcs, deep violet/cyan neon glow, central 'J.A.R.V.I.S.' emblem, and outer planetary tracking notches.",
    particleDensity: 65,
  },
];

// Helper to normalize legacy styles to one of the 7 authentic cores
export function normalizeReactorStyle(style?: string): ReactorStyle {
  if (!style) return "core-mark1-classic";
  const exists = HOLOGRAPHIC_REACTOR_THEMES.some(t => t.id === style);
  if (exists) return style as ReactorStyle;

  // Map removed or legacy identifiers to closest match among the 7 cores
  const legacyMap: Record<string, ReactorStyle> = {
    "core-jarvis-stencil-avatar": "core-mark1-classic",
    "core-quantum-power-wave": "core-grid-matrix-suit",
    "core-volumetric-assistant-bust": "core-grid-matrix-suit",
    "core-jarvis-quantum": "core-mark1-classic",
    "core-friday-neural": "core-stealth-orbital-orb",
    "core-stark-vr-cad": "core-grid-matrix-suit",
    "core-neural-synapse": "core-matrix-neon-arc",
    "core-nanotech-flux": "core-cyber-neon-gradient",
    "core-tactical-hud": "core-tactical-mark7-hud",
    "core-sonic-cylinder": "core-stealth-orbital-orb",
    "core-tesseract-matrix": "core-mark6-triangular",
    "core-orbital-satellite": "core-stealth-orbital-orb",
    "core-sentient-nexus": "core-matrix-neon-arc",
  };

  return legacyMap[style] || "core-mark1-classic";
}

// Aliases for compatibility
export const MARVEL_REACTOR_THEMES = HOLOGRAPHIC_REACTOR_THEMES;
export type MarvelReactorTheme = HolographicReactorTheme;
