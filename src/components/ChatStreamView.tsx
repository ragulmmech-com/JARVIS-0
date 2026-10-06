import React, { useRef, useEffect } from "react";
import { 
  Terminal, ShieldCheck, Cpu, Check, Copy, ExternalLink,
  CornerDownRight, Globe, AlertTriangle, FileCode
} from "lucide-react";
import { Message } from "../types";
import { SmartChatContent } from "./SmartChatContent";

interface ChatStreamViewProps {
  messages: Message[];
  isProcessing: boolean;
}

export const ChatStreamView: React.FC<ChatStreamViewProps> = ({
  messages,
  isProcessing,
}) => {
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative z-10 font-tech">
      {messages.length === 0 ? (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 mb-4 animate-pulse">
            <Cpu className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="font-hud text-lg text-cyan-300 tracking-widest mb-1">
            J.A.R.V.I.S. TACTICAL OPERATING MATRIX READY
          </h2>
          <p className="text-xs text-cyan-600 max-w-md font-mono-code leading-relaxed">
            Awaiting voice commands or tactical directives. Say &quot;Hey JARVIS&quot;, launch games, query world knowledge, or control your Windows PC.
          </p>
        </div>
      ) : (
        messages.map((msg, idx) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id ? `${msg.id}-${idx}` : `chat-msg-${idx}`}
              className={`flex gap-3 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Badge Icon */}
              <div
                className={`w-8 h-8 rounded border flex-shrink-0 flex items-center justify-center ${
                  isUser
                    ? "bg-slate-800 border-slate-700 text-slate-300"
                    : "bg-cyan-950/70 border-cyan-500/50 text-cyan-400 shadow-md shadow-cyan-950"
                }`}
              >
                {isUser ? (
                  <span className="font-hud text-[10px]">OPERATOR</span>
                ) : (
                  <Terminal className="w-4 h-4 text-cyan-300" />
                )}
              </div>

              {/* Message Content Container */}
              <div
                className={`p-4 rounded-xl border relative overflow-hidden backdrop-blur-md transition-all ${
                  isUser
                    ? "bg-slate-900/80 border-slate-700/60 text-slate-100 shadow-sm"
                    : "bg-gray-950/80 border-cyan-500/30 text-cyan-50 shadow-lg shadow-cyan-950/20"
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/5 text-[10px] font-hud text-cyan-500/70">
                  <span>{isUser ? "TACTICAL TRANSMISSION" : "JARVIS CORE SYNAPSE"}</span>
                  <span>{msg.modelBadge || "CORE ALPHA"}</span>
                </div>

                {/* Multimodal Image Preview */}
                {msg.image && (
                  <div className="mb-3 max-w-md rounded-lg overflow-hidden border border-cyan-500/40 relative group">
                    <img
                      src={msg.image}
                      alt="Multimodal context"
                      className="w-full max-h-72 object-contain bg-black/60"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-cyan-500/50 font-hud text-[9px] text-cyan-300">
                      OPTICAL TELEMETRY
                    </div>
                  </div>
                )}

                {/* Main Body Text */}
                {msg.text && (
                  <SmartChatContent
                    content={msg.text}
                    isUser={isUser}
                    variant={isUser ? "user" : "tactical"}
                    className="text-sm font-mono-code leading-relaxed selection:bg-cyan-500 selection:text-black"
                  />
                )}

                {/* Tool / God Mode PC Execution Card */}
                {msg.toolCall && (
                  <div className="mt-3 p-3 rounded bg-black/70 border border-cyan-900/60 font-mono-code text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                      <div className="flex items-center gap-2 text-cyan-400 font-hud text-[11px]">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>GOD-MODE PROTOCOL: {(msg.toolCall?.name || "SYSTEM").toUpperCase()}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-hud uppercase tracking-wider ${
                          msg.toolCall.status === "REQUESTED" ? "bg-gray-800 text-gray-400" :
                          msg.toolCall.status === "AUTHORIZING" ? "bg-amber-950 text-amber-300 animate-pulse border border-amber-800" :
                          msg.toolCall.status === "EXECUTING" ? "bg-blue-950 text-blue-300 animate-pulse border border-blue-800" :
                          msg.toolCall.status === "SUCCESS" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                          "bg-red-950 text-red-300 border border-red-800"
                        }`}
                      >
                        {msg.toolCall.status || "EXECUTED"}
                      </span>
                    </div>

                    <div className="text-gray-400 text-[11px]">
                      <span className="text-gray-500">Payload: </span>
                      <code className="text-cyan-200">{JSON.stringify(msg.toolCall.args || {})}</code>
                    </div>

                    {/* Execution Result */}
                    {msg.toolCall.result && (
                      <div className="pt-2 border-t border-gray-800">
                        <div className="text-[10px] text-gray-500 font-hud mb-1">LOCAL DAEMON OUTPUT:</div>
                        {msg.toolCall?.name === "take_screenshot" && msg.toolCall?.result?.image_base64 ? (
                          <div className="mt-1 rounded border border-cyan-700/50 overflow-hidden max-w-sm">
                            <img
                              src={msg.toolCall.result.image_base64}
                              alt="Windows Screenshot"
                              className="w-full h-auto"
                            />
                          </div>
                        ) : (
                          <pre className="max-h-40 overflow-y-auto p-2 bg-gray-950 rounded text-[11px] text-gray-300 text-emerald-300/90 whitespace-pre-wrap">
                            {typeof msg.toolCall.result === "string"
                              ? msg.toolCall.result
                              : JSON.stringify(msg.toolCall.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Processing Animation */}
      {isProcessing && (
        <div className="flex items-center gap-3 text-cyan-400 font-mono-code text-xs animate-pulse p-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>SYNAPTIC COMPUTE IN PROGRESS // ACCESSING WORLD KNOWLEDGE...</span>
        </div>
      )}

      <div ref={streamEndRef} />
    </div>
  );
};
