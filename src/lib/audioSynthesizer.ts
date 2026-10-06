/**
 * J.A.R.V.I.S. Audio Synthesizer
 * High-performance, low-latency, natural Tamil & Tanglish voice synthesizer.
 * Primary: Edge Neural Studio TTS (/api/voice/synthesize)
 * Fallback: Gemini Flash TTS & Web SpeechSynthesis
 */

export class JarvisAudioSynthesizer {
  private muted: boolean = false;
  private voiceEngine: "neural" | "instant" = "neural";
  private activeVoiceId: string = "jarvis-classic";
  private isAudioPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    try {
      const savedMute = localStorage.getItem("jarvis_voice_muted");
      if (savedMute !== null) {
        this.muted = savedMute === "true";
      }
      const savedVoice = localStorage.getItem("jarvis_selected_voice_id");
      if (savedVoice) {
        this.activeVoiceId = savedVoice;
      }
    } catch (e) {
      console.debug("Failed reading voice preferences", e);
    }
  }

  public getMuted(): boolean {
    return this.muted;
  }

  public setMuted(val: boolean): void {
    this.muted = val;
    try {
      localStorage.setItem("jarvis_voice_muted", String(val));
    } catch (e) {
      console.debug("Failed saving voice muted state", e);
    }
    if (val) {
      this.stopSpeaking();
    }
  }

  public getVoiceEngine(): "neural" | "instant" {
    return this.voiceEngine;
  }

  public setVoiceEngine(engine: "neural" | "instant"): void {
    this.voiceEngine = engine;
  }

  public getActiveVoiceId(): string {
    return this.activeVoiceId;
  }

  public setActiveVoiceId(id: string): void {
    this.activeVoiceId = id;
    try {
      localStorage.setItem("jarvis_selected_voice_id", id);
    } catch (e) {
      console.debug("Failed saving selected voice ID", e);
    }
  }

  public setVoiceProfile(voiceId?: string, _rate?: number, _pitch?: number): void {
    if (voiceId) {
      this.setActiveVoiceId(voiceId);
    }
  }

  public unlockAudio(): void {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!this.audioCtx) {
        try {
          this.audioCtx = new AudioContextClass();
        } catch (e) {
          console.debug("AudioContext unlock notice", e);
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch((e) => console.debug("AudioContext resume notice", e));
      }
    }
  }

  public isPlaying(): boolean {
    const isBrowserSpeaking =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      window.speechSynthesis.speaking;
    return this.isAudioPlaying || Boolean(isBrowserSpeaking);
  }

  public isSpeaking(): boolean {
    return this.isPlaying();
  }

  public stopSpeaking(): void {
    this.isAudioPlaying = false;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch (e) {
        console.debug("Audio pause exception", e);
      }
      this.currentAudio = null;
    }

    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch (e) {
        console.debug("URL revoke exception", e);
      }
      this.currentObjectUrl = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.debug("speechSynthesis cancel exception", e);
      }
    }
  }

  private cleanVocalText(raw: string): string {
    if (!raw) return "";
    return raw
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[ACTION:\s*[^\]]+\]/g, "")
      .replace(/\[SYSTEM\s*[^\]]*\]/gi, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\b(sir|boss|mr\.?\s*stark)\b/gi, "")
      .replace(/\b(சார்|பாஸ்)\b/g, "")
      .replace(/[#*_\-\>~]/g, " ")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .replace(/\{[^\}]+\}/g, "")
      .replace(/\.{2,}/g, ".")
      .replace(/\s+/g, " ")
      .trim();
  }

  public speak(text: string, onEnd?: () => void): void {
    this.speakHumanized(text, onEnd);
  }

  /**
   * Primary Vocalizer: Fetches high-definition neural voice from server,
   * falls back gracefully to browser SpeechSynthesis if offline.
   */
  public async speakHumanized(
    text: string,
    onEnd?: () => void,
    onError?: (err: any) => void,
    onStart?: () => void
  ): Promise<void> {
    const clean = this.cleanVocalText(text);
    if (!clean || this.muted) {
      onEnd?.();
      return;
    }

    this.unlockAudio();
    this.stopSpeaking();
    this.isAudioPlaying = false;

    try {
      const isFriday =
        this.activeVoiceId === "friday-female" ||
        this.activeVoiceId === "friday-human" ||
        this.activeVoiceId === "friday-ai" ||
        this.activeVoiceId === "friday" ||
        this.activeVoiceId === "Kore" ||
        this.activeVoiceId === "Aoede";
      const targetVoice = isFriday ? "friday-female" : "jarvis-male";

      const res = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          voice: targetVoice,
        }),
      });

      if (!res.ok) {
        throw new Error(`Voice server responded with status ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (json.fallback) {
          throw new Error("Server requested client fallback");
        }
      }

      const blob = await res.blob();
      if (blob.size < 400) {
        throw new Error("Received empty audio stream from voice server");
      }

      const audioUrl = URL.createObjectURL(blob);
      this.currentObjectUrl = audioUrl;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      // Natural human conversational rate (1.00x)
      audio.playbackRate = 1.00;

      let hasNotifiedStart = false;
      const notifyStart = () => {
        if (!hasNotifiedStart) {
          hasNotifiedStart = true;
          this.isAudioPlaying = true;
          onStart?.();
        }
      };

      audio.onplay = notifyStart;

      audio.onended = () => {
        this.isAudioPlaying = false;
        if (this.currentObjectUrl) {
          try {
            URL.revokeObjectURL(this.currentObjectUrl);
          } catch (e) {}
          this.currentObjectUrl = null;
        }
        this.currentAudio = null;
        onEnd?.();
      };

      audio.onerror = (e) => {
        this.isAudioPlaying = false;
        console.warn("Audio element playback error, falling back to Web Speech:", e);
        this.fallbackBrowserSpeech(clean, onEnd, onError, onStart);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(notifyStart)
          .catch((playErr) => {
            this.isAudioPlaying = false;
            console.warn("Autoplay block notice, falling back:", playErr);
            this.fallbackBrowserSpeech(clean, onEnd, onError, onStart);
          });
      }
    } catch (err: any) {
      this.isAudioPlaying = false;
      console.warn("Server TTS synthesis notice, switching to browser speech:", err?.message || err);
      this.fallbackBrowserSpeech(clean, onEnd, onError, onStart);
    }
  }

  /**
   * Browser SpeechSynthesis Fallback
   */
  private fallbackBrowserSpeech(
    text: string,
    onEnd?: () => void,
    onError?: (err: any) => void,
    onStart?: () => void
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onError?.(new Error("No speech engine available"));
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Convert Tamil to legible Tanglish if browser has no native Tamil TTS voice
      const isTamil = /[\u0B80-\u0BFF]/.test(text);
      const voices = window.speechSynthesis.getVoices();
      const hasTamilVoice = voices.some((v) => v.lang.startsWith("ta"));

      let spokenText = text;
      if (isTamil && !hasTamilVoice) {
        // Simple phonetic transliteration so English TTS doesn't stumble or go silent
        spokenText = text
          .replace(/வணக்கம்/g, "Vanakkam")
          .replace(/நான்/g, "naan")
          .replace(/உங்க/g, "unga")
          .replace(/ஜார்விஸ்/g, "Jarvis")
          .replace(/ஃப்ரைடே/g, "Friday")
          .replace(/நல்லா/g, "nalla")
          .replace(/இருக்கேன்/g, "irukken")
          .replace(/சொல்லுங்க/g, "sollunga")
          .replace(/சரி/g, "seri")
          .replace(/ரெடி/g, "ready")
          .replace(/என்ன/g, "enna")
          .replace(/பண்ணலாம்/g, "pannalaam");
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      // Natural human rate (1.00x)
      utterance.rate = 1.00;
      utterance.pitch = 1.0;

      const isFriday =
        this.activeVoiceId === "friday-female" ||
        this.activeVoiceId === "friday-human" ||
        this.activeVoiceId === "friday-ai" ||
        this.activeVoiceId === "friday" ||
        this.activeVoiceId === "Kore" ||
        this.activeVoiceId === "Aoede";

      if (isFriday) {
        utterance.pitch = 1.05;
      }

      if (isTamil && hasTamilVoice) {
        const tamilVoice = voices.find((v) => v.lang.startsWith("ta") && (isFriday ? v.name.toLowerCase().includes("female") : true)) || voices.find((v) => v.lang.startsWith("ta"));
        if (tamilVoice) utterance.voice = tamilVoice;
        utterance.lang = "ta-IN";
      } else {
        const selectedVoice = voices.find(
          (v) =>
            isFriday
              ? (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("victoria")) && (v.lang.startsWith("en") || v.lang.startsWith("ta"))
              : v.lang === "en-IN" || v.lang.startsWith("en")
        ) || voices.find(v => isFriday ? v.name.toLowerCase().includes("female") : true) || voices.find(v => v.lang.startsWith("en"));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = selectedVoice?.lang || "en-IN";
      }

      utterance.onstart = () => {
        this.isAudioPlaying = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isAudioPlaying = false;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isAudioPlaying = false;
        console.warn("SpeechSynthesis error:", e);
        onError?.(e);
        onEnd?.();
      };

      this.isAudioPlaying = true;
      onStart?.();
      window.speechSynthesis.speak(utterance);
    } catch (e: any) {
      this.isAudioPlaying = false;
      onError?.(e);
      onEnd?.();
    }
  }

  // --- Clean Sound FX (Silenced to eliminate annoying beep/error sounds) ---

  private playTone(_freq: number, _type: OscillatorType, _duration: number, _gainVal: number = 0.08): void {
    // Keep UI completely silent and free of annoying sine/beeping error sounds
    return;
  }

  public playNotificationSound(): void {
    // Silent
  }

  public playWakeSound(): void {
    // Silent
  }

  public playListeningStartSound(): void {
    // Silent
  }

  public playListeningStopSound(): void {
    // Silent
  }

  public playExecuteSuccess(): void {
    // Silent
  }
}

export const jarvisAudio = new JarvisAudioSynthesizer();
export default jarvisAudio;
