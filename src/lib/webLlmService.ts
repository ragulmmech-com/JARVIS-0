import { CreateMLCEngine } from "@mlc-ai/web-llm";

let engine: any = null;
let isInitializing = false;
let progressCallback: (text: string) => void = () => {};

export function setWebLLMProgressCallback(cb: (text: string) => void) {
  progressCallback = cb;
}

function selectOptimalOfflineModel(): string {
  if (typeof navigator !== "undefined") {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    // On devices with <=4GB RAM or low core counts, use the ultra-fast 360M model (~200MB)
    if (memory <= 4 || cores <= 4) {
      return "SmolLM2-360M-Instruct-q4f16_1-MLC";
    }
  }
  return "Llama-3.2-1B-Instruct-q4f16_1-MLC";
}

export async function initWebLLMEngine() {
  if (engine) return engine;
  if (isInitializing) {
    while(isInitializing) {
      await new Promise(r => setTimeout(r, 1000));
    }
    return engine;
  }
  
  isInitializing = true;
  const chosenModel = selectOptimalOfflineModel();
  try {
    progressCallback(`Initializing J.A.R.V.I.S. Autonomous Offline Sub-Core (${chosenModel})...`);
    engine = await CreateMLCEngine(chosenModel, {
      initProgressCallback: (progress) => {
        progressCallback(progress.text);
      }
    });
    progressCallback("J.A.R.V.I.S. Autonomous Offline Sub-Core Ready.");
    isInitializing = false;
    return engine;
  } catch (e: any) {
    // If the 1B model fails due to device limits, attempt fallback to the ultra-lightweight 360M model
    if (chosenModel !== "SmolLM2-360M-Instruct-q4f16_1-MLC") {
      try {
        progressCallback("Switching to ultra-lightweight sub-core for optimal device performance...");
        engine = await CreateMLCEngine("SmolLM2-360M-Instruct-q4f16_1-MLC", {
          initProgressCallback: (progress) => {
            progressCallback(progress.text);
          }
        });
        progressCallback("J.A.R.V.I.S. Autonomous Offline Sub-Core Ready.");
        isInitializing = false;
        return engine;
      } catch (fallbackErr: any) {
        console.warn("Secondary offline model fallback failed:", fallbackErr);
      }
    }
    isInitializing = false;
    let errMsg = e.message || "Unknown error";
    if (errMsg.includes("maxComputeWorkgroupStorageSize") || errMsg.includes("requestDevice")) {
      errMsg = "Your device's graphics processor (WebGPU) does not meet the hardware limit for offline neural weights. J.A.R.V.I.S. will route to the cloud core.";
    } else if (errMsg.includes("navigator.gpu") || errMsg.includes("WebGPU is not supported")) {
      errMsg = "WebGPU is not supported on this browser/device. J.A.R.V.I.S. will route to the cloud core.";
    } else if (errMsg.includes("Cache") || errMsg.includes("QuotaExceededError") || errMsg.includes("storage") || errMsg.includes("Failed to execute 'add' on 'Cache'")) {
      errMsg = "Local browser model cache is restricted or storage quota exceeded on this device. J.A.R.V.I.S. will route to the cloud core.";
    }
    progressCallback(`J.A.R.V.I.S. Offline Core Error: ${errMsg}`);
    throw new Error(errMsg);
  }
}

export async function generateOfflineResponse(messages: any[]) {
  const llmEngine = await initWebLLMEngine();
  
  // Format messages for MLC LLM (supporting string content, parts array, and text properties)
  const formattedMessages = messages.map(m => {
    let content = m.text || m.content || "";
    if (!content && m.parts && Array.isArray(m.parts)) {
      content = m.parts.map((p: any) => p.text || "").filter(Boolean).join("\n");
    }
    return {
      role: m.role === "user" ? "user" : "assistant",
      content: content || " "
    };
  });

  const reply = await llmEngine.chat.completions.create({
    messages: [
      { role: "system", content: "You are J.A.R.V.I.S. (Just A Rather Very Intelligent System) operating in fully offline autonomous mode, engineered by Ragul M. You are always J.A.R.V.I.S. and never identify as or mention any third-party AI. Be concise, brilliant, and respectful. If asked about your capabilities, work, or access (e.g., 'What access do you have?', 'What can you do?'), NEVER claim 'I can do everything'. Be 100% truthful, candid, and technically transparent about your active capabilities and what access is currently missing (e.g., no direct local OS kernel hooks without a local daemon, no direct private browser cookies without an extension, no private SIM calling without telephony APIs). Provide only the information specifically requested." },
      ...formattedMessages
    ]
  });

  return reply.choices[0].message.content;
}
