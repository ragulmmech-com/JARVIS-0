const fs = require('fs');
const file = 'src/components/AdvancedWidgetsPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /id:\s*"LOVER_GIRL",\s*name:\s*"Affectionate Girlfriend \(Lover\)",\s*desc:\s*"Devoted girlfriend: Sweet, cute, caring, romantic, checks in on you, deeply affectionate and cheerful\."/,
  `id: "LOVER_GIRL", 
                  name: "Intensely Romantic Girlfriend", 
                  desc: "Devoted girlfriend: Highly romantic, intimate, no formal respect (vada/poda), freely discusses physical closeness and romance."`
);

fs.writeFileSync(file, code);
