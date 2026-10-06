const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf8');

const regex = /export const JARVIS_VOICES_COLLECTION: JarvisVoiceOption\[\] = \[\s*\{[\s\S]*?\}\s*\];/;
const replacement = `export const JARVIS_VOICES_COLLECTION: JarvisVoiceOption[] = [
  {
    id: "jarvis-classic",
    name: "J.A.R.V.I.S. Core",
    category: "JARVIS Core",
    tag: "British Refined (Paul Bettany)",
    description: "Original iconic JARVIS butler cadence. Eloquent, calm, high intellect.",
    defaultPitch: 0.95,
    defaultRate: 1.05,
    previewSample: "Always a pleasure watching you work, Sir. All telemetry operating at peak efficiency."
  },
  {
    id: "friday-ai",
    name: "F.R.I.D.A.Y. Protocol",
    category: "Marvel AI",
    tag: "Energetic Female Assistant",
    description: "Responsive, quick-reflex female AI voice modeled after secondary assistant.",
    defaultPitch: 1.15,
    defaultRate: 1.10,
    previewSample: "Boss, incoming telemetry detected! Target lock confirmed."
  }
];`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', code);
console.log("Patched voices");
