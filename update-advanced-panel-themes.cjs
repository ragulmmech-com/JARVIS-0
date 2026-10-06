const fs = require('fs');

let content = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');

// Add import for JARVIS_THEMES
if (!content.includes('JARVIS_THEMES')) {
  content = content.replace(
    /import \{ ([^}]+) \} from "lucide-react";/,
    'import { $1 } from "lucide-react";\nimport { JARVIS_THEMES } from "../lib/themes";'
  );
}

// Replace the 5 hardcoded themes with a map of JARVIS_THEMES
const themeSectionRegex = /\{\/\* Cyan Theme \*\/\}[\s\S]*?\{\/\* Purple Theme \*\/\}[\s\S]*?<\/button>/;
const dynamicThemeList = `
              {JARVIS_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onUIThemeChange && onUIThemeChange(theme.id)}
                  className={\`w-full text-left p-2.5 rounded-lg border flex flex-col gap-1 transition-all \${
                    uiTheme === theme.id
                      ? "bg-black/80 border-opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      : "bg-black/40 border-gray-800/80 hover:bg-black/60"
                  }\`}
                  style={{
                    borderColor: uiTheme === theme.id ? theme.primary : "rgba(75, 85, 99, 0.4)",
                    boxShadow: uiTheme === theme.id ? \`0 0 15px \${theme.primary}40\` : "none"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[11px] font-['Orbitron',sans-serif] font-bold"
                      style={{ color: uiTheme === theme.id ? theme.primary : "#d1d5db" }}
                    >
                      {theme.name}
                    </span>
                    {uiTheme === theme.id && <Check className="w-3.5 h-3.5" style={{ color: theme.primary }} />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <p className="text-[9px] font-['JetBrains_Mono',monospace] text-gray-500">
                      {theme.description}
                    </p>
                  </div>
                </button>
              ))}`;

content = content.replace(themeSectionRegex, dynamicThemeList);

// Change the title from "SYSTEM UI THEME (VISUAL MATRIX)" to "CUSTOM J.A.R.V.I.S THEMES (50+)"
content = content.replace(
  /SYSTEM UI THEME \(VISUAL MATRIX\)/,
  "CUSTOM J.A.R.V.I.S THEMES (50+)"
);

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', content);
