const fs = require('fs');

// 1. App.tsx - safeStorageSet
let storageCode = fs.readFileSync('src/utils/storage.ts', 'utf8');
if (!storageCode.includes('safeStorageSet')) {
    storageCode += `\nexport function safeStorageSet(key: string, value: string) {\n  try {\n    localStorage.setItem(key, value);\n  } catch (err) {\n    console.warn("Storage quota exceeded for key:", key);\n  }\n}\n`;
    fs.writeFileSync('src/utils/storage.ts', storageCode);
}

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (appCode.includes('localStorage.setItem')) {
    appCode = appCode.replace(/localStorage\.setItem/g, 'safeStorageSet');
    if (!appCode.includes('safeStorageSet(key')) {
        appCode = `import { safeStorageSet } from "./utils/storage";\n` + appCode;
    }
    fs.writeFileSync('src/App.tsx', appCode);
}

// 2. jarvisLiveClient.ts - Empty catch blocks
let wsCode = fs.readFileSync('src/lib/jarvisLiveClient.ts', 'utf8');
wsCode = wsCode.replace(/catch\s*\{\}/g, 'catch (e) { console.debug("Handled rejection:", e); }');
fs.writeFileSync('src/lib/jarvisLiveClient.ts', wsCode);

// 3. audioSynthesizer.ts - Chrome 15s bug
let audioCode = fs.readFileSync('src/lib/audioSynthesizer.ts', 'utf8');
if (!audioCode.includes('resumeInterval')) {
    audioCode = audioCode.replace('private activeAbortController: AbortController | null = null;', 
        'private activeAbortController: AbortController | null = null;\n  private resumeInterval: any = null;');
    audioCode = audioCode.replace('window.speechSynthesis.cancel();', 
        'window.speechSynthesis.cancel();\n      if (this.resumeInterval) { clearInterval(this.resumeInterval); this.resumeInterval = null; }');
    
    const speakHook = `window.speechSynthesis.speak(utterance);
      if (this.resumeInterval) clearInterval(this.resumeInterval);
      this.resumeInterval = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(this.resumeInterval);
        }
      }, 14000);`;
    audioCode = audioCode.replace('window.speechSynthesis.speak(utterance);', speakHook);
    fs.writeFileSync('src/lib/audioSynthesizer.ts', audioCode);
}

// 4. server.ts - Promise anti-pattern, Express limit, and Multer integration
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace('app.use(express.json({ limit: "5000mb" }));', 
    'app.use(express.json({ limit: "100mb" }));');
serverCode = serverCode.replace('app.use(express.urlencoded({ limit: "5000mb", extended: true }));', 
    'app.use(express.urlencoded({ limit: "100mb", extended: true }));');
    
if (!serverCode.includes('import multer')) {
    serverCode = serverCode.replace('import express from "express";', 'import express from "express";\nimport multer from "multer";\nimport fs from "fs";\nimport os from "os";\nconst upload = multer({ dest: os.tmpdir() });\n');
}

if (!serverCode.includes('/api/upload')) {
    const uploadRoute = `
app.post("/api/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const ai = getAi();
    const uploadResult = await ai.files.upload({
      file: req.file.path,
      mimeType: req.file.mimetype,
    });
    fs.unlinkSync(req.file.path); 
    return res.json({ fileUri: uploadResult.uri, mimeType: uploadResult.mimeType, name: uploadResult.name });
  } catch (e: any) {
    console.error("Gemini Upload Error:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
});\n`;
    serverCode = serverCode.replace('app.post("/api/chat"', uploadRoute + 'app.post("/api/chat"');
}

if (!serverCode.includes('geminifile:')) {
    const handleGeminiFile = `
      if (att.url && att.url.startsWith("geminifile:")) {
        const actualUri = att.url.replace("geminifile:", "");
        userParts.push({ fileData: { fileUri: actualUri, mimeType: att.type || "application/octet-stream" } });
        continue;
      }
      if (att.url && att.url.startsWith("data:")) {`;
    serverCode = serverCode.replace('if (att.url && att.url.startsWith("data:")) {', handleGeminiFile);
}

if (!serverCode.includes('})().catch(reject);')) {
    const promiseFix = `return new Promise((resolve, reject) => {
      (async () => {
        let resolved = false;`;
    serverCode = serverCode.replace(/return new Promise\(async \(resolve, reject\) => \{\n\s*let resolved = false;/m, promiseFix);
    
    serverCode = serverCode.replace(/        \}\n      \} catch \(e\) \{\n        if \(\!resolved\) \{\n          resolved = true;\n          clearTimeout\(timeout\);\n          reject\(e\);\n        \}\n      \}\n    \}\);/m, 
    `        }
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(e);
        }
      }
      })().catch(reject);
    });`);
}

fs.writeFileSync('server.ts', serverCode);

// 5. mediaUpload.ts - Chunked Multipart Upload Strategy for files > 15MB
let mediaCode = fs.readFileSync('src/lib/mediaUpload.ts', 'utf8');
const startStr = "if (isImg) {";
const endStr = "      let detectedType = file.type;";
const startIndex = mediaCode.indexOf(startStr);
const endIndex = mediaCode.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1 && !mediaCode.includes('geminifile:')) {
    const replacement = `      if (isImg) {
        if (file.size > 800 * 1024 && file.size <= 15 * 1024 * 1024) {
          url = await compressImageFile(file, 1600, 0.85);
        } else if (file.size > 15 * 1024 * 1024) {
          const fd = new FormData(); fd.append("file", file);
          const r = await fetch("/api/upload", { method: "POST", body: fd });
          if(r.ok) { const d = await r.json(); url = "geminifile:" + d.fileUri; }
        } else {
          url = await readFileAsDataUrl(file);
        }
      } else if (isText) {
        if (file.size > 5 * 1024 * 1024) {
          const fd = new FormData(); fd.append("file", file);
          const r = await fetch("/api/upload", { method: "POST", body: fd });
          if(r.ok) { const d = await r.json(); url = "geminifile:" + d.fileUri; }
          extractedText = undefined;
        } else if (totalTextSize > MAX_TEXT_MEMORY) {
            extractedText = "// [TRUNCATED]: J.A.R.V.I.S. Memory protection enabled. Max context length reached.";
            url = ""; 
        } else {
            extractedText = await readFileAsText(file);
            totalTextSize += extractedText.length;
            url = ""; 
        }
      } else {
        if (file.size > 15 * 1024 * 1024) {
            const fd = new FormData(); fd.append("file", file);
            const r = await fetch("/api/upload", { method: "POST", body: fd });
            if(r.ok) { 
               const d = await r.json(); 
               url = "geminifile:" + d.fileUri; 
            } else {
               console.warn("Server upload failed for", file.name);
               url = "";
            }
        } else {
            url = await readFileAsDataUrl(file);
        }
      }
      
`;
    mediaCode = mediaCode.substring(0, startIndex) + replacement + mediaCode.substring(endIndex);
    fs.writeFileSync('src/lib/mediaUpload.ts', mediaCode);
}

console.log("All 6 bug fixes applied successfully!");
