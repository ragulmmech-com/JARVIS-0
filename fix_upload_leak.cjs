const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
    const ai = getAi();
    let uploadResult;
    try {
      uploadResult = await ai.files.upload({
        file: req.file.path,
        config: { mimeType: req.file.mimetype },
      });
    } finally {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
    return res.json({ fileUri: uploadResult.uri, mimeType: uploadResult.mimeType, name: uploadResult.name });
`;

code = code.replace(/    const ai \= getAi\(\);\n    const uploadResult \= await ai\.files\.upload\(\{\n      file: req\.file\.path,\n      config: \{ mimeType: req\.file\.mimetype \},\n    \}\);\n    fs\.unlinkSync\(req\.file\.path\); \n    return res\.json\(\{ fileUri: uploadResult\.uri, mimeType: uploadResult\.mimeType, name: uploadResult\.name \}\);/m, replacement);

fs.writeFileSync('server.ts', code);
