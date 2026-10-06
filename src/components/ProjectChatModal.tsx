import React, { useState, useRef, useEffect } from "react";
import { 
  Cpu, Zap, Send, Trash2, Maximize2, Minimize2, 
  Copy, Check, RefreshCw, Layers, Paperclip, Sparkles,
  Mic, MicOff, Waves
} from "lucide-react";
import { Message, MediaAttachment } from "../types";
import { getGlobalMemoryString } from "../lib/memory";
import { generateChatTranscript } from "../lib/transcript";
import { SmartChatContent } from "./SmartChatContent";
import { AttachmentButton, AttachmentTray, MessageAttachmentsGrid } from "./AttachmentComponents";
import { microcontrollerDebugger } from "../lib/microcontrollerDebugger";

interface ProjectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceActive?: boolean;
  liveTranscript?: string;
  onToggleVoice?: () => void;
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({
  isOpen,
  onClose,
  isVoiceActive = false,
  liveTranscript = "",
  onToggleVoice,
}) => {
  const selectedEngine = "gemini-3.7-pro";
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isChatCopied, setIsChatCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [modelMessages, setModelMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_project_workspace_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("jarvis_project_workspace_history", JSON.stringify(modelMessages));
    } catch (e) {
      console.warn("Could not persist engine chat history", e);
    }
  }, [modelMessages]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [modelMessages, isOpen]);

  // Listen for voice prompts dispatched from the Live Reactor
  useEffect(() => {
    const handleVoiceProjectPrompt = (e: any) => {
      const prompt = e.detail?.text;
      const shouldSpeak = e.detail?.speakReply !== false;
      if (prompt && typeof prompt === "string") {
        handleSend(undefined, prompt, e.detail?.attachments, shouldSpeak);
      }
    };

    const handleVoiceTriggerFiles = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        const input = document.getElementById("jarvis-attachment-files-input") as HTMLInputElement;
        input?.click();
      }
    };

    const handleVoiceTriggerFolder = () => {
      const input = document.getElementById("jarvis-attachment-folder-input") as HTMLInputElement;
      input?.click();
    };

    window.addEventListener("jarvis-project-prompt", handleVoiceProjectPrompt);
    window.addEventListener("jarvis-trigger-upload-files", handleVoiceTriggerFiles);
    window.addEventListener("jarvis-trigger-upload-folder", handleVoiceTriggerFolder);

    return () => {
      window.removeEventListener("jarvis-project-prompt", handleVoiceProjectPrompt);
      window.removeEventListener("jarvis-trigger-upload-files", handleVoiceTriggerFiles);
      window.removeEventListener("jarvis-trigger-upload-folder", handleVoiceTriggerFolder);
    };
  }, [modelMessages, isProcessing]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachments(prev => [
        ...prev,
        {
          id: `att-proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  const handleSend = async (e?: React.FormEvent, promptOverride?: string, attachmentsOverride?: MediaAttachment[], speakReply?: boolean) => {
    if (e) e.preventDefault();
    const query = (promptOverride !== undefined ? promptOverride : input).trim();
    const currentAttachments = attachmentsOverride !== undefined ? attachmentsOverride : attachments;
    if ((!query && currentAttachments.length === 0) || isProcessing) return;

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
    if (promptOverride === undefined) {
      setInput("");
      setAttachments([]);
    }
    setIsProcessing(true);

    try {
      const historyPayload = modelMessages.slice(-10).map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        else parts.push({ text: " " });
        return { role: m.role, parts };
      });

      
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
      
      const data = await res.json();

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
      if (speakReply && reply) {
        window.dispatchEvent(new CustomEvent("jarvis-speak-reply", { detail: { text: reply } }));
      }
    } catch (err: any) {
      const errMsg = `Neural Gateway Error: ${err.message || "Failed to contact engine"}`;
      setModelMessages(prev => [
        ...prev,
        {
          id: `engine-err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "model",
          text: errMsg,
          timestamp: Date.now(),
        }
      ]);
      if (speakReply) {
        window.dispatchEvent(new CustomEvent("jarvis-speak-reply", { detail: { text: errMsg } }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete the entire project chat history?")) {
      setModelMessages([]);
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
    const transcript = generateChatTranscript(modelMessages, "J.A.R.V.I.S. Project Workspace");
    navigator.clipboard.writeText(transcript);
    setIsChatCopied(true);
    setTimeout(() => setIsChatCopied(false), 2000);
  };

  const handleClear = () => {
    setModelMessages([]);
    localStorage.removeItem("jarvis_project_workspace_history");
  };

  const currentEngine = {
    name: "J.A.R.V.I.S. Project Workspace",
    tag: "DEEP RESEARCH & MULTIMODAL",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    accentBorder: "border-purple-500/40",
    desc: "All-in-one workspace with full J.A.R.V.I.S. cognitive capabilities: deep research, document analysis, optical image & video breakdown, writing, and coding."
  };

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

          {/* Project Workspace Badge & Window Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-500/40 text-[11px] font-['JetBrains_Mono',monospace] text-purple-200">
              <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="font-bold">PROJECT WORKSPACE (J.A.R.V.I.S. CORE)</span>
            </div>

            {/* Clear History */}
            <button
              onClick={handleCopyFullChat}
              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
              title="Copy Entire Project History"
            >
              {isChatCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 transition-colors"
              title="Clear Project History"
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
                PROJECT WORKSPACE
              </h4>
              <p className="text-xs text-gray-400 max-w-md">
                Upload any file format (Images, Videos, PDF, PPT, Word, Excel, etc.), inspect photos, write complex code, edit text, and perform advanced research. The engine operates with full J.A.R.V.I.S. cognitive capabilities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                <button
                  onClick={() => {
                    setInput("Explain the engineering workflow and architecture of an electric vehicle powertrain.");
                  }}
                  className="p-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 text-left text-cyan-200 hover:border-[var(--theme-primary)] transition-all text-[11px]"
                >
                  &quot;EV powertrain architecture...&quot;
                </button>
                <button
                  onClick={() => {
                    setInput("Perform deep analysis on renewable solar & green hydrogen energy storage.");
                  }}
                  className="p-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 text-left text-cyan-200 hover:border-[var(--theme-primary)] transition-all text-[11px]"
                >
                  &quot;Renewable energy analysis...&quot;
                </button>
                <button
                  onClick={() => {
                    setInput("Synthesize an engineering circuit schematic explanation with design formulas.");
                  }}
                  className="p-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 text-left text-cyan-200 hover:border-[var(--theme-primary)] transition-all text-[11px]"
                >
                  &quot;Engineering schematic formulas...&quot;
                </button>
                <button
                  onClick={() => {
                    setInput("Explain quantum superposition and system architecture in detail.");
                  }}
                  className="p-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 text-left text-cyan-200 hover:border-[var(--theme-primary)] transition-all text-[11px]"
                >
                  &quot;Explain quantum superposition...&quot;
                </button>
              </div>
            </div>
          ) : (
            modelMessages.map((msg, idx) => (
              <div
                key={msg.id ? `${msg.id}-${idx}` : `proj-msg-${idx}`}
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
              <span>`Synthesizing project response (J.A.R.V.I.S. Neural Link)...`</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[var(--theme-secondary)] border-t border-[var(--theme-primary)]/20 flex-shrink-0">
          {/* Live Voice / Reactor Transcript Banner */}
          {(isVoiceActive || liveTranscript) && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="font-['JetBrains_Mono',monospace] font-bold text-[11px]">
                  {liveTranscript ? `LIVE SPEECH: "${liveTranscript}"` : "LIVE REACTOR LISTENING FOR PROJECT COMMAND..."}
                </span>
              </div>
              {liveTranscript && (
                <button
                  type="button"
                  onClick={() => handleSend(undefined, liveTranscript)}
                  className="px-2 py-0.5 rounded bg-cyan-500 text-black text-[10px] font-bold hover:brightness-110"
                >
                  SEND VOICE
                </button>
              )}
            </div>
          )}

          {/* Multi-file/folder Attachment Tray */}
          <AttachmentTray
            attachments={attachments}
            onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
            onClearAll={() => setAttachments([])}
          />
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              id="project-chat-file-input"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <AttachmentButton
              onFilesSelected={(newFiles) => setAttachments(prev => [...prev, ...newFiles])}
              disabled={isProcessing}
              buttonSize="sm"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isVoiceActive ? "Speak into Live Reactor or type here..." : "Ask J.A.R.V.I.S., analyze documents, code, images, or chat..."}
              disabled={isProcessing}
              className="flex-1 bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/30 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--theme-primary)] font-['JetBrains_Mono',monospace] text-xs shadow-[inset_0_0_10px_rgba(0,243,255,0.05)]"
            />
            {onToggleVoice && (
              <button
                type="button"
                onClick={onToggleVoice}
                title={isVoiceActive ? "Stop Voice Listening" : "Start Live Voice Input"}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                  isVoiceActive 
                    ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse" 
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                }`}
              >
                {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
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
