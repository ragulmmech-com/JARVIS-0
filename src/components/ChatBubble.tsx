import React from "react";
import { SmartChatContent } from "./SmartChatContent";

export const ChatBubble: React.FC<{ content: string; sender: "user" | "jarvis" }> = ({
  content,
  sender,
}) => {
  const isJarvis = sender === "jarvis";

  return (
    <div className={`flex w-full ${isJarvis ? "justify-start" : "justify-end"} my-3 px-2`}>
      <div
        className={`max-w-[92%] md:max-w-[80%] rounded-xl p-4 text-sm md:text-base ${
          isJarvis
            ? "bg-black/70 border border-cyan-500/30 text-cyan-50 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            : "bg-cyan-950/40 border border-cyan-400/40 text-gray-100"
        }`}
      >
        <SmartChatContent
          content={content}
          isUser={!isJarvis}
          variant={isJarvis ? "model" : "user"}
        />
      </div>
    </div>
  );
};

