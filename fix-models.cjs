const fs = require('fs');

// 1. Add 'offline-llama' to models in types.ts
let types = fs.readFileSync('src/types.ts', 'utf-8');
if (!types.includes('offline-llama')) {
  types = types.replace(
    /export type AIModelId = "jarvis-core-mk1" \| "jarvis-core-mk2" \| "jarvis-core-mk3" \| "jarvis-core-mk4" \| "jarvis-core-mk5";/,
    'export type AIModelId = "jarvis-core-mk1" | "jarvis-core-mk2" | "jarvis-core-mk3" | "jarvis-core-mk4" | "jarvis-core-mk5" | "offline-llama";'
  );
  fs.writeFileSync('src/types.ts', types);
}

// 2. Add 'offline-llama' to AdvancedWidgetsPanel.tsx UI
let panel = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');
if (!panel.includes('offline-llama')) {
  const mk5Regex = /\{\/\* CORE MK5 \*\/\}[\s\S]*?<\/button>/;
  const offlineButton = `
            {/* OFFLINE LLAMA */}
            <button
              onClick={() => onOpenEngineChat && onOpenEngineChat("offline-llama")}
              className="p-3 rounded-lg border bg-black/40 border-gray-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition-all group"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-emerald-400 font-bold text-xs group-hover:animate-pulse">WebLLM OFFLINE CORE</span>
                <Globe className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                Fully local in-browser neural engine. Requires 1.5GB initial download. Works with NO internet.
              </p>
            </button>
  `;
  panel = panel.replace(mk5Regex, `$&\\n${offlineButton}`);
  
  // Also add it to the tactical chat dropdown
  const dropdownRegex = /<option value="jarvis-core-mk5">MK5 - Deep Thought<\/option>/;
  panel = panel.replace(dropdownRegex, `$&\\n<option value="offline-llama">OFFLINE NEURAL (WebLLM)</option>`);
  
  fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', panel);
}
