import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  for (const m of models) {
    const t0 = Date.now();
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents: "Hi Jarvis, tell me 1 short sentence."
      });
      console.log(`Model ${m} took: ${Date.now() - t0}ms, text:`, resp.text?.slice(0, 50));
    } catch (e: any) {
      console.log(`Model ${m} FAILED in ${Date.now() - t0}ms:`, e.message);
    }
  }
}
test();
