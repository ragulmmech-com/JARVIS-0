const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
if (!content.includes('getGlobalMemoryString')) {
  content = content.replace(
    /import \{ generateOfflineResponse, setWebLLMProgressCallback \} from "\.\/lib\/webLlmService";/,
    'import { generateOfflineResponse, setWebLLMProgressCallback } from "./lib/webLlmService";\nimport { getGlobalMemoryString } from "./lib/memory";'
  );
}

// Add to fetch
const fetchRegex = /body: JSON\.stringify\(\{([\s\S]*?)model: selectedModel,/;
const newFetch = `body: JSON.stringify({$1model: selectedModel,\n            globalMemory: getGlobalMemoryString(),`;
content = content.replace(fetchRegex, newFetch);

fs.writeFileSync('src/App.tsx', content);
