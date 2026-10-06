const fs = require('fs');
let code = fs.readFileSync('src/components/ArcReactorVoiceDeck.tsx', 'utf8');

code = code.replace(
  /import \{ ArcReactorState, VoiceListeningMode, UITheme \} from "\.\.\/types";/,
  'import { ArcReactorState, VoiceListeningMode, UITheme, ReactorStyle } from "../types";'
);

code = code.replace(
  /  uiTheme\?: UITheme;\n}/,
  '  uiTheme?: UITheme;\n  reactorStyle?: ReactorStyle;\n}'
);

code = code.replace(
  /  onInterrupt,\n  uiTheme = "cyan",\n}\) => \{/,
  '  onInterrupt,\n  uiTheme = "cyan",\n  reactorStyle = "mk1",\n}) => {'
);

code = code.replace(
  /<ArcReactorOrb\s+state=\{reactorState\}\s+onClick=\{onReactorTap\}\s+size="md"\s*\/>/,
  '<ArcReactorOrb state={reactorState} onClick={onReactorTap} size="md" reactorStyle={reactorStyle} />'
);

fs.writeFileSync('src/components/ArcReactorVoiceDeck.tsx', code);
console.log("Patched ArcReactorVoiceDeck");
