const fs = require('fs');

function fixAppTsx() {
  let code = fs.readFileSync('src/App.tsx', 'utf8');

  // Fix JSON.parse instances
  const safeParseReplace = `
const safeJSONParse = (str, fallback) => {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch(e) { console.warn("JSON Parse error", e); return fallback; }
};
`;
  if (!code.includes('safeJSONParse')) {
    code = code.replace(/import \{.*\} from 'react';/, match => match + '\n' + safeParseReplace);
    if (!code.includes('safeJSONParse')) {
      code = safeParseReplace + '\n' + code;
    }
  }

  code = code.replace(/JSON\.parse\(saved\)/g, 'safeJSONParse(saved, [])');
  code = code.replace(/JSON\.parse\(localStorage\.getItem\("jarvis_sidebar_workspace_sessions"\) \|\| "\[\]"\)/g, 'safeJSONParse(localStorage.getItem("jarvis_sidebar_workspace_sessions") || "[]", [])');
  code = code.replace(/JSON\.parse\(dataStr\)/g, 'safeJSONParse(dataStr, {})');
  code = code.replace(/JSON\.parse\(theme\)/g, 'safeJSONParse(theme, null)');

  // Fix Battery leak
  code = code.replace(/battery\.addEventListener\('levelchange', updateBattery\);\s*\}\)\.catch\(\(e: any\) => console\.warn\("Battery API unavailable:", e\)\);\s*\}\s*return \(\) => \{\s*if \(batteryInstance\) \{\s*batteryInstance\.removeEventListener\('levelchange', updateBattery\);\s*\}\s*\};/m, 
`battery.addEventListener('levelchange', updateBattery);
      }).catch((e: any) => console.warn("Battery API unavailable:", e));
    }
    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', updateBattery);
        batteryInstance = null;
      }
    };`);

  // Fix empty catch
  code = code.replace(/catch\s*\{\}/g, 'catch (e) { console.debug("Ignored exception", e); }');
  
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed App.tsx");
}

function fixServerTs() {
  let code = fs.readFileSync('server.ts', 'utf8');

  // Fix empty catch
  code = code.replace(/catch\s*\{\}/g, 'catch (e) { console.debug("Ignored server exception", e); }');

  // Fix Unhandled rejections due to empty req.body
  const injectCheck = (match) => {
    return match + `\n    if (!req.body) return res.status(400).json({ error: "Missing JSON payload" });`;
  };
  
  code = code.replace(/app\.post\("\/api\/chat\/stream", async \(req, res\) => \{\s*let history = \[\];\s*try \{/m, injectCheck);
  code = code.replace(/app\.post\("\/api\/chat", async \(req, res\) => \{\s*try \{/m, injectCheck);
  code = code.replace(/app\.post\("\/api\/chat\/tool-response", async \(req, res\) => \{\s*try \{/m, injectCheck);
  code = code.replace(/app\.post\("\/api\/generate-media", async \(req, res\) => \{\s*try \{/m, injectCheck);
  code = code.replace(/app\.post\("\/api\/voice\/synthesize", async \(req, res\) => \{\s*try \{/m, injectCheck);

  fs.writeFileSync('server.ts', code);
  console.log("Fixed server.ts");
}

function fixAudio() {
  let code = fs.readFileSync('src/lib/audioSynthesizer.ts', 'utf8');
  
  // Empty catch
  code = code.replace(/catch\s*\{\}/g, 'catch (e) { console.debug("Ignored audio exception", e); }');
  
  // Fix memory leak on revokeObjectURL
  code = code.replace(/if \(this\.activeAudioElement === audio\) \{/, 
  `if (audioUrl) {
          try { URL.revokeObjectURL(audioUrl); } catch(e) {}
        }
        if (this.activeAudioElement === audio) {`);

  fs.writeFileSync('src/lib/audioSynthesizer.ts', code);
  console.log("Fixed audioSynthesizer.ts");
}

function fixHtml() {
  let code = fs.readFileSync('index.html', 'utf8');
  code = code.replace(/catch\s*\(e\)\s*\{\}/g, 'catch(e) { console.warn("Theme script error", e); }');
  fs.writeFileSync('index.html', code);
  console.log("Fixed index.html");
}

try { fixAppTsx(); } catch(e) { console.error("App.tsx err", e); }
try { fixServerTs(); } catch(e) { console.error("server.ts err", e); }
try { fixAudio(); } catch(e) { console.error("audio.ts err", e); }
try { fixHtml(); } catch(e) { console.error("html err", e); }

