const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add offline service import if missing
if (!content.includes('generateOfflineResponse')) {
  content = content.replace(
    /import \{ JarvisLiveClient \} from "\.\/lib\/jarvisLiveClient";/,
    'import { JarvisLiveClient } from "./lib/jarvisLiveClient";\nimport { generateOfflineResponse, setWebLLMProgressCallback } from "./lib/webLlmService";'
  );
}

// Add state for offline progress
if (!content.includes('const [offlineProgress, setOfflineProgress] = useState("");')) {
  content = content.replace(
    /const \[isProcessing, setIsProcessing\] = useState\(false\);/,
    'const [isProcessing, setIsProcessing] = useState(false);\n  const [offlineProgress, setOfflineProgress] = useState("");'
  );
  
  content = content.replace(
    /useEffect\(\(\) => \{\s*if \(terminalLogRef\.current\) \{/,
    `useEffect(() => {
    setWebLLMProgressCallback((text) => setOfflineProgress(text));
  }, []);
  
  useEffect(() => {
    if (terminalLogRef.current) {`
  );
}

// Modify the fetch block in handleSendMessage
const fetchRegex = /const res = await fetch\("\/api\/chat", \{[\s\S]*?const data = await res\.json\(\);/;
const newFetch = `
      let data: any;
      if (selectedModel === "offline-llama") {
        const textResponse = await generateOfflineResponse([...historyPayload, { role: "user", parts: [{ text: query }] }]);
        data = { type: "text", text: textResponse };
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            history: historyPayload,
            image: activeAttachment?.url,
            mediaType: activeAttachment?.type,
            mediaName: activeAttachment?.name,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          if (res.status === 413) throw new Error("File too large (exceeds 32MB limit).");
          throw new Error(\`HTTP Error \${res.status}\`);
        }
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned an invalid response (might be overloaded or restarting).");
        }
        
        data = await res.json();
      }
`;
content = content.replace(fetchRegex, newFetch);

// Update processing indicator
content = content.replace(
  /\{isProcessing && \([\s\S]*?J\.A\.R\.V\.I\.S\. Core Synthesizing\.\.\.[\s\S]*?<\/div>\)/,
  `{isProcessing && (
          <div className="flex justify-start">
            <div className="bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30 rounded-2xl p-4 inline-flex items-center gap-3 animate-pulse">
              <Cpu className="w-5 h-5 animate-spin-slow" />
              <span className="font-['JetBrains_Mono',monospace] text-sm">
                {selectedModel === "offline-llama" && offlineProgress ? offlineProgress : "J.A.R.V.I.S. Core Synthesizing..."}
              </span>
            </div>
          </div>
        )}`
);

fs.writeFileSync('src/App.tsx', content);
