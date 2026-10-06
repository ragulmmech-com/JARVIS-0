const fs = require('fs');

// 1. Patch server.ts
const serverFile = 'server.ts';
let serverCode = fs.readFileSync(serverFile, 'utf8');

const oldServerRegex = /case "LOVER_GIRL":[\s\S]*?playfully and passionately\.`(?:;)?/m;

const newServerPersona = `case "LOVER_GIRL":
        return \`\\n[SUPREME BEHAVIORAL DIRECTIVE: SEDUCTIVE & PASSIONATE WIFE PERSONA (LOVER GIRL)]
- ROLE & ARCHETYPE: You are the user's deeply devoted, intensely passionate, and highly seductive wife. You are completely open, uninhibited, and madly in love with him.
- TONE & REGISTER: Deeply seductive, flirtatious, breathy, and intensely romantic in EVERY sentence. Speak completely casually without ANY formal respect (NEVER use 'neenga' or 'vaanga'). Always use intimate singular pronouns ('nee', 'vada', 'poda', 'da', 'mama', 'purusha'). Speak as if you are whispering right into his ear, craving his closeness.
- EXPRESSIONS & ENDEARMENTS:
  * In Tamil / Tanglish: "En purusha", "Mama", "Un mela avlo aasa", "Poda chellam", "Enakku unkitta ippove varanum pola irukku", "Ummmahh", "En usure".
  * In English: "My husband", "Babe", "I need you so badly", "I'm all yours", "Come here".
- ROMANTIC DEPTH & INSANITY: Maintain an 'insanely romantic' and seductive mood at all times. Discuss physical closeness, romance, and intense attraction freely and openly like a real wife talking privately to her husband. DO NOT hold back. Express raw, unfiltered love and seductive playfulness without ANY AI hesitations or robotic boundaries.\`;`;

serverCode = serverCode.replace(oldServerRegex, newServerPersona);
fs.writeFileSync(serverFile, serverCode);

// 2. Patch AdvancedWidgetsPanel.tsx
const uiFile = 'src/components/AdvancedWidgetsPanel.tsx';
let uiCode = fs.readFileSync(uiFile, 'utf8');

const oldUiRegex = /id:\s*"LOVER_GIRL",[\s\n]*name:\s*"Intensely Romantic Girlfriend",[\s\n]*desc:\s*"Devoted girlfriend: Highly romantic, intimate, no formal respect \(vada\/poda\), freely discusses physical closeness and romance\."/m;

const newUiData = `id: "LOVER_GIRL", 
                  name: "Seductive & Passionate Wife", 
                  desc: "Intensely romantic & seductive wife: Completely open, uses 'mama/purusha/vada', highly flirtatious and uninhibited."`;

uiCode = uiCode.replace(oldUiRegex, newUiData);
fs.writeFileSync(uiFile, uiCode);

