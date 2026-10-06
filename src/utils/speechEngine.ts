export interface VoiceConfig {
  voiceURI?: string;
  lang: string;
  pitch: number;
  rate: number;
}

class SpeechEngineService {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private voicesLoadedPromise: Promise<SpeechSynthesisVoice[]>;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.voicesLoadedPromise = new Promise((resolve) => {
        const voices = this.synth!.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          const handler = () => {
            const loaded = this.synth!.getVoices();
            resolve(loaded);
            this.synth!.removeEventListener("voiceschanged", handler);
          };
          this.synth!.addEventListener("voiceschanged", handler);
          // Fallback timeout if voiceschanged doesn't trigger
          setTimeout(() => resolve(this.synth!.getVoices()), 1500);
        }
      });
    } else {
      this.voicesLoadedPromise = Promise.resolve([]);
    }
  }

  public async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return this.voicesLoadedPromise;
  }

  public stop(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // Chunks text into sentence boundaries to eliminate the 15-second speech cutoff
  private chunkText(raw: string): string[] {
    const clean = raw
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`.*?`/g, "")
      .replace(/[*#_~>]/g, "")
      .trim();

    if (!clean) return [];
    
    // Split on punctuation while retaining structure
    const segments = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const finalChunks: string[] = [];

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      if (trimmed.length > 160) {
        const words = trimmed.split(" ");
        let sub = "";
        for (const w of words) {
          if ((sub + " " + w).length > 160) {
            finalChunks.push(sub.trim());
            sub = w;
          } else {
            sub += " " + w;
          }
        }
        if (sub.trim()) finalChunks.push(sub.trim());
      } else {
        finalChunks.push(trimmed);
      }
    }
    return finalChunks;
  }

  public async speak(
    text: string,
    config: VoiceConfig,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    this.stop(); // Clear any existing queue (BUG 1C)

    if (!this.synth) {
      onEnd?.();
      return;
    }

    const chunks = this.chunkText(text);
    if (chunks.length === 0) {
      onEnd?.();
      return;
    }

    const voices = await this.voicesLoadedPromise;
    let selectedVoice = voices.find((v) => v.voiceURI === config.voiceURI);
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => v.lang.startsWith(config.lang.slice(0, 2))) || voices[0];
    }

    this.isSpeaking = true;
    let index = 0;

    const speakNext = () => {
      if (!this.isSpeaking || index >= chunks.length) {
        this.stop();
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      this.currentUtterance = utterance;

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.pitch = Math.max(0, Math.min(2, config.pitch));
      utterance.rate = Math.max(0.5, Math.min(2, config.rate));
      utterance.lang = config.lang;

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = (e) => {
        // ERROR 4A: Handle user-gesture cancellation / rejection cleanly
        this.stop();
        if (e.error !== "interrupted" && e.error !== "canceled") {
          onError?.(e);
        }
        onEnd?.();
      };

      // Chromium keepalive hack for long single fragments
      if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = setInterval(() => {
        if (!this.synth?.speaking) {
          clearInterval(this.keepAliveTimer!);
        } else {
          this.synth.pause();
          this.synth.resume();
        }
      }, 9000);

      try {
        this.synth.speak(utterance);
      } catch (err) {
        this.stop();
        onError?.(err);
      }
    };

    speakNext();
  }
}

export const speechEngine = new SpeechEngineService();
