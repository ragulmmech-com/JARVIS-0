const fs = require('fs');
let code = fs.readFileSync('src/lib/geminiLiveClient.ts', 'utf8');

const replacement = `  public sendText(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public interruptAudio() {
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }`;

const targetEnd = `  private pcmToBase64(pcmData: Float32Array): string {`;

const endIndex = code.indexOf(targetEnd);

if (endIndex !== -1) {
  code = code.substring(0, endIndex) + replacement + "\n\n" + code.substring(endIndex);
  fs.writeFileSync('src/lib/geminiLiveClient.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find targets");
}
