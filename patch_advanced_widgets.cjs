const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf8');

// Update imports
code = code.replace(
  /import { AIModelId, Message, UITheme } from "\.\.\/types";/,
  'import { AIModelId, Message, UITheme, ReactorStyle } from "../types";'
);

// Add to props
code = code.replace(
  /  onUIThemeChange\?: \(theme: UITheme\) => void;\n}/,
  '  onUIThemeChange?: (theme: UITheme) => void;\n  reactorStyle?: ReactorStyle;\n  onReactorStyleChange?: (style: ReactorStyle) => void;\n}'
);

// Destructure props
code = code.replace(
  /  onUIThemeChange,\n}\) => {/,
  '  onUIThemeChange,\n  reactorStyle = "mk1",\n  onReactorStyleChange,\n}) => {'
);

// Add state for reactor
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<"chat" \| "offline" \| "languages" \| "voice" \| "ui_change">/,
  'const [activeTab, setActiveTab] = useState<"chat" | "offline" | "languages" | "voice" | "ui_change" | "reactor_change">'
);

// Add tab button
const tabButtonsRegex = /<button\s+onClick=\{\(\) => setActiveTab\("ui_change"\)\}[\s\S]*?<\/button>\n\s*<\/div>/;
const newTabButtons = `<button
            onClick={() => setActiveTab("ui_change")}
            className={\`p-1.5 rounded flex items-center gap-1.5 transition-all \${
              activeTab === "ui_change"
                ? "bg-[#00f3ff]/20 text-[#00f3ff] font-bold border border-[#00f3ff]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }\`}
            title="Change User Interface Theme"
          >
            <Sliders className="w-3 h-3 text-rose-400" />
            <span>THEME</span>
          </button>
          
          <button
            onClick={() => setActiveTab("reactor_change")}
            className={\`p-1.5 rounded flex items-center gap-1.5 transition-all \${
              activeTab === "reactor_change"
                ? "bg-[#00f3ff]/20 text-[#00f3ff] font-bold border border-[#00f3ff]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }\`}
            title="Change Arc Reactor Core Design"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>CORE</span>
          </button>
        </div>`;
code = code.replace(tabButtonsRegex, newTabButtons);

// Add the reactor tab content section
const reactorTabContent = `
        {/* TACTICAL TAB 6: REACTOR CORE DESIGNS */}
        {activeTab === "reactor_change" && (
          <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-xs font-bold text-amber-400 tracking-widest font-['Orbitron',sans-serif]">
                REACTOR CORE DESIGN MATRICES
              </h3>
            </div>
            
            <p className="text-[10px] text-gray-400 mb-3 px-1">
              Select an Arc Reactor structural configuration. System will re-align energy coils and display properties.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-amber-500/20 grid grid-cols-2 gap-2">
              {Array.from({ length: 25 }).map((_, idx) => {
                const markId = \`mk\${idx + 1}\` as ReactorStyle;
                return (
                  <button
                    key={markId}
                    onClick={() => onReactorStyleChange && onReactorStyleChange(markId)}
                    className={\`w-full text-left p-2 rounded-lg border flex flex-col gap-1 transition-all \${
                      reactorStyle === markId
                        ? "bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        : "bg-black/40 border-gray-800/80 hover:border-amber-500/30 hover:bg-amber-950/20"
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={\`text-[10px] font-['Orbitron',sans-serif] font-bold \${reactorStyle === markId ? "text-amber-400" : "text-gray-300"}\`}>
                        MARK {idx + 1}
                      </span>
                      {reactorStyle === markId && <Check className="w-3 h-3 text-amber-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
`;

const tab5Regex = /        \{\/\* TACTICAL TAB 5: UI THEMES \*\/\}/;
code = code.replace(tab5Regex, reactorTabContent + '\n        {/* TACTICAL TAB 5: UI THEMES */}');

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', code);
console.log("Patched advanced widgets panel");
