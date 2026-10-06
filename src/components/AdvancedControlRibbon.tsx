import React from "react";
import { Zap, MessageSquare, FolderArchive, Copy, Check, Trash2 } from "lucide-react";

interface AdvancedOpsRibbonProps {
  onOpenAllChats?: () => void;
  chatCount?: number;
  activeChatTitle?: string;
  powerOutputPcnt: number;
  isCharging?: boolean;
  onCopyMainChat?: () => void;
  isMainChatCopied?: boolean;
  onClearMemory?: () => void;
  messagesLength?: number;
}

export const AdvancedControlRibbon: React.FC<AdvancedOpsRibbonProps> = ({
  onOpenAllChats,
  chatCount,
  activeChatTitle,
  powerOutputPcnt,
  isCharging = false,
  onCopyMainChat,
  isMainChatCopied,
  onClearMemory,
  messagesLength,
}) => {
  // Battery percentage & Charging behaviors specified by user:
  // - If charging: the thunderbolt (Zap icon) blinks!
  // - If not charging (normal): stays steady as usual.
  // - If <= 20%: blinks warning!
  // - If <= 10%: blinks fast/speed blink!
  const isCritical = powerOutputPcnt <= 10 && !isCharging;
  const isLow = powerOutputPcnt <= 20 && !isCharging;

  let zapClass = "text-emerald-400";
  if (isCharging) {
    zapClass = "text-emerald-400 animate-pulse";
  } else if (isCritical) {
    // 10% or less: speed blink
    zapClass = "text-red-500 animate-[ping_0.5s_ease-in-out_infinite]";
  } else if (isLow) {
    // 20% or less: normal blink
    zapClass = "text-amber-400 animate-pulse";
  }

  let badgeBorderClass = "border-[var(--theme-primary)]/20 bg-[var(--theme-secondary)]";
  if (isCharging) {
    badgeBorderClass = "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  } else if (isCritical) {
    badgeBorderClass = "border-red-500/60 bg-red-950/40 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse";
  } else if (isLow) {
    badgeBorderClass = "border-amber-500/40 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
  }

  let textPcntColor = "text-emerald-400 font-bold";
  if (isCharging) {
    textPcntColor = "text-emerald-400 font-bold";
  } else if (isCritical) {
    textPcntColor = "text-red-400 font-black animate-pulse";
  } else if (isLow) {
    textPcntColor = "text-amber-400 font-bold";
  }

  return (
    <div className="w-full bg-[var(--theme-secondary)]/95 border-b border-[var(--theme-primary)]/20 px-3 md:px-6 py-2 flex items-center justify-between gap-3 text-xs font-['JetBrains_Mono',monospace] overflow-x-auto scrollbar-none z-20 flex-shrink-0">
      {/* Left Group: Advanced Ops Options */}
      <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
        <span className="text-[var(--theme-primary)]/70 text-[10px] uppercase font-['Orbitron',sans-serif] tracking-wider hidden sm:inline">
          ADVANCED OPS:
        </span>

        {/* Memory Folder Button */}
        {onOpenAllChats && (
          <button
            type="button"
            onClick={onOpenAllChats}
            className="text-cyan-300 hover:text-white transition-colors p-1.5 flex items-center gap-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded px-2.5 shadow-[0_0_10px_rgba(0,243,255,0.15)]"
            title="Open Memory Folder (Access Old Conversations & Archived Notes)"
          >
            <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">MEMORY FOLDER</span>
          </button>
        )}

        {/* Copy Entire Chat */}
        {onCopyMainChat && (
          <button
            type="button"
            onClick={onCopyMainChat}
            className="text-gray-300 hover:text-[var(--theme-primary)] transition-colors p-1.5 flex items-center gap-1 bg-black/40 border border-gray-800 rounded px-2"
            title="Copy Entire Stream & Notes"
          >
            {isMainChatCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="font-semibold">COPY CHAT</span>
          </button>
        )}

        {/* Clear / Wipe Screen */}
        {onClearMemory && (
          <button
            type="button"
            onClick={onClearMemory}
            className="text-gray-400 hover:text-amber-300 transition-colors p-1.5 flex items-center gap-1 bg-black/40 border border-gray-800 rounded px-2"
            title="Wipe front screen • Chats remain safely saved in Memory Folder (முன் திரை மட்டும் க்ளியர் ஆகும், மெமரி ஃபோல்டரில் பாதுகாப்பாக இருக்கும்)"
          >
            <Trash2 className="w-3 h-3 text-amber-400/80" />
            <span className="font-semibold text-gray-300">WIPE SCREEN</span>
          </button>
        )}

        {/* Active Chat Topic Preview */}
        {activeChatTitle && (
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-gray-400 pl-2 border-l border-cyan-500/20 max-w-[200px] truncate">
            <MessageSquare className="w-3 h-3 text-cyan-500/60 flex-shrink-0" />
            <span className="text-gray-500 text-[10px]">CURRENT:</span>
            <span className="text-cyan-300 truncate">{activeChatTitle}</span>
          </div>
        )}
      </div>

      {/* Right Group: Live System Time, Location & Core Status */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 text-[11px]">
        {messagesLength !== undefined && (
          <span className="text-gray-400 hidden sm:inline text-[10px]">MEMORY: <strong className="text-cyan-400">{messagesLength} LOGS</strong></span>
        )}
        
        {/* Arc Power Level Indicator */}
        <div 
          className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[10px] transition-all ${badgeBorderClass}`}
          title={isCharging ? `Charging Battery: ${powerOutputPcnt}%` : `Battery Power: ${powerOutputPcnt}%`}
        >
          <div className="relative flex items-center justify-center">
            <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${zapClass}`} />
          </div>
          <span className="text-gray-400">ARC POWER:</span>
          <span className={textPcntColor}>{powerOutputPcnt}%</span>
          {isCharging && (
            <span className="text-[8px] font-mono text-emerald-300 uppercase px-1 py-0.2 rounded bg-emerald-900/60 ml-0.5 animate-pulse font-bold">
              CHARGING
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
