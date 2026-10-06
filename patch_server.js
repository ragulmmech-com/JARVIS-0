const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /Sound like a true companion, NEVER like a rigid robotic computer\.\\n/,
  `Sound like a true companion, NEVER like a rigid robotic computer. Use natural conversational fillers (like "hmm", "uh", "ah") appropriately to sound exactly like a real human on a phone call.\\n`
);

fs.writeFileSync(file, code);
