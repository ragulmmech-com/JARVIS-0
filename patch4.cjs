const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: systemInstruction,
        },`;

const replacementNew = `        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: systemInstruction,
          // outputAudioTranscription: {},
          // inputAudioTranscription: {},
        },`;

const startIndex = code.indexOf(replacement);

if (startIndex !== -1) {
  code = code.replace(replacement, replacementNew);
  fs.writeFileSync('server.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find targets");
}
