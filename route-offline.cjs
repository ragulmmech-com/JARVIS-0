const fs = require('fs');

let modal = fs.readFileSync('src/components/ModelChatModal.tsx', 'utf-8');

if (!modal.includes('import { generateOfflineResponse, setWebLLMProgressCallback } from "../lib/webLlmService";')) {
  modal = modal.replace(
    /import React, \{ useState, useEffect, useRef \} from "react";/,
    'import React, { useState, useEffect, useRef } from "react";\nimport { generateOfflineResponse, setWebLLMProgressCallback } from "../lib/webLlmService";'
  );
  
  // Also add progress state
  modal = modal.replace(
    /const \[isProcessing, setIsProcessing\] = useState\(false\);/,
    'const [isProcessing, setIsProcessing] = useState(false);\n  const [offlineProgress, setOfflineProgress] = useState("");'
  );
  
  // Also update progress callback on mount
  modal = modal.replace(
    /useEffect\(\(\) => \{\s*if \(isOpen\) \{/,
    `useEffect(() => {
    setWebLLMProgressCallback((text) => setOfflineProgress(text));
  }, []);
  
  useEffect(() => {
    if (isOpen) {`
  );
  
  // Modify the submit handler
  const fetchRegex = /const res = await fetch\("\/api\/chat", \{[\s\S]*?\}\);/;
  const newFetchCode = `
      let data: any;
      if (selectedEngine === "offline-llama") {
        const textResponse = await generateOfflineResponse([...historyPayload, { role: "user", parts: [{ text: query }] }]);
        data = { type: "text", text: textResponse };
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            image: activeAttachment?.url,
            mediaType: activeAttachment?.type,
            mediaName: activeAttachment?.name,
            history: historyPayload,
            model: selectedEngine,
          }),
        });

        if (!res.ok) {
          if (res.status === 413) throw new Error("File too large (exceeds limit).");
          try {
            const errorData = await res.json();
            throw new Error(errorData.error || \`HTTP Error \${res.status}\`);
          } catch {
            throw new Error(\`HTTP Error \${res.status}\`);
          }
        }
        
        data = await res.json();
      }
  `;
  modal = modal.replace(fetchRegex, newFetchCode);
  
  // Remove the old data parsing
  modal = modal.replace(
    /const contentType = res\.headers\.get\("content-type"\);[\s\S]*?const data = await res\.json\(\);/,
    ''
  );
  
  // Update the processing UI to show offline progress
  modal = modal.replace(
    /<span>\{currentEngine\?.name \|\| "J\.A\.R\.V\.I\.S\. Core"\} synthesizing response\.\.\.<\/span>/,
    '<span>{selectedEngine === "offline-llama" && offlineProgress ? offlineProgress : `${currentEngine?.name || "J.A.R.V.I.S. Core"} synthesizing response...`}</span>'
  );
  
  fs.writeFileSync('src/components/ModelChatModal.tsx', modal);
}
