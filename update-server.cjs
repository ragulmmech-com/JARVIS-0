const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const regex = /let dynamicInstruction = systemInstruction;/;
const directives = `
      let dynamicInstruction = systemInstruction;
      
      if (req.body.globalMemory) {
        dynamicInstruction += "\\n\\n[SYNAPTIC MEMORY ARCHIVE (PAST CONVERSATIONS)]\\n" + req.body.globalMemory + "\\n[END MEMORY ARCHIVE]\\n\\nCRITICAL INSTRUCTION: You have access to the user's past conversations in the Synaptic Memory Archive above. You must use this memory to remember facts, preferences, and context if the user refers to past discussions. Act as a continuous intelligence that remembers everything.]";
      }
`;
content = content.replace(regex, directives);
fs.writeFileSync('server.ts', content);
