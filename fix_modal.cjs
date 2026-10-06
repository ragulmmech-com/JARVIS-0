const fs = require('fs');
let code = fs.readFileSync('src/components/ModelChatModal.tsx', 'utf8');

const replacement = `  const engineMeta: Record<AIModelId, { name: string; tag: string; badgeColor: string; accentBorder: string; desc: string }> = {
    "jarvis-core-mk1": {
      name: "Cognitive Core Alpha",
      tag: "ULTRA FAST INTELLIGENCE",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      accentBorder: "border-cyan-500/40",
      desc: "Ultra-low latency reasoning, emotional intelligence, and real-time live tools."
    },
    "jarvis-core-mk2": {
      name: "Cognitive Core Delta",
      tag: "DEEP REASONING MATRIX",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      accentBorder: "border-blue-500/40",
      desc: "Complex algorithmic architecture, code generation, and deep context."
    },
    "jarvis-core-mk3": {
      name: "Analytical Neural Engine",
      tag: "CONVERSATIONAL CORE",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      accentBorder: "border-emerald-500/40",
      desc: "Natural conversational flow, step-by-step logic, and creative problem solving."
    },
    "jarvis-core-mk4": {
      name: "Strategic Logic Matrix",
      tag: "DEEP REASONING",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      accentBorder: "border-purple-500/40",
      desc: "Nuanced synthesis, long-form technical writing, and structural logic."
    },
    "jarvis-core-mk5": {
      name: "Deep Thought Protocol",
      tag: "CHAIN OF THOUGHT",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      accentBorder: "border-amber-500/40",
      desc: "Deep deliberative step-by-step reasoning for competitive problem solving."
    }
  };

  const fallbackEngine = {
    name: "Cognitive Core",
    tag: "HIGH SPEED MULTIMODAL",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    accentBorder: "border-cyan-500/40",
    desc: "Ultra-low latency reasoning, mathematical computation, and live tools."
  };`;

const targetStart = `  const engineMeta: Record<AIModelId, { name: string; tag: string; badgeColor: string; accentBorder: string; desc: string }> = {`;
const targetEnd = `  const currentEngine = (engineMeta && (engineMeta[selectedEngine] || engineMeta["jarvis-core-mk1"])) || fallbackEngine;`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + "\n\n" + code.substring(endIndex);
  fs.writeFileSync('src/components/ModelChatModal.tsx', code);
  console.log("Fixed successfully");
} else {
  console.log("Not found");
}
