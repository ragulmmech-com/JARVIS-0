const fs = require('fs');

let modal = fs.readFileSync('src/components/ProjectChatModal.tsx', 'utf-8');

// Rename Component
modal = modal.replace(/ModelChatModalProps/g, 'ProjectChatModalProps');
modal = modal.replace(/ModelChatModal/g, 'ProjectChatModal');

// Remove defaultModel prop usage from signature
modal = modal.replace(/defaultModel = "jarvis-core-mk1",/g, '');
modal = modal.replace(/defaultModel\?: AIModelId;/g, '');

// Change state to fixed "gemini-3.7-pro" model for Project
modal = modal.replace(/const \[selectedEngine, setSelectedEngine\] = useState<AIModelId>\(defaultModel\);/g, 'const selectedEngine = "gemini-3.7-pro";');
modal = modal.replace(/onChange=\{\(e\) => setSelectedEngine\(e\.target\.value as AIModelId\)\}/g, '');
modal = modal.replace(/value=\{selectedEngine\}/g, '');

// Remove the Select element entirely for the Engine dropdown, replace with a fixed title.
const selectRegex = /<select[\s\S]*?<\/select>/;
modal = modal.replace(selectRegex, `
<div className="px-3 py-1.5 bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/30 rounded text-xs text-[var(--theme-primary)] font-bold flex items-center gap-2">
  <Zap className="w-4 h-4" />
  <span>PROJECT WORKSPACE (GEMINI PRO)</span>
</div>
`);

// Change local storage key
modal = modal.replace(/localStorage\.getItem\(\`engine_chat_history_\$\{defaultModel\}\`\)/g, 'localStorage.getItem("jarvis_project_workspace_history")');
modal = modal.replace(/localStorage\.setItem\(\`engine_chat_history_\$\{selectedEngine\}\`/g, 'localStorage.setItem("jarvis_project_workspace_history"');
modal = modal.replace(/localStorage\.getItem\(\`engine_chat_history_\$\{selectedEngine\}\`\)/g, 'localStorage.getItem("jarvis_project_workspace_history")');
modal = modal.replace(/, selectedEngine\]\)/g, '])');

// Add "Clear Full Chat" handler
modal = modal.replace(
  /const handleDeleteMessage = \(id: string\) => \{/,
  `const handleClearAll = () => {
    if (confirm("Are you sure you want to delete the entire project chat history?")) {
      setModelMessages([]);
    }
  };
  
  const handleDeleteMessage = (id: string) => {`
);

// Add Clear All Button near the close button
modal = modal.replace(
  /\{\/\* Maximize Button \*\/\}/,
  `{/* Clear All Button */}
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-bold"
              title="Clear All Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {/* Maximize Button */}`
);

// Change Empty State text
modal = modal.replace(
  /\{currentEngine\?.name \|\| "J\.A\.R\.V\.I\.S\. Core"\} Dedicated Channel/,
  "PROJECT WORKSPACE"
);
modal = modal.replace(
  /This dedicated workstation runs independently of J\.A\.R\.V\.I\.S\. voice telemetry\. Ask deep technical questions, test prompts, or converse directly with \{currentEngine\?.name \|\| "the engine"\}\./,
  "Upload any file format (Images, PDF, PPT, Word, Excel, etc.), generate images, write complex code, edit text, and perform advanced research. The engine operates with full Gemini/ChatGPT capabilities."
);

// Change the empty state suggestion buttons
modal = modal.replace(
  /"Explain quantum computing qubit superposition in 3 concise points\."/g,
  '"Generate an image of a futuristic neural link reactor."'
);
modal = modal.replace(
  /"Explain quantum superposition\.\.\."/,
  '"Generate a futuristic reactor image..."'
);
modal = modal.replace(
  /"Generate a production TypeScript debounce function with generic types\."/g,
  '"Analyze the attached PDF and summarize key data points."'
);
modal = modal.replace(
  /"TypeScript generic debounce function\.\.\."/,
  '"Analyze the attached PDF..."'
);

// Fix input placeholder
modal = modal.replace(
  /placeholder=\{\`Message \$\{currentEngine\?.name \|\| "J\.A\.R\.V\.I\.S\. Core"\} directly\.\.\.\`\}/,
  'placeholder="Type your project instructions, request image generation, or chat with the AI..."'
);

// Change text to PROJECT
modal = modal.replace(
  /\{selectedEngine === "offline-llama" && offlineProgress \? offlineProgress : \`\$\{currentEngine\?.name \|\| "J\.A\.R\.V\.I\.S\. Core"\} synthesizing response\.\.\.\`\}/,
  '`Synthesizing project response (Full Gemini Capabilities)...`'
);

fs.writeFileSync('src/components/ProjectChatModal.tsx', modal);
