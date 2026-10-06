/**
 * J.A.R.V.I.S. High-Performance Multimodal Live Arc Reactor Audio Engine
 * Bidirectional, real-time voice streaming with Gemini Live API over WebSocket.
 * Features:
 * - 16kHz PCM mono mic capture with real-time downsampling & noise suppression
 * - 24kHz gapless PCM playback with Web Audio API AudioContext & AnalyserNode
 * - Real-time audio waveform & RMS energy telemetry for Arc Reactor visual dynamics
 * - Instant vocal barge-in / acoustic echo cancellation & interruption handling
 * - Bold human male (Fenrir) & bold human female (Aoede) voice matrix
 */

import { ArcReactorState } from "../types";

export interface LiveAudioCallbacks {
  onStateChange?: (state: ArcReactorState) => void;
  onLiveTranscript?: (text: string, isUser: boolean) => void;
  onTurnComplete?: (userText: string, modelText: string) => void;
  onAudioLevel?: (level: number, isModelSpeaking: boolean) => void;
  onError?: (error: string) => void;
  onLiveReady?: (info: { model: string; voice: string }) => void;
  onInterrupted?: () => void;
  onMediaGenerated?: (media: { url: string; prompt?: string; type: "image" | "video" }) => void;
}

export class GeminiLiveAudioClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime: number = 0;

  private isConnected: boolean = false;
  private isListening: boolean = false;
  private isModelSpeaking: boolean = false;
  private isProcessing: boolean = false;

  private activeVoice: string = "jarvis-male";
  private activePersona: string = "NORMAL_JARVIS";
  private activeLanguage: string = "ta-IN";
  private callbacks: LiveAudioCallbacks = {};

  private userTranscriptBuffer: string = "";
  private modelTranscriptBuffer: string = "";
  private visualizerRaf: number | null = null;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private isIntentionallyStopped: boolean = true;
  private hasActiveSpeechInTurn: boolean = false;
  private turnSilenceTimer: any = null;
  private lastSpokenTimestamp: number = 0;
  private isMuted: boolean = false;
  private masterGainNode: GainNode | null = null;
  private isNoiseGateOpen: boolean = false;
  private speechOnsetCount: number = 0;
  private speechHoldUntil: number = 0;
  private preAudioBuffer: Int16Array[] = [];

  constructor(voiceId: string = "jarvis-male", personaId: string = "NORMAL_JARVIS", language: string = "ta-IN") {
    this.activeVoice = voiceId;
    this.activePersona = personaId;
    this.activeLanguage = language || "ta-IN";
  }

  public setCallbacks(callbacks: LiveAudioCallbacks) {
    this.callbacks = callbacks;
  }

  public setVoice(voiceId: string) {
    this.activeVoice = voiceId;
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send persona / voice update to active live session
      this.sendSetup();
    }
  }

  public setPersona(personaId: string) {
    this.activePersona = personaId;
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ updatePersona: personaId }));
    }
  }

  public setLanguage(language: string) {
    this.activeLanguage = language || "ta-IN";
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSetup();
    }
  }

  public setUserTranscript(text: string) {
    if (!text) return;
    // Discard unwanted Hindi/Devanagari text if user language is not Hindi
    if (this.activeLanguage !== "hi-IN" && /[\u0900-\u097F]/.test(text)) {
      return;
    }
    this.userTranscriptBuffer = text;
    this.callbacks.onLiveTranscript?.(this.userTranscriptBuffer, true);

    // Active speech detected by Web Speech STT - open gate immediately so voice stream is never lost
    this.lastSpokenTimestamp = Date.now();
    this.hasActiveSpeechInTurn = true;
    this.isNoiseGateOpen = true;
    this.speechHoldUntil = Date.now() + 850;
    if (this.turnSilenceTimer) {
      clearTimeout(this.turnSilenceTimer);
      this.turnSilenceTimer = null;
    }
  }

  public sendSpokenTextTurn(text: string) {
    if (!text || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.isProcessing = true;
      this.notifyState();
      this.ws.send(JSON.stringify({ text, turnComplete: true }));
    } catch (e) {
      console.warn("sendSpokenTextTurn notice:", e);
    }
  }

  public getVoice(): string {
    return this.activeVoice;
  }

  public getPersona(): string {
    return this.activePersona;
  }

  public getLanguage(): string {
    return this.activeLanguage;
  }

  public getIsActive(): boolean {
    return this.isConnected && (this.isListening || this.isModelSpeaking);
  }

  public getIsSessionOpen(): boolean {
    return !this.isIntentionallyStopped && (this.isConnected || Boolean(this.ws));
  }

  public getIsModelSpeaking(): boolean {
    return this.isModelSpeaking;
  }

  public getState(): ArcReactorState {
    if (this.isModelSpeaking) return "speaking";
    if (this.isListening) return "listening";
    if (this.isProcessing) return "processing";
    return "idle";
  }

  /**
   * Unlock AudioContexts upon user interaction / reactor tap
   */
  public async unlockAudio(): Promise<void> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!this.outputAudioCtx) {
      try {
        this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch (e) {
        console.debug("Output AudioContext init notice:", e);
      }
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state === "suspended") {
      try {
        await this.outputAudioCtx.resume();
      } catch (e) {
        console.debug("Output AudioContext resume notice:", e);
      }
    }
  }

  /**
   * Start or Connect the Live Arc Reactor Session
   */
  public async startLiveSession(memoryContext?: string, systemEnv?: any, language?: string): Promise<boolean> {
    this.isIntentionallyStopped = false;
    if (language) {
      this.activeLanguage = language;
    }
    await this.unlockAudio();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // 1. Establish microphone access
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
        });
      }

      // 2. Connect WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const voiceQuery = encodeURIComponent(this.activeVoice);
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${voiceQuery}&model=gemini-3.8-live`;

      if (this.ws) {
        try { this.ws.close(); } catch (e) {}
        this.ws = null;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sendSetup(memoryContext, systemEnv);
        this.startMicCapture();
        this.startVisualizer();
        this.isListening = true;
        this.notifyState();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.liveReady) {
            this.callbacks.onLiveReady?.({
              model: msg.model || "gemini-3.8-live",
              voice: msg.voice || (this.activeVoice.includes("friday") ? "Kore" : "Fenrir"),
            });
            this.isListening = true;
            this.isProcessing = false;
            this.notifyState();
          }

          if (msg.audio) {
            this.handleModelAudioChunk(msg.audio);
          }

          if (msg.modelTranscript) {
            this.modelTranscriptBuffer += msg.modelTranscript;
            this.callbacks.onLiveTranscript?.(this.modelTranscriptBuffer, false);
          }

          if (msg.userTranscript) {
            // Guard against ungrounded Devanagari Hindi text when speaking in Tamil or English
            const hasDevanagari = /[\u0900-\u097F]/.test(msg.userTranscript);
            if (!hasDevanagari || this.activeLanguage === "hi-IN") {
              this.userTranscriptBuffer = msg.userTranscript;
              this.callbacks.onLiveTranscript?.(this.userTranscriptBuffer, true);
            }
          }

          if (msg.interrupted) {
            this.stopAllAudioPlayback();
            this.isListening = true;
            this.isModelSpeaking = false;
            this.notifyState();
            this.callbacks.onInterrupted?.();
          }

          if (msg.image) {
            this.callbacks.onMediaGenerated?.({
              url: msg.image,
              prompt: msg.mediaPrompt || "Generated Visual",
              type: msg.mediaType || "image"
            });
          }

          if (msg.turnComplete) {
            const finalUser = this.userTranscriptBuffer.trim();
            const finalModel = this.modelTranscriptBuffer.trim();
            this.callbacks.onTurnComplete?.(finalUser, finalModel);
            this.userTranscriptBuffer = "";
            this.modelTranscriptBuffer = "";
          }

          if (msg.error) {
            this.callbacks.onError?.(msg.error);
          }
        } catch (e: any) {
          console.debug("Live WS message parse exception:", e);
        }
      };

      this.ws.onerror = (err) => {
        if (!this.isIntentionallyStopped) {
          console.debug("[Live Arc Reactor WS Notice]", err);
          this.callbacks.onError?.("Live Arc audio stream standby.");
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isListening = false;
        this.isModelSpeaking = false;
        this.notifyState();

        if (!this.isIntentionallyStopped && this.reconnectAttempts < 1) {
          this.reconnectAttempts++;
          this.reconnectTimer = setTimeout(() => {
            if (!this.isIntentionallyStopped) {
              this.startLiveSession(memoryContext, systemEnv, this.activeLanguage);
            }
          }, 3000);
        } else {
          this.stopLiveSession();
        }
      };

      return true;
    } catch (err: any) {
      console.error("[Live Arc Reactor Session Error]", err);
      this.callbacks.onError?.(err?.message || "Failed to initialize microphone.");
      this.stopLiveSession();
      return false;
    }
  }

  private sendSetup(memory?: string, env?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const isFriday = this.activeVoice.includes("friday") || this.activeVoice === "Aoede" || this.activeVoice === "Kore";
    const voiceName = isFriday ? "Kore" : "Fenrir";

    this.ws.send(
      JSON.stringify({
        setup: {
          voice: voiceName,
          persona: this.activePersona,
          memory: memory || "",
          systemEnvironment: env,
          language: this.activeLanguage || "ta-IN",
          model: "gemini-3.8-live",
        },
      })
    );
  }

  /**
   * Capture 16kHz PCM audio from microphone with active noise cancellation & VAD spectral gate
   */
  private startMicCapture() {
    if (!this.mediaStream) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioContextClass();

      const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);

      // 1. High-Pass Filter: Cuts sub-vocal rumble, wind, desk thumps, and breathing air puffs (< 130 Hz)
      const highPass = this.inputAudioCtx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.setValueAtTime(130, this.inputAudioCtx.currentTime);
      highPass.Q.setValueAtTime(0.7, this.inputAudioCtx.currentTime);

      // 2. Low-Pass Filter: Cuts ambient hiss, computer fan whirr, and digital static (> 3800 Hz)
      const lowPass = this.inputAudioCtx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.setValueAtTime(3800, this.inputAudioCtx.currentTime);
      lowPass.Q.setValueAtTime(0.7, this.inputAudioCtx.currentTime);

      // 3. Speech Presence Peaking Filter (2.2 kHz): Enhances clarity of user voice without raising noise floor
      const presenceFilter = this.inputAudioCtx.createBiquadFilter();
      presenceFilter.type = "peaking";
      presenceFilter.frequency.setValueAtTime(2200, this.inputAudioCtx.currentTime);
      presenceFilter.Q.setValueAtTime(1.2, this.inputAudioCtx.currentTime);
      presenceFilter.gain.setValueAtTime(2.5, this.inputAudioCtx.currentTime);

      // 4. Balanced Speech Dynamics Compressor (Threshold -24dB, Ratio 3:1) - clean speech, no noise floor magnification
      const compressor = this.inputAudioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, this.inputAudioCtx.currentTime);
      compressor.knee.setValueAtTime(20, this.inputAudioCtx.currentTime);
      compressor.ratio.setValueAtTime(3.0, this.inputAudioCtx.currentTime);
      compressor.attack.setValueAtTime(0.005, this.inputAudioCtx.currentTime);
      compressor.release.setValueAtTime(0.15, this.inputAudioCtx.currentTime);

      // Connect filter chain: source -> highPass -> lowPass -> presenceFilter -> compressor
      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(presenceFilter);
      presenceFilter.connect(compressor);

      const bufferSize = 4096;
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);
      compressor.connect(this.scriptProcessor);

      // Route through zero-gain node so user mic NEVER echoes back through own speakers
      const silenceGain = this.inputAudioCtx.createGain();
      silenceGain.gain.setValueAtTime(0, this.inputAudioCtx.currentTime);
      this.scriptProcessor.connect(silenceGain);
      silenceGain.connect(this.inputAudioCtx.destination);

      this.isNoiseGateOpen = false;
      this.speechOnsetCount = 0;
      this.speechHoldUntil = 0;
      this.preAudioBuffer = [];

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        const inputSampleRate = e.inputBuffer.sampleRate;

        // VAD RMS & Zero Crossing calculation for voice vs breathing / ambient noise
        let sumSquares = 0;
        let zeroCrossings = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          const s = inputChannelData[i];
          sumSquares += s * s;
          if (i > 0 && ((s >= 0 && inputChannelData[i - 1] < 0) || (s < 0 && inputChannelData[i - 1] >= 0))) {
            zeroCrossings++;
          }
        }
        const rms = Math.sqrt(sumSquares / inputChannelData.length);
        const now = Date.now();

        // BALANCED SPEECH THRESHOLDS:
        // Ambient room noise / quiet breathing: RMS < 0.0020
        // Natural user speech (soft or normal): RMS >= 0.0035
        const SPEECH_ONSET_RMS = 0.0035;
        const SPEECH_HOLD_RMS = 0.0020;

        const isAboveSpeechOnset = rms >= SPEECH_ONSET_RMS;
        const isAboveSpeechHold = rms >= SPEECH_HOLD_RMS;

        if (isAboveSpeechOnset) {
          this.speechOnsetCount++;
        } else {
          this.speechOnsetCount = Math.max(0, this.speechOnsetCount - 1);
        }

        // Open noise gate reliably on user voice (1 frame onset check)
        if (this.speechOnsetCount >= 1) {
          this.isNoiseGateOpen = true;
          this.speechHoldUntil = now + 750; // 750ms hangover hold time so trailing words and natural pauses are never cut
          this.lastSpokenTimestamp = now;
          this.hasActiveSpeechInTurn = true;
          if (this.turnSilenceTimer) {
            clearTimeout(this.turnSilenceTimer);
            this.turnSilenceTimer = null;
          }
        } else if (this.isNoiseGateOpen && isAboveSpeechHold) {
          this.speechHoldUntil = now + 750;
          this.lastSpokenTimestamp = now;
        } else if (this.isNoiseGateOpen && now > this.speechHoldUntil) {
          this.isNoiseGateOpen = false;
        }

        // Downsample to 16kHz 16-bit PCM little-endian
        const pcm16 = this.downsampleTo16kPcm(inputChannelData, inputSampleRate);

        if (this.isNoiseGateOpen) {
          // Flush pre-buffer chunks so initial consonant onset is pristine
          if (this.preAudioBuffer.length > 0) {
            for (const preChunk of this.preAudioBuffer) {
              const b64 = this.int16ArrayToBase64(preChunk);
              this.ws.send(JSON.stringify({ audio: b64 }));
            }
            this.preAudioBuffer = [];
          }

          const base64Audio = this.int16ArrayToBase64(pcm16);
          this.ws.send(JSON.stringify({ audio: base64Audio }));
        } else {
          // Gate is CLOSED (breathing, room silence, background murmurs):
          // Maintain a rolling 1-chunk pre-buffer (approx 90ms)
          this.preAudioBuffer = [pcm16];

          // CRITICAL: DO NOT SEND AUDIO OVER WEBSOCKET WHILE GATE IS CLOSED!
          // This completely prevents ambient noise, breathing, or sighs from reaching Gemini Live!

          // Detect when user turn ends after speech has ceased for 1.2 seconds (Prompt & snappy response)
          if (this.hasActiveSpeechInTurn && !this.isModelSpeaking) {
            if (!this.turnSilenceTimer) {
              this.turnSilenceTimer = setTimeout(() => {
                if (this.hasActiveSpeechInTurn && this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN && !this.isModelSpeaking) {
                  this.hasActiveSpeechInTurn = false;
                  this.isProcessing = true;
                  this.notifyState();
                  try {
                    this.ws.send(JSON.stringify({ turnComplete: true }));
                  } catch (err) {}
                }
              }, 1200);
            }
          }
        }
      };
    } catch (e) {
      console.warn("Error starting mic processor:", e);
    }
  }

  /**
   * Resample Float32 audio buffer to 16kHz 16-bit PCM mono
   */
  private downsampleTo16kPcm(buffer: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === 16000) {
      const pcm = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return pcm;
    }

    const sampleRatio = inputSampleRate / 16000;
    const newLength = Math.round(buffer.length / sampleRatio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      const s = count > 0 ? accum / count : 0;
      const clamped = Math.max(-1, Math.min(1, s));
      result[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private int16ArrayToBase64(int16Array: Int16Array): string {
    const uint8 = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
    let binary = "";
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  /**
   * Handle incoming 24kHz PCM audio chunk from Gemini Live
   */
  private handleModelAudioChunk(base64Pcm: string) {
    if (!this.outputAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
    }

    if (this.outputAudioCtx.state === "suspended") {
      this.outputAudioCtx.resume().catch(() => {});
    }

    if (!this.analyser) {
      this.analyser = this.outputAudioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.outputAudioCtx.destination);
    }

    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      if (float32.length === 0) return;

      const audioBuf = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuf.copyToChannel(float32, 0);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuf;
      sourceNode.connect(this.analyser);

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      sourceNode.start(startTime);
      this.nextStartTime = startTime + audioBuf.duration;

      this.activeSources.push(sourceNode);

      if (this.turnSilenceTimer) {
        clearTimeout(this.turnSilenceTimer);
        this.turnSilenceTimer = null;
      }
      this.hasActiveSpeechInTurn = false;
      this.isProcessing = false;

      if (!this.isModelSpeaking) {
        this.isModelSpeaking = true;
        this.userTranscriptBuffer = "";
        this.notifyState();
      }

      sourceNode.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== sourceNode);
        if (this.activeSources.length === 0) {
          setTimeout(() => {
            if (
              this.activeSources.length === 0 &&
              this.outputAudioCtx &&
              this.outputAudioCtx.currentTime >= this.nextStartTime - 0.1
            ) {
              this.isModelSpeaking = false;
              this.isListening = true;
              this.notifyState();
            }
          }, 120);
        }
      };
    } catch (err) {
      console.warn("Error playing live audio chunk:", err);
    }
  }

  /**
   * Stop all active audio playback nodes immediately
   */
  public stopAllAudioPlayback() {
    if (this.turnSilenceTimer) {
      clearTimeout(this.turnSilenceTimer);
      this.turnSilenceTimer = null;
    }
    this.hasActiveSpeechInTurn = false;
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
    this.isModelSpeaking = false;
    this.notifyState();
  }

  /**
   * Interrupt the Live Session (Barge-In)
   */
  public interrupt() {
    this.stopAllAudioPlayback();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ interrupt: true }));
    }
    this.isListening = true;
    this.notifyState();
  }

  /**
   * Real-time Audio Level & Energy Visualizer loop for Arc Reactor
   */
  private startVisualizer() {
    if (this.visualizerRaf) return;

    const dataArray = new Uint8Array(64);

    const update = () => {
      let energy = 0;

      if (this.isModelSpeaking && this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        energy = Math.min(100, Math.round((sum / dataArray.length) * 1.4));
      } else if (this.isListening) {
        energy = 15 + Math.round(Math.random() * 10);
      }

      this.callbacks.onAudioLevel?.(energy, this.isModelSpeaking);
      this.visualizerRaf = requestAnimationFrame(update);
    };

    this.visualizerRaf = requestAnimationFrame(update);
  }

  private stopVisualizer() {
    if (this.visualizerRaf) {
      cancelAnimationFrame(this.visualizerRaf);
      this.visualizerRaf = null;
    }
  }

  private notifyState() {
    const state = this.getState();
    this.callbacks.onStateChange?.(state);
  }

  /**
   * Cleanly stop the live session
   */
  public stopLiveSession() {
    this.isIntentionallyStopped = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopAllAudioPlayback();
    this.stopVisualizer();

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch (e) {}
      this.scriptProcessor = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {}
      this.inputAudioCtx = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      this.mediaStream = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.isConnected = false;
    this.isListening = false;
    this.isModelSpeaking = false;
    this.isProcessing = false;
    this.userTranscriptBuffer = "";
    this.modelTranscriptBuffer = "";
    this.notifyState();
  }
}

export const geminiLiveAudio = new GeminiLiveAudioClient();
