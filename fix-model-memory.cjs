const fs = require('fs');
let content = fs.readFileSync('src/components/ModelChatModal.tsx', 'utf-8');

if (!content.includes('getGlobalMemoryString')) {
  content = content.replace(
    /import \{ Send, X, Copy, Check, Trash2, Paperclip \} from "lucide-react";/,
    'import { Send, X, Copy, Check, Trash2, Paperclip } from "lucide-react";\nimport { getGlobalMemoryString } from "../lib/memory";'
  );
}

const fetchRegex = /body: JSON\.stringify\(\{([\s\S]*?)model: selectedEngine,/;
const newFetch = `body: JSON.stringify({$1model: selectedEngine,\n          globalMemory: getGlobalMemoryString(),`;
content = content.replace(fetchRegex, newFetch);

fs.writeFileSync('src/components/ModelChatModal.tsx', content);
