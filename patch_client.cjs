const fs = require('fs');
let code = fs.readFileSync('src/lib/jarvisLiveClient.ts', 'utf8');

const regex = /this\.ws = new WebSocket\(`\$\{protocol\}\/\/\$\{window\.location\.host\}\/live`\);/;
const replacement = `    // Pass the currently selected JARVIS voice down to the Live API
    const savedVoice = localStorage.getItem("jarvis_selected_voice_id") || "jarvis-classic";
    this.ws = new WebSocket(\`\${protocol}//\${window.location.host}/live?voice=\${savedVoice}\`);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/jarvisLiveClient.ts', code);
console.log("Patched jarvisLiveClient.ts");
