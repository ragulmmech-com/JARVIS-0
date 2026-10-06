import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const interaction = await ai.interactions.create({
    model: 'gemini-3.1-flash-tts-preview',
    input: 'Vanakkam nanba, eppadi irukkinga?',
    response_modalities: ['audio'],
    generation_config: {
      speech_config: {
        voice_name: "Puck"
      }
    }
  } as any);

  for (const step of interaction.steps) {
    if (step.type === 'model_output') {
      const audioContent = step.content?.find(c => c.type === 'audio');
      if (audioContent && audioContent.data) {
        console.log("Audio found! length:", audioContent.data.length);
        const audioBuffer = Buffer.from(audioContent.data, 'base64');
        fs.writeFileSync("test.wav", audioBuffer);
      }
    }
  }
}
test().catch(console.error);
