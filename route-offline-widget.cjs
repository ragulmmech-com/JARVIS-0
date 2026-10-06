const fs = require('fs');

let panel = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');

if (!panel.includes('import { generateOfflineResponse, setWebLLMProgressCallback } from "../lib/webLlmService";')) {
  panel = panel.replace(
    /import React, \{ useState, useEffect, useRef \} from "react";/,
    'import React, { useState, useEffect, useRef } from "react";\nimport { generateOfflineResponse, setWebLLMProgressCallback } from "../lib/webLlmService";'
  );
  
  panel = panel.replace(
    /const \[isWidgetChatProcessing, setIsWidgetChatProcessing\] = useState\(false\);/,
    'const [isWidgetChatProcessing, setIsWidgetChatProcessing] = useState(false);\n  const [offlineProgress, setOfflineProgress] = useState("");'
  );
  
  // Also update progress callback on mount
  panel = panel.replace(
    /useEffect\(\(\) => \{\s*if \(activeTab === "chat"\) \{/,
    `useEffect(() => {
    setWebLLMProgressCallback((text) => setOfflineProgress(text));
  }, []);
  
  useEffect(() => {
    if (activeTab === "chat") {`
  );
  
  // Modify the submit handler
  const fetchRegex = /const res = await fetch\("\/api\/chat", \{[\s\S]*?\}\);/;
  const newFetchCode = `
      let data: any;
      if (widgetModel === "offline-llama") {
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
            model: widgetModel,
          }),
        });

        if (!res.ok) {
          if (res.status === 413) throw new Error("File too large (exceeds limit).");
          try {
            const errorData = await res.json();
            throw new Error(errorData.error || \`HTTP \${res.status}\`);
          } catch {
            throw new Error(\`HTTP \${res.status}\`);
          }
        }
        
        data = await res.json();
      }
  `;
  panel = panel.replace(fetchRegex, newFetchCode);
  
  // Remove the old data parsing
  panel = panel.replace(
    /const contentType = res\.headers\.get\("content-type"\);[\s\S]*?const data = await res\.json\(\);/,
    ''
  );
  
  // Update the processing UI to show offline progress
  panel = panel.replace(
    /<span>Processing query with \{widgetModel\}\.\.\.<\/span>/,
    '<span>{widgetModel === "offline-llama" && offlineProgress ? offlineProgress : `Processing query with ${widgetModel}...`}</span>'
  );
  
  fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', panel);
}
