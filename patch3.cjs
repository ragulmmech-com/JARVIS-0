const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const handleInterrupt = () => {
    if (liveClientRef.current) {
      liveClientRef.current.interruptAudio();
    }
    jarvisAudio.stopSpeaking();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    // If continuous mode was active, user interrupted speech and wants to talk right now!
    if (voiceModeRef.current === "continuous" && isContinuousActiveRef.current) {
      // The websocket is still open, so they can just talk!
    } else {
      stopListeningSession(true);
    }
  };`;

const targetStart = `  const handleInterrupt = () => {`;
const targetEnd = `  const handleToggleVoiceMuted = () => {`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + "\n\n" + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find targets");
}
