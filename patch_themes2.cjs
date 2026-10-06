const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf8');

const themeSectionRegex = /\{\/\* TACTICAL TAB 5: UI THEMES \*\/\}[\s\S]*?<\/div>\n\s*<\/div>\n\s*\)}/;

const themeReplacement = `{/* TACTICAL TAB 5: UI THEMES */}
        {activeTab === "ui_change" && (
          <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Sliders className="w-4 h-4 text-rose-400 animate-pulse" />
              <h3 className="text-xs font-bold text-rose-400 tracking-widest font-['Orbitron',sans-serif]">
                TERMINAL LOGS THEMES (30+)
              </h3>
            </div>
            
            <p className="text-[10px] text-gray-400 mb-3 px-1">
              Customize the J.A.R.V.I.S. logs and HUD color scheme. 31 unique tactical themes available.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#00f3ff]/20 grid grid-cols-2 gap-2">
              {[
                { id: "cyan", name: "CYBER CYAN", color: "text-cyan-400", border: "border-cyan-500", bg: "bg-cyan-950" },
                { id: "emerald", name: "EMERALD MATRIX", color: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-950" },
                { id: "amber", name: "AMBER ALERT", color: "text-amber-400", border: "border-amber-500", bg: "bg-amber-950" },
                { id: "rose", name: "CRIMSON PROTOCOL", color: "text-rose-400", border: "border-rose-500", bg: "bg-rose-950" },
                { id: "purple", name: "AMETHYST CORE", color: "text-purple-400", border: "border-purple-500", bg: "bg-purple-950" },
                { id: "sapphire", name: "SAPPHIRE DEEP", color: "text-blue-400", border: "border-blue-500", bg: "bg-blue-950" },
                { id: "ruby", name: "RUBY STRIKE", color: "text-red-500", border: "border-red-600", bg: "bg-red-950" },
                { id: "gold", name: "MIDAS GOLD", color: "text-yellow-400", border: "border-yellow-500", bg: "bg-yellow-950" },
                { id: "silver", name: "MERCURY SILVER", color: "text-gray-300", border: "border-gray-400", bg: "bg-gray-800" },
                { id: "bronze", name: "BRONZE FORGE", color: "text-orange-700", border: "border-orange-800", bg: "bg-orange-950" },
                { id: "neon-green", name: "NEON TOXIN", color: "text-lime-400", border: "border-lime-500", bg: "bg-lime-950" },
                { id: "neon-pink", name: "SYNTHWAVE PINK", color: "text-pink-400", border: "border-pink-500", bg: "bg-pink-950" },
                { id: "neon-blue", name: "TRON BLUE", color: "text-sky-400", border: "border-sky-500", bg: "bg-sky-950" },
                { id: "crimson", name: "BLOOD MOON", color: "text-red-600", border: "border-red-700", bg: "bg-red-950" },
                { id: "indigo", name: "DEEP SPACE", color: "text-indigo-400", border: "border-indigo-500", bg: "bg-indigo-950" },
                { id: "teal", name: "OCEANIC TEAL", color: "text-teal-400", border: "border-teal-500", bg: "bg-teal-950" },
                { id: "lime", name: "ACID LIME", color: "text-lime-500", border: "border-lime-600", bg: "bg-lime-950" },
                { id: "orange", name: "SOLAR FLARE", color: "text-orange-500", border: "border-orange-600", bg: "bg-orange-950" },
                { id: "fuchsia", name: "MAGENTA PULSE", color: "text-fuchsia-400", border: "border-fuchsia-500", bg: "bg-fuchsia-950" },
                { id: "violet", name: "ULTRA VIOLET", color: "text-violet-400", border: "border-violet-500", bg: "bg-violet-950" },
                { id: "sky", name: "ATMOSPHERE", color: "text-sky-300", border: "border-sky-400", bg: "bg-sky-900" },
                { id: "zinc", name: "TITANIUM ZINC", color: "text-zinc-400", border: "border-zinc-500", bg: "bg-zinc-900" },
                { id: "slate", name: "CARBON SLATE", color: "text-slate-400", border: "border-slate-500", bg: "bg-slate-900" },
                { id: "stone", name: "OBSIDIAN", color: "text-stone-400", border: "border-stone-500", bg: "bg-stone-900" },
                { id: "neutral", name: "GHOST WHITE", color: "text-neutral-300", border: "border-neutral-400", bg: "bg-neutral-800" },
                { id: "red", name: "DANGER RED", color: "text-red-500", border: "border-red-600", bg: "bg-red-950" },
                { id: "yellow", name: "CAUTION YELLOW", color: "text-yellow-400", border: "border-yellow-500", bg: "bg-yellow-950" },
                { id: "green", name: "SAFE GREEN", color: "text-green-500", border: "border-green-600", bg: "bg-green-950" },
                { id: "blue", name: "SYSTEM BLUE", color: "text-blue-500", border: "border-blue-600", bg: "bg-blue-950" },
                { id: "pink", name: "HOLOGRAPHIC PINK", color: "text-pink-300", border: "border-pink-400", bg: "bg-pink-900" },
                { id: "white", name: "PURE LIGHT", color: "text-white", border: "border-gray-200", bg: "bg-gray-800" },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onUIThemeChange && onUIThemeChange(theme.id as UITheme)}
                  className={\`w-full text-left p-2 rounded-lg border flex flex-col gap-1 transition-all \${
                    uiTheme === theme.id
                      ? \`\${theme.bg}/40 \${theme.border}/50 shadow-[0_0_10px_currentColor] \${theme.color}\`
                      : \`bg-black/40 border-gray-800/80 hover:\${theme.border}/30 hover:\${theme.bg}/20 text-gray-400\`
                  }\`}
                >
                  <div className="flex items-center justify-between">
                    <span className={\`text-[9px] font-['Orbitron',sans-serif] font-bold \${uiTheme === theme.id ? theme.color : "text-gray-300"}\`}>
                      {theme.name}
                    </span>
                    {uiTheme === theme.id && <Check className={\`w-3 h-3 \${theme.color}\`} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}`;

code = code.replace(themeSectionRegex, themeReplacement);
fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', code);
console.log("Patched themes section");
