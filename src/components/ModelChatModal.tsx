import React, { useState, useRef, useEffect } from "react";
import { 
  Cpu, Zap, Send, Trash2, Maximize2, Minimize2, 
  Copy, Check, RefreshCw, Layers, Paperclip, Sparkles
} from "lucide-react";
import { generateOfflineResponse, setWebLLMProgressCallback } from "../lib/webLlmService";
import { Message, AIModelId, MediaAttachment } from "../types";
import { getGlobalMemoryString } from "../lib/memory";
import { generateChatTranscript } from "../lib/transcript";
import { SmartChatContent } from "./SmartChatContent";
import { AttachmentButton, AttachmentTray, MessageAttachmentsGrid } from "./AttachmentComponents";
import { microcontrollerDebugger } from "../lib/microcontrollerDebugger";

interface ModelChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModel?: AIModelId;
}

export const ModelChatModal: React.FC<ModelChatModalProps> = ({
  isOpen,
  onClose,
  defaultModel = "jarvis-core-mk1",
}) => {
  const [selectedEngine, setSelectedEngine] = useState<AIModelId>(defaultModel);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isChatCopied, setIsChatCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [modelMessages, setModelMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`engine_chat_history_${defaultModel}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && defaultModel) {
      setSelectedEngine(defaultModel);
    }
  }, [isOpen, defaultModel]);

  useEffect(() => {
    try {
      localStorage.setItem(`engine_chat_history_${selectedEngine}`, JSON.stringify(modelMessages));
    } catch (e) {
      console.warn("Could not persist engine chat history", e);
    }
  }, [modelMessages, selectedEngine]);

  useEffect(() => {
    // When switching engines, reload that engine's dedicated memory
    try {
      const saved = localStorage.getItem(`engine_chat_history_${selectedEngine}`);
      setModelMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setModelMessages([]);
    }
  }, [selectedEngine]);

  useEffect(() => {
    setWebLLMProgressCallback((text) => setOfflineProgress(text));
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [modelMessages, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachments(prev => [
        ...prev,
        {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: reader.result as string,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        }
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if ((!query && attachments.length === 0) || isProcessing) return;

    const currentAttachments = attachments;
    const firstAtt = currentAttachments[0];
    const userTimestamp = Date.now();
    const userMsg: Message = {
      id: `engine-usr-${userTimestamp}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      text: query,
      image: firstAtt?.url || undefined,
      mediaType: firstAtt ? (firstAtt.type.startsWith("image/") ? "image" : firstAtt.type.startsWith("video/") ? "video" : "document") : undefined,
      mediaName: firstAtt?.name,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: userTimestamp,
      modelBadge: selectedEngine,
    };

    setModelMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsProcessing(true);

    try {
      const historyPayload = modelMessages.slice(-10).map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        else parts.push({ text: " " });
        return { role: m.role, parts };
      });

      
      let data: any;
      if (selectedEngine === "offline-llama") {
        const textResponse = await generateOfflineResponse([...historyPayload, { role: "user", parts: [{ text: query }] }]);
        data = { type: "text", text: textResponse };
      } else {
        const codeDiagnosis = microcontrollerDebugger.analyzeCode(query);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            image: firstAtt?.url,
            mediaType: firstAtt?.type,
            mediaName: firstAtt?.name,
            attachments: currentAttachments,
            history: historyPayload,
            model: selectedEngine,
            globalMemory: getGlobalMemoryString(modelMessages, query),
            codeDiagnosis: codeDiagnosis.isCodeDetected ? codeDiagnosis : undefined,
          }),
        });

        if (!res.ok) {
          if (res.status === 413) throw new Error("File too large (exceeds limit).");
          let errorMsg = `HTTP Error ${res.status}`;
          try {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await res.json();
              errorMsg = errorData.error || errorMsg;
            } else {
              errorMsg = `Server returned ${res.status} (Not JSON). The server might be restarting or unreachable.`;
            }
          } catch {
            // ignore
          }
          throw new Error(errorMsg);
        }
        
        data = await res.json();
      }

      let imageUrl = data.image || data.toolCall?.result?.url || undefined;
      let mediaType = data.mediaType || (imageUrl ? "image" : undefined);
      let mediaName = data.mediaName || undefined;

      const reply = data.text || "No response received from engine matrix.";

      const aiMsg: Message = {
        id: `engine-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "model",
        text: reply,
        image: imageUrl,
        mediaType: mediaType as any,
        mediaName: mediaName,
        timestamp: Date.now(),
        modelBadge: selectedEngine,
      };
      setModelMessages(prev => [...prev, aiMsg]);

      // Sync into the Memory Folder so Live Reactor and All Chats can access it immediately
      try {
        const storedSessions = localStorage.getItem("jarvis_all_chat_sessions_v1");
        let sessionsList = storedSessions ? JSON.parse(storedSessions) : [];
        if (!Array.isArray(sessionsList)) sessionsList = [];

        const widgetSessionId = `widget-session-${selectedEngine}`;
        const engineTitle = selectedEngine === "jarvis-core-mk1" ? "Core Alpha" :
                            selectedEngine === "jarvis-core-mk2" ? "Code Matrix" :
                            selectedEngine === "jarvis-core-mk3" ? "Reasoning Prime" :
                            selectedEngine === "jarvis-core-mk4" ? "Vision Sentinel" :
                            String(selectedEngine).toUpperCase();
        const existingIdx = sessionsList.findIndex((s: any) => s.id === widgetSessionId);

        if (existingIdx >= 0) {
          sessionsList[existingIdx].updatedAt = Date.now();
          sessionsList[existingIdx].messages.push(userMsg, aiMsg);
        } else {
          sessionsList.unshift({
            id: widgetSessionId,
            title: `Tactical AI: ${engineTitle}`,
            updatedAt: Date.now(),
            modelUsed: selectedEngine,
            messages: [userMsg, aiMsg],
          });
        }
        // Trim and sanitize to prevent quota overflow
        const sanitized = sessionsList.slice(0, 8).map((s: any) => ({
          ...s,
          messages: (s.messages || []).slice(-12).map((m: any) =>
            m.image && m.image.length > 50000 ? { ...m, image: undefined, text: (m.text || "") + "\n[Media secured]" } : m
          )
        }));
        localStorage.setItem("jarvis_all_chat_sessions_v1", JSON.stringify(sanitized));
      } catch (syncErr) {
        console.warn("Failed to sync widget chat to memory folder:", syncErr);
      }
    } catch (err: any) {
      setModelMessages(prev => [
        ...prev,
        {
          id: `engine-err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "model",
          text: `Neural Gateway Error: ${err.message || "Failed to contact engine"}`,
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setModelMessages(prev => prev.filter(m => m.id !== id));
  };
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyFullChat = () => {
    if (modelMessages.length === 0) return;
    const transcript = generateChatTranscript(modelMessages, `J.A.R.V.I.S. Engine: ${selectedEngine}`);
    navigator.clipboard.writeText(transcript);
    setIsChatCopied(true);
    setTimeout(() => setIsChatCopied(false), 2000);
  };

  const handleClear = () => {
    setModelMessages([]);
    localStorage.removeItem(`engine_chat_history_${selectedEngine}`);
  };

  const engineMeta: Record<string, { name: string; tag: string; badgeColor: string; accentBorder: string; desc: string }> = {
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
    },
    "gemini-free": {
      name: "Neural Matrix Prime",
      tag: "MULTIMODAL SYNTHESIS",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      accentBorder: "border-cyan-500/40",
      desc: "Multimodal perception, real-time contextual analysis, and creative synthesis."
    },
    "jarvis-neural-matrix": {
      name: "Neural Matrix Prime",
      tag: "MULTIMODAL SYNTHESIS",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      accentBorder: "border-cyan-500/40",
      desc: "Multimodal perception, real-time contextual analysis, and creative synthesis."
    },
    "chatgpt-free": {
      name: "Cognitive Synthesizer",
      tag: "STRUCTURED ARCHITECTURE",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      accentBorder: "border-emerald-500/40",
      desc: "Structured architectural reasoning, articulated explanations, and step-by-step logic."
    },
    "jarvis-cognitive-synth": {
      name: "Cognitive Synthesizer",
      tag: "STRUCTURED ARCHITECTURE",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      accentBorder: "border-emerald-500/40",
      desc: "Structured architectural reasoning, articulated explanations, and step-by-step logic."
    },
    "deep-research": {
      name: "Synaptic Deep Research",
      tag: "GLOBAL REPOSITORY",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      accentBorder: "border-indigo-500/40",
      desc: "Exhaustive deep-dive research synthesizing academic and web intelligence."
    },
    "jarvis-deep-research": {
      name: "Synaptic Deep Research",
      tag: "GLOBAL REPOSITORY",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      accentBorder: "border-indigo-500/40",
      desc: "Exhaustive deep-dive research synthesizing academic and web intelligence."
    },
    "offline-llama": {
      name: "Autonomous Edge Core",
      tag: "LOCAL OFFLINE",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      accentBorder: "border-amber-500/40",
      desc: "Zero-latency in-browser neural execution with local weight cache."
    },
    "offline-deepseek": {
      name: "Deep Logic Sub-Core",
      tag: "LOCAL OFFLINE",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      accentBorder: "border-purple-500/40",
      desc: "Autonomous local edge reasoning and algorithmic computation."
    }
  };

  const fallbackEngine = {
    name: "Cognitive Core",
    tag: "HIGH SPEED MULTIMODAL",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    accentBorder: "border-cyan-500/40",
    desc: "Ultra-low latency reasoning, mathematical computation, and live tools."
  };

  const currentEngine = (engineMeta && (engineMeta[selectedEngine] || engineMeta["jarvis-core-mk1"])) || fallbackEngine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
      <div 
        className={`w-full bg-[#030914] border ${currentEngine.accentBorder || "border-cyan-500/40"} rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden transition-all duration-300 ${
          isMaximized ? "h-[96vh] max-w-[96vw]" : "h-[85vh] max-w-4xl"
        }`}
      >
        {/* Top Header */}
        <div className="h-14 bg-[var(--theme-secondary)] border-b border-[var(--theme-primary)]/20 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Orbitron',sans-serif] text-sm font-bold tracking-wider text-[#e0f7ff]">
                  {currentEngine?.name || "J.A.R.V.I.S. Core"}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono',monospace] border ${currentEngine?.badgeColor || ""}`}>
                  {currentEngine?.tag || "ACTIVE"}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-['JetBrains_Mono',monospace] truncate max-w-md hidden sm:block">
                {currentEngine?.desc || ""}
              </p>
            </div>
          </div>

          {/* Engine Selector Pills & Window Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Engine Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-[var(--theme-secondary)] p-1 rounded-lg border border-[var(--theme-primary)]/20 text-[10px] font-['JetBrains_Mono',monospace]">
              {(["jarvis-core-mk1", "jarvis-core-mk2", "jarvis-core-mk3"] as any[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedEngine(id)}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    selectedEngine === id
                      ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold border border-[var(--theme-primary)]/40 shadow-[0_0_8px_rgba(0,243,255,0.2)]"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {id === "jarvis-core-mk1" ? "Core Alpha" : id === "jarvis-core-mk2" ? "Core Delta" : "Neural Engine"}
                </button>
              ))}
            </div>
            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value as AIModelId)}
                className="bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] text-xs rounded p-1"
              >
                <option value="jarvis-core-mk1">Core Alpha</option>
                <option value="jarvis-core-mk2">Core Delta</option>
                <option value="jarvis-core-mk3">Neural Engine</option>
              </select>
            </div>

            {/* Clear History */}
            <button
              onClick={handleCopyFullChat}
              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
              title="Copy Entire Engine History"
            >
              {isChatCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 transition-colors"
              title="Clear Engine History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Maximize Toggle */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 transition-colors hidden sm:block"
              title={isMaximized ? "Restore Window" : "Maximize Window"}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-red-500 transition-colors text-xs font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Chat History View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-['JetBrains_Mono',monospace] text-xs scrollbar-thin bg-black/40">
          {modelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)]">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-['Orbitron',sans-serif] text-sm text-[#e0f7ff] tracking-wider">
                {currentEngine?.name || "J.A.R.V.I.S. Core"} Dedicated Channel
              </h4>
              <p className="text-xs text-gray-400 max-w-md">
                This dedicated workstation runs independently of J.A.R.V.I.S. voice telemetry. Ask deep technical questions, test prompts, or converse directly with {currentEngine?.name || "the engine"}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                <button
                  onClick={() => {
                    setInput("Explain quantum computing qubit superposition in 3 concise points.");
                  }}
                  className="p-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 text-left text-cyan-200 hover:border-[var(--theme-primary)] transition-all text-[11px]"
                >
                  &quot;Explain quantum superposition...&quot;
                </button>
                <button
                  onClick={() => {
                    setInput("Generate a production TypeScript debounce function with generic types.");
                  }}
                  className="p-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 text-left text-cyan-200 hover:border-[var(--theme-primary)] transition-all text-[11px]"
                >
                  &quot;TypeScript generic debounce function...&quot;
                </button>
              </div>
            </div>
          ) : (
            modelMessages.map((msg, idx) => (
              <div
                key={msg.id ? `${msg.id}-${idx}` : `model-msg-${idx}`}
                className={`p-3 rounded-xl border leading-relaxed relative group ${
                  msg.role === "user"
                    ? "ml-auto max-w-[85%] bg-cyan-950/40 border-cyan-500/40 text-cyan-100"
                    : "mr-auto max-w-[90%] bg-[var(--theme-secondary)]/90 border-slate-700/60 text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-['Orbitron',sans-serif] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    {msg.role === "user" ? (
                      <span className="text-[var(--theme-primary)] font-bold">USER INQUIRY</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">{msg.modelBadge?.toUpperCase() || "J.A.R.V.I.S. CORE"}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                    {msg.text && (
                      <button
                        onClick={() => handleCopy(msg.text || "", msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {(msg.attachments?.length || msg.image) && (
                  <MessageAttachmentsGrid
                    attachments={msg.attachments}
                    singleImage={msg.image}
                    singleMediaType={msg.mediaType}
                    singleMediaName={msg.mediaName}
                  />
                )}

                <SmartChatContent
                  content={msg.text || ""}
                  isUser={msg.role === "user"}
                  variant={msg.role === "user" ? "user" : "model"}
                  className="font-sans text-sm text-gray-100 leading-relaxed"
                />
              </div>
            ))
          )}
          {isProcessing && (
            <div className="mr-auto p-3 rounded-xl bg-[var(--theme-secondary)]/90 border border-[var(--theme-primary)]/30 text-cyan-300 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--theme-primary)]" />
              <span>{selectedEngine === "offline-llama" && offlineProgress ? offlineProgress : `${currentEngine?.name || "J.A.R.V.I.S. Core"} synthesizing response...`}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[var(--theme-secondary)] border-t border-[var(--theme-primary)]/20 flex-shrink-0">
          {/* Multi-file/folder Attachment Tray */}
          <AttachmentTray
            attachments={attachments}
            onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
            onClearAll={() => setAttachments([])}
          />
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <AttachmentButton
              onFilesSelected={(newFiles) => setAttachments(prev => [...prev, ...newFiles])}
              disabled={isProcessing}
              buttonSize="sm"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask J.A.R.V.I.S., analyze documents, code, images, or chat..."
              disabled={isProcessing}
              className="flex-1 bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/30 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--theme-primary)] font-['JetBrains_Mono',monospace] text-xs shadow-[inset_0_0_10px_rgba(0,243,255,0.05)]"
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[var(--theme-primary)] text-black font-bold hover:brightness-110 disabled:opacity-40 transition-all text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,243,255,0.3)]"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
