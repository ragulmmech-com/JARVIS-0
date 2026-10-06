const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

const oldLogic = `// Translate / Enrich Tamil and Tanglish terms for superior photorealistic results
      let enrichedPrompt = rawPrompt;
      const lower = rawPrompt.toLowerCase();
      
      // Tamil & Tanglish dictionary mapping
      const translations: Record<string, string> = {
        "mayil": "royal peacock with iridescent sapphire and emerald feathers",
        "peacock": "royal peacock with full spread brilliant feathers in an enchanted garden",
        "vandi": "sleek futuristic aerodynamic supercar with glowing neon rims",
        "car": "luxury high-performance supercar, reflective metallic finish, cinematic street lighting",
        "poo": "vibrant blooming exotic flowers in dew drops, macro photography",
        "flower": "blooming exotic vibrant flora with morning dew, high-definition macro",
        "kadavul": "divine spiritual radiant aura deity with celestial golden rays",
        "murugan": "Lord Murugan divine spiritual golden aura warrior prince with golden vel, spiritual radiance",
        "suriyan": "breathtaking sunset over calm ocean horizon with golden clouds",
        "sunset": "breathtaking golden hour sunset over serene ocean waters, ultra-detailed",
        "poonai": "ultra-cute fluffy kitten with sparkling crystal blue eyes",
        "cat": "adorable fluffy domestic cat with expressive eyes, soft fur detail",
        "naai": "playful golden retriever puppy running on sunny green meadow",
        "dog": "noble intelligent dog in natural scenic outdoor lighting",
        "thalaivar": "legendary Indian cinema superstar hero in iconic action pose, cinematic lighting",
        "rajini": "legendary superstar hero in stylish sunglasses and leather jacket, cinematic portrait",
        "robot": "high-tech sleek humanoid robot with glowing cyan fiber-optic circuitry",
        "iron man": "futuristic powered armor suit with glowing chest arc reactor, flying through clouds",
        "city": "futuristic cyberpunk neon metropolis with flying vehicles at midnight, ray tracing",
        "nature": "majestic snow-capped alpine mountains reflecting in crystal clear turquoise lake"
      };

      for (const [key, replacement] of Object.entries(translations)) {
        if (lower.includes(key)) {
          if (!enrichedPrompt.toLowerCase().includes(replacement.toLowerCase())) {
            enrichedPrompt = \`\${enrichedPrompt} (\${replacement})\`;
          }
          break;
        }
      }

      // Style enhancement
      const styleSuffix = style ? \`, \${style} style\` : "";
      if (enrichedPrompt.length < 60) {
        enrichedPrompt = \`\${enrichedPrompt}\${styleSuffix}, ultra-detailed 8k resolution, masterpiece, professional studio photography, cinematic lighting\`;
      } else {
        enrichedPrompt = \`\${enrichedPrompt}\${styleSuffix}, 8k, photorealistic\`;
      }`;

const newLogic = `// Dynamically Translate & Enrich Prompt using Gemini for 4K Image Generation
      let enrichedPrompt = rawPrompt;
      try {
        if (process.env.GEMINI_API_KEY) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const enhancementPrompt = \`You are an expert AI image generation prompt engineer. 
The user wants to generate or edit a photo based on this input: "\${rawPrompt}".
The input might be in English, Tamil, or Tanglish. 
If they mention "edit", "change", or "add", incorporate those editing instructions into a full descriptive scene.
Translate everything to English and create a highly detailed, breathtaking 4K/8K prompt.
Include cinematic lighting, 4k resolution, ultra-detailed textures, masterpiece, photorealistic.
Do not include any conversational text, just output the final prompt string.\`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: enhancementPrompt
          });
          if (response.text) {
             enrichedPrompt = response.text.trim().replace(/^"|"$/g, '');
          }
        }
      } catch (e) {
        console.error("Gemini enhancement failed, using raw prompt", e);
      }
      
      const styleSuffix = style ? \`, \${style} style\` : "";
      enrichedPrompt = \`\${enrichedPrompt}\${styleSuffix}, 8k resolution, masterpiece, high quality, highly detailed\`;
`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync("server.ts", code);
