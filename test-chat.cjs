const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}
run().catch(console.error);
