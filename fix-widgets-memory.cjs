const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');

if (!content.includes('getGlobalMemoryString')) {
  content = content.replace(
    /import \{ jarvisAudio \} from "\.\.\/lib\/audioSynthesizer";/,
    'import { jarvisAudio } from "../lib/audioSynthesizer";\nimport { getGlobalMemoryString } from "../lib/memory";'
  );
}

const fetchRegex = /body: JSON\.stringify\(\{([\s\S]*?)model: widgetModel,/;
const newFetch = `body: JSON.stringify({$1model: widgetModel,\n          globalMemory: getGlobalMemoryString(),`;
content = content.replace(fetchRegex, newFetch);

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', content);
