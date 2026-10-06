const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf8');

const anchor = `      </div>

      {/* Quick Status Bar */}`;

const reactorTabBlock = `
        {/* TACTICAL TAB 6: REACTOR CORE DESIGNS */}
        {activeTab === "reactor_change" && (
          <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Zap className="w-4 h-4 text-[#00f3ff] animate-pulse" />
              <h3 className="text-xs font-bold text-[#00f3ff] tracking-widest font-['Orbitron',sans-serif]">
                ARC REACTOR CORE MATRICES (25+)
              </h3>
            </div>
            
            <p className="text-[10px] text-gray-400 mb-3 px-1">
              Reconfigure the J.A.R.V.I.S. central power core visual matrices. Each Mark iteration introduces unique energy geometries and pulse signatures.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#00f3ff]/20 grid grid-cols-2 gap-2">
              {Array.from({ length: 25 }).map((_, i) => {
                const mark = i + 1;
                const id = \`mk\${mark}\`;
                
                return (
                  <button
                    key={id}
                    onClick={() => onReactorStyleChange && onReactorStyleChange(id as ReactorStyle)}
                    className={\`w-full text-left p-2 rounded-lg border flex flex-col gap-1 transition-all \${
                      reactorStyle === id
                        ? "bg-[#00f3ff]/20 border-[#00f3ff] shadow-[0_0_10px_#00f3ff] text-[#00f3ff]"
                        : "bg-black/40 border-gray-800/80 hover:border-[#00f3ff]/30 hover:bg-[#00f3ff]/10 text-gray-400"
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={\`text-[10px] font-['Orbitron',sans-serif] font-bold \${reactorStyle === id ? "text-[#00f3ff]" : "text-gray-300"}\`}>
                        MARK {mark} CORE
                      </span>
                      {reactorStyle === id && <Check className="w-3 h-3 text-[#00f3ff]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}`;

code = code.replace(anchor, reactorTabBlock + '\n\n' + anchor);

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', code);
console.log("Patched reactor tab");
