import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Paperclip, Camera, Send, Trash2, X, ChevronDown, Cpu, Sparkles, Plus } from "lucide-react";
import { generateOfflineResponse } from "../lib/webLlmService";
import { AIModelId, MediaAttachment } from "../types";
import { getGlobalMemoryString } from "../lib/memory";
import { SmartChatContent } from "./SmartChatContent";
import { AttachmentButton, AttachmentTray, MessageAttachmentsGrid } from "./AttachmentComponents";
import { indexedStorage } from "../utils/storage";
import { microcontrollerDebugger } from "../lib/microcontrollerDebugger";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  image?: string;
  mediaType?: "image" | "video" | "document" | string;
  mediaName?: string;
  attachments?: MediaAttachment[];
  modelBadge?: AIModelId;
}

interface SidebarChatProps {
  onClose?: () => void;
  telemetry?: any;
}

export const SidebarChat: React.FC<SidebarChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_sidebar_workspace_history") || localStorage.getItem("jarvis_project_workspace_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

  useEffect(() => {
    const loadMemory = async () => {
      const stored = await indexedStorage.get<Message[] | null>("jarvis_sidebar_workspace_history", null);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setMessages(stored);
      }
      setIsIndexedDBLoaded(true);
    };
    loadMemory();
  }, []);

  const [input, setInput] = useState("");
  const [model, setModel] = useState<AIModelId>("jarvis-core-mk1");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-persist messages to Chat Workspace storage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        if (isIndexedDBLoaded) {
          indexedStorage.set("jarvis_sidebar_workspace_history", messages);
          localStorage.setItem("jarvis_sidebar_workspace_history", JSON.stringify(messages.slice(-5)));
        } else {
          localStorage.setItem("jarvis_sidebar_workspace_history", JSON.stringify(messages.slice(-5)));
        }
      } catch (e) {
        console.warn("Sidebar storage quota warning", e);
      }
    } else {
      if (isIndexedDBLoaded) {
        indexedStorage.remove("jarvis_sidebar_workspace_history");
      }
      localStorage.removeItem("jarvis_sidebar_workspace_history");
    }
  }, [messages, isIndexedDBLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for voice prompts dispatched to Chat Workspace
  useEffect(() => {
    const handleVoiceWorkspacePrompt = (e: any) => {
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

    window.addEventListener("jarvis-workspace-prompt", handleVoiceWorkspacePrompt);
    window.addEventListener("jarvis-trigger-upload-files", handleVoiceTriggerFiles);
    window.addEventListener("jarvis-trigger-upload-folder", handleVoiceTriggerFolder);

    return () => {
      window.removeEventListener("jarvis-workspace-prompt", handleVoiceWorkspacePrompt);
      window.removeEventListener("jarvis-trigger-upload-files", handleVoiceTriggerFiles);
      window.removeEventListener("jarvis-trigger-upload-folder", handleVoiceTriggerFolder);
    };
  }, [messages, isProcessing, model, attachments]);

  const handleNewChat = async () => {
    if (messages.length > 0) {
      try {
        let existing = await indexedStorage.get<any[]>("jarvis_sidebar_workspace_sessions", []);
        if (!existing || existing.length === 0) {
          existing = JSON.parse(localStorage.getItem("jarvis_sidebar_workspace_sessions") || "[]");
        }
        const firstUserMsg = messages.find(m => m.role === "user");
        const title = firstUserMsg?.text ? firstUserMsg.text.slice(0, 30) : `Workspace Chat ${existing.length + 1}`;
        existing.unshift({
          id: `sidebar-session-${Date.now()}`,
          title: `[Workspace] ${title}`,
          createdAt: messages[0]?.timestamp || Date.now(),
          updatedAt: Date.now(),
          messages: [...messages],
          modelUsed: model
        });
        const truncated = existing.slice(0, 30);
        await indexedStorage.set("jarvis_sidebar_workspace_sessions", truncated);
        localStorage.setItem("jarvis_sidebar_workspace_sessions", JSON.stringify(truncated.map((s: any) => ({ ...s, messages: s.messages.slice(-1) }))));
      } catch {}
    }
    setMessages([]);
    localStorage.removeItem("jarvis_sidebar_workspace_history");
    indexedStorage.remove("jarvis_sidebar_workspace_history");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachments(prev => [
        ...prev,
        {
          id: `att-sb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: event.target?.result as string,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        }
      ]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e?: React.FormEvent, promptOverride?: string, attachmentsOverride?: MediaAttachment[], speakReply?: boolean) => {
    if (e) e.preventDefault();
    const query = (promptOverride !== undefined ? promptOverride : input).trim();
    const currentAttachments = attachmentsOverride !== undefined ? attachmentsOverride : attachments;
    if (!query && currentAttachments.length === 0) return;
    if (isProcessing) return;

    const firstAtt = currentAttachments[0];
    const currentModel = model;

    const userMsg: Message = {
      id: `sb-usr-${Date.now()}`,
      role: "user",
      text: query,
      image: firstAtt?.url,
      mediaType: firstAtt ? (firstAtt.type.startsWith("image/") ? "image" : firstAtt.type.startsWith("video/") ? "video" : "document") : undefined,
      mediaName: firstAtt?.name,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: Date.now(),
      modelBadge: currentModel
    };

    setMessages(prev => [...prev, userMsg]);
    if (promptOverride === undefined) {
      setInput("");
      setAttachments([]);
    }
    setIsProcessing(true);

    const streamMsgId = `sb-ai-${Date.now()}`;
    const initialAiMsg: Message = {
      id: streamMsgId,
      role: "model",
      text: "",
      timestamp: Date.now(),
      modelBadge: currentModel
    };
    setMessages(prev => [...prev, initialAiMsg]);

    try {
      if (currentModel.startsWith("offline")) {
        const textResponse = await generateOfflineResponse([
          { role: "user", parts: [{ text: query }] }
        ]);
        setMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, text: textResponse } : m));
        if (speakReply && textResponse) {
          window.dispatchEvent(new CustomEvent("jarvis-speak-reply", { detail: { text: textResponse } }));
        }
      } else {
        const historyPayload = messages.slice(-10).map(m => ({
          role: m.role,
          parts: [{ text: m.text || "" }]
        }));

        // Access full dual-folder memory matrix
        const globalMemory = getGlobalMemoryString(messages as any, query);
        const codeDiagnosis = microcontrollerDebugger.analyzeCode(query);

        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            history: historyPayload,
            globalMemory,
            image: firstAtt?.url,
            mediaType: firstAtt?.type,
            mediaName: firstAtt?.name,
            attachments: currentAttachments,
            model: currentModel,
            codeDiagnosis: codeDiagnosis.isCodeDetected ? codeDiagnosis : undefined,
          }),
        });

        if (!res.ok) throw new Error("API stream failed");

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let streamedText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  if (line.slice(5) === "[DONE]") continue;
                  const data = JSON.parse(line.slice(5));
                  if (data.type === "error" && data.error) {
                    streamedText = `[SYSTEM FAILURE]: ${data.error}`;
                    setMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, text: streamedText } : m));
                  }
                  if (data.type === "chunk" && data.text) {
                    streamedText += data.text;
                    setMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, text: streamedText } : m));
                  }
                  if (data.type === "done") {
                    const finalAiText = data.text || streamedText;
                    setMessages(prev => prev.map(m => m.id === streamMsgId ? {
                      ...m,
                      text: finalAiText,
                      image: data.image || m.image,
                      mediaType: data.mediaType || (data.image ? "image" : m.mediaType),
                      mediaName: data.mediaName || m.mediaName
                    } : m));
                    if (speakReply && finalAiText) {
                      window.dispatchEvent(new CustomEvent("jarvis-speak-reply", { detail: { text: finalAiText } }));
                    }
                  }
                } catch (err) {}
              }
            }
          }
        }
      }
    } catch (err) {
      const errMsg = "Connection error. Failed to reach AI Core.";
      setMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, text: errMsg } : m));
      if (speakReply) {
        window.dispatchEvent(new CustomEvent("jarvis-speak-reply", { detail: { text: errMsg } }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] rounded-xl overflow-hidden font-sans text-gray-200 shadow-2xl relative border border-[var(--theme-primary)]/20">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--theme-primary)]/20 bg-[#1e1f20]">
        <div className="flex items-center gap-3">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as AIModelId)}
            className="bg-transparent text-[var(--theme-primary)] text-sm font-bold focus:outline-none cursor-pointer hover:bg-gray-800 py-1 px-2 rounded-lg transition-colors"
          >
            <option value="jarvis-core-mk1" className="bg-[#1e1f20]">J.A.R.V.I.S. Primary Core</option>
            <option value="gemini-free" className="bg-[#1e1f20]">J.A.R.V.I.S. Neural Matrix</option>
            <option value="chatgpt-free" className="bg-[#1e1f20]">J.A.R.V.I.S. Cognitive Engine</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={handleNewChat} className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full transition-colors" title="Archive & Start New Workspace Chat">
              <Plus className="w-5 h-5" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full transition-colors" title="Close">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-80">
            <Sparkles className="w-12 h-12 mb-4 text-[var(--theme-primary)]" />
            <h2 className="text-xl font-medium text-white mb-2">How can I help you today?</h2>
            <p className="text-xs text-gray-400">Powered by global knowledge, real-time context, and unified access.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "model" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/50 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === "user" ? "bg-gray-800 rounded-2xl rounded-tr-sm p-3.5" : "pt-1"}`}>
                  {(msg.attachments?.length || msg.image) && (
                    <MessageAttachmentsGrid
                      attachments={msg.attachments}
                      singleImage={msg.image}
                      singleMediaType={msg.mediaType}
                      singleMediaName={msg.mediaName}
                    />
                  )}
                  {msg.text && (
                    <SmartChatContent
                      content={msg.text}
                      isUser={msg.role === "user"}
                      variant={msg.role === "user" ? "user" : "model"}
                      className={`text-[14px] leading-relaxed ${msg.role === "user" ? "text-gray-100" : "text-gray-200"}`}
                    />
                  )}
                  {msg.role === "model" && !msg.text && isProcessing && (
                    <div className="flex items-center gap-1 h-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce delay-200" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-3 pt-0 bg-[#131314]">
        <div className="relative flex flex-col bg-[#1e1f20] rounded-2xl border border-gray-700 focus-within:border-[var(--theme-primary)] transition-colors p-2">
          
          {/* Multi-file/folder Attachment Tray */}
          <AttachmentTray
            attachments={attachments}
            onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
            onClearAll={() => setAttachments([])}
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 200) + 'px';
            }}
            placeholder="Message J.A.R.V.I.S., analyze images & videos..."
            className="w-full bg-transparent text-gray-200 placeholder-gray-500 p-3 resize-none focus:outline-none min-h-[52px] max-h-[200px] scrollbar-thin text-sm"
            rows={1}
          />
          
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <AttachmentButton
                onFilesSelected={(newFiles) => setAttachments(prev => [...prev, ...newFiles])}
                disabled={isProcessing}
                buttonSize="sm"
              />
              
              {/* Native Camera Support */}
              <button 
                onClick={() => document.getElementById('sidebar-camera-input-2')?.click()}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                title="Capture Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                id="sidebar-chat-file-input"
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                id="sidebar-camera-input-2"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setAttachments(prev => [
                      ...prev,
                      {
                        id: `att-cam-${Date.now()}`,
                        name: file.name || "Camera Photo.jpg",
                        size: file.size,
                        type: file.type || "image/jpeg",
                        url: event.target?.result as string,
                      }
                    ]);
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isProcessing}
              className={`p-2 rounded-full flex items-center justify-center transition-all ${
                (!input.trim() && attachments.length === 0) || isProcessing 
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
