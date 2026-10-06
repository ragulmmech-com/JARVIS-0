import React from "react";
import { 
  Mic, MicOff, Waves, Zap, Square, 
  Volume2, VolumeX, Globe, Cpu, ChevronRight, ShieldCheck, Sparkles
} from "lucide-react";
import { ArcReactorState, VoiceListeningMode, UITheme, ReactorStyle, AIModelId } from "../types";
import { ArcReactorOrb } from "./ArcReactorOrb";
import { usePerformance } from "../context/PerformanceContext";

interface ArcReactorVoiceDeckProps {
  reactorState: ArcReactorState;
  voiceMode: VoiceListeningMode;
  wakeWordEnabled: boolean;
  wakeWordAlert: string | null;
  liveTranscript: string;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isVoiceMuted: boolean;
  latestResponse?: string;
  speechLang?: string;
  compact?: boolean;
  orientation?: "vertical" | "horizontal";
  onSelectSpeechLang?: (lang: string) => void;
  onToggleVoiceMuted: () => void;
  onReactorTap: () => void;
  onTapToListen: () => void;
  onToggleContinuous: () => void;
  onToggleWakeWord: () => void;
  onInterrupt: () => void;
  onQuickPrompt?: (prompt: string) => void;
  uiTheme?: UITheme;
  reactorStyle?: ReactorStyle;
  selectedModel?: AIModelId;
  onOpenTacticalCores?: () => void;
  selectedVoiceId?: string;
  onSelectVoiceId?: (voiceId: string) => void;
  audioLevel?: number;
}

export const ArcReactorVoiceDeck: React.FC<ArcReactorVoiceDeckProps> = ({
  reactorState,
  voiceMode,
  wakeWordEnabled,
  wakeWordAlert,
  liveTranscript,
  isListening,
  isSpeaking,
  isProcessing,
  isVoiceMuted,
  latestResponse,
  speechLang,
  compact = false,
  orientation = "horizontal",
  onSelectSpeechLang,
  onToggleVoiceMuted,
  onReactorTap,
  onTapToListen,
  onToggleContinuous,
  onToggleWakeWord,
  onInterrupt,
  onQuickPrompt,
  uiTheme = "cyan" as UITheme,
  reactorStyle = "core-mark1-classic" as ReactorStyle,
  selectedModel = "jarvis-core-mk1",
  onOpenTacticalCores,
  selectedVoiceId = "jarvis-male",
  onSelectVoiceId,
  audioLevel = 0,
}) => {
  const { mode: perfMode, fps, cyclePerformanceMode, isLowEnd } = usePerformance();

  // Strict visual precedence: AI Speaking ALWAYS overrides listening & processing
  const effectiveState: ArcReactorState = 
    isSpeaking || reactorState === "speaking"
      ? "speaking"
      : isProcessing || reactorState === "processing"
      ? "processing"
      : isListening || reactorState === "listening"
      ? "listening"
      : "idle";

  const isLiveActive = voiceMode === "continuous" && (isListening || effectiveState === "listening" || effectiveState === "speaking");

  const getModelDisplayName = (modelId: string) => {
    switch(modelId) {
      case "chatgpt-free": return "J.A.R.V.I.S. Synth";
      case "gemini-free": return "J.A.R.V.I.S. Matrix";
      case "deep-research": return "J.A.R.V.I.S. Research";
      case "claude-3-5-sonnet": return "J.A.R.V.I.S. Architect";
      case "offline-llama": return "J.A.R.V.I.S. Offline Edge";
      default: return "J.A.R.V.I.S. Core Alpha";
    }
  };

  // VERTICAL SIDE PANEL LAYOUT
  if (orientation === "vertical") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-between gap-1.5 md:gap-2 select-none overflow-x-hidden">
        {/* Standby Wake Word Banner */}
        {wakeWordAlert && (
          <div className="w-full px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-['Orbitron',sans-serif] font-bold rounded-lg shadow-[0_0_15px_#fbbf24] flex items-center justify-center gap-1.5 animate-bounce">
            <Zap className="w-3 h-3 text-black fill-black" />
            <span>{wakeWordAlert}</span>
          </div>
        )}

        {/* Top Header Label */}
        <div className="w-full flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="font-['Orbitron',sans-serif] text-[10px] font-bold text-[var(--theme-primary)] tracking-wider">
              ARC REACTOR
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => cyclePerformanceMode()}
              title={`Performance: ${perfMode} (${fps} FPS) - Click to cycle`}
              className={`px-1.5 py-0.5 text-[8px] rounded font-['JetBrains_Mono',monospace] font-bold border transition-colors cursor-pointer ${
                perfMode === 'ULTRA' ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.3)]" :
                perfMode === 'BALANCED' ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" :
                "bg-amber-500/15 text-amber-400 border-amber-500/40"
              }`}
            >
              {fps} FPS
            </button>
            <span className={`px-1.5 py-0.5 text-[8px] rounded font-['JetBrains_Mono',monospace] font-bold ${
              effectiveState === "speaking" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse" :
              effectiveState === "listening" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse" :
              effectiveState === "processing" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-spin" :
              "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
            }`}>
              {effectiveState.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Visual Reactor Stage in center - Perfectly Circular Large Holographic Core */}
        <div className="relative w-56 h-56 sm:w-60 sm:h-60 aspect-square flex items-center justify-center my-auto flex-shrink-0">
          <ArcReactorOrb 
            state={effectiveState} 
            onClick={onReactorTap} 
            size="lg" 
            reactorStyle={reactorStyle} 
            audioLevel={audioLevel}
          />
          
          {/* State Pill Beneath Core */}
          {effectiveState !== "idle" && (
            <div className="absolute -bottom-2.5 bg-black/90 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[8px] font-['Orbitron',sans-serif] tracking-wider text-[var(--theme-primary)] shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-center gap-1 whitespace-nowrap z-10">
              {effectiveState === "speaking" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold">JARVIS SPEAKING</span>
                </>
              ) : effectiveState === "processing" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-spin" />
                  <span className="text-purple-300 font-bold">REASONING</span>
                </>
              ) : effectiveState === "listening" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-cyan-300 font-bold">LISTENING</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Active Speaking Interactive Banner with Direct Mute/Unmute */}
        {effectiveState === "speaking" && (
          <div className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-400/60 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-['Orbitron',sans-serif] font-bold text-emerald-200 truncate">
                  {speechLang === "ta-IN" ? "தமிழ் குரல் ஒலிக்கிறது" : "JARVIS SPEAKING"}
                </span>
                <span className="text-[8px] font-mono text-emerald-300/80">
                  {isVoiceMuted ? "குரல் மியூட் செய்யப்பட்டுள்ளது" : "நேரலை குரல் ஒலி (ON)"}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onToggleVoiceMuted}
              className={`px-2.5 py-1 rounded text-[9px] font-bold font-['JetBrains_Mono',monospace] flex items-center gap-1 transition-all cursor-pointer ${
                isVoiceMuted
                  ? "bg-red-950 border border-red-400 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.5)] hover:bg-red-900"
                  : "bg-black/60 border border-emerald-400 text-emerald-300 hover:bg-red-950 hover:border-red-400 hover:text-red-200"
              }`}
              title={isVoiceMuted ? "தமிழ் குரலை அன்மியூட் செய்" : "தமிழ் குரலை மியூட் செய்"}
            >
              {isVoiceMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  <span>அன்மியூட்</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>மியூட்</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Real-Time Live Hearing Transcript Banner */}
        {liveTranscript ? (
          <div className="w-full px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-100 text-[11px] font-['JetBrains_Mono',monospace] flex items-start gap-2 shadow-[0_0_20px_rgba(0,243,255,0.3)] animate-pulse overflow-hidden break-words">
            <Mic className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse mt-0.5" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between text-[9px] text-cyan-300 font-bold uppercase tracking-wider mb-0.5">
                <span>HEARING (கேட்பது):</span>
                <span className="text-[8px] text-cyan-300 font-mono px-1 py-0.2 rounded bg-cyan-900/60 border border-cyan-500/40">
                  {speechLang === "ta-IN" ? "தமிழ்" : "ENGLISH"}
                </span>
              </div>
              <p className="text-white text-xs font-sans leading-snug break-words">
                &ldquo;{liveTranscript}&rdquo;
              </p>
            </div>
          </div>
        ) : effectiveState !== "speaking" ? (
          <div className="w-full text-center py-0.5 text-[9px] text-gray-500 font-['JetBrains_Mono',monospace]">
            {isLiveActive 
              ? "Live Voice Active • Tap core to stop" 
              : "Tap core to speak"}
          </div>
        ) : null}

        {/* Sleek, Compact Language & Audio Controls (Tamil, English, Mute/Unmute) */}
        {speechLang && onSelectSpeechLang && (
          <div className="w-full flex items-center justify-between gap-1 pt-1.5 border-t border-[var(--theme-primary)]/15">
            {/* Language Selection: Tamil / English (Smaller Compact Buttons) */}
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-md border border-[var(--theme-primary)]/20">
              <button
                type="button"
                onClick={() => onSelectSpeechLang("ta-IN")}
                className={`py-0.5 px-1.5 rounded text-[8.5px] font-bold font-['JetBrains_Mono',monospace] transition-all cursor-pointer ${
                  speechLang === "ta-IN"
                    ? "bg-cyan-950 border border-cyan-400 text-cyan-200 shadow-[0_0_6px_rgba(0,243,255,0.3)]"
                    : "text-gray-400 hover:text-cyan-300"
                }`}
                title="Tamil & Tanglish Voice"
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => onSelectSpeechLang("en-US")}
                className={`py-0.5 px-1.5 rounded text-[8.5px] font-bold font-['JetBrains_Mono',monospace] transition-all cursor-pointer ${
                  speechLang === "en-US"
                    ? "bg-emerald-950 border border-emerald-400 text-emerald-200 shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                    : "text-gray-400 hover:text-emerald-300"
                }`}
                title="English Voice"
              >
                ENGLISH
              </button>
            </div>

            {/* Mute / Unmute Option */}
            <button
              type="button"
              onClick={onToggleVoiceMuted}
              className={`py-0.5 px-1.5 rounded text-[8.5px] font-bold font-['JetBrains_Mono',monospace] flex items-center gap-1 transition-all cursor-pointer border ${
                isVoiceMuted
                  ? "bg-red-950/80 border-red-500/70 text-red-300 shadow-[0_0_6px_rgba(239,68,68,0.3)]"
                  : "bg-black/60 border-cyan-500/40 text-cyan-200 hover:text-white"
              }`}
              title={isVoiceMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isVoiceMuted ? <VolumeX className="w-2.5 h-2.5 text-red-400" /> : <Volume2 className="w-2.5 h-2.5 text-emerald-400" />}
              <span>{isVoiceMuted ? "MUTED" : "UNMUTED"}</span>
            </button>
          </div>
        )}

        {/* Interrupt / Cut In when active */}
        {(isListening || isSpeaking || isProcessing) && (
          <button
            type="button"
            onClick={onInterrupt}
            className="w-full py-1 px-2 mt-1 rounded-lg border border-red-500/60 bg-red-950/70 text-red-300 hover:bg-red-900 transition-colors flex items-center justify-center gap-1 text-[9px] font-bold cursor-pointer"
            title="Cut in / stop audio immediately"
          >
            <Square className="w-2.5 h-2.5 fill-red-400" />
            <span>CUT IN</span>
          </button>
        )}
      </div>
    );
  }

  // COMPACT HUD MODE (Sleek Horizontal Bar)
  if (compact) {
    return (
      <div className="w-full bg-[#020b18]/90 border border-[var(--theme-primary)]/30 rounded-xl p-2.5 shadow-[0_0_15px_rgba(0,243,255,0.08)] flex flex-col md:flex-row items-center justify-between gap-3 select-none overflow-x-hidden">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0 cursor-pointer" title="Click Arc Reactor to Toggle Voice">
            <ArcReactorOrb 
              state={reactorState} 
              onClick={onReactorTap} 
              size="xs" 
              reactorStyle={reactorStyle} 
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron',sans-serif] text-xs font-bold text-[var(--theme-primary)]">
                ARC REACTOR CORE
              </span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded font-['JetBrains_Mono',monospace] font-bold ${
                reactorState === "listening" ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse" :
                reactorState === "processing" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-spin" :
                reactorState === "speaking" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                "bg-cyan-950 text-cyan-300"
              }`}>
                {reactorState.toUpperCase()}
              </span>
            </div>

            {liveTranscript ? (
              <span className="text-[11px] text-cyan-200 font-['JetBrains_Mono',monospace] truncate max-w-xs md:max-w-md animate-pulse">
                Hearing: &ldquo;{liveTranscript}&rdquo;
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-['JetBrains_Mono',monospace]">
                {voiceMode === "continuous" && isListening ? "Live Continuous Talk Active (Speak anytime)" : "Voice & Text Synchronized. Tap to speak or type."}
              </span>
            )}
          </div>
        </div>

        {/* Compact Voice Controls */}
        <div className="flex items-center gap-1.5 flex-wrap font-['JetBrains_Mono',monospace] text-[11px]">
          <button
            type="button"
            onClick={onToggleContinuous}
            className={`px-2.5 py-1 rounded border text-[10px] font-bold transition-all ${
              isLiveActive
                ? "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,243,255,0.4)]"
                : "bg-black/50 border-gray-700 text-gray-400 hover:text-cyan-300"
            }`}
          >
            CONTINUOUS: {isLiveActive ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={onToggleVoiceMuted}
            className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 transition-all ${
              isVoiceMuted
                ? "bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                : "bg-black/60 border-cyan-500/40 text-cyan-200 hover:text-white"
            }`}
            title={isVoiceMuted ? "Unmute Voice Output" : "Mute Voice Output"}
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isVoiceMuted ? "MUTED" : "LIVE AUDIO"}</span>
          </button>

          {(isListening || isSpeaking || isProcessing) && (
            <button
              type="button"
              onClick={onInterrupt}
              className="px-2 py-1 rounded border border-red-500/60 bg-red-950/70 text-red-300 hover:bg-red-900 text-[10px] font-bold flex items-center gap-1"
            >
              <Square className="w-2.5 h-2.5 fill-red-400" />
              <span>CUT IN</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // EXPANDED INTEGRATED STAGE (Default View)
  return (
    <div className="flex flex-col items-center select-none flex-shrink-0 relative w-full border-b border-[var(--theme-primary)]/20 pb-4 mb-3 overflow-x-hidden">
      
      {/* Standby Wake Word Banner */}
      {wakeWordAlert && (
        <div className="absolute -top-3 z-30 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[11px] font-['Orbitron',sans-serif] font-bold rounded-full shadow-[0_0_20px_#fbbf24] flex items-center gap-1.5 animate-bounce">
          <Zap className="w-3.5 h-3.5 text-black fill-black" />
          <span>{wakeWordAlert}</span>
        </div>
      )}

      {/* Visual Reactor Stage - Proportional and Centered */}
      <div className="relative w-36 h-36 md:w-40 md:h-40 flex items-center justify-center my-1 flex-shrink-0">
        <ArcReactorOrb 
          state={effectiveState} 
          onClick={onReactorTap} 
          size="md" 
          reactorStyle={reactorStyle} 
          audioLevel={audioLevel}
        />
        
        {/* State Pill Beneath Core */}
        {effectiveState !== "idle" && (
          <div className="absolute -bottom-2.5 bg-black/90 border border-cyan-500/40 px-3 py-0.5 rounded-full text-[9px] font-['Orbitron',sans-serif] tracking-wider text-[var(--theme-primary)] shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-center gap-1.5 whitespace-nowrap">
            {effectiveState === "speaking" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold">JARVIS SPEAKING</span>
              </>
            ) : effectiveState === "processing" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-spin" />
                <span className="text-purple-300 font-bold">NEURAL REASONING</span>
              </>
            ) : effectiveState === "listening" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-cyan-300 font-bold">LISTENING</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Active Speaking Interactive Banner with Direct Mute/Unmute */}
      {effectiveState === "speaking" && (
        <div className="w-full max-w-md px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-400/60 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse my-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-['Orbitron',sans-serif] font-bold text-emerald-200 truncate">
                {speechLang === "ta-IN" ? "தமிழ் குரல் ஒலிக்கிறது" : "JARVIS SPEAKING"}
              </span>
              <span className="text-[9px] font-mono text-emerald-300/80">
                {isVoiceMuted ? "குரல் மியூட் செய்யப்பட்டுள்ளது" : "நேரலை குரல் ஒலி (ON)"}
              </span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onToggleVoiceMuted}
            className={`px-3 py-1 rounded-md text-[10px] font-bold font-['JetBrains_Mono',monospace] flex items-center gap-1.5 transition-all cursor-pointer ${
              isVoiceMuted
                ? "bg-red-950 border border-red-400 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.5)] hover:bg-red-900"
                : "bg-black/60 border border-emerald-400 text-emerald-300 hover:bg-red-950 hover:border-red-400 hover:text-red-200"
            }`}
            title={isVoiceMuted ? "தமிழ் குரலை அன்மியூட் செய்" : "தமிழ் குரலை மியூட் செய்"}
          >
            {isVoiceMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span>அன்மியூட் / UNMUTE</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>மியூட் / MUTE</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Real-Time Live Hearing Transcript Banner */}
      {liveTranscript && (
        <div className="w-full max-w-md mt-2 px-3 py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/60 text-cyan-100 text-xs font-['JetBrains_Mono',monospace] flex items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.2)] animate-pulse overflow-hidden break-words">
          <Mic className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold flex-shrink-0">HEARING:</span>
          <span className="truncate text-white font-medium">&ldquo;{liveTranscript}&rdquo;</span>
        </div>
      )}

      {/* SLEEK COMPACT VOICE HUD CONTROLS - SMALL & ELEGANT */}
      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap z-10 font-['JetBrains_Mono',monospace]">
        {/* Language Selection: Tamil / English (Compact Small Buttons) */}
        {speechLang && onSelectSpeechLang && (
          <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-md border border-[var(--theme-primary)]/20 shadow-[0_0_6px_rgba(0,243,255,0.1)]">
            <button
              type="button"
              onClick={() => onSelectSpeechLang("ta-IN")}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer ${
                speechLang === "ta-IN"
                  ? "bg-cyan-950 border border-cyan-400 text-cyan-200 shadow-[0_0_6px_rgba(0,243,255,0.3)]"
                  : "text-gray-400 hover:text-cyan-300"
              }`}
              title="Tamil & Tanglish Voice"
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => onSelectSpeechLang("en-US")}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer ${
                speechLang === "en-US"
                  ? "bg-emerald-950 border border-emerald-400 text-emerald-200 shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                  : "text-gray-400 hover:text-emerald-300"
              }`}
              title="English Voice"
            >
              ENGLISH
            </button>
          </div>
        )}

        {/* Audio Output Mute / Unmute Toggle */}
        <button
          type="button"
          onClick={onToggleVoiceMuted}
          className={`px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 text-[8.5px] font-bold cursor-pointer ${
            isVoiceMuted
              ? "bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_6px_rgba(239,68,68,0.3)]"
              : "bg-black/60 border-cyan-500/30 text-cyan-200 hover:text-white"
          }`}
          title={isVoiceMuted ? "Unmute Audio Output" : "Mute Audio Output"}
        >
          {isVoiceMuted ? <VolumeX className="w-2.5 h-2.5 text-red-400" /> : <Volume2 className="w-2.5 h-2.5 text-emerald-400" />}
          <span>{isVoiceMuted ? "MUTED" : "UNMUTED"}</span>
        </button>

        {/* Interrupt / Cut In (When speaking, listening, or processing) */}
        {(isListening || isSpeaking || isProcessing) && (
          <button
            type="button"
            onClick={onInterrupt}
            className="px-2 py-0.5 rounded-md border border-red-500/60 bg-red-950/70 text-red-300 hover:bg-red-900 transition-colors flex items-center gap-1 text-[8.5px] font-bold shadow-[0_0_6px_rgba(239,68,68,0.3)] cursor-pointer"
            title="Stop speech immediately"
          >
            <Square className="w-2 h-2 fill-red-400" />
            <span>CUT IN</span>
          </button>
        )}
      </div>

    </div>
  );
};
