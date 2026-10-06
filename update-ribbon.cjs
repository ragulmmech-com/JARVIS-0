const fs = require('fs');
let ribbon = fs.readFileSync('src/components/AdvancedControlRibbon.tsx', 'utf-8');

ribbon = ribbon.replace(
  /interface AdvancedOpsRibbonProps \{/,
  'interface AdvancedOpsRibbonProps {\n  onOpenProject?: () => void;'
);

ribbon = ribbon.replace(
  /onNewChat,/,
  'onNewChat,\n  onOpenProject,'
);

const projectBtn = `
        {/* PROJECT MODE */}
        <button
          onClick={onOpenProject}
          className="px-2.5 py-1 rounded bg-[var(--theme-secondary)] border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white flex items-center gap-1.5 transition-all text-[11px] shadow-[0_0_10px_rgba(168,85,247,0.1)] group"
          title="Open Project Workspace (Deep Research & File Analysis)"
        >
          <Zap className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold tracking-wide">PROJECT</span>
        </button>
`;

ribbon = ribbon.replace(
  /\{\/\* 2\. NEW CHAT QUICK ACTION \*\/\}/,
  projectBtn + '\n        {/* 2. NEW CHAT QUICK ACTION */}'
);

fs.writeFileSync('src/components/AdvancedControlRibbon.tsx', ribbon);
