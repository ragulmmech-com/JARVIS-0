declare module 'node-edge-tts' {
  export interface EdgeTTSConfig {
    voice?: string;
    lang?: string;
    outputFormat?: string;
    rate?: string;
    pitch?: string;
    volume?: string;
    proxy?: string;
  }

  export class EdgeTTS {
    constructor(config?: EdgeTTSConfig);
    ttsPromise(text: string, filepath: string): Promise<void>;
  }
}
