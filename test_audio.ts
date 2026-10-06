import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const interaction = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: 'Vanakkam nanba, eppadi irukkinga? Speak this.',
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
      }
    }
  });
  console.log(JSON.stringify(interaction.candidates[0].content.parts, null, 2));
}
test().catch(console.error);
