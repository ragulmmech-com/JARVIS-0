const fs = require('fs');

const file = 'src/components/ArcReactorSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace any with proper props
content = content.replace(
  /export const ArcReactorSvg = \(\{ mark, isListening, isProcessing, isSpeaking, glowColor, pulseSpeed \}: any\) => \{/,
  `export interface ArcReactorProps {
  mark: number;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  glowColor?: string;
  pulseSpeed?: number;
}

export const ArcReactorSvg = ({ mark, isListening, isProcessing, isSpeaking, glowColor, pulseSpeed }: ArcReactorProps) => {`
);

// Add z-10 somewhere? Actually wait, ArcReactorOrb is where it's floating. Let's check ArcReactorOrb.tsx
fs.writeFileSync(file, content);
console.log('Fixed ArcReactorSvg props');
