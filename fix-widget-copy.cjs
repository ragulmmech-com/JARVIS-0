const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');

if (!content.includes('generateChatTranscript')) {
  content = content.replace(
    /import \{ getGlobalMemoryString \} from "\.\.\/lib\/memory";/,
    'import { getGlobalMemoryString } from "../lib/memory";\nimport { generateChatTranscript } from "../lib/transcript";\nimport { Copy } from "lucide-react";'
  );
}

if (!content.includes('const [isWidgetCopied, setIsWidgetCopied]')) {
  content = content.replace(
    /const \[copiedId, setCopiedId\] = useState<string \| null>\(null\);/,
    'const [copiedId, setCopiedId] = useState<string | null>(null);\n  const [isWidgetCopied, setIsWidgetCopied] = useState(false);'
  );
}

if (!content.includes('handleCopyWidgetChat')) {
  content = content.replace(
    /const handleCopy = \(text: string, id: string\) => \{/,
    `const handleCopyWidgetChat = () => {
    if (widgetMessages.length === 0) return;
    const transcript = generateChatTranscript(widgetMessages, "J.A.R.V.I.S. Tactical Widget");
    navigator.clipboard.writeText(transcript);
    setIsWidgetCopied(true);
    setTimeout(() => setIsWidgetCopied(false), 2000);
  };
  
  const handleCopy = (text: string, id: string) => {`
  );
}

const buttonRegex = /<button\s*type="button"\s*onClick=\{\(\) => setWidgetMessages\(\[\]\)\}\s*className="p-1\.5 rounded bg-red-950\/40 border border-red-500\/30 text-red-400 hover:bg-red-900\/50"\s*title="Clear Widget Chat"\s*>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/;
const newButtons = `<button
                type="button"
                onClick={handleCopyWidgetChat}
                className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50"
                title="Copy Entire Widget Chat"
              >
                {isWidgetCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setWidgetMessages([])}
                className="p-1.5 rounded bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/50"
                title="Clear Widget Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>`;
content = content.replace(buttonRegex, newButtons);

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', content);
