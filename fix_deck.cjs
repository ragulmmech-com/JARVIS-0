const fs = require('fs');
let code = fs.readFileSync('src/components/ArcReactorVoiceDeck.tsx', 'utf8');

// Add import
if (!code.includes('ArcReactorOrb')) {
  code = code.replace(
    'import { Cpu, Mic, Radio, Square, Zap, Globe, Volume2, VolumeX } from "lucide-react";',
    'import { Cpu, Mic, Radio, Square, Zap, Globe, Volume2, VolumeX } from "lucide-react";\nimport { ArcReactorOrb } from "./ArcReactorOrb";'
  );
}

// Add reactorStyle to destructuring
code = code.replace(
  /uiTheme = "cyan" as UITheme,\s*\}\) => \{/,
  'uiTheme = "cyan" as UITheme,\n  reactorStyle = "mk1" as ReactorStyle,\n}) => {'
);

// Replace visual stage
const visualStageRegex = /\{\/\* Visual Reactor Stage \*\/\}\s*<div className="relative w-48 h-48[\s\S]*?\{\/\* State Pill Beneath Core \*\/\}/;
const visualStageReplacement = `{/* Visual Reactor Stage */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center my-1">
        <ArcReactorOrb 
          state={reactorState} 
          onClick={onReactorTap} 
          size="xl" 
          reactorStyle={reactorStyle} 
        />
        
        {/* State Pill Beneath Core */}`;

code = code.replace(visualStageRegex, visualStageReplacement);

fs.writeFileSync('src/components/ArcReactorVoiceDeck.tsx', code);
console.log("Patched ArcReactorVoiceDeck");
