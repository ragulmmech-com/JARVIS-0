const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const uploadResult \= await ai\.files\.upload\(\{\n      file: req\.file\.path,\n      mimeType: req\.file\.mimetype,\n    \}\);/m, 
    `const uploadResult = await ai.files.upload({
      file: req.file.path,
      config: { mimeType: req.file.mimetype },
    });`);

fs.writeFileSync('server.ts', code);
