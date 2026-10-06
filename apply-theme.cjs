const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('JARVIS_THEMES')) {
  content = content.replace(
    /import \{ UITheme, ReactorStyle \} from "\.\/types";/,
    'import { UITheme, ReactorStyle } from "./types";\nimport { JARVIS_THEMES } from "./lib/themes";'
  );
}

// Add effect to apply CSS variables
const effectCode = `
  // Apply Dynamic Theme
  useEffect(() => {
    const theme = JARVIS_THEMES.find(t => t.id === uiTheme) || JARVIS_THEMES[0];
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  }, [uiTheme]);
`;

if (!content.includes('--theme-primary')) {
  content = content.replace(
    /const \[telemetry, setTelemetry\] = useState<SystemDiagnostic>[\s\S]*?\n\n/,
    `$&${effectCode}`
  );
}

fs.writeFileSync('src/App.tsx', content);
