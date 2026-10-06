import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const conn = await ai.live.connect({
    model: "gemini-3.8-live",
    callbacks: { onmessage: () => {} }
  });
  console.log("Keys of conn:", Object.keys(conn));
  console.log("Proto keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(conn)));
  conn.close();
}
test().catch(console.error);
