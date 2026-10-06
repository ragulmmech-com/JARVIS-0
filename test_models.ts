import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.8-live"
  ];
  for (const m of models) {
    const t0 = Date.now();
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents: "Hello"
      });
      console.log(`Model ${m} SUCCESS in ${Date.now() - t0}ms:`, resp.text?.slice(0, 30));
    } catch (e: any) {
      console.log(`Model ${m} FAILED in ${Date.now() - t0}ms:`, e.message);
    }
  }
}
test();
