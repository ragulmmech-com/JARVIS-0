const fs = require('fs');
let code = fs.readFileSync('src/lib/mediaUpload.ts', 'utf8');
code = code.replace(/extractedText \= extractedText\.substring\(0, 1024 \* 1024\) \+ "\n\/\/ \[TRUNCATED\] File too large\.";/m, 
    'extractedText = extractedText.substring(0, 1024 * 1024) + "\\n// [TRUNCATED] File too large.";');
fs.writeFileSync('src/lib/mediaUpload.ts', code);
