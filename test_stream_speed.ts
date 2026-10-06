import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const t0 = Date.now();
  let firstTokenTime = 0;
  const stream = await ai.models.generateContentStream({
    model: "gemini-flash-latest",
    contents: "Hello, 1 quick word."
  });
  for await (const chunk of stream) {
    if (!firstTokenTime) {
      firstTokenTime = Date.now() - t0;
    }
  }
  console.log(`gemini-flash-latest time-to-first-token: ${firstTokenTime}ms, total: ${Date.now() - t0}ms`);
}
test();
