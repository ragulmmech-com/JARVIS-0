const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectChatModal.tsx', 'utf-8');

if (!content.includes('generateChatTranscript')) {
  content = content.replace(
    /import \{ getGlobalMemoryString \} from "\.\.\/lib\/memory";/,
    'import { getGlobalMemoryString } from "../lib/memory";\nimport { generateChatTranscript } from "../lib/transcript";'
  );
}

if (!content.includes('const [isChatCopied, setIsChatCopied]')) {
  content = content.replace(
    /const \[copiedId, setCopiedId\] = useState<string \| null>\(null\);/,
    'const [copiedId, setCopiedId] = useState<string | null>(null);\n  const [isChatCopied, setIsChatCopied] = useState(false);'
  );
}

if (!content.includes('handleCopyFullChat')) {
  content = content.replace(
    /const handleClear = \(\) => \{/,
    `const handleCopyFullChat = () => {
    if (modelMessages.length === 0) return;
    const transcript = generateChatTranscript(modelMessages, "J.A.R.V.I.S. Project Workspace");
    navigator.clipboard.writeText(transcript);
    setIsChatCopied(true);
    setTimeout(() => setIsChatCopied(false), 2000);
  };

  const handleClear = () => {`
  );
}

const buttonRegex = /<button\s*onClick=\{handleClear\}\s*className="p-1\.5 rounded-lg border border-red-500\/30 text-red-400 hover:bg-red-950\/40 transition-colors"\s*title="Clear Project History"\s*>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/;
const newButtons = `<button
              onClick={handleCopyFullChat}
              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
              title="Copy Entire Project History"
            >
              {isChatCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 transition-colors"
              title="Clear Project History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>`;
content = content.replace(buttonRegex, newButtons);

fs.writeFileSync('src/components/ProjectChatModal.tsx', content);
