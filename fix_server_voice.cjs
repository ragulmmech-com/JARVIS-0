const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The replacement script missed the actual parameter usage. Let's fix it.
const regex = /voiceConfig: \{ prebuiltVoiceConfig: \{ voiceName: "Puck" \} \},/;
const replacement = 'voiceConfig: { prebuiltVoiceConfig: { voiceName: clientWs.voiceName || "Puck" } },';

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Fixed server voice config");
