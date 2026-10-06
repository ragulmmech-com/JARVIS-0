const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const startListeningSession = async (mode: VoiceListeningMode = voiceModeRef.current, playSound: boolean = true) => {
    if (!liveClientRef.current) {
      liveClientRef.current = new GeminiLiveClient(
        () => {
          // onInterrupted
        },
        (state) => {
          if (state === "listening") {
            setIsListening(true);
            isListeningRef.current = true;
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setIsProcessing(false);
          } else if (state === "speaking") {
            setIsListening(false);
            isListeningRef.current = false;
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            setIsProcessing(false);
          } else if (state === "processing") {
            setIsListening(false);
            isListeningRef.current = false;
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setIsProcessing(true);
          } else if (state === "idle") {
            setIsListening(false);
            isListeningRef.current = false;
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setIsProcessing(false);
          }
        }
      );
    }
    
    jarvisAudio.stopSpeaking();
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    if (mode === "continuous") {
      isContinuousActiveRef.current = true;
    }

    try {
      if (playSound) jarvisAudio.playListeningStartSound();
      await liveClientRef.current.connect();
    } catch (e) {
      console.error("Live API start error:", e);
    }
  };

  const stopListeningSession = (fullyStop: boolean = true) => {
    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
    }
    if (fullyStop) {
      isContinuousActiveRef.current = false;
    }
    setIsListening(false);
    isListeningRef.current = false;
    setLiveTranscript("");
    
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      liveClientRef.current = null;
    }

    if (fullyStop) {
      jarvisAudio.playListeningStopSound();
    }
  };`;

const targetStart = `  const startListeningSession = (mode: VoiceListeningMode = voiceModeRef.current, playSound: boolean = true) => {`;
const targetEnd = `  const speakAndHandleResume = (textToSpeak: string) => {`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + "\n\n" + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find targets");
}
