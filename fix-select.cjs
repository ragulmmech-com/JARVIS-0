const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<option value="jarvis-core-mk4" className="bg-\[var\(--theme-secondary\)\] text-\[var\(--theme-primary\)\]">Logic Matrix<\/option>/;
const newOptions = `<option value="jarvis-core-mk4" className="bg-[var(--theme-secondary)] text-[var(--theme-primary)]">Logic Matrix</option>
              <option value="gemini-3.7-pro" className="bg-[var(--theme-secondary)] text-purple-400 font-bold">Project Workspace (Pro)</option>
              <option value="offline-llama" className="bg-[var(--theme-secondary)] text-emerald-400 font-bold">Offline Neural Engine</option>`;

content = content.replace(regex, newOptions);

fs.writeFileSync('src/App.tsx', content);
