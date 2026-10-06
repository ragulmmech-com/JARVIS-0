const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('generateChatTranscript')) {
  content = content.replace(
    /import \{ getGlobalMemoryString \} from "\.\/lib\/memory";/,
    'import { getGlobalMemoryString } from "./lib/memory";\nimport { generateChatTranscript } from "./lib/transcript";\nimport { Copy } from "lucide-react";'
  );
}

if (!content.includes('const [isMainChatCopied, setIsMainChatCopied]')) {
  content = content.replace(
    /const \[copiedId, setCopiedId\] = useState<string \| null>\(null\);/,
    'const [copiedId, setCopiedId] = useState<string | null>(null);\n  const [isMainChatCopied, setIsMainChatCopied] = useState(false);'
  );
}

if (!content.includes('handleCopyMainChat')) {
  content = content.replace(
    /const handleClearMemory = \(\) => \{/,
    `const handleCopyMainChat = () => {
    if (messages.length === 0) return;
    const transcript = generateChatTranscript(messages, "J.A.R.V.I.S. Main Data Stream");
    navigator.clipboard.writeText(transcript);
    setIsMainChatCopied(true);
    setTimeout(() => setIsMainChatCopied(false), 2000);
  };
  
  const handleClearMemory = () => {`
  );
}

const buttonRegex = /<span className="text-gray-400">MEMORY: <strong className="text-cyan-400">\{messages\.length\} LOGS<\/strong><\/span>/;
const newButtons = '<span className="text-gray-400">MEMORY: <strong className="text-cyan-400">{messages.length} LOGS</strong></span>\n              <button\n                onClick={handleCopyMainChat}\n                className="text-gray-400 hover:text-[var(--theme-primary)] transition-colors p-1 flex items-center gap-1 bg-black/40 border border-gray-800 rounded px-2"\n                title="Copy Entire Chat"\n              >\n                {isMainChatCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} COPY CHAT\n              </button>';
              
content = content.replace(buttonRegex, newButtons);

fs.writeFileSync('src/App.tsx', content);
