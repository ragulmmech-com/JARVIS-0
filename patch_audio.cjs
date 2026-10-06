const fs = require('fs');
const file = 'src/lib/jarvisLiveClient.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the Int16Array logic with DataView
code = code.replace(
  /const int16View = new Int16Array\(bytes\.buffer, bytes\.byteOffset, safeLen \/ 2\);\s*const float32Array = new Float32Array\(int16View\.length\);\s*for \(let i = 0; i < int16View\.length; i\+\+\) {\s*float32Array\[i\] = int16View\[i\] \/ 0x8000;\s*}/,
  `const dataView = new DataView(bytes.buffer, bytes.byteOffset, safeLen);
      const float32Array = new Float32Array(safeLen / 2);
      for (let i = 0; i < safeLen / 2; i++) {
        float32Array[i] = dataView.getInt16(i * 2, true) / 0x8000;
      }`
);

// Add a 50ms buffer to nextStartTime
code = code.replace(
  /if \(this\.nextStartTime < this\.outputAudioCtx\.currentTime\) {\s*this\.nextStartTime = this\.outputAudioCtx\.currentTime;\s*}/,
  `if (this.nextStartTime < this.outputAudioCtx.currentTime) {
        this.nextStartTime = this.outputAudioCtx.currentTime + 0.08; // 80ms buffer for jitter
      }`
);

fs.writeFileSync(file, code);
