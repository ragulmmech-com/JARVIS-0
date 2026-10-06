const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  /\} else if \(requestedModel === "jarvis-core-mk5"\) \{/,
  `} else if (requestedModel === "gemini-3.7-pro") {
        modelVersion = "gemini-3.7-pro";
        dynamicInstruction += \`\\n[Persona Directive: You are operating as the Advanced PROJECT WORKSPACE AI. Provide highly detailed, analytical, and comprehensive answers. You have full file reading, writing, image generation, and research capabilities.]\`;
      } else if (requestedModel === "jarvis-core-mk5") {`
);

fs.writeFileSync('server.ts', content);
