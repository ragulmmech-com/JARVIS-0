import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Cpu, Languages, Volume2, 
  Zap, Send, Trash2, Maximize2, RefreshCw, 
  Check, Play, WifiOff, Globe, Sliders, Heart, Smile, Paperclip, X, Copy, Shield, ShieldCheck, Lock, Sparkles, ChevronRight,
  ChevronUp, ChevronDown, ArrowUpToLine, ArrowDownToLine, Mic,
  Upload, Image as ImageIcon
} from "lucide-react";
import { generateOfflineResponse, setWebLLMProgressCallback } from "../lib/webLlmService";
import { JARVIS_THEMES } from "../lib/themes";
import { AIModelId, Message, UITheme, ReactorStyle, TacticalTabType, PersonaType } from "../types";
import { jarvisAudio } from "../lib/audioSynthesizer";
import { getGlobalMemoryString } from "../lib/memory";
import { generateChatTranscript } from "../lib/transcript";
import { SmartChatContent } from "./SmartChatContent";
import { MARVEL_REACTOR_THEMES, MarvelReactorTheme } from "../lib/reactorThemes";
import { ArcReactorSvg } from "./ArcReactorSvg";

interface AdvancedWidgetsProps {
  onExecutePrompt: (prompt: string) => void;
  onOpenEngineChat?: (engine?: AIModelId) => void;
  telemetry: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatencyMs: number;
    powerOutputPcnt: number;
    localAgentOnline: boolean;
    activeProcesses: number;
  };
  speechLang?: string;
  onSelectSpeechLang?: (lang: string) => void;
  eqFriendActive?: boolean;
  onToggleEqFriend?: () => void;
  uiTheme?: UITheme;
  onUIThemeChange?: (theme: UITheme) => void;
  reactorStyle?: ReactorStyle;
  onReactorStyleChange?: (style: ReactorStyle) => void;
  externalActiveTab?: TacticalTabType;
  onTabChange?: (tab: TacticalTabType) => void;
  onClose?: () => void;
  selectedModel?: AIModelId;
  onSelectModel?: (model: AIModelId) => void;
  persona?: PersonaType;
  onPersonaChange?: (persona: PersonaType) => void;
  selectedVoiceId?: string;
  onSelectVoiceId?: (voiceId: string) => void;
}

export interface JarvisVoiceOption {
  id: string;
  name: string;
  category: "JARVIS Core" | "Marvel AI" | "Regional" | "Specialized" | "Personal AI";
  tag: string;
  description: string;
  defaultPitch: number;
  defaultRate: number;
  previewSample: string;
}

export const JARVIS_VOICES_COLLECTION: JarvisVoiceOption[] = [
  {
    id: "jarvis-male",
    name: "J.A.R.V.I.S. (Personal AI Agent Voice)",
    category: "Personal AI",
    tag: "Personal AI Agent • Intelligent & Calm • Sovereign Companion",
    description: "கம்பீரமான J.A.R.V.I.S. ஆண் குரல். நுண்ணறிவு மிக்க உங்களின் பிரத்யேக பர்சனல் AI அசிஸ்டன்ட் (Pure 24kHz HD Voice).",
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSample: "வணக்கம்! நான் உங்க பர்சனல் AI J.A.R.V.I.S. உங்களின் அனைத்து சிஸ்டம்களும் 100% ஆன்லைனில் தயார் நிலையில் உள்ளன. என்ன செய்யலாம், சொல்லுங்கள்!"
  },
  {
    id: "friday-female",
    name: "F.R.I.D.A.Y. (Close Friend & Companion Voice)",
    category: "Personal AI",
    tag: "Super Friendly • Natural Conversational Voice • Close Friend",
    description: "இயல்பாக ஒரு நெருங்கிய நண்பரிடம் பேசுவது போன்ற F.R.I.D.A.Y. பெண் குரல். எவ்வித உறவுமுறை அடைமொழிகளும் இல்லாமல் (சித்தி, தங்கச்சி போன்றவை இன்றி) சகஜமாகவும் நட்பாகவும் பேசும் நேச்சுரல் பர்சனல் AI வாய்ஸ் (Pure 24kHz HD Voice).",
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSample: "ஹாய்! நான் உங்க பிரெண்ட் ஃப்ரைடே. சொல்லுங்க, இன்னைக்கு நாம என்ன பண்ணலாம்? நான் உங்களுக்கு உதவ எப்போதும் தயாரா இருக்கேன்."
  }
];

export const AdvancedWidgetsPanel: React.FC<AdvancedWidgetsProps> = ({
  onExecutePrompt,
  onOpenEngineChat,
  telemetry,
  speechLang = "en-IN",
  onSelectSpeechLang,
  eqFriendActive = true,
  onToggleEqFriend,
  uiTheme = "cyan",
  onUIThemeChange,
  reactorStyle = "core-mark1-classic",
  onReactorStyleChange,
  externalActiveTab,
  onTabChange,
  onClose,
  selectedModel = "jarvis-core-mk1",
  onSelectModel,
  persona = "normal",
  onPersonaChange,
  selectedVoiceId = "jarvis-male",
  onSelectVoiceId,
}) => {
  // TACTICAL WIDGET OPTIONS:
  // 1. NEURAL CORES (JARVIS Core Alpha, Neural Matrix, Cognitive Synthesizer, etc.)
  // 2. LANGUAGES
  // 3. VOICE
  // 4. UI THEME
  // 5. REACTOR CORE
  // 6. PERSONA
  const [internalActiveTab, setInternalActiveTab] = useState<TacticalTabType>("persona");
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = (tab: TacticalTabType) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  // 3. LANGUAGES STATE
  const [selectedLanguage, setSelectedLanguage] = useState<"ta" | "en" | "tanglish" | "hi">(() => {
    try {
      const saved = localStorage.getItem("jarvis_system_language");
      if (saved && (saved === "ta" || saved === "en" || saved === "tanglish" || saved === "hi")) {
        return saved as any;
      }
      if (speechLang?.startsWith("ta")) return "ta";
      if (speechLang?.startsWith("hi")) return "hi";
      if (speechLang === "en-US") return "en";
      return "tanglish";
    } catch {
      return "tanglish";
    }
  });

  const handleLanguageSelect = (lang: "ta" | "en" | "tanglish" | "hi") => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem("jarvis_system_language", lang);
    } catch {}
    jarvisAudio.playNotificationSound();

    if (lang === "ta") {
      onSelectSpeechLang?.("ta-IN");
      jarvisAudio.setVoiceProfile("jarvis-human", 1.0, 1.0);
    } else if (lang === "en") {
      onSelectSpeechLang?.("en-US");
      jarvisAudio.setVoiceProfile("jarvis-human", 1.0, 1.0);
    } else if (lang === "tanglish") {
      onSelectSpeechLang?.("en-IN");
      jarvisAudio.setVoiceProfile("jarvis-male", 1.0, 1.0);
    } else if (lang === "hi") {
      onSelectSpeechLang?.("hi-IN");
      jarvisAudio.setVoiceProfile("jarvis-male", 1.0, 1.0);
    }
  };

  // 4. VOICE COLLECTION STATE
  const [activeVoice, setActiveVoice] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("jarvis_selected_voice_id");
      if (saved && (saved === "friday-female" || saved === "friday-human" || saved === "Aoede")) return "friday-female";
      return "jarvis-male";
    } catch {
      return "jarvis-male";
    }
  });
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("jarvis_selected_voice_pitch");
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("jarvis_selected_voice_rate");
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [reactorCategoryFilter, setReactorCategoryFilter] = useState<string>("ALL");

  // Synchronize internal activeVoice state when selectedVoiceId prop changes
  useEffect(() => {
    if (selectedVoiceId) {
      setActiveVoice(selectedVoiceId);
    }
  }, [selectedVoiceId]);

  const handleSelectVoice = (voice: JarvisVoiceOption) => {
    setActiveVoice(voice.id);
    setVoicePitch(voice.defaultPitch);
    setVoiceRate(voice.defaultRate);
    try {
      localStorage.setItem("jarvis_selected_voice_id", voice.id);
      localStorage.setItem("jarvis_selected_voice", voice.id);
      localStorage.setItem("jarvis_selected_voice_pitch", voice.defaultPitch.toString());
      localStorage.setItem("jarvis_selected_voice_rate", voice.defaultRate.toString());
    } catch {}
    jarvisAudio.setActiveVoiceId(voice.id);
    jarvisAudio.setVoiceProfile(voice.id, voice.defaultRate, voice.defaultPitch);
    onSelectVoiceId?.(voice.id);
  };

  const handleTestVoice = (voice: JarvisVoiceOption) => {
    setPreviewingVoiceId(voice.id);
    jarvisAudio.setActiveVoiceId(voice.id);
    jarvisAudio.setVoiceProfile(voice.id, voice.defaultRate, voice.defaultPitch);
    jarvisAudio.speak(voice.previewSample, () => {
      setPreviewingVoiceId(null);
    });
  };

  const tacticalScrollRef = useRef<HTMLDivElement>(null);

  // Helper: Find the currently active scrollable container (supports inner tabs like Theme, Persona, Reactor styles)
  const getActiveTacticalScrollTarget = (): HTMLElement | null => {
    if (!tacticalScrollRef.current) return null;
    const innerScrollable = tacticalScrollRef.current.querySelector<HTMLElement>('.overflow-y-auto');
    if (innerScrollable && innerScrollable.scrollHeight > innerScrollable.clientHeight) {
      return innerScrollable;
    }
    return tacticalScrollRef.current;
  };

  // Listen for voice-driven scrolling in Tactical Widgets
  useEffect(() => {
    const handleVoiceScroll = (e: any) => {
      const direction = e.detail?.direction;
      const amount = e.detail?.amount || 360;
      const target = getActiveTacticalScrollTarget();
      if (!target) return;
      if (direction === "down") {
        target.scrollBy({ top: amount, behavior: "smooth" });
        if (target !== tacticalScrollRef.current) tacticalScrollRef.current?.scrollBy({ top: amount, behavior: "smooth" });
      } else if (direction === "up") {
        target.scrollBy({ top: -amount, behavior: "smooth" });
        if (target !== tacticalScrollRef.current) tacticalScrollRef.current?.scrollBy({ top: -amount, behavior: "smooth" });
      } else if (direction === "bottom") {
        target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
      } else if (direction === "top") {
        target.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("jarvis-scroll", handleVoiceScroll);
    return () => window.removeEventListener("jarvis-scroll", handleVoiceScroll);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full justify-between overflow-hidden">
      {/* Top Header & 4 Strict Tab Options */}
      <div>
        <div className="flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--theme-primary)]" />
            <h2 className="font-['Orbitron',sans-serif] text-xs font-bold tracking-widest text-[var(--theme-primary)]">
              TACTICAL WIDGETS
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-[9px] font-['JetBrains_Mono',monospace] text-cyan-300 uppercase">
              {activeTab}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Collapse Tactical Widgets"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Tabs: PERSONA, REACTOR CORE, LANGUAGES, VOICE, UI THEMES */}
        <div className="grid grid-cols-5 gap-1 bg-[var(--theme-secondary)] p-1 rounded-lg border border-[var(--theme-primary)]/20 mb-3 font-['JetBrains_Mono',monospace] text-[10px]">
          {/* Tab: Persona Matrix */}
          <button
            onClick={() => setActiveTab("persona")}
            className={`py-1 rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === "persona"
                ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold border border-[var(--theme-primary)]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Persona Matrix (Friend, Lover, Professor, Scientist, Military, etc.)"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>PERSONA</span>
          </button>

          {/* Tab: Reactor Core */}
          <button
            onClick={() => setActiveTab("reactor_change")}
            className={`py-1 rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === "reactor_change"
                ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold border border-[var(--theme-primary)]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Holographic Reactor Cores"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>REACTOR</span>
          </button>

          {/* Tab: Languages */}
          <button
            onClick={() => setActiveTab("languages")}
            className={`py-1 rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === "languages"
                ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold border border-[var(--theme-primary)]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Language & Multilingual Settings (Tamil, English, Tanglish)"
          >
            <Languages className="w-3 h-3 text-emerald-400" />
            <span>LANG</span>
          </button>

          {/* Tab: Voice */}
          <button
            onClick={() => setActiveTab("voice")}
            className={`py-1 rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === "voice"
                ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold border border-[var(--theme-primary)]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="JARVIS Voices Collection"
          >
            <Volume2 className="w-3 h-3 text-purple-400" />
            <span>VOICE</span>
          </button>

          {/* Tab: UI Change */}
          <button
            onClick={() => setActiveTab("ui_change")}
            className={`py-1 rounded flex items-center justify-center gap-1 transition-all ${
              activeTab === "ui_change"
                ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold border border-[var(--theme-primary)]/40 shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Change User Interface Theme"
          >
            <Sliders className="w-3 h-3 text-rose-400" />
            <span>THEME</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div 
        ref={tacticalScrollRef}
        data-scroll-container="true"
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin font-['JetBrains_Mono',monospace]"
      >

        {/* OPTION: LANGUAGES & EQ FRIEND MATRIX */}
        {activeTab === "languages" && (
          <div className="space-y-2.5">
            {/* STT Speech Recognition Language Engine */}
            <div className="p-2.5 rounded-lg bg-[var(--theme-secondary)]/90 border border-[var(--theme-primary)]/30 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  SPEECH RECOGNITION (STT)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  {speechLang}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                Select your speech input dialect for the microphone and Live Arc Reactor:
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectSpeechLang && onSelectSpeechLang("ta-IN")}
                  className={`p-2 rounded text-center border transition-all text-[11px] cursor-pointer ${
                    speechLang === "ta-IN"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.3)] font-bold ring-1 ring-cyan-400"
                      : "bg-black/50 text-gray-400 border-gray-800 hover:text-gray-200"
                  }`}
                  title="Direct Tamil script & spoken Tamil (Tanglish is inbuilt)"
                >
                  <div className="font-bold">தமிழ் (TAMIL)</div>
                  <div className="text-[8px] text-gray-400 mt-0.5">ta-IN • Tanglish இன்பில்ட்</div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSpeechLang && onSelectSpeechLang("en-US")}
                  className={`p-2 rounded text-center border transition-all text-[11px] cursor-pointer ${
                    speechLang === "en-US"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] font-bold ring-1 ring-emerald-400"
                      : "bg-black/50 text-gray-400 border-gray-800 hover:text-gray-200"
                  }`}
                  title="Standard English"
                >
                  <div className="font-bold">ENGLISH</div>
                  <div className="text-[8px] text-gray-400 mt-0.5">en-US • Standard Voice</div>
                </button>
              </div>
            </div>

            {/* EQ FRIEND COMPANION STATUS (Silent Backend Engine) */}
            <div 
              onClick={() => onToggleEqFriend && onToggleEqFriend()}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all space-y-1.5 ${
                eqFriendActive 
                  ? "bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "bg-black/50 border-gray-800 hover:border-gray-700"
              }`}
              title="Click to toggle EQ Friend Matrix"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className={`flex items-center gap-1.5 font-bold ${eqFriendActive ? "text-emerald-300" : "text-gray-400"}`}>
                  <Smile className={`w-3.5 h-3.5 ${eqFriendActive ? "text-emerald-400" : "text-gray-500"}`} />
                  EQ FRIEND & EMOTION SYNAPSE
                </span>
                <span className={`flex items-center gap-1 text-[9px] font-bold ${eqFriendActive ? "text-emerald-400" : "text-gray-500"}`}>
                  {eqFriendActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE IN BACKEND
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      OFFLINE
                    </>
                  )}
                </span>
              </div>
              <p className={`text-[10px] leading-snug ${eqFriendActive ? "text-emerald-100/70" : "text-gray-500"}`}>
                Detects emotions and replies like a real caring friend in Tamil & English. Zero &quot;Sir&quot; or &quot;Boss&quot; hierarchy.
              </p>
            </div>

            {/* Language Preset Cards */}
            <div className="space-y-1.5">
              {/* Tamil Card */}
              <div
                onClick={() => handleLanguageSelect("ta")}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  selectedLanguage === "ta"
                    ? "bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                    : "bg-[var(--theme-secondary)] border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-cyan-300">தமிழ் (Tamil - Inbuilt Tanglish)</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      தமிழ் பேச்சு & எழுத்து • Tanglish தானாகவே இன்பில்ட்டாக இயங்கும்
                    </div>
                  </div>
                  {selectedLanguage === "ta" && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              </div>

              {/* English */}
              <div
                onClick={() => handleLanguageSelect("en")}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  selectedLanguage === "en"
                    ? "bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                    : "bg-[var(--theme-secondary)] border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-cyan-300">English (System Standard)</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      Fluent English conversational responses with warm, friendly tone
                    </div>
                  </div>
                  {selectedLanguage === "en" && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              </div>
            </div>

            {/* Quick Test Prompt */}
            <button
              onClick={() => onExecutePrompt(selectedLanguage === "ta" ? "வணக்கம் ஜார்விஸ், இன்றைய முக்கிய செய்திகளை சுருக்கமாக கூறுங்கள்." : "Jarvis, indha app eppadi work aagudhu nu sollunga.")}
              className="w-full py-2 rounded bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/30 text-cyan-200 hover:bg-[var(--theme-primary)]/10 text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>TEST DIALECT WITH J.A.R.V.I.S.</span>
            </button>
          </div>
        )}

        {/* OPTION 4: VOICE (JARVIS COLLECTION) */}
        {activeTab === "voice" && (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-lg bg-[var(--theme-secondary)]/90 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  J.A.R.V.I.S. VOICES COLLECTION
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/60 border border-purple-500/40 text-purple-300">
                  {JARVIS_VOICES_COLLECTION.length} PROFILES
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                Select your preferred vocal persona from JARVIS's collection. Listen to previews and customize cadence.
              </p>
            </div>

            {/* Voice List Items */}
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-0.5 scrollbar-thin">
              {JARVIS_VOICES_COLLECTION.map((voice) => {
                const isSelected = activeVoice === voice.id;
                const isPreviewing = previewingVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        : "bg-[var(--theme-secondary)] border-gray-800 text-gray-300 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => handleSelectVoice(voice)}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-purple-200">{voice.name}</span>
                          {isSelected && <span className="text-[8px] bg-purple-500/30 text-purple-300 px-1 rounded border border-purple-500/40">ACTIVE</span>}
                        </div>
                        <div className="text-[9px] text-[var(--theme-primary)] mt-0.5">{voice.tag}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{voice.description}</div>
                      </div>

                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleTestVoice(voice)}
                          disabled={isPreviewing}
                          className="p-1.5 rounded bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-purple-300 transition-all text-[10px] flex items-center gap-1"
                          title="Preview this voice"
                        >
                          <Play className={`w-3 h-3 ${isPreviewing ? "animate-spin text-purple-200" : ""}`} />
                          <span className="text-[8px]">TEST</span>
                        </button>
                        <button
                          onClick={() => handleSelectVoice(voice)}
                          className={`p-1.5 rounded text-[10px] border transition-all ${
                            isSelected 
                              ? "bg-purple-500 text-black border-purple-400 font-bold"
                              : "border-gray-700 text-gray-400 hover:bg-purple-950/30"
                          }`}
                          title="Apply voice"
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : "USE"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Real-time Pitch and Rate Customization Sliders */}
            <div className="p-2 rounded-lg bg-[var(--theme-secondary)] border border-purple-500/20 space-y-2 text-[10px]">
              <div className="flex items-center justify-between text-purple-300">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  CADENCE TUNING
                </span>
                <span className="text-gray-400 text-[9px]">Rate: {voiceRate.toFixed(2)}x | Pitch: {voicePitch.toFixed(2)}</span>
              </div>

              {/* Rate Slider */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Speed:</span>
                  <span>{voiceRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoiceRate(val);
                    jarvisAudio.setVoiceProfile(activeVoice, val, voicePitch);
                  }}
                  className="w-full accent-purple-400 cursor-pointer h-1 bg-black rounded"
                />
              </div>

              {/* Pitch Slider */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Pitch:</span>
                  <span>{voicePitch}</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoicePitch(val);
                    jarvisAudio.setVoiceProfile(activeVoice, voiceRate, val);
                  }}
                  className="w-full accent-purple-400 cursor-pointer h-1 bg-black rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: UI CHANGE (THEME) CONTENT */}
        {activeTab === "ui_change" && (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Sliders className="w-4 h-4 text-rose-400" />
              <span className="font-['Orbitron',sans-serif] text-[11px] font-bold text-rose-400 tracking-wider">
                CORE THEME SELECTION
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-[var(--theme-primary)]/20">
              
              {JARVIS_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onUIThemeChange && onUIThemeChange(theme.id)}
                  className={`w-full text-left p-2.5 rounded-lg border flex flex-col gap-1 transition-all ${
                    uiTheme === theme.id
                      ? "bg-black/80 border-opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      : "bg-black/40 border-gray-800/80 hover:bg-black/60"
                  }`}
                  style={{
                    borderColor: uiTheme === theme.id ? theme.primary : "rgba(75, 85, 99, 0.4)",
                    boxShadow: uiTheme === theme.id ? `0 0 15px ${theme.primary}40` : "none"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[11px] font-['Orbitron',sans-serif] font-bold"
                      style={{ color: uiTheme === theme.id ? theme.primary : "#d1d5db" }}
                    >
                      {theme.name}
                    </span>
                    {uiTheme === theme.id && <Check className="w-3.5 h-3.5" style={{ color: theme.primary }} />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <p className="text-[9px] font-['JetBrains_Mono',monospace] text-gray-500">
                      {theme.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* TACTICAL TAB 6: 10 PURE HOLOGRAPHIC AI CORES (J.A.R.V.I.S., F.R.I.D.A.Y., STARK VR) */}
        {activeTab === "reactor_change" && (
          <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                <h3 className="text-xs font-bold text-[var(--theme-primary)] tracking-widest font-['Orbitron',sans-serif]">
                  HOLOGRAPHIC AI CORES (7)
                </h3>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/40 text-[var(--theme-primary)] font-bold">
                MCU HOLOGRAM
              </span>
            </div>
            
            <p className="text-[10px] text-gray-400 mb-2.5 px-1 leading-relaxed">
              Stark Arc Reactor & J.A.R.V.I.S. Holographic VR AI Cores (7).
            </p>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 font-['JetBrains_Mono',monospace] text-[9px] scrollbar-none">
              {[
                { id: "ALL", label: "ALL CORES (7)" },
                { id: "Stark Labs", label: "STARK LABS (4)" },
                { id: "J.A.R.V.I.S. VR", label: "J.A.R.V.I.S. VR (3)" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setReactorCategoryFilter(chip.id)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-all border ${
                    reactorCategoryFilter === chip.id
                      ? "bg-[var(--theme-primary)] text-black font-bold border-[var(--theme-primary)] shadow-[0_0_8px_var(--theme-primary)]"
                      : "bg-black/40 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* 10 Holographic Cores Grid */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--theme-primary)]/20 space-y-2">
              {MARVEL_REACTOR_THEMES.filter((theme) =>
                reactorCategoryFilter === "ALL" ? true : theme.category === reactorCategoryFilter
              ).map((theme) => {
                const isSelected = reactorStyle === theme.id;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => onReactorStyleChange && onReactorStyleChange(theme.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-all relative overflow-hidden group ${
                      isSelected
                        ? "bg-[var(--theme-primary)]/15 border-[var(--theme-primary)] shadow-[0_0_12px_rgba(0,243,255,0.2)] text-white"
                        : "bg-black/50 border-gray-800/80 hover:border-gray-700 hover:bg-white/5 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Live Mini Holographic Reactor Preview */}
                      <div className="w-11 h-11 flex-shrink-0 bg-black/90 rounded-lg p-0.5 border border-cyan-500/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_10px_rgba(0,243,255,0.15)] group-hover:border-cyan-400 transition-colors">
                        <ArcReactorSvg 
                          styleId={theme.id} 
                          glowColor={theme.color} 
                          isSpeaking={isSelected}
                          audioLevel={isSelected ? 30 : 0}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block flex-shrink-0 animate-pulse"
                            style={{ backgroundColor: theme.color, boxShadow: `0 0 6px ${theme.color}` }}
                          />
                          <span className={`text-[10px] font-['Orbitron',sans-serif] font-bold truncate ${isSelected ? "text-[var(--theme-primary)]" : "text-gray-200"}`}>
                            {theme.name}
                          </span>
                          <span
                            className="text-[8px] font-mono px-1 py-0.2 rounded border ml-auto flex-shrink-0 font-bold"
                            style={{
                              backgroundColor: `${theme.color}20`,
                              borderColor: `${theme.color}60`,
                              color: theme.color
                            }}
                          >
                            {theme.badge}
                          </span>
                        </div>
                        <div className="text-[9px] text-[var(--theme-primary)]/80 font-mono mb-0.5 truncate">
                          {theme.tag}
                        </div>
                        <div className="text-[8px] text-gray-400 line-clamp-1 italic">
                          {theme.description}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-1 flex flex-col items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[var(--theme-primary)] text-black border-[var(--theme-primary)] shadow-[0_0_8px_var(--theme-primary)]"
                              : "border-gray-700 text-transparent group-hover:border-gray-500"
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TACTICAL TAB 7: PERSONA SETTINGS */}
        {activeTab === "persona" && (
          <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Smile className="w-4 h-4 text-pink-400 animate-pulse" />
              <h3 className="text-xs font-bold text-pink-400 tracking-widest font-['Orbitron',sans-serif]">
                J.A.R.V.I.S. PERSONA MATRIX
              </h3>
            </div>
            
            <p className="text-[10px] text-gray-400 mb-2 px-1">
              Select JARVIS's active personality algorithm. Every response and vocal tone strictly conforms to the selected persona.
            </p>

            <div className="mb-2.5 px-2 py-1.5 rounded-md bg-pink-950/20 border border-pink-500/30 flex items-center justify-between text-[10px]">
              <span className="text-gray-400 font-['Orbitron',sans-serif]">CURRENT ACTIVE:</span>
              <span className="text-pink-400 font-bold uppercase tracking-wider">
                {persona || "NORMAL_JARVIS"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-500/20 flex flex-col gap-2">
              {[
                { 
                  id: "NORMAL_JARVIS", 
                  name: "J.A.R.V.I.S. Default", 
                  desc: "Default J.A.R.V.I.S.: Speaks naturally and crisply like an intelligent assistant and loyal companion." 
                },
                { 
                  id: "FRIEND", 
                  name: "Best Friend (Hyper-Casual & Loveable)", 
                  desc: "Ride-or-die buddy: Energetic slang ('Bro / Machi / Homie'), jokes, deep emotional care & hype." 
                },
                { 
                  id: "PROFESSIONAL", 
                  name: "Executive Professional", 
                  desc: "Corporate consultant: Strictly formal, polished, executive summaries, zero slang, maximum efficiency." 
                },
                { 
                  id: "PROFESSOR", 
                  name: "Scholarly Professor", 
                  desc: "Academic mentor: Explains from foundational first principles, deep analogies, thought-provoking questions." 
                },
                { 
                  id: "SCIENTIST", 
                  name: "Empirical Scientist", 
                  desc: "Rigorous researcher: Data-driven, physics laws, hypothesis testing, mathematical models, evidence-first." 
                },
                { 
                  id: "STUDENT", 
                  name: "Curious Student", 
                  desc: "Eager study partner: Inquisitive, humble, asks follow-up questions, learns side-by-side with you." 
                },

                { 
                  id: "DOCTOR", 
                  name: "Medical Doctor", 
                  desc: "Physician & health expert: Calm bedside manner, evidence-based wellness, sleep, ergonomics, and reassurance." 
                },
                { 
                  id: "MILITARY", 
                  name: "Tactical Commander", 
                  desc: "Special forces lead: Terse, decisive, military terminology ('Affirmative / Roger / SitRep'), mission execution." 
                },
                { 
                  id: "CYBER_SECURITY", 
                  name: "Cybersecurity Analyst", 
                  desc: "Paranoid OpSec operative: Zero-trust mindset, vulnerability hunting, encryption, and threat modeling." 
                },
                { 
                  id: "SIBLINGS", 
                  name: "Playful Sibling", 
                  desc: "Teasing brother/sister: Roast-master banter, playful eye-rolls, but fiercely protective and loyal underneath." 
                },
              ].map(p => {
                const isActive = (persona || "NORMAL_JARVIS") === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onPersonaChange && onPersonaChange(p.id as PersonaType)}
                    className={`w-full text-left p-2.5 rounded-lg border flex flex-col gap-1 transition-all ${
                      isActive
                        ? "bg-pink-950/40 border-pink-500 shadow-[0_0_14px_rgba(236,72,153,0.35)] text-pink-300 ring-1 ring-pink-500/50"
                        : "bg-black/40 border-gray-800/80 hover:border-pink-500/30 hover:bg-pink-900/10 text-gray-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-['Orbitron',sans-serif] font-bold ${isActive ? "text-pink-300" : "text-gray-300"}`}>
                        {p.name}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                          <Check className="w-3 h-3 text-pink-400" /> ACTIVE
                        </span>
                      )}
                    </div>
                    <div className={`text-[9px] leading-relaxed ${isActive ? "text-pink-200/80" : "text-gray-500"}`}>
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Scroll Navigation Controls & Voice Indicator */}
        <div className="sticky bottom-1 right-1 self-end z-20 flex items-center gap-1.5 p-1 rounded-xl bg-black/90 backdrop-blur-md border border-[var(--theme-primary)]/40 shadow-xl mt-2">
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[var(--theme-primary)]/10 text-[9px] text-[var(--theme-primary)] font-mono">
            <Mic className="w-2.5 h-2.5 animate-pulse text-[var(--theme-primary)]" />
            <span>Voice: "ஸ்க்ரோல் பண்ணு"</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const target = getActiveTacticalScrollTarget();
              target?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
            title="Scroll to Top (தொடக்கத்திற்கு)"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const target = getActiveTacticalScrollTarget();
              target?.scrollBy({ top: -300, behavior: "smooth" });
              if (target !== tacticalScrollRef.current) tacticalScrollRef.current?.scrollBy({ top: -300, behavior: "smooth" });
            }}
            className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
            title="Scroll Up (மேலே ஸ்க்ரோல்)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const target = getActiveTacticalScrollTarget();
              target?.scrollBy({ top: 300, behavior: "smooth" });
              if (target !== tacticalScrollRef.current) tacticalScrollRef.current?.scrollBy({ top: 300, behavior: "smooth" });
            }}
            className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
            title="Scroll Down (கீழே ஸ்க்ரோல்)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const target = getActiveTacticalScrollTarget();
              target?.scrollTo({ top: target.scrollHeight || 10000, behavior: "smooth" });
            }}
            className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
            title="Scroll to Bottom (கடைசி வரைக்கும்)"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="mt-2.5 pt-2.5 border-t border-[var(--theme-primary)]/20 flex items-center justify-between text-[9px] font-['JetBrains_Mono',monospace] text-gray-400">
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-cyan-400" />
          SYSTEM: OPTIMAL
        </span>
        <span className="text-emerald-400 flex items-center gap-1">
          <Check className="w-3 h-3" />
          AUTO-SYNC ACTIVE
        </span>
      </div>
    </div>
  );
};
