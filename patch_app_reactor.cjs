const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add ReactorStyle to imports
code = code.replace(
  /import \{ Message, ArcReactorState, AIModelId, SystemDiagnostic, ChatSession, VoiceListeningMode, UITheme \} from "\.\/types";/,
  'import { Message, ArcReactorState, AIModelId, SystemDiagnostic, ChatSession, VoiceListeningMode, UITheme, ReactorStyle } from "./types";'
);

// Add reactor style state
const stateReplacement = `  const [selectedModel, setSelectedModel] = useState<AIModelId>("jarvis-core-mk1");
  const [uiTheme, setUITheme] = useState<UITheme>("cyan");
  const [reactorStyle, setReactorStyle] = useState<ReactorStyle>("mk1");`;
code = code.replace(/  const \[selectedModel, setSelectedModel\] = useState<AIModelId>\("jarvis-core-mk1"\);\n  const \[uiTheme, setUITheme\] = useState<UITheme>\("cyan"\);/, stateReplacement);


// Update ArcReactorOrb usage (which is in HolographicDashboard now? No, wait)
// Actually ArcReactorVoiceDeck uses it.
code = code.replace(/<ArcReactorVoiceDeck([^>]*?)\/>/s, `<ArcReactorVoiceDeck$1 reactorStyle={reactorStyle} />`);


// Update AdvancedWidgetsPanel usage
const widgetsRegex = /uiTheme=\{uiTheme\}\n\s*onUIThemeChange=\{setUITheme\}/;
const widgetsReplacement = `uiTheme={uiTheme}\n            onUIThemeChange={setUITheme}\n            reactorStyle={reactorStyle}\n            onReactorStyleChange={setReactorStyle}`;
code = code.replace(widgetsRegex, widgetsReplacement);


fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for reactor style");
