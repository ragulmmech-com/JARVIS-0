const fs = require('fs');
const glob = require('glob');

// Use hardcoded files instead of glob
const files = [
  'src/App.tsx',
  'src/components/AdvancedControlRibbon.tsx',
  'src/components/AdvancedWidgetsPanel.tsx',
  'src/components/AllChatsHistoryModal.tsx',
  'src/components/ArcReactorVoiceDeck.tsx',
  'src/components/HolographicDashboard.tsx',
  'src/components/ModelChatModal.tsx',
  'src/components/StarkHudTelemetry.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace hardcoded cyan and dark blue variants with CSS variables
    content = content.replace(/#00f3ff/gi, 'var(--theme-primary)');
    content = content.replace(/#020b18/gi, 'var(--theme-secondary)');
    content = content.replace(/#041226/gi, 'var(--theme-secondary)');
    content = content.replace(/#04142a/gi, 'var(--theme-secondary)');
    content = content.replace(/#020712/gi, 'var(--theme-secondary)');
    
    // Make sure we don't break tailwind classes like text-[var(--theme-primary)]
    // Tailwind supports arbitrary values like text-[var(--theme-primary)] natively.
    
    fs.writeFileSync(file, content);
  }
});
