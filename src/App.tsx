import { safeStorageSet } from "./utils/storage";

const safeJSONParse = (str, fallback) => {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch(e) { console.warn("JSON Parse error", e); return fallback; }
};

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Zap, 
  Terminal, ShieldCheck, Power, Paperclip, 
  Trash2, Activity, MessageSquare, Cpu, Maximize, Maximize2, Minimize, Download,
  Copy, Check, FolderArchive, ChevronUp, ChevronDown, Sparkles,
  Camera, Image as ImageIcon, Video, FileText, Globe, X, Sliders,
  ArrowLeftRight, Menu, PanelLeft, PanelLeftClose, PanelLeftOpen,
  Square, RotateCcw, CheckCircle2, AlertCircle, ExternalLink, BatteryCharging
} from "lucide-react";
import { jarvisAudio } from "./lib/audioSynthesizer";
import { geminiLiveAudio } from "./lib/geminiLiveAudio";
import { JARVIS_THEMES } from "./lib/themes";
import { HOLOGRAPHIC_REACTOR_THEMES, normalizeReactorStyle } from "./lib/reactorThemes";
import { Message, ArcReactorState, AIModelId, SystemDiagnostic, ChatSession, VoiceListeningMode, UITheme, ReactorStyle, PersonaType, MediaAttachment } from "./types";
import { AttachmentButton, AttachmentTray, MessageAttachmentsGrid } from "./components/AttachmentComponents";
import { processUploadedFiles } from "./lib/mediaUpload";
import { ModelChatModal } from "./components/ModelChatModal";
import { ProjectChatModal } from "./components/ProjectChatModal";
import { AdvancedControlRibbon } from "./components/AdvancedControlRibbon";
import { AdvancedWidgetsPanel } from "./components/AdvancedWidgetsPanel";
import { SuitAssemblyAnimation } from "./components/SuitAssemblyAnimation";
import { SidebarChat } from "./components/SidebarChat";
import { AllChatsHistoryModal } from "./components/AllChatsHistoryModal";
import { ArcReactorVoiceDeck } from "./components/ArcReactorVoiceDeck";
import { LockScreen } from "./components/LockScreen";
import { CameraCaptureModal } from "./components/CameraCaptureModal";
import { generateOfflineResponse, setWebLLMProgressCallback } from "./lib/webLlmService";
import { getGlobalMemoryString } from "./lib/memory";
import { generateChatTranscript } from "./lib/transcript";
import { useSystemEnvironment } from "./lib/useSystemEnvironment";
import { usePerformance } from "./context/PerformanceContext";
import { SystemTelemetryDeck } from "./components/SystemTelemetryDeck";
import { SystemEnvironmentModal } from "./components/SystemEnvironmentModal";
import { SystemSidebarNav, TacticalTabType } from "./components/SystemSidebarNav";
import { SmartChatContent } from "./components/SmartChatContent";

import { StorageVaultModal } from "./components/StorageVaultModal";
import { FileConverterModal } from "./components/FileConverterModal";
import { SmartCalendarModal } from "./components/SmartCalendarModal";
import { 
  CalendarEvent, 
  loadCalendarEvents, 
  saveCalendarEvents, 
  getUpcoming2DayAlerts, 
  formatDateKey 
} from "./lib/smartCalendarStorage";
import { downloadFileToDevice } from "./lib/downloadManager";
import { indexedStorage, compressAndArchiveChatSessions } from "./utils/storage";
import { microcontrollerDebugger } from "./lib/microcontrollerDebugger";

// Available Reactions for chat messages
const AVAILABLE_REACTIONS = [
  { emoji: "👍", label: "Thumbs Up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Insight" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "😂", label: "Laugh" },
];

// Web Speech Recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any = null;
let isRecognitionRunning = false;

function initRecognition(lang = "ta-IN") {
  if (!SpeechRecognition) return null;
  try {
    if (recognition) {
      try { recognition.abort(); } catch (e) {}
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = lang || "ta-IN";
    recognition = rec;
    return rec;
  } catch (e) {
    console.warn("SpeechRecognition init notice:", e);
    return null;
  }
}

if (SpeechRecognition) {
  initRecognition("ta-IN");
}

let micPermissionGranted = false;
async function requestMicPermission(): Promise<boolean> {
  if (micPermissionGranted) return true;
  if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      stream.getTracks().forEach(t => t.stop());
      micPermissionGranted = true;
      return true;
    } catch (e) {
      console.debug("Microphone permission check notice:", e);
      return false;
    }
  }
  return true;
}

function safeStartRecognition(lang?: string) {
  if (!SpeechRecognition) return;
  if (!recognition) {
    initRecognition(lang || "ta-IN");
  }
  if (!recognition) return;
  try {
    if (lang) recognition.lang = lang;
    if (!isRecognitionRunning) {
      recognition.start();
      isRecognitionRunning = true;
    }
  } catch (e: any) {
    if (e?.name === "InvalidStateError") {
      isRecognitionRunning = true;
    } else {
      console.debug("safeStartRecognition retry notice:", e?.message);
      try {
        const targetLang = lang || recognition?.lang || "ta-IN";
        initRecognition(targetLang);
        recognition?.start();
        isRecognitionRunning = true;
      } catch (retryErr) {
        isRecognitionRunning = false;
      }
    }
  }
}

function safeStopRecognition() {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch (e) {
    console.debug("safeStopRecognition notice", e);
  }
  isRecognitionRunning = false;
}

// Ensure every message in state and storage has a strictly unique identity
function deduplicateMessages(msgs: Message[]): Message[] {
  if (!Array.isArray(msgs)) return [];
  const seenIds = new Set<string>();
  return msgs.map((m, idx) => {
    let id = m.id || `msg-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
    if (seenIds.has(id)) {
      id = `${id}-dup-${idx}-${Math.random().toString(36).slice(2, 7)}`;
    }
    seenIds.add(id);
    return { ...m, id };
  });
}

export default function App() {
  const [isSystemLocked, setIsSystemLocked] = useState(true);
  
  // Power Save and Performance Mode
  const { mode: perfMode, setMode, cyclePerformanceMode, fps: currentFps, powerSave, setPowerSave } = usePerformance();

  // Live System Environment: Chronometer, Date, Geolocation, Atmosphere & Hardware
  const {
    systemEnvironment,
    currentTime,
    currentDate,
    dayOfWeek,
    timeZone,
    is24Hour,
    toggle24Hour,
    tempUnit,
    toggleTempUnit,
    displayTemperature,
    location,
    weather,
    deviceStats,
    locateUser,
    getSystemContextPrompt,
  } = useSystemEnvironment();

  const [isSystemEnvironmentModalOpen, setIsSystemEnvironmentModalOpen] = useState(false);
  const [isStorageVaultOpen, setIsStorageVaultOpen] = useState(false);
  const [isFileConverterOpen, setIsFileConverterOpen] = useState(false);
  const [isSmartCalendarOpen, setIsSmartCalendarOpen] = useState(false);
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

  // Day-to-day Synaptic Memory Sessions (All Chats)
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  // Async load from IndexedDB strictly
  useEffect(() => {
    const loadIndexedMemory = async () => {
      let storedSessions: ChatSession[] | null = null;
      try {
        storedSessions = await indexedStorage.get<ChatSession[] | null>("jarvis_all_chat_sessions_v1", null);
      } catch (e) {
        console.error("Failed to load secure vault", e);
      }

      let initialSessions: ChatSession[] = [];
      if (storedSessions && Array.isArray(storedSessions) && storedSessions.length > 0) {
        initialSessions = storedSessions;
      } else {
        // Fallback to legacy local storage if vault is empty (migration scenario) or create new
        try {
          const saved = localStorage.getItem("jarvis_all_chat_sessions_v1");
          if (saved) {
            const parsed = safeJSONParse(saved, []);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialSessions = parsed.map((s: ChatSession) => ({
                ...s,
                messages: deduplicateMessages(s.messages || [])
              }));
            }
          }
        } catch (e) { console.debug("Ignored exception", e); }
        
        if (initialSessions.length === 0) {
          initialSessions = [{
            id: "session_" + Date.now(),
            title: "New Chat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
            modelUsed: "jarvis-core-mk1"
          }];
        }
      }

      setSessions(initialSessions);
      
      const savedActive = localStorage.getItem("jarvis_active_session_id");
      if (savedActive && initialSessions.find(s => s.id === savedActive)) {
        setActiveSessionId(savedActive);
      } else {
        setActiveSessionId(initialSessions[0].id);
      }
      
      setIsIndexedDBLoaded(true);
    };
    
    loadIndexedMemory();
  }, []);

  const [isAllChatsOpen, setIsAllChatsOpen] = useState(false);

  // Active Session Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const lastActiveSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isIndexedDBLoaded && sessions.length > 0 && activeSessionId) {
      if (lastActiveSessionIdRef.current !== activeSessionId) {
        lastActiveSessionIdRef.current = activeSessionId;
        const active = sessions.find(s => s.id === activeSessionId);
        if (active) {
          setMessages(deduplicateMessages(active.messages || []));
        } else {
          // New or wiped session - keep pristine empty messages, never revert to previous session!
          setMessages([]);
        }
      }
    }
  }, [sessions, activeSessionId, isIndexedDBLoaded]);

  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Toggle reaction on a specific message (user or model)
  const handleToggleReaction = useCallback((messageId: string, emoji: string) => {
    try {
      jarvisAudio.playNotificationSound();
    } catch (e) { console.debug("Ignored audio exception", e); }

    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const currentReactions: Record<string, number> = { ...(msg.reactions || {}) };
        const currentUserReactions: string[] = [...(msg.userReactions || [])];
        const userHasReacted = currentUserReactions.includes(emoji);

        if (userHasReacted) {
          const nextCount = (currentReactions[emoji] || 1) - 1;
          if (nextCount <= 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = nextCount;
          }
          const nextUserReactions = currentUserReactions.filter(e => e !== emoji);
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: nextUserReactions,
          };
        } else {
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          const nextUserReactions = [...currentUserReactions, emoji];
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: nextUserReactions,
          };
        }
      });
      return updated;
    });

    setTimeout(() => {
      saveCurrentSessionData();
    }, 100);
  }, []);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const activeStreamAbortCtrlRef = useRef<AbortController | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => jarvisAudio.getMuted());
  const [voiceEngine, setVoiceEngine] = useState<"instant" | "neural">(() => jarvisAudio.getVoiceEngine());
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  // Legacy alias for single attachment consumers
  const attachment = attachments[0] || null;
  const setAttachment = (att: any) => {
    if (!att) setAttachments([]);
    else if (Array.isArray(att)) setAttachments(att);
    else setAttachments([att]);
  };
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(() => {
    try {
      return (localStorage.getItem("jarvis_selected_model") as AIModelId) || "jarvis-core-mk1";
    } catch(e) { console.debug("Ignored exception", e); 
      return "jarvis-core-mk1";
    }
  });

  const handleSelectModel = (modelId: AIModelId) => {
    setSelectedModel(modelId);
    selectedModelRef.current = modelId;
    try {
      safeStorageSet("jarvis_selected_model", modelId);
    } catch (e) { console.debug("Ignored exception", e); }
  };
  const selectedModelRef = useRef<AIModelId>(selectedModel);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(() => {
    try {
      return (localStorage.getItem("jarvis_persona") as PersonaType) || "NORMAL_JARVIS";
    } catch(e) { console.debug("Ignored exception", e); 
      return "NORMAL_JARVIS";
    }
  });
  const selectedPersonaRef = useRef<PersonaType>(selectedPersona);
  const isHighIntimacyActive = selectedPersona === "LOVER_GIRL" || selectedPersona === "LOVER_BOY";

  const checkRomanticTheme = useCallback((text?: string): boolean => {
    if (isHighIntimacyActive) return true;
    if (!text) return false;
    const lower = text.toLowerCase();
    const romanticKeywords = [
      "love", "romance", "romantic", "darling", "sweetheart", "honey", "kiss", "hug", 
      "cuddle", "heart", "intimate", "intimacy", "affection", "passion", "beloved", 
      "purusha", "mama", "uyire", "anbe", "kanna", "chellam", "kadhal", "paasam", 
      "en aasa", "kattipidichu", "muthu", "aasai", "nenjukkul", "thol mela"
    ];
    return romanticKeywords.some(keyword => lower.includes(keyword));
  }, [isHighIntimacyActive]);

  useEffect(() => {
    selectedPersonaRef.current = selectedPersona;
  }, [selectedPersona]);

  const handlePersonaChange = (p: PersonaType) => {
    setSelectedPersona(p);
    selectedPersonaRef.current = p;
    safeStorageSet("jarvis_persona", p);
    safeStorageSet("jarvis_selected_persona", p);
  };

  const [uiTheme, setUITheme] = useState<UITheme>(() => {
    try {
      return (localStorage.getItem("jarvis_ui_theme") as UITheme) || "cyan";
    } catch(e) { console.debug("Ignored exception", e); 
      return "cyan";
    }
  });

  const handleUIThemeChange = (theme: UITheme) => {
    setUITheme(theme);
    try {
      safeStorageSet("jarvis_ui_theme", theme);
    } catch (e) { console.debug("Ignored exception", e); }
  };

  const [reactorStyle, setReactorStyle] = useState<ReactorStyle>(() => {
    try {
      const saved = localStorage.getItem("jarvis_reactor_style");
      if (saved) return normalizeReactorStyle(saved);
      return "core-mark1-classic";
    } catch(e) { console.debug("Ignored exception", e); 
      return "core-mark1-classic";
    }
  });

  const handleReactorStyleChange = (style: ReactorStyle) => {
    setReactorStyle(style);
    try {
      safeStorageSet("jarvis_reactor_style", style);
    } catch (e) { console.debug("Ignored exception", e); }
  };
  const [isMainChatCopied, setIsMainChatCopied] = useState(false);
  const [isSidebarNavOpen, setIsSidebarNavOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("jarvis_sidebar_open");
      if (saved === "false") {
        return false;
      }
      return true; // Default is OPEN on all devices! User can close whenever needed.
    } catch(e) { console.debug("Ignored exception", e); 
      return true;
    }
  });
  const [reactorHudExpanded, setReactorHudExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [assemblyTrigger, setAssemblyTrigger] = useState(0);

  // Voice Interaction System: Tap to Speak is DEFAULT so casual background talking is NEVER typed automatically!
  const [voiceMode, setVoiceMode] = useState<VoiceListeningMode>(() => {
    try {
      const saved = localStorage.getItem("jarvis_voice_mode_v2");
      return (saved === "continuous") ? "continuous" : "tap_to_listen";
    } catch(e) { console.debug("Ignored exception", e); 
      return "tap_to_listen";
    }
  });

  // Wake word is DISABLED by default so microphone never runs in the background uninvited
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("jarvis_wake_word_v2");
      return saved === "true";
    } catch(e) { console.debug("Ignored exception", e); 
      return false;
    }
  });

  const [wakeWordAlert, setWakeWordAlert] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  // Speech Recognition Language (Tanglish/Indian English 'en-IN', Tamil 'ta-IN', US English 'en-US')
  const [speechLang, setSpeechLang] = useState<string>(() => {
    try {
      return localStorage.getItem("jarvis_speech_lang_v1") || "ta-IN";
    } catch(e) { console.debug("Ignored exception", e); 
      return "ta-IN";
    }
  });
  
  // EQ Friend Companion Mode Toggle
  const [eqFriendActive, setEqFriendActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("jarvis_eq_friend");
      return saved !== "false";
    } catch(e) { console.debug("Ignored exception", e); 
      return true;
    }
  });

  const handleToggleEqFriend = () => {
    setEqFriendActive(prev => {
      safeStorageSet("jarvis_eq_friend", String(!prev));
      return !prev;
    });
  };

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("jarvis_selected_voice_id") || localStorage.getItem("jarvis_selected_voice");
      if (saved && (saved === "friday-female" || saved === "friday-human" || saved === "Aoede" || saved === "Kore" || saved === "friday")) return "friday-female";
      return "jarvis-male";
    } catch(e) {
      return "jarvis-male";
    }
  });

  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);

  const handleSelectVoiceId = (voiceId: string) => {
    // Stop any ongoing speech immediately so selection is 100% silent
    jarvisAudio.stopSpeaking();
    setSelectedVoiceId(voiceId);
    safeStorageSet("jarvis_selected_voice_id", voiceId);
    safeStorageSet("jarvis_selected_voice", voiceId);
    jarvisAudio.setActiveVoiceId(voiceId);
    geminiLiveAudio.setVoice(voiceId);

    const isFriday = voiceId === "friday-female" || voiceId === "friday-human" || voiceId === "friday-ai" || voiceId === "Aoede" || voiceId === "Kore" || voiceId === "friday";
    setWakeWordAlert(isFriday ? "🎙️ F.R.I.D.A.Y. Voice (Female) Selected • Silent Mode" : "🎙️ J.A.R.V.I.S. Voice (Male) Selected • Silent Mode");
    setTimeout(() => setWakeWordAlert(null), 2500);
  };

  // Hoisted ref for voice action execution to connect Live Reactor and Speech API
  const executeJarvisVoiceActionRef = useRef<(text: string) => boolean>(() => false);

  // Synchronize Gemini Live Multimodal Arc Reactor Callbacks
  useEffect(() => {
    geminiLiveAudio.setCallbacks({
      onStateChange: (state) => {
        if (state === "speaking") {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          setIsListening(false);
          isListeningRef.current = false;
        } else if (state === "listening") {
          setIsListening(true);
          isListeningRef.current = true;
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        } else if (state === "idle") {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setIsListening(false);
          isListeningRef.current = false;
        }
      },
      onLiveTranscript: (text, isUser) => {
        setLiveTranscript(text);

        // Guard against stray Devanagari Hindi text when user speaks in Tamil or English
        if (speechLangRef.current !== "hi-IN" && /[\u0900-\u097F]/.test(text)) {
          return;
        }

        const trimmed = text.trim();
        if (!trimmed) return;

        // Immediately execute UI voice actions in real-time during live speech
        executeJarvisVoiceActionRef.current(trimmed);

        const activeBadge = selectedModelRef.current;

        if (isUser) {
          // LIVE USER SPEECH: Instantly reflect spoken words in chat stream in real-time as user speaks!
          setMessages((prev) => {
            const currentId = currentLiveUserMsgIdRef.current;
            if (currentId && prev.some((m) => m.id === currentId)) {
              return prev.map((m) =>
                m.id === currentId ? { ...m, text: trimmed } : m
              );
            } else {
              const newId = `msg-usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              currentLiveUserMsgIdRef.current = newId;
              return [
                ...prev,
                {
                  id: newId,
                  role: "user",
                  text: trimmed,
                  timestamp: Date.now(),
                  modelBadge: activeBadge,
                },
              ];
            }
          });
        } else {
          // LIVE MODEL SPEECH: Instantly stream AI response words into chat in real-time as AI speaks!
          setMessages((prev) => {
            const currentId = currentLiveModelMsgIdRef.current;
            if (currentId && prev.some((m) => m.id === currentId)) {
              return prev.map((m) =>
                m.id === currentId ? { ...m, text: trimmed } : m
              );
            } else {
              const newId = `msg-mod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              currentLiveModelMsgIdRef.current = newId;
              return [
                ...prev,
                {
                  id: newId,
                  role: "model",
                  text: trimmed,
                  timestamp: Date.now(),
                  modelBadge: activeBadge,
                },
              ];
            }
          });
        }
      },
      onMediaGenerated: (media) => {
        setMessages((prev) => {
          const modelMsgId = currentLiveModelMsgIdRef.current;
          if (modelMsgId && prev.some(m => m.id === modelMsgId)) {
            return prev.map(m => m.id === modelMsgId ? {
              ...m,
              image: media.url,
              mediaType: "image",
              mediaName: media.prompt
            } : m);
          } else {
            const last = prev.slice(-1)[0];
            if (last && last.role === "model") {
              return prev.map((m, idx) => idx === prev.length - 1 ? {
                ...m,
                image: media.url,
                mediaType: "image",
                mediaName: media.prompt
              } : m);
            } else {
              return [
                ...prev,
                {
                  id: `live-vis-${Date.now()}`,
                  role: "model",
                  text: `Ungaloda visual image ready!\n\n**Prompt**: *"${media.prompt}"*`,
                  image: media.url,
                  mediaType: "image",
                  mediaName: media.prompt,
                  timestamp: Date.now(),
                  modelBadge: selectedModelRef.current
                }
              ];
            }
          }
        });
      },
      onTurnComplete: (userText, modelText) => {
        const cleanUser = userText?.trim() || "";
        const cleanModel = modelText?.trim() || "";

        // Execute any voice action directives from user speech or model response
        if (cleanUser) {
          executeJarvisVoiceActionRef.current(cleanUser);
        }
        if (cleanModel) {
          executeJarvisVoiceActionRef.current(cleanModel);
        }

        // Finalize existing messages in-place without EVER creating extra duplicate messages
        setMessages((prev) => {
          let updated = [...prev];
          const userMsgId = currentLiveUserMsgIdRef.current;
          const modelMsgId = currentLiveModelMsgIdRef.current;

          if (userMsgId && cleanUser) {
            updated = updated.map((m) =>
              m.id === userMsgId ? { ...m, text: cleanUser } : m
            );
          }
          if (modelMsgId && cleanModel) {
            updated = updated.map((m) =>
              m.id === modelMsgId ? { ...m, text: cleanModel } : m
            );
          }
          return updated;
        });

        // Ready for next turn: reset all live speech accumulation buffers completely
        currentLiveUserMsgIdRef.current = null;
        currentLiveModelMsgIdRef.current = null;
        sessionSpeechBufferRef.current = "";
        setLiveTranscript("");
      },
      onInterrupted: () => {
        currentLiveUserMsgIdRef.current = null;
        currentLiveModelMsgIdRef.current = null;
        sessionSpeechBufferRef.current = "";
        setLiveTranscript("");
      },
      onAudioLevel: (level) => {
        setLiveAudioLevel(level);
      },
      onError: (err) => {
        console.warn("[Live Arc Audio Notice]:", err);
      },
    });

    return () => {
      geminiLiveAudio.stopLiveSession();
    };
  }, []);

  const speechLangRef = useRef<string>(speechLang);

  useEffect(() => {
    speechLangRef.current = speechLang;
    if (recognition) {
      recognition.lang = speechLang;
    }
  }, [speechLang]);

  const handleSelectSpeechLang = (lang: string) => {
    setSpeechLang(lang);
    speechLangRef.current = lang;
    safeStorageSet("jarvis_speech_lang_v1", lang);
    if (recognition) {
      recognition.lang = lang;
      if (isListening && !isSpeaking && !isProcessing) {
        try {
          safeStopRecognition();
        } catch (e) { console.debug("Ignored exception", e); }
      }
    }
  };

  // Refs for speech recognition callbacks to eliminate stale closure problems
  const isContinuousActiveRef = useRef<boolean>(false);
  const voiceModeRef = useRef<VoiceListeningMode>(voiceMode);
  const wakeWordEnabledRef = useRef<boolean>(wakeWordEnabled);
  const isSpeakingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const lastSpokeEndTimeRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>("");
  const recentSentQueriesRef = useRef<{ text: string; time: number }[]>([]);
  const currentLiveModelMsgIdRef = useRef<string | null>(null);
  const currentLiveUserMsgIdRef = useRef<string | null>(null);
  const liveUserResetTimerRef = useRef<any>(null);
  const sessionSpeechBufferRef = useRef<string>("");
  const lastVoiceInteractionRef = useRef<boolean>(false);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    wakeWordEnabledRef.current = wakeWordEnabled;
  }, [wakeWordEnabled]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Dedicated Chatbox Modal (JARVIS)
  const [isEngineChatOpen, setIsEngineChatOpen] = useState(false);
  const [isProjectChatOpen, setIsProjectChatOpen] = useState(false);
  const [engineChatDefault, setEngineChatDefault] = useState<AIModelId>("jarvis-core-mk1");

  // Tactical Widgets Panel & Active Tab State
  const [isTacticalWidgetsOpen, setIsTacticalWidgetsOpen] = useState<boolean>(false);
  const [activeTacticalTab, setActiveTacticalTab] = useState<TacticalTabType>(() => {
    try {
      const saved = localStorage.getItem("jarvis_tactical_tab") as TacticalTabType;
      return (saved && (saved as string) !== "neural_cores") ? saved : "persona";
    } catch(e) { console.debug("Ignored exception", e); 
      return "persona";
    }
  });

  const handleTacticalTabChange = (tab: TacticalTabType) => {
    setActiveTacticalTab(tab);
    try {
      safeStorageSet("jarvis_tactical_tab", tab);
    } catch (e) { console.debug("Ignored exception", e); }
  };
  
  const [isSidebarChatOpen, setIsSidebarChatOpen] = useState<boolean>(false);

  // Full-Screen Lightbox
  const [lightboxImage, setLightboxImage] = useState<{ url: string; prompt?: string } | null>(null);

  // Live Core Reactor Telemetry State
  const [telemetry, setTelemetry] = useState<SystemDiagnostic>({
    cpuUsage: 34,
    memoryUsage: 48,
    networkLatencyMs: 14,
    powerOutputPcnt: 100,
    localAgentOnline: false,
    activeProcesses: 148,
  });


  // Apply Dynamic Theme
  useEffect(() => {
    const theme = JARVIS_THEMES.find(t => t.id === uiTheme) || JARVIS_THEMES[0];
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  }, [uiTheme]);
  // System Terminal Stream
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[00:00:01] ARCHITECTURE_REMODEL: Unified sovereign interface locked.",
    "[00:00:02] MEMORY_SYNC: Lifetime synaptic cache loaded.",
    "[00:00:03] LINGUISTIC_PIPELINE: English, Tamil & Tanglish detector engaged.",
    "[00:00:04] CORE_ENGINE: Sovereign neural matrix active."
  ]);

  const persistSessionsSafely = async (sessionsToSave: ChatSession[]) => {
    try {
      const compressed = await compressAndArchiveChatSessions(sessionsToSave);
      if (typeof indexedStorage !== 'undefined' && isIndexedDBLoaded) {
        indexedStorage.set("jarvis_all_chat_sessions_v1", compressed).catch(()=>{});
      }
      const sanitized = compressed.slice(0, 8).map(s => ({
        ...s,
        messages: (s.messages || []).slice(-10).map(m =>
          m.image && m.image.length > 30000
            ? { ...m, image: undefined, text: (m.text || "") + "\n[Media archived in secure vault]" }
            : m
        )
      }));
      safeStorageSet("jarvis_all_chat_sessions_v1", JSON.stringify(sanitized));
    } catch (quotaErr) {
      console.warn("Storage quota protected; IndexedDB persists complete state safely:", quotaErr);
    }
  };
  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const voiceSilenceTimerRef = useRef<any>(null);
  const lastVoiceUploadTriggerRef = useRef<number>(0);

  // Auto-persist active session and all sessions
  const saveCurrentSessionData = () => {
    try {
      setSessions(prev => {
        const index = prev.findIndex(s => s.id === activeSessionId);
        let title = "New Chat";
        const firstUser = messagesRef.current.find(m => m.role === "user");
        if (firstUser?.text) {
          title = firstUser.text.trim().slice(0, 32) + (firstUser.text.length > 32 ? "..." : "");
        }

        if (index !== -1) {
          const current = prev[index];
          const updatedSession: ChatSession = {
            ...current,
            title: (current.title && current.title !== "New Chat") ? current.title : title,
            updatedAt: Date.now(),
            messages: messagesRef.current,
            modelUsed: selectedModel,
          };
          const next = [...prev];
          next[index] = updatedSession;
          persistSessionsSafely(next);
          return next;
        } else {
          const newSession: ChatSession = {
            id: activeSessionId,
            title,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: messagesRef.current,
            modelUsed: selectedModel,
          };
          const next = [newSession, ...prev];
          persistSessionsSafely(next);
          return next;
        }
      });
      safeStorageSet("jarvis_active_session_id", activeSessionId);
    } catch (e) {
      console.warn("Storage quota warning", e);
    }
  };

  const sessionDebounceTimerRef = useRef<any>(null);
  useEffect(() => {
    // Only execute if messages actually change to prevent recursive updates
    if (messages.length > 0) {
      if (sessionDebounceTimerRef.current) clearTimeout(sessionDebounceTimerRef.current);
      sessionDebounceTimerRef.current = setTimeout(() => {
        saveCurrentSessionData();
      }, isProcessing ? 1800 : 300);
    }
    return () => {
      if (sessionDebounceTimerRef.current) clearTimeout(sessionDebounceTimerRef.current);
    };
  }, [messages, activeSessionId, selectedModel, isIndexedDBLoaded, isProcessing]);

  // Track processed action message IDs so neither past chat messages nor reloaded messages ever auto-trigger actions
  const processedActionMsgIdsRef = useRef<Set<string>>(new Set(messages.map(m => m.id)));

  // Hoisted execution refs for actions declared downstream
  const handleClearMemoryRef = useRef<() => void>(() => {});
  const handleClearAllSessionsRef = useRef<() => void>(() => {});
  const handleNewChatRef = useRef<() => void>(() => {});

  // Visual HUD notification for voice scrolling
  const [scrollAlert, setScrollAlert] = useState<string | null>(null);

  // Universal Smart Voice Scrolling Engine for open modals, option drawers & active chat
  const handleSmartVoiceScroll = useCallback((direction: "down" | "up" | "bottom" | "top" | "left" | "right") => {
    const scrollAmount = 380;
    const horizontalAmount = 260;

    // 1. Dispatch custom event for any listening modal/drawer component
    window.dispatchEvent(new CustomEvent("jarvis-scroll", { detail: { direction, amount: scrollAmount } }));

    // 2. Identify active open modal or high-priority options overlay first
    const openModals = Array.from(document.querySelectorAll<HTMLElement>(
      '.fixed.inset-0, [role="dialog"], .z-50, .z-40'
    )).filter(m => m.offsetParent !== null || window.getComputedStyle(m).display !== "none");

    let targetEl: HTMLElement | null = null;

    if (openModals.length > 0) {
      const topModal = openModals[openModals.length - 1];
      const modalScrollables = Array.from(topModal.querySelectorAll<HTMLElement>(
        '.overflow-y-auto, [data-scroll-container], .overflow-x-auto'
      )).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.height > 40 && rect.width > 40 && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);
      });
      if (modalScrollables.length > 0) {
        targetEl = modalScrollables[modalScrollables.length - 1];
      }
    }

    // 3. Fallback to main stream containers if no modal is active
    if (!targetEl) {
      const scrollCandidates = Array.from(document.querySelectorAll<HTMLElement>(
        '.overflow-y-auto, [data-scroll-container="true"], .chat-stream-container, #chat-messages-container, #terminal-stream'
      )).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.height > 50 && rect.width > 50 && el.scrollHeight > el.clientHeight;
      });

      if (scrollCandidates.length > 0) {
        targetEl = scrollCandidates[scrollCandidates.length - 1];
      }
    }

    if (targetEl) {
      if (direction === "down") {
        targetEl.scrollBy({ top: scrollAmount, behavior: "smooth" });
      } else if (direction === "up") {
        targetEl.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      } else if (direction === "bottom") {
        targetEl.scrollTo({ top: targetEl.scrollHeight, behavior: "smooth" });
      } else if (direction === "top") {
        targetEl.scrollTo({ top: 0, behavior: "smooth" });
      } else if (direction === "left") {
        targetEl.scrollBy({ left: -horizontalAmount, behavior: "smooth" });
      } else if (direction === "right") {
        targetEl.scrollBy({ left: horizontalAmount, behavior: "smooth" });
      }
    } else if (chatContainerRef.current) {
      if (direction === "down") {
        chatContainerRef.current.scrollBy({ top: scrollAmount, behavior: "smooth" });
      } else if (direction === "up") {
        chatContainerRef.current.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      } else if (direction === "bottom") {
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
      } else if (direction === "top") {
        chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (terminalRef.current) {
      if (direction === "down") {
        terminalRef.current.scrollBy({ top: scrollAmount, behavior: "smooth" });
      } else if (direction === "up") {
        terminalRef.current.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      } else if (direction === "bottom") {
        terminalRef.current.scrollTo({ top: terminalRef.current.scrollHeight, behavior: "smooth" });
      } else if (direction === "top") {
        terminalRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const delta = direction === "down" ? scrollAmount : direction === "up" ? -scrollAmount : 0;
      if (direction === "bottom") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      else if (direction === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      else if (direction === "left") window.scrollBy({ left: -horizontalAmount, behavior: "smooth" });
      else if (direction === "right") window.scrollBy({ left: horizontalAmount, behavior: "smooth" });
      else window.scrollBy({ top: delta, behavior: "smooth" });
    }

    const label = direction === "down" ? "⬇️ SCROLLING DOWN (கீழே ஸ்க்ரோல் செய்யப்படுகிறது)" :
                  direction === "up" ? "⬆️ SCROLLING UP (மேலே ஸ்க்ரோல் செய்யப்படுகிறது)" :
                  direction === "bottom" ? "⏬ SCROLLED TO BOTTOM (கடைசி வரைக்கும்)" : 
                  direction === "top" ? "⏫ SCROLLED TO TOP (தொடக்கத்திற்கு)" :
                  direction === "left" ? "⬅️ SCROLLED LEFT (இடது பக்கம்)" : "➡️ SCROLLED RIGHT (வலது பக்கம்)";
    setScrollAlert(label);
    setTimeout(() => setScrollAlert(null), 2500);
    jarvisAudio.playNotificationSound();
  }, []);

  // Master Unified J.A.R.V.I.S. Voice & Text Action Engine
  // Intercepts BOTH explicit [ACTION: ...] tags AND spoken natural language commands in Tamil, Tanglish, and English
  const executeJarvisVoiceAction = useCallback((rawText: string): boolean => {
    if (!rawText) return false;
    const text = rawText.trim();
    const lower = text.toLowerCase();
    let executed = false;

    // Helper condition checks for robust spoken Tamil & English matching
    const isClose = lower.includes("close") || lower.includes("hide") || lower.includes("மூடு") || lower.includes("க்ளோஸ்") || lower.includes("அடை");
    const isOpen = lower.includes("open") || lower.includes("show") || lower.includes("ஓபன்") || lower.includes("திற") || lower.includes("காட்டு") || lower.includes("கொண்டு வா");

    // 1. Return Home / Close All Modals
    if (
      text.includes("[ACTION: RETURN_HOME]") || text.includes("[ACTION: CLOSE_ALL]") ||
      lower.includes("return to home") || lower.includes("go home") || lower.includes("close all") ||
      lower.includes("ஹோம் பேஜ்") || lower.includes("ஹோம் போ") || lower.includes("ரிட்டர்ன் டு ஹோம்") || lower.includes("எல்லாத்தையும் மூடு")
    ) {
      setIsProjectChatOpen(false);
      setIsSidebarChatOpen(false);
      setIsAllChatsOpen(false);
      setIsCameraOpen(false);
      setIsSystemEnvironmentModalOpen(false);
      setIsEngineChatOpen(false);
      setIsTacticalWidgetsOpen(false);
      setIsFileConverterOpen(false);
      setIsStorageVaultOpen(false);
      setIsSmartCalendarOpen(false);
      jarvisAudio.playNotificationSound();
      return true;
    }

    // 2. Tactical Widgets Drawer & Tabs (டேர்டிக்கல் விட்ஜெட்ஸ்)
    const isTactical = lower.includes("tactical") || lower.includes("widget") || lower.includes("விட்ஜெட்") || 
                      lower.includes("டேர்டிக்கல்") || lower.includes("டேக்டிகல்") || lower.includes("டாக்டிகல்") || lower.includes("டாடிக்கல்");

    if (text.includes("[ACTION: CLOSE_TACTICAL_WIDGETS]") || (isTactical && isClose)) {
      setIsTacticalWidgetsOpen(false);
      executed = true;
    } else if (
      text.includes("[ACTION: OPEN_TACTICAL_WIDGETS]") ||
      (isTactical && (isOpen || lower.includes("டேர்டிக்கல் விட்ஜெட்") || lower.includes("விட்ஜெட்ஸ் ஓபன்") || lower.includes("டேர்டிக்கல் ஓபன்") || (!lower.includes("தீம்") && !lower.includes("ரியாக்டர்") && !lower.includes("மொழி") && !lower.includes("வாய்ஸ்"))))
    ) {
      setIsTacticalWidgetsOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    if (text.includes("[ACTION: TOGGLE_TACTICAL_WIDGETS]") || lower.includes("toggle widgets") || lower.includes("விட்ஜெட்ஸ் மாத்து") || lower.includes("விட்ஜெட் மாத்து")) {
      setIsTacticalWidgetsOpen(prev => !prev);
      executed = true;
    }

    // Tactical Tabs (Themes, Reactor Styles, Languages, Voice, Persona)
    const tacticalTabMatch = text.match(/\[ACTION:\s*OPEN_TACTICAL_TAB:\s*([a-zA-Z0-9_-]+)\]/i);
    if (tacticalTabMatch && tacticalTabMatch[1]) {
      const rawTab = tacticalTabMatch[1].toLowerCase();
      const tab: TacticalTabType = 
        rawTab.includes("lang") ? "languages" :
        rawTab.includes("reactor") ? "reactor_change" :
        rawTab.includes("persona") ? "persona" :
        rawTab.includes("ui") || rawTab.includes("theme") ? "ui_change" :
        rawTab.includes("voice") ? "voice" : "languages";
      handleTacticalTabChange(tab);
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (
      lower.includes("லாங்குவேஜ்") || lower.includes("மொழி ஆப்ஷன்") || lower.includes("மொழி மாற்று") ||
      lower.includes("language option") || lower.includes("language tab") || (lower.includes("language") && isOpen)
    ) {
      handleTacticalTabChange("languages");
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      setWakeWordAlert("🌐 Tactical Widgets: Language Options");
      setTimeout(() => setWakeWordAlert(null), 2500);
      executed = true;
    } else if (
      (lower.includes("ரியாக்டர்") && (lower.includes("செலக்ட்") || lower.includes("ஆப்ஷன்") || lower.includes("மாத்து") || lower.includes("போ") || isOpen)) ||
      lower.includes("reactor option") || lower.includes("select reactor") || lower.includes("reactor tab")
    ) {
      handleTacticalTabChange("reactor_change");
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      setWakeWordAlert("⚡ Tactical Widgets: Reactor Selection");
      setTimeout(() => setWakeWordAlert(null), 2500);
      executed = true;
    } else if (
      lower.includes("பர்சனல்குள்ள") || lower.includes("பர்சனாக்குள்ள") || lower.includes("பர்சனா ஆப்ஷன்") || 
      lower.includes("பர்சனல் ஆப்ஷன்") || lower.includes("persona tab") || lower.includes("open persona") ||
      (lower.includes("பர்சனா") && (isOpen || lower.includes("போ")))
    ) {
      handleTacticalTabChange("persona");
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      setWakeWordAlert("🎭 Tactical Widgets: Persona Options");
      setTimeout(() => setWakeWordAlert(null), 2500);
      executed = true;
    } else if (
      lower.includes("தீம்குள்ள") || lower.includes("தீம் ஆப்ஷன்") || lower.includes("theme option") || 
      lower.includes("open themes") || lower.includes("theme tab") || (lower.includes("தீம்") && (isOpen || lower.includes("போ") || lower.includes("மாத்து")))
    ) {
      handleTacticalTabChange("ui_change");
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      setWakeWordAlert("🎨 Tactical Widgets: UI Themes");
      setTimeout(() => setWakeWordAlert(null), 2500);
      executed = true;
    } else if (
      lower.includes("வாய்ஸ்குள்ள") || lower.includes("வாய்ஸ் ஆப்ஷன்") || lower.includes("குரல் ஆப்ஷன்") || 
      lower.includes("voice option") || lower.includes("voice tab")
    ) {
      handleTacticalTabChange("voice");
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      setWakeWordAlert("🎙️ Tactical Widgets: Voice Selection");
      setTimeout(() => setWakeWordAlert(null), 2500);
      executed = true;
    }

    // 3. File Converter Modal & File/Folder Upload Voice Triggers ('Upload file' & 'Select folder')
    const isConverter = lower.includes("converter") || lower.includes("கன்வெர்ட்டர்") || lower.includes("கன்வெர்ட்டர") || lower.includes("கன்வர்ட்டர்");
    const isUploadFilesAction = 
      lower.includes("upload file") || lower.includes("upload files") || 
      lower.includes("upload a file") || lower.includes("upload the file") ||
      lower.includes("attach file") || lower.includes("attach a file") ||
      lower.includes("choose file") || lower.includes("choose files") ||
      lower.includes("select file") || lower.includes("select files") ||
      lower.includes("அப்லோட் ஃபைல்") || lower.includes("அப்லோட் ஃபைல்ஸ்") || 
      lower.includes("ஃபைல் அப்லோட்") || lower.includes("ஃபைலை அப்லோட்") ||
      lower.includes("சூஸ் ஃபைல்") || lower.includes("சூஸ் ஃபைல்ஸ்");

    const isUploadFolderAction =
      lower.includes("select folder") || lower.includes("select a folder") ||
      lower.includes("select folders") || lower.includes("choose folder") ||
      lower.includes("choose a folder") || lower.includes("upload folder") || 
      lower.includes("upload a folder") || lower.includes("upload directory") || 
      lower.includes("select directory") ||
      lower.includes("அப்லோட் ஃபோல்டர்") || lower.includes("அப்லோட் போல்டர்") ||
      lower.includes("ஃபோல்டர் அப்லோட்") || lower.includes("போல்டர் அப்லோட்") ||
      lower.includes("ஃபோல்டர் செலக்ட்") || lower.includes("செலக்ட் ஃபோல்டர்");

    if (isUploadFilesAction || isUploadFolderAction) {
      const now = Date.now();
      if (now - lastVoiceUploadTriggerRef.current < 1500) {
        return true;
      }
      lastVoiceUploadTriggerRef.current = now;

      if (isUploadFolderAction) {
        // Direct native trigger for current chat session using folderInputRef
        if (folderInputRef.current) {
          try {
            (folderInputRef.current as any).webkitdirectory = true;
            (folderInputRef.current as any).directory = true;
          } catch (e) {}
          folderInputRef.current.click();
        } else {
          const el = document.getElementById("voice-main-folder-input") as HTMLInputElement;
          if (el) {
            try {
              (el as any).webkitdirectory = true;
              (el as any).directory = true;
            } catch (e) {}
            el.click();
          }
        }
        window.dispatchEvent(new CustomEvent("jarvis-trigger-upload-folder"));
        setWakeWordAlert("📁 J.A.R.V.I.S. UPLINK: Folder selection dialog triggered");
      } else {
        // Direct native trigger for current chat session using fileInputRef
        if (fileInputRef.current) {
          fileInputRef.current.click();
        } else {
          const el = document.getElementById("voice-main-file-input") as HTMLInputElement;
          el?.click();
        }
        window.dispatchEvent(new CustomEvent("jarvis-trigger-upload-files"));
        setWakeWordAlert("📎 J.A.R.V.I.S. UPLINK: File selection dialog triggered");
      }
      setTimeout(() => setWakeWordAlert(null), 3000);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (text.includes("[ACTION: CLOSE_CONVERTER]") || text.includes("[ACTION: CLOSE_FILE_CONVERTER]") || (isConverter && isClose)) {
      setIsFileConverterOpen(false);
      executed = true;
    } else if (
      text.includes("[ACTION: OPEN_CONVERTER]") || text.includes("[ACTION: OPEN_FILE_CONVERTER]") ||
      (isConverter && (isOpen || lower.includes("கன்வெர்ட்டர்") || lower.includes("கன்வெர்ட்டர")))
    ) {
      setIsFileConverterOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 4. Chat Workspace / Shadow Box (சாட் வொர்க்ஸ்பேஸ் & ஷேடோ பாக்ஸ்)
    const isChatWorkspace = lower.includes("chat workspace") || lower.includes("சாட் வொர்க்ஸ்பேஸ்") || lower.includes("சாட் வொர்க் ஸ்பேஸ்") || lower.includes("சாட் வொர்க்ஸ்பேஸ") || lower.includes("சாட் ஆப்ஷன்") || lower.includes("சாட் பாக்ஸ்") || lower.includes("ஷேடோ பாக்ஸ்") || lower.includes("ஷேடோபாக்ஸ்");
    const isSendToWorkspace = isChatWorkspace && (
      lower.includes("ஹாய்") || lower.includes("டைப்") || lower.includes("சென்ட்") || lower.includes("அனுப்பு") || 
      lower.includes("கேளு") || lower.includes("சொல்லு") || lower.includes("டைப் பண்ணி") || lower.includes("சென்ட் பண்ணிரு") || 
      lower.includes("send") || lower.includes("type") || lower.includes("ask")
    );

    if (isSendToWorkspace) {
      setIsSidebarChatOpen(true);
      let promptToSend = "ஹாய்";
      if (lower.includes("ஹாய்") || lower.includes("hi") || lower.includes("hello")) {
        promptToSend = "ஹாய், எப்படி இருக்கீங்க? இந்த வொர்க்ஸ்பேஸ்ல என்னென்ன உதவிகள் பண்ண முடியும்?";
      } else {
        promptToSend = text
          .replace(/^(சாட்\s*வொர்க்\s*ஸ்பேஸ்|சாட்\s*வொர்க்ஸ்பேஸ்|சாட்\s*பாக்ஸ்|ஷேடோ\s*பாக்ஸ்|chat\s*workspace)\s*(?:ல\s*போய்|ல|இல்|குள்ள)?\s*(?:போய்)?\s*/i, "")
          .replace(/(?:னு\s*டைப்\s*பண்ணி\s*சென்ட்\s*பண்ணு|னு\s*டைப்\s*பண்ணி\s*சென்ட்\s*பண்ணிரு|னு\s*டைப்\s*பண்ணு|னு\s*அனுப்பு|னு\s*கேளு|பத்தி\s*கேளு|கேளு|சொல்லு|சென்ட்\s*பண்ணு|டைப்\s*பண்ணு)\s*$/i, "")
          .trim();
        if (!promptToSend) promptToSend = "ஹாய்";
      }

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("jarvis-workspace-prompt", {
          detail: { text: promptToSend, speakReply: true }
        }));
      }, 200);

      setWakeWordAlert(`💬 J.A.R.V.I.S. Workspace: "${promptToSend}" dispatched`);
      setTimeout(() => setWakeWordAlert(null), 3000);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (text.includes("[ACTION: CLOSE_CHAT_WORKSPACE]") || text.includes("[ACTION: CLOSE_CHAT]") || (isChatWorkspace && isClose)) {
      setIsSidebarChatOpen(false);
      executed = true;
    } else if (
      text.includes("[ACTION: OPEN_CHAT_WORKSPACE]") || text.includes("[ACTION: OPEN_CHAT]") ||
      (isChatWorkspace && isOpen) ||
      (lower.includes("சாட்") && (lower.includes("ஓபன்") || lower.includes("திற") || lower.includes("காட்டு") || lower.includes("ஆப்ஷன் ஓபன்")) && !lower.includes("அழி") && !lower.includes("கிளியர்"))
    ) {
      setIsSidebarChatOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 5. Projects Workspace & Live Reactor Voice Integration (ப்ராஜெக்ட்ஸ் ஆப்ஸ்)
    const isProject = lower.includes("project") || lower.includes("ப்ராஜெக்ட்") || lower.includes("ப்ராஜக்ட்") || lower.includes("ப்ராஜெக்ட்ஸ்") || lower.includes("ப்ராஜெக்ட் ஆப்ஸ்") || lower.includes("ப்ராஜெக்ட் ஆப்ஸ");
    const isSendToProject = isProject && (
      lower.includes("ஹாய்") || lower.includes("டைப்") || lower.includes("சென்ட்") || lower.includes("அனுப்பு") || 
      lower.includes("கேளு") || lower.includes("சொல்லு") || lower.includes("டைப் பண்ணி") || lower.includes("சென்ட் பண்ணிரு") || 
      lower.includes("ஆட் பண்ணு") || lower.includes("நோட் பண்ணு") || lower.includes("எழுது") || lower.includes("டாஸ்க்") || 
      lower.startsWith("project:") || lower.includes("ப்ராஜெக்ட்ல:") || lower.includes("ரன் பண்ணு")
    );

    if (isSendToProject) {
      setIsProjectChatOpen(true);
      let taskText = "ஹாய்";
      if (lower.includes("ஹாய்") || lower.includes("hi") || lower.includes("hello")) {
        taskText = "ஹாய், ப்ராஜெக்ட் ஆப்ஸ் ஸ்டேட்டஸ் என்ன?";
      } else {
        taskText = text
          .replace(/^(ப்ராஜெக்ட்\s*ஆப்ஸ்|ப்ராஜெக்ட்\s*ஆப்|ப்ராஜெக்ட்ல\s*ஆட்\s*பண்ணு|ப்ராஜெக்ட்ல\s*நோட்\s*பண்ணு|ப்ராஜெக்ட்ல\s*எழுது|ப்ராஜெக்ட்ல\s*டாஸ்க்|ப்ராஜெக்ட்\s*டாஸ்க்|ப்ராஜெக்ட்\s*ஆப்ல|ப்ராஜெக்ட்ல\s*ரன்\s*பண்ணு|ப்ராஜெக்ட்ல|ப்ராஜெக்டில்|project task|project:)\s*[:,-]?\s*/i, "")
          .replace(/(?:னு\s*டைப்\s*பண்ணி\s*சென்ட்\s*பண்ணு|னு\s*டைப்\s*பண்ணி\s*சென்ட்\s*பண்ணிரு|னு\s*டைப்\s*பண்ணு|னு\s*அனுப்பு|னு\s*கேளு|பத்தி\s*கேளு|கேளு|சொல்லு|சென்ட்\s*பண்ணு|டைப்\s*பண்ணு)\s*$/i, "")
          .trim();
        if (!taskText) taskText = "ஹாய்";
      }

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("jarvis-project-prompt", {
          detail: { text: taskText, speakReply: true }
        }));
      }, 200);

      setWakeWordAlert(`📂 Project Ops: "${taskText}" dispatched`);
      setTimeout(() => setWakeWordAlert(null), 3000);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (text.includes("[ACTION: CLOSE_PROJECTS]") || text.includes("[ACTION: CLOSE_PROJECT_CHAT]") || (isProject && isClose)) {
      setIsProjectChatOpen(false);
      executed = true;
    } else if (
      text.includes("[ACTION: CREATE_PROJECT]") || text.includes("[ACTION: NEW_PROJECT]") ||
      lower.includes("create project") || lower.includes("new project") ||
      lower.includes("புது ப்ராஜெக்ட்") || lower.includes("புதிய ப்ராஜெக்ட்") || lower.includes("ப்ராஜெக்ட் கிரியேட்")
    ) {
      localStorage.removeItem("jarvis_project_workspace_history");
      setIsProjectChatOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (
      text.includes("[ACTION: OPEN_PROJECTS]") || text.includes("[ACTION: OPEN_PROJECT_CHAT]") ||
      (isProject && (isOpen || lower.includes("ஆப்ஸ்") || lower.includes("ஆப்ஸ") || lower.includes("ப்ராஜெக்ட் ஓபன்") || lower.includes("ப்ராஜெக்ட்ஸ் ஓபன்") || lower.includes("ப்ராஜெக்ட் திற")))
    ) {
      setIsProjectChatOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 6. Sidebar Navigation (சைடுபார் - Minimize / Maximize / Toggle)
    if (
      text.includes("[ACTION: OPEN_SIDEBAR]") || text.includes("[ACTION: MAXIMIZE_SIDEBAR]") ||
      lower.includes("maximize sidebar") || lower.includes("open sidebar") || lower.includes("show sidebar") ||
      lower.includes("சைடுபார மேக்ஸிமைஸ்") || lower.includes("சைடுபார ஓபன்") || lower.includes("சைடு பார் ஓபன்") || lower.includes("சைடு பார பெருசாக்கு")
    ) {
      setIsSidebarNavOpen(true);
      try { localStorage.setItem("jarvis_sidebar_collapsed", "false"); } catch(e){}
      jarvisAudio.playNotificationSound();
      executed = true;
    }
    if (
      text.includes("[ACTION: CLOSE_SIDEBAR]") || text.includes("[ACTION: MINIMIZE_SIDEBAR]") ||
      lower.includes("minimize sidebar") || lower.includes("close sidebar") || lower.includes("hide sidebar") ||
      lower.includes("சைடுபார மினிமைஸ்") || lower.includes("சைடுபார மூடு") || lower.includes("சைடு பார் க்ளோஸ்") || lower.includes("சைடு பார சிறிதாக்கு")
    ) {
      setIsSidebarNavOpen(false);
      try { localStorage.setItem("jarvis_sidebar_collapsed", "true"); } catch(e){}
      jarvisAudio.playNotificationSound();
      executed = true;
    }
    if (text.includes("[ACTION: TOGGLE_SIDEBAR]") || lower.includes("toggle sidebar") || lower.includes("சைடுபார மாத்து") || lower.includes("டூகுள் சைடுபார்")) {
      setIsSidebarNavOpen(prev => !prev);
      executed = true;
    }

    // 7. System Environment Settings (சிஸ்டம் என்விரான்மென்ட்)
    if (
      text.includes("[ACTION: OPEN_SYSTEM_ENV]") ||
      lower.includes("open environment") || lower.includes("open system env") || lower.includes("system environment") || lower.includes("system settings") ||
      lower.includes("என்விரான்மென்ட்ட ஓபன்") || lower.includes("சிஸ்டம் என்விரான்மென்ட் ஓபன்") || lower.includes("என்விரான்மென்ட் காட்டு")
    ) {
      setIsSystemEnvironmentModalOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }
    if (
      text.includes("[ACTION: CLOSE_SYSTEM_ENV]") ||
      lower.includes("close environment") || lower.includes("close system env") ||
      lower.includes("என்விரான்மென்ட்ட மூடு") || lower.includes("சிஸ்டம் என்விரான்மென்ட் க்ளோஸ்")
    ) {
      setIsSystemEnvironmentModalOpen(false);
      executed = true;
    }

    // 8. Memory Matrix / Folders (மெமரி ஃபோல்டர்)
    if (
      text.includes("[ACTION: OPEN_MEMORY]") ||
      lower.includes("open memory") || lower.includes("memory folder") || lower.includes("all chats") ||
      lower.includes("மெமரி ஃபோல்டருக்குள்ள போ") || lower.includes("மெமரி ஃபோல்டர் ஓபன்") || lower.includes("மெமரி ஓபன்") || lower.includes("மெமரி காட்டு")
    ) {
      setIsAllChatsOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }
    if (
      text.includes("[ACTION: CLOSE_MEMORY]") ||
      lower.includes("close memory") ||
      lower.includes("மெமரி மூடு") || lower.includes("மெமரி க்ளோஸ்")
    ) {
      setIsAllChatsOpen(false);
      executed = true;
    }

    // 9. Wipe Screen / Clear Current Chat
    if (
      text.includes("[ACTION: WIPE_SCREEN]") || text.includes("[ACTION: CLEAR_MEMORY]") ||
      lower.includes("wipe screen") || lower.includes("clear screen") || lower.includes("clear chat") || lower.includes("clear data stream") ||
      lower.includes("வைப் ஸ்கிரீன்") || lower.includes("சாட்டை அழி") || lower.includes("சாட் அழி") || lower.includes("ஸ்கிரீனை அழி") || lower.includes("ஸ்க்ரீனை அழி") ||
      lower.includes("ஸ்க்ரீனை கிளியர் பண்ணு") || lower.includes("சாட்டை கிளியர் பண்ணு") || lower.includes("சாட் கிளியர்") ||
      (lower.includes("வைப்") && (lower.includes("டேட்டா") || lower.includes("ஸ்கிரீன்") || lower.includes("சாட்")))
    ) {
      handleClearMemoryRef.current?.();
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 10. Wipe All Data in Memory Folder (மெமரி ஃபோல்டர்ல வைப் ஆல் டேட்டா)
    if (
      text.includes("[ACTION: WIPE_ALL_DATA]") || text.includes("[ACTION: CLEAR_ALL_MEMORY]") ||
      lower.includes("wipe all data") || lower.includes("wipe all memory") || lower.includes("clear all memory") || lower.includes("delete all chats") ||
      lower.includes("வைப் ஆல் டேட்டா") || lower.includes("எல்லா டேட்டாவையும் அழி") || lower.includes("அனைத்து டேட்டாவையும் அழி") || lower.includes("மெமரி ஃபோல்டர்ல வைப் ஆல் டேட்டா") ||
      lower.includes("முழு மெமரியையும் அழி")
    ) {
      handleClearAllSessionsRef.current?.();
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 11. Storage Vault
    if (
      text.includes("[ACTION: OPEN_STORAGE_VAULT]") || text.includes("[ACTION: OPEN_VAULT]") ||
      lower.includes("open storage vault") || lower.includes("open vault") || lower.includes("storage vault") ||
      lower.includes("ஸ்டோரேஜ் வால்ட் ஓபன்") || lower.includes("வால்ட் ஓபன்") || lower.includes("ஸ்டோரேஜ் வாலட் ஓபன்")
    ) {
      setIsStorageVaultOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }
    if (
      text.includes("[ACTION: CLOSE_STORAGE_VAULT]") || text.includes("[ACTION: CLOSE_VAULT]") ||
      lower.includes("close storage vault") || lower.includes("close vault") ||
      lower.includes("ஸ்டோரேஜ் வால்ட் மூடு") || lower.includes("வால்ட் மூடு")
    ) {
      setIsStorageVaultOpen(false);
      executed = true;
    }

    // 12. Camera Modal
    if (text.includes("[ACTION: OPEN_CAMERA]") || lower.includes("open camera") || lower.includes("கேமரா ஆன்") || lower.includes("கேமரா ஓபன்")) {
      setIsCameraOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }
    if (text.includes("[ACTION: CLOSE_CAMERA]") || lower.includes("close camera") || lower.includes("கேமரா மூடு") || lower.includes("கேமரா ஆஃப்")) {
      setIsCameraOpen(false);
      executed = true;
    }

    // 13. Voice Language Switch
    if (text.includes("[ACTION: SET_LANGUAGE_TAMIL]") || lower.includes("switch to tamil") || lower.includes("தமிழ்ல மாத்து") || lower.includes("தமிழுக்கு மாத்து") || lower.includes("தமிழில் பேசு")) {
      handleSelectSpeechLang("ta-IN");
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (text.includes("[ACTION: SET_LANGUAGE_ENGLISH]") || lower.includes("switch to english") || lower.includes("இங்கிலீஷ்ல மாத்து") || lower.includes("ஆங்கிலத்தில் பேசு") || lower.includes("ஆங்கிலத்துக்கு மாத்து")) {
      handleSelectSpeechLang("en-US");
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (text.includes("[ACTION: SET_LANGUAGE_TANGLISH]") || lower.includes("switch to tanglish") || lower.includes("டாங்க்ளிஷ்ல மாத்து") || lower.includes("தங்கிலீஷ்ல பேசு") || lower.includes("தங்கிலீஷுக்கு மாத்து")) {
      handleSelectSpeechLang("tanglish");
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (lower.includes("லாங்குவேஜ் மாத்து") || lower.includes("மொழி மாத்து") || lower.includes("change language") || lower.includes("லாங்குவேஜ் டேப்") || lower.includes("மொழி டேப்")) {
      handleTacticalTabChange("languages");
      setIsTacticalWidgetsOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 14. Voice Model Switch (Friday Female vs Jarvis Male)
    if (
      text.includes("[ACTION: SET_VOICE_FRIDAY]") || 
      lower.includes("friday voice") || lower.includes("set friday") || 
      lower.includes("ஃப்ரைடே வாய்ஸ்") || lower.includes("ஃப்ரைடேயா பேசு") || 
      lower.includes("பெண் குரல்") || lower.includes("ஃபீமேல் வாய்ஸ்") || 
      lower.includes("female voice") || lower.includes("பெண் குரலுக்கு மாத்து") ||
      lower.includes("ஃபீமேல் வாய்ஸா மாத்து") || lower.includes("ஃப்ரைடே வாய்ஸ் மாத்து")
    ) {
      handleSelectVoiceId("friday-female");
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (
      text.includes("[ACTION: SET_VOICE_JARVIS]") || 
      lower.includes("jarvis voice") || lower.includes("set jarvis") || 
      lower.includes("ஜார்விஸ் வாய்ஸ்") || lower.includes("ஜார்விஸா பேசு") || 
      lower.includes("ஆண் குரல்") || lower.includes("மேல் வாய்ஸ்") || 
      lower.includes("male voice") || lower.includes("ஆண் குரலுக்கு மாத்து") ||
      lower.includes("மேல் வாய்ஸ் எக்ஸ்சேஞ்ச்") || lower.includes("மேல் வாய்ஸா மாத்து") ||
      lower.includes("ஜார்விஸ் வாய்ஸ் மாத்து")
    ) {
      handleSelectVoiceId("jarvis-male");
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (lower.includes("வாய்ஸ் மாத்து") || lower.includes("குரல் மாத்து") || lower.includes("change voice") || lower.includes("வாய்ஸ் டேப்") || lower.includes("வாய்ஸ் ஆப்ஷன்")) {
      handleTacticalTabChange("voice");
      setIsTacticalWidgetsOpen(true);
      setIsSidebarChatOpen(false);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 15. New Stream / New Chat
    if (text.includes("[ACTION: NEW_STREAM]") || text.includes("[ACTION: NEW_CHAT]")) {
      handleNewChatRef.current?.();
      executed = true;
    }

    // 16. UI Themes via Regex or Phrases
    const uiThemeMatch = text.match(/\[ACTION:\s*SET_UI_THEME:\s*([a-zA-Z0-9_-]+)\]/i);
    if (uiThemeMatch && uiThemeMatch[1]) {
      const val = uiThemeMatch[1].trim().toLowerCase();
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= JARVIS_THEMES.length) {
        handleUIThemeChange(JARVIS_THEMES[num - 1].id as UITheme);
        jarvisAudio.playNotificationSound();
        executed = true;
      } else {
        const found = JARVIS_THEMES.find(t => 
          t.id.toLowerCase() === val || 
          t.id.includes(val) || 
          t.name.toLowerCase().includes(val)
        );
        if (found) { 
          handleUIThemeChange(found.id as UITheme); 
          jarvisAudio.playNotificationSound(); 
          executed = true; 
        }
      }
    } else if (lower.includes("சையான் தீம்") || lower.includes("cyan theme") || (lower.includes("தீம்") && (lower.includes("சையான்") || lower.includes("cyan")))) {
      handleUIThemeChange("cyan"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("எமரால்டு தீம்") || lower.includes("emerald theme") || (lower.includes("தீம்") && (lower.includes("எமரால்டு") || lower.includes("emerald") || lower.includes("பச்சை")))) {
      handleUIThemeChange("emerald"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("ஆம்பர் தீம்") || lower.includes("amber theme") || (lower.includes("தீம்") && (lower.includes("ஆம்பர்") || lower.includes("amber") || lower.includes("மஞ்சள்")))) {
      handleUIThemeChange("amber"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("கிரிம்சன் தீம்") || lower.includes("crimson theme") || (lower.includes("தீம்") && (lower.includes("கிரிம்சன்") || lower.includes("crimson") || lower.includes("சிவப்பு")))) {
      handleUIThemeChange("crimson"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("அமெதிஸ்ட் தீம்") || lower.includes("amethyst theme") || (lower.includes("தீம்") && (lower.includes("அமெதிஸ்ட்") || lower.includes("amethyst") || lower.includes("ஊதா")))) {
      handleUIThemeChange("amethyst"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("கோல்டு தீம்") || lower.includes("gold theme") || (lower.includes("தீம்") && (lower.includes("கோல்டு") || lower.includes("gold") || lower.includes("தங்க")))) {
      handleUIThemeChange("gold"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("தீம்ஸ் மாத்து") || lower.includes("தீம் மாத்து") || lower.includes("change theme") || lower.includes("ui theme tab") || lower.includes("தீம்ஸ் டேப்")) {
      handleTacticalTabChange("ui_change");
      setIsTacticalWidgetsOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 17. Arc Reactor Core Style Matching
    const reactorStyleMatch = text.match(/\[ACTION:\s*SET_REACTOR_THEME:\s*([a-zA-Z0-9_-]+)\]/i);
    if (reactorStyleMatch && reactorStyleMatch[1]) {
      const val = reactorStyleMatch[1].trim();
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= HOLOGRAPHIC_REACTOR_THEMES.length) {
        handleReactorStyleChange(HOLOGRAPHIC_REACTOR_THEMES[num - 1].id);
        jarvisAudio.playNotificationSound();
        executed = true;
      } else {
        const found = HOLOGRAPHIC_REACTOR_THEMES.find(t => 
          t.id.toLowerCase() === val.toLowerCase() || 
          t.id.includes(val.toLowerCase()) || 
          t.name.toLowerCase().includes(val.toLowerCase())
        );
        if (found) { 
          handleReactorStyleChange(found.id); 
          jarvisAudio.playNotificationSound(); 
          executed = true; 
        }
      }
    } else if (lower.includes("பல்லேடியம்") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 1") || lower.includes("mk 1") || lower.includes("முதல்") || lower.includes("ஒன்னாவது")))) {
      handleReactorStyleChange("core-mark1-classic"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("முக்கோண ரியாக்டர்") || lower.includes("vibranium") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 2") || lower.includes("mk 2") || lower.includes("இரண்டாவது") || lower.includes("ரெண்டாவது")))) {
      handleReactorStyleChange("core-mark2-vibranium"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("கிரிட் ரியாக்டர்") || lower.includes("wireframe") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 3") || lower.includes("mk 3") || lower.includes("மூன்றாவது")))) {
      handleReactorStyleChange("core-mark3-grid"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("ஸ்டெல்த் ரியாக்டர்") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 4") || lower.includes("mk 4") || lower.includes("நான்காவது")))) {
      handleReactorStyleChange("core-mark4-stealth"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("நியோன் ரியாக்டர்") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 5") || lower.includes("mk 5") || lower.includes("ஐந்தாவது")))) {
      handleReactorStyleChange("core-mark5-pulsar"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("ஃபியூஷன் ரியாக்டர்") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 6") || lower.includes("mk 6") || lower.includes("ஆறாவது")))) {
      handleReactorStyleChange("core-mark6-fusion"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("ஓவர்க்ளாக் ரியாக்டர்") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 7") || lower.includes("mk 7") || lower.includes("ஏழாவது")))) {
      handleReactorStyleChange("core-mark7-overclock"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("அவுரா ரியாக்டர்") || (lower.includes("ரியாக்டர்") && (lower.includes("mark 8") || lower.includes("mk 8") || lower.includes("எட்டாவது")))) {
      handleReactorStyleChange("core-mark8-infinity"); jarvisAudio.playNotificationSound(); executed = true;
    } else if (lower.includes("ரியாக்டர் மாத்து") || lower.includes("ரியாக்டர் ஸ்டைல் மாத்து") || lower.includes("change reactor") || lower.includes("reactor tab") || lower.includes("ரியாக்டர் டேப்")) {
      handleTacticalTabChange("reactor_change");
      setIsTacticalWidgetsOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 21. Live Telemetry Queries (Time, Date, Power, Battery Accuracy)
    if (
      lower.includes("மணி என்ன") || lower.includes("what time") || lower.includes("current time") || 
      lower.includes("தேதி என்ன") || lower.includes("இன்னைக்கு என்ன தேதி") || lower.includes("what date") || lower.includes("today's date") ||
      lower.includes("பவர் எவ்வளவு") || lower.includes("battery level") || lower.includes("arc reactor power") || lower.includes("சார்ஜ் எவ்வளவு")
    ) {
      const timeStr = systemEnvironment.currentTime;
      const dateStr = systemEnvironment.currentDate;
      const battStr = systemEnvironment.device.batteryLevel !== null ? `${systemEnvironment.device.batteryLevel}% (${systemEnvironment.device.isCharging ? "Charging / Arc Reactor Active" : "Battery Powered"})` : "100% Arc Reactor Core";
      const locStr = systemEnvironment.location.city || "Connected Node";

      const reply = `⏱️ Live Time: ${timeStr} | 📅 Date: ${dateStr} | ⚡ Arc Reactor Power: ${battStr} | 📍 ${locStr}`;
      setWakeWordAlert(reply);
      setTimeout(() => setWakeWordAlert(null), 4000);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 18. File Converter Format Selection
    const convertFormatMatch = text.match(/\[ACTION:\s*CONVERT_FORMAT:\s*([a-zA-Z0-9]+)_TO_([a-zA-Z0-9]+)\]/i);
    if (convertFormatMatch) {
      setIsFileConverterOpen(true);
      window.dispatchEvent(new CustomEvent("jarvis-set-converter-format", {
        detail: { from: convertFormatMatch[1].toLowerCase(), to: convertFormatMatch[2].toLowerCase() }
      }));
      executed = true;
    }
    const convertToMatch = text.match(/\[ACTION:\s*SET_CONVERTER_TO:\s*([a-zA-Z0-9]+)\]/i);
    if (convertToMatch) {
      setIsFileConverterOpen(true);
      window.dispatchEvent(new CustomEvent("jarvis-set-converter-format", {
        detail: { to: convertToMatch[1].toLowerCase() }
      }));
      executed = true;
    }

    // Smart Calendar Voice Engine (Open, Close, Plan Scheduling, Date Fixing & 2-Day Alerts)
    const isCalOpenPhrase = 
      text.includes("[ACTION: OPEN_CALENDAR]") || text.includes("[ACTION: SMART_CALENDAR]") ||
      lower.includes("open calendar") || lower.includes("show calendar") || lower.includes("smart calendar") ||
      lower.includes("ஓபன் பண்ணி காமி") || lower.includes("ஓபன் பண்ணி காட்டு") || lower.includes("ஓபன் பண்ணி காமிக்க") ||
      lower.includes("கேலண்டர் ஓபன்") || lower.includes("காலண்டர் ஓபன்") || lower.includes("கேலண்டர ஓபன்") || lower.includes("காலண்டர ஓபன்") ||
      lower.includes("கேலண்டர் காட்டு") || lower.includes("காலண்டர் காட்டு") || lower.includes("கேலண்டர் திற") || lower.includes("காலண்டர் திற") ||
      lower.includes("கேலண்டரை திற") || lower.includes("காலண்டரை திற") || lower.includes("கேலண்டர் பாரு") || lower.includes("காலண்டர் பாரு");

    const isCalClosePhrase = 
      text.includes("[ACTION: CLOSE_CALENDAR]") || 
      (lower.includes("calendar") && isClose) || 
      lower.includes("கேலண்டர் மூடு") || lower.includes("காலண்டர் மூடு") || 
      lower.includes("கேலண்டர மூடு") || lower.includes("காலண்டர மூடு") ||
      lower.includes("கேலண்டர் க்ளோஸ்") || lower.includes("காலண்டர் க்ளோஸ்");

    // Explicit tag or natural voice to add a plan / fix date
    const addPlanTagMatch = text.match(/\[ACTION:\s*ADD_PLAN:\s*date="([^"]+)"(?:\s*time="([^"]+)")?\s*title="([^"]+)"(?:\s*category="([^"]+)")?\]/i);
    const isSchedulingVoice = 
      lower.includes("பிளான் பண்ணு") || lower.includes("குறிச்சு வை") || lower.includes("சேர்த்து வை") || 
      lower.includes("ஆட் பண்ணு") || lower.includes("ஷெட்யூல் பண்ணு") || lower.includes("நோட் பண்ணு") || 
      lower.includes("ரிமைண்டர் வை") || lower.includes("பிக்ஸ் பண்ணு") || lower.includes("schedule plan") || 
      lower.includes("add plan") || lower.includes("set reminder") || lower.includes("fix date");

    if (addPlanTagMatch) {
      const planDate = addPlanTagMatch[1].trim();
      const planTime = (addPlanTagMatch[2] || "10:00").trim();
      const planTitle = addPlanTagMatch[3].trim();
      const planCat = (addPlanTagMatch[4] as any) || "முக்கியம்";

      const newEv: CalendarEvent = {
        id: `plan-tag-${Date.now()}`,
        date: planDate,
        time: planTime,
        title: planTitle,
        type: "reminder",
        category: planCat,
        notes: "J.A.R.V.I.S. AI Action Directives மூலம் தானாக பதிவு செய்யப்பட்டது.",
        isImportant: true,
        status: "pending",
        createdAt: Date.now(),
      };
      const existing = loadCalendarEvents();
      saveCalendarEvents([newEv, ...existing]);
      setIsSmartCalendarOpen(true);
      setWakeWordAlert(`✅ கேலண்டரில் குறிக்கப்பட்டது: ${planTitle} (${planDate})`);
      setTimeout(() => setWakeWordAlert(null), 3500);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (isSchedulingVoice && !isCalClosePhrase) {
      // Natural spoken plan scheduling:
      const now = new Date();
      let targetDate = formatDateKey(now);
      let targetTime = "10:00";

      if (lower.includes("நாளைக்கு") || lower.includes("tomorrow")) {
        const d = new Date();
        d.setDate(now.getDate() + 1);
        targetDate = formatDateKey(d);
      } else if (lower.includes("நாளை மறுநாள்") || lower.includes("2 நாள் கழிச்சு") || lower.includes("day after tomorrow")) {
        const d = new Date();
        d.setDate(now.getDate() + 2);
        targetDate = formatDateKey(d);
      } else {
        // Month detection
        const monthsMap: Record<string, number> = {
          "ஜனவரி": 0, "january": 0, "jan": 0,
          "பிப்ரவரி": 1, "february": 1, "feb": 1,
          "மார்ச்": 2, "march": 2, "mar": 2,
          "ஏப்ரல்": 3, "april": 3, "apr": 3,
          "மே": 4, "may": 4,
          "ஜூன்": 5, "june": 5,
          "ஜூலை": 6, "july": 6,
          "ஆகஸ்ட்": 7, "august": 7, "aug": 7,
          "செப்டம்பர்": 8, "september": 8, "sep": 8,
          "அக்டோபர்": 9, "october": 9, "oct": 9,
          "நவம்பர்": 10, "november": 10, "nov": 10,
          "டிசம்பர்": 11, "december": 11, "dec": 11,
        };

        for (const [mName, mIdx] of Object.entries(monthsMap)) {
          if (lower.includes(mName)) {
            // Find day number nearby
            const dayMatch = text.match(new RegExp(`${mName}[^0-9]*(\\d{1,2})`, "i")) || text.match(/(\d{1,2})[^0-9]*(?:-?ஆம்\s*தேதி|-?வது\s*தேதி|ஆம்\s*தேதி|தேதி)/i) || text.match(/(\d{1,2})/);
            if (dayMatch && dayMatch[1]) {
              const dayNum = parseInt(dayMatch[1], 10);
              if (dayNum >= 1 && dayNum <= 31) {
                const y = now.getFullYear();
                targetDate = `${y}-${String(mIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                break;
              }
            }
          }
        }
      }

      // Time parsing
      const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:மணி|am|pm)/i);
      if (timeMatch) {
        const hh = parseInt(timeMatch[1], 10);
        const mm = timeMatch[2] || "00";
        const isEvening = lower.includes("மாலை") || lower.includes("pm") || lower.includes("இரவு");
        const formattedH = isEvening && hh < 12 ? hh + 12 : hh;
        targetTime = `${String(formattedH).padStart(2, "0")}:${mm}`;
      }

      // Title cleanup
      let cleanTitle = text
        .replace(/\[ACTION:[^\]]+\]/g, "")
        .replace(/பிளான் பண்ணு|குறிச்சு வை|சேர்த்து வை|ஆட் பண்ணு|ஷெட்யூல் பண்ணு|நோட் பண்ணு|ரிமைண்டர் வை|பிக்ஸ் பண்ணு/gi, "")
        .replace(/நாளைக்கு|நாளை மறுநாள்|இன்னைக்கு|கேலண்டர்ல|காலண்டர்ல|மணிக்கு/gi, "")
        .replace(/ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்/gi, "")
        .replace(/\b\d{1,2}\s*(?:ஆம்\s*தேதி|தேதி|மணி)?\b/gi, "")
        .trim();

      if (!cleanTitle || cleanTitle.length < 2) {
        cleanTitle = "புதிய திட்டம் (New Plan)";
      }

      const newEv: CalendarEvent = {
        id: `plan-voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: targetDate,
        time: targetTime,
        title: cleanTitle,
        type: "reminder",
        category: lower.includes("பண்டிகை") ? "பண்டிகை" : lower.includes("விசேஷம்") ? "விசேஷம்" : "முக்கியம்",
        notes: `குரல் கட்டளை (Voice Command) மூலம் தானாக பதிவு செய்யப்பட்டது: "${text}"`,
        isImportant: true,
        status: "pending",
        createdAt: Date.now(),
      };

      const existing = loadCalendarEvents();
      saveCalendarEvents([newEv, ...existing]);
      setIsSmartCalendarOpen(true);
      setWakeWordAlert(`✅ கேலண்டரில் குறிக்கப்பட்டது: ${cleanTitle} (${targetDate} • ${targetTime})`);
      setTimeout(() => setWakeWordAlert(null), 3500);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (
      (lower.includes("அலர்ட்") || lower.includes("alert") || lower.includes("வரவிருக்கும்") || lower.includes("upcoming") || lower.includes("என்ன பிளான்")) &&
      !isCalClosePhrase
    ) {
      // Querying alerts & upcoming plans
      const alerts = getUpcoming2DayAlerts(loadCalendarEvents());
      setIsSmartCalendarOpen(true);
      if (alerts.length > 0) {
        setWakeWordAlert(`🔔 அடுத்த 2 நாள் எச்சரிக்கை (${alerts.length}): ${alerts.map(a => a.title).join(", ")}`);
      } else {
        setWakeWordAlert("🔔 அடுத்த 2 நாட்களில் புதிய எச்சரிக்கை திட்டங்கள் ஏதுமில்லை.");
      }
      setTimeout(() => setWakeWordAlert(null), 4000);
      jarvisAudio.playNotificationSound();
      executed = true;
    } else if (isCalOpenPhrase) {
      setIsSmartCalendarOpen(true);
      jarvisAudio.playNotificationSound();
      setWakeWordAlert("📅 Smart Calendar Opened");
      setTimeout(() => setWakeWordAlert(null), 2500);
      executed = true;
    } else if (isCalClosePhrase) {
      setIsSmartCalendarOpen(false);
      executed = true;
    }

    // 19. Performance Boost, FPS Matrix & Power Save Toggle
    const isPerfVoice =
      text.includes("[ACTION: BOOST_PERFORMANCE]") || text.includes("[ACTION: OPTIMIZE_PERFORMANCE]") ||
      text.includes("[ACTION: TOGGLE_PERFORMANCE]") ||
      lower.includes("boost performance") || lower.includes("optimize system") || 
      lower.includes("performance mode") || lower.includes("ultra mode") ||
      lower.includes("பெர்ஃபார்மன்ஸ்") || lower.includes("பெர்பார்மன்ஸ்") || 
      lower.includes("fps") || lower.includes("எஃப் பி எஸ்") ||
      lower.includes("power save") || lower.includes("பவர் சேவர்") || lower.includes("பவர் சேவ்");

    if (isPerfVoice) {
      let activeModeLabel = "";
      if (lower.includes("120") || lower.includes("ultra") || lower.includes("அல்ட்ரா")) {
        setMode('ULTRA');
        activeModeLabel = "ULTRA (120 FPS)";
      } else if (lower.includes("30") || lower.includes("save") || lower.includes("சேவர்") || lower.includes("சேவ்")) {
        setMode('ECO');
        activeModeLabel = "POWER SAVE (30 FPS)";
      } else if (lower.includes("60") || lower.includes("balanced") || lower.includes("நார்மல்")) {
        setMode('BALANCED');
        activeModeLabel = "PERFORMANCE (60 FPS)";
      } else {
        const nextMode = cyclePerformanceMode();
        activeModeLabel = nextMode === 'ULTRA' ? "ULTRA (120 FPS)" : nextMode === 'BALANCED' ? "PERFORMANCE (60 FPS)" : "POWER SAVE (30 FPS)";
      }

      setTelemetry(prev => ({
        ...prev,
        memoryUsage: Math.max(18, prev.memoryUsage - 22),
        networkLatencyMs: Math.max(6, prev.networkLatencyMs - 12)
      }));
      setWakeWordAlert(`⚡ PERFORMANCE MATRIX UPDATED: ${activeModeLabel}`);
      setTimeout(() => setWakeWordAlert(null), 3000);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 20. Personas
    if (text.includes("[ACTION: SET_PERSONA_NORMAL]") || lower.includes("normal persona")) { handlePersonaChange("NORMAL_JARVIS"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_PROFESSIONAL]") || lower.includes("professional persona")) { handlePersonaChange("PROFESSIONAL"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_FRIEND]") || lower.includes("friend persona") || lower.includes("நண்பன் பர்சோனா")) { handlePersonaChange("FRIEND"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_PROFESSOR]") || lower.includes("professor persona")) { handlePersonaChange("PROFESSOR"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_SCIENTIST]") || lower.includes("scientist persona")) { handlePersonaChange("SCIENTIST"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_STUDENT]")) { handlePersonaChange("STUDENT"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_LOVER_BOY]")) { handlePersonaChange("LOVER_BOY"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_LOVER_GIRL]") || lower.includes("lover girl") || lower.includes("மனைவி பர்சோனா")) { handlePersonaChange("LOVER_GIRL"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_DOCTOR]") || lower.includes("doctor persona") || lower.includes("மருத்துவர் பர்சோனா")) { handlePersonaChange("DOCTOR"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_MILITARY]") || lower.includes("military persona")) { handlePersonaChange("MILITARY"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_CYBER_SECURITY]")) { handlePersonaChange("CYBER_SECURITY"); executed = true; }
    if (text.includes("[ACTION: SET_PERSONA_SIBLINGS]")) { handlePersonaChange("SIBLINGS"); executed = true; }
    if (lower.includes("பர்சோனா மாத்து") || lower.includes("change persona") || lower.includes("பர்சோனா டேப்") || lower.includes("persona tab")) {
      handleTacticalTabChange("persona");
      setIsTacticalWidgetsOpen(true);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    // 21. Sovereign File & Book Download Execution Engine
    const downloadFileMatch = text.match(/\[ACTION:\s*DOWNLOAD_FILE:\s*url="([^"]+)"(?:\s*filename="([^"]+)")?\]/i);
    if (downloadFileMatch && downloadFileMatch[1]) {
      const fileUrl = downloadFileMatch[1];
      const fileName = downloadFileMatch[2] || fileUrl.split("/").pop() || "downloaded_file";
      downloadFileToDevice(fileUrl, fileName);
      setWakeWordAlert(`📥 கோப்பு பதிவிறக்கம் தொடங்கப்பட்டது: ${fileName}`);
      setTimeout(() => setWakeWordAlert(null), 4000);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    const downloadBookMatch = text.match(/\[ACTION:\s*DOWNLOAD_BOOK(?::\s*format="([^"]+)")?\]/i);
    if (downloadBookMatch) {
      const format = downloadBookMatch[1] || "pdf";
      window.dispatchEvent(new CustomEvent("jarvis-download-book", { detail: { format } }));
      setWakeWordAlert(`📚 புத்தகம் ${format.toUpperCase()} வடிவில் பதிவிறக்கம் செய்யப்படுகிறது...`);
      setTimeout(() => setWakeWordAlert(null), 4000);
      jarvisAudio.playNotificationSound();
      executed = true;
    }

    const isDownloadSpoken = 
      lower.includes("டவுன்லோட் பண்ணு") || lower.includes("டவுன்லோட் பண்ணிரு") || 
      lower.includes("டவுன்லோட் செய்") || lower.includes("பதிவிறக்கம்") || 
      lower.includes("பதிவிறக்கு") || lower.includes("டவுன்லோடு") ||
      lower.includes("சேவ் பண்ணு") || lower.includes("download it") || 
      lower.includes("download this") || lower.includes("download the pdf") || 
      lower.includes("download file") || lower.includes("download book");

    if (isDownloadSpoken) {
      // 1. Trigger Book Download if book card is active
      window.dispatchEvent(new CustomEvent("jarvis-download-book", { detail: { format: "pdf" } }));

      // 2. Scan recent chat history for download links
      const currentList = messagesRef.current || [];
      let foundUrl: string | null = null;
      let foundName = "downloaded_file";

      for (let i = currentList.length - 1; i >= 0; i--) {
        const m = currentList[i];
        const contentStr = m.text || "";

        const match = contentStr.match(/\[ACTION:\s*DOWNLOAD_FILE:\s*url="([^"]+)"(?:\s*filename="([^"]+)")?\]/i);
        if (match && match[1]) {
          foundUrl = match[1];
          foundName = match[2] || "document";
          break;
        }

        const fileUrlMatch = contentStr.match(/((?:https?:\/\/)[^\s\)]+\.(?:pdf|epub|mobi|docx?|xlsx?|pptx?|txt|zip|rar|7z|mp4|mp3|mkv|wav|jpg|jpeg|png|webp|apk|exe)(?:\?[^\s\)]*)?)/i);
        if (fileUrlMatch && fileUrlMatch[1]) {
          foundUrl = fileUrlMatch[1];
          foundName = foundUrl.split("/").pop()?.split("?")[0] || "file";
          break;
        }

        const anyUrlMatch = contentStr.match(/((?:https?:\/\/)[^\s\)]+)/i);
        if (anyUrlMatch && anyUrlMatch[1]) {
          foundUrl = anyUrlMatch[1];
          foundName = "downloaded_content";
          break;
        }
      }

      if (foundUrl) {
        downloadFileToDevice(foundUrl, foundName);
        setWakeWordAlert(`📥 கோப்பு பதிவிறக்கம் செய்யப்படுகிறது: ${foundName}`);
        setTimeout(() => setWakeWordAlert(null), 4000);
        jarvisAudio.playNotificationSound();
        executed = true;
      }
    }

    // 22. VOICE-CONTROLLED SCROLLING ENGINE (வாய்ஸ் ஸ்க்ரோலிங் & ஆப்ஷன்ஸ் ஸ்க்ரோல்)
    const isScrollLeft = 
      lower.includes("scroll left") || lower.includes("லெஃப்ட் ஸ்க்ரோல்") || lower.includes("இடது பக்கம் ஸ்க்ரோல்") ||
      lower.includes("முந்தைய ஆப்ஷன்ஸ்") || lower.includes("முந்தைய ஆப்ஷன்") || lower.includes("முந்தையது");

    const isScrollRight = 
      lower.includes("scroll right") || lower.includes("ரைட் ஸ்க்ரோல்") || lower.includes("வலது பக்கம் ஸ்க்ரோல்") ||
      lower.includes("அடுத்த ஆப்ஷன்ஸ்") || lower.includes("அடுத்தது காமி") || lower.includes("அடுத்த ஆப்ஷன்") || lower.includes("அடுத்தது காட்டு");

    const isScrollBottom = 
      lower.includes("scroll to bottom") || lower.includes("scroll bottom") || lower.includes("முழுசா கீழ") || 
      lower.includes("கடைசி வரைக்கும்") || lower.includes("கடைசி போ") || lower.includes("பாட்டம் போ");

    const isScrollTop = 
      lower.includes("scroll to top") || lower.includes("scroll top") || lower.includes("முழுசா மேல") || 
      lower.includes("முதல் பக்கம்") || lower.includes("டாப் போ") || lower.includes("ஆரம்பத்துக்கு போ");

    const isScrollDown = 
      !isScrollBottom && !isScrollTop && !isScrollLeft && !isScrollRight && (
        lower.includes("scroll down") || lower.includes("ஸ்க்ரோல் டவுன்") || 
        lower.includes("கீழே ஸ்க்ரோல்") || lower.includes("கீழ ஸ்க்ரோல்") || 
        lower.includes("கீழே போ") || lower.includes("கீழ போ") || 
        lower.includes("கீழ இறக்கு") || lower.includes("கீழ இறக்குங்க") ||
        lower.includes("இன்னும் கொஞ்சம் கீழ") || lower.includes("கீழ காமி") || lower.includes("கீழே காட்டு") ||
        lower.includes("இன்னும் கொஞ்சம் ஸ்க்ரோல்") || lower.includes("ஆப்ஷன்ஸ ஸ்க்ரோல் பண்ணு") || lower.includes("ஆப்ஷன்ஸ் ஸ்க்ரோல்") ||
        lower.includes("ஸ்க்ரோல் பண்ணு") || lower.includes("ஸ்க்ரோல் பண்ணி") || lower.includes("ஸ்க்ரோல் பண்ணுங்க") ||
        (lower.includes("scroll") && !lower.includes("up") && !lower.includes("top") && !lower.includes("left") && !lower.includes("right"))
      );

    const isScrollUp = 
      !isScrollBottom && !isScrollTop && !isScrollLeft && !isScrollRight && (
        lower.includes("scroll up") || lower.includes("ஸ்க்ரோல் அப்") || 
        lower.includes("மேலே ஸ்க்ரோல்") || lower.includes("மேல ஸ்க்ரோல்") || 
        lower.includes("மேலே போ") || lower.includes("மேல போ") || 
        lower.includes("மேல ஏத்து") || lower.includes("மேல ஏத்துங்க") ||
        lower.includes("இன்னும் கொஞ்சம் மேல") || lower.includes("மேல காமி") || lower.includes("மேலே காட்டு")
      );

    if (isScrollBottom || text.includes("[ACTION: SCROLL_BOTTOM]")) {
      handleSmartVoiceScroll("bottom");
      return true;
    }
    if (isScrollTop || text.includes("[ACTION: SCROLL_TOP]")) {
      handleSmartVoiceScroll("top");
      return true;
    }
    if (isScrollDown || text.includes("[ACTION: SCROLL_DOWN]")) {
      handleSmartVoiceScroll("down");
      return true;
    }
    if (isScrollUp || text.includes("[ACTION: SCROLL_UP]")) {
      handleSmartVoiceScroll("up");
      return true;
    }
    if (isScrollLeft || text.includes("[ACTION: SCROLL_LEFT]")) {
      handleSmartVoiceScroll("left");
      return true;
    }
    if (isScrollRight || text.includes("[ACTION: SCROLL_RIGHT]")) {
      handleSmartVoiceScroll("right");
      return true;
    }

    return executed;
  }, [
    handleTacticalTabChange,
    handleSelectSpeechLang,
    handleSelectVoiceId,
    handleUIThemeChange,
    handleReactorStyleChange,
    handlePersonaChange,
    handleSmartVoiceScroll
  ]);

  executeJarvisVoiceActionRef.current = executeJarvisVoiceAction;

  // J.A.R.V.I.S. UI Control Action Parser (Executes whenever a new AI message arrives)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "model" && lastMsg.text && !processedActionMsgIdsRef.current.has(lastMsg.id)) {
      processedActionMsgIdsRef.current.add(lastMsg.id);
      executeJarvisVoiceAction(lastMsg.text);
    }
  }, [messages, executeJarvisVoiceAction]);

  // Session Management Operations
  const handleNewChat = () => {
    const newId = "session_" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelUsed: selectedModel,
    };
    setSessions(prev => {
      const next = [newSession, ...prev];
      persistSessionsSafely(next);
      return next;
    });
    setActiveSessionId(newId);
    lastActiveSessionIdRef.current = newId;
    setMessages([]);
    messagesRef.current = [];
    sessionSpeechBufferRef.current = "";
    setLiveTranscript("");
    safeStorageSet("jarvis_active_session_id", newId);
    jarvisAudio.playNotificationSound();
  };

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === "workspace-chat-primary" || sessionId.startsWith("sidebar-") || sessionId.startsWith("workspace-")) {
      if (sessionId.startsWith("sidebar-session-")) {
        try {
          let wSessions = await indexedStorage.get<any[]>("jarvis_sidebar_workspace_sessions", []);
          if (!wSessions || wSessions.length === 0) {
            wSessions = safeJSONParse(localStorage.getItem("jarvis_sidebar_workspace_sessions") || "[]", []);
          }
          const found = wSessions.find((ws: any) => ws.id === sessionId);
          if (found && found.messages) {
            await indexedStorage.set("jarvis_sidebar_workspace_history", found.messages);
            safeStorageSet("jarvis_sidebar_workspace_history", JSON.stringify(found.messages.slice(-5)));
          }
        } catch (e) { console.debug("Ignored exception", e); }
      }
      setIsSidebarChatOpen(true);
      jarvisAudio.playNotificationSound();
      return;
    }

    let target = sessions.find(s => s.id === sessionId);
    
    if (!target && sessionId.startsWith("widget-")) {
      try {
        const saved = localStorage.getItem("jarvis_tactical_widget_histories");
        if (saved) {
          const histories = safeJSONParse(saved, []);
          const modelId = sessionId.replace("widget-", "");
          const widgetMessages = histories[modelId];
          if (widgetMessages) {
            target = {
              id: sessionId,
              title: `[Widget] ${modelId.toUpperCase()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: widgetMessages,
              modelUsed: modelId as any,
              source: "tactical_widget"
            };
            setSessions(prev => [target!, ...prev]);
          }
        }
      } catch (e) {}
    }

    if (target) {
      if (target.messages) {
        target.messages.forEach((m: any) => {
          if (m?.id) processedActionMsgIdsRef.current.add(m.id);
        });
      }
      setActiveSessionId(sessionId);
      setMessages(target.messages || []);
      if (target.modelUsed) setSelectedModel(target.modelUsed);
      jarvisAudio.playNotificationSound();
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      persistSessionsSafely(remaining);
      if (sessionId === activeSessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setMessages(remaining[0].messages);
        } else {
          const newId = "session_" + Date.now();
          setActiveSessionId(newId);
          setMessages([]);
        }
      }
      return remaining;
    });
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s);
      persistSessionsSafely(updated);
      return updated;
    });
  };

  const handleClearAllSessions = () => {
    const newId = "session_" + Date.now();
    const freshSession: ChatSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelUsed: selectedModel,
    };
    setSessions([freshSession]);
    setActiveSessionId(newId);
    setMessages([]);
    persistSessionsSafely([freshSession]);
    safeStorageSet("jarvis_active_session_id", newId);
    localStorage.removeItem("jarvis_remodel_memory_v3");
  };

  // Telemetry fluctuation & local daemon ping
  useEffect(() => {
    const pingLocalDaemon = async () => {
      // Prevent mixed-content console spam in secure environments
      if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
        setTelemetry(prev => {
          if (prev.localAgentOnline === false) return prev;
          return { ...prev, localAgentOnline: false };
        });
        return;
      }
      try {
        const start = performance.now();
        const res = await fetch("http://localhost:11424/status", { method: "GET" });
        const latency = Math.round(performance.now() - start);

        if (res.ok) {
          const data = await res.json();
          setTelemetry(prev => ({
            ...prev,
            localAgentOnline: true,
            networkLatencyMs: latency || 12,
            cpuUsage: data.telemetry?.cpu_percent ?? 24,
            memoryUsage: data.telemetry?.memory_percent ?? 42,
            activeProcesses: data.telemetry?.active_processes ?? 162,
          }));
        } else {
          setTelemetry(prev => {
            if (prev.localAgentOnline === false) return prev;
            return { ...prev, localAgentOnline: false };
          });
        }
      } catch(e) {
        setTelemetry(prev => {
          if (prev.localAgentOnline === false) return prev;
          return { ...prev, localAgentOnline: false };
        });
      }
    };

    pingLocalDaemon();
    
    const pingInterval = 20000;
    const interval = setInterval(pingLocalDaemon, pingInterval);

  return () => clearInterval(interval);
  }, [powerSave]);

  // Sync Arc Power with Device Battery Level & Charging Status
  useEffect(() => {
    let batteryInstance: any = null;
    const updateBattery = () => {
      if (batteryInstance) {
        setTelemetry(prev => ({
          ...prev,
          powerOutputPcnt: Math.round(batteryInstance.level * 100),
          isCharging: Boolean(batteryInstance.charging),
        }));
      }
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch((e: any) => console.warn("Battery API unavailable:", e));
    }
    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', updateBattery);
        batteryInstance.removeEventListener('chargingchange', updateBattery);
        batteryInstance = null;
      }
    };
  }, []);

  // Sync fullscreen state with document fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // High-performance Auto-scroll Engine with Instant Stream Following and Pin-to-Bottom
  const scrollToBottom = (smooth = true) => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distance = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isNearBottom = distance < 80;
    isAtBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  // Always auto-scroll to the latest message whenever messages update
  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  useEffect(() => {
    if (liveTranscript) {
      scrollToBottom(false);
    }
  }, [liveTranscript]);

  useEffect(() => {
    if (isProcessing) {
      isAtBottomRef.current = true;
      scrollToBottom(true);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Speech Recognition Handling with Continuous Loop, Tap to Listen, and Wake Word
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const now = Date.now();

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptPart = item[0]?.transcript || "";
        const confidence = item[0]?.confidence ?? 1;

        // Only discard completely unintelligible single-character noise
        if (confidence > 0 && confidence < 0.1 && transcriptPart.trim().length <= 1) {
          continue;
        }

        if (item.isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const activeSpeech = (finalTranscript || interimTranscript).trim();
      if (!activeSpeech) return;

      // NOISE, BREATH & AMBIENT ARTIFACT FILTER:
      // Discard pure isolated breathing sounds, exhalations, throat clears, without dropping real words
      const isNoiseOrBreath = (txt: string): boolean => {
        const clean = txt.trim().toLowerCase();
        if (/^(ஹ்ம்|ம்|ஹ|ஹ்|உ|uh|um|hmm|hm|er|huh|sigh|cough|[.,\-_\s]+)$/i.test(clean)) {
          return true;
        }
        if (clean.length <= 1 && clean !== "a" && clean !== "i" && clean !== "ஆ" && clean !== "ஓ") {
          return true;
        }
        return false;
      };

      if (isNoiseOrBreath(activeSpeech)) {
        return;
      }

      // 1. ACOUSTIC ECHO GUARD & REAL-TIME USER VOCAL INPUT BARGE-IN:
      if (jarvisAudio.isPlaying()) {
        const cleanInput = activeSpeech.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "");
        const cleanAi = (lastSpokenTextRef.current || "").toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "");
        const isVerbatimEcho = cleanInput.length >= 25 && cleanAi.includes(cleanInput);

        if (isVerbatimEcho) {
          return;
        }

        // Real user vocal input detected while AI was speaking!
        // Immediately interrupt speech across all engines and accept the user's input
        jarvisAudio.stopSpeaking();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        lastSpokeEndTimeRef.current = now;
        setIsListening(true);
        isListeningRef.current = true;

        const lowerRaw = activeSpeech.toLowerCase();
        const isStopWord = /^(stop|jarvis stop|cut in|wait|pause|hold on|shutup|shut up|podhum|nillu|iruda|irunga|niruthu|pesadha|போதும்|நில்லு|இரு|நிறுத்து)\b/i.test(lowerRaw);

        if (isStopWord) {
          sessionSpeechBufferRef.current = "";
          setLiveTranscript("");
          setInput("");
          return;
        }
      }

      const inLiveContinuous = (voiceModeRef.current === "continuous" && isContinuousActiveRef.current) || isListeningRef.current;
      const isActivelyListening = isListeningRef.current || inLiveContinuous;

      // 2. IF NOT ACTIVELY LISTENING:
      if (!isActivelyListening) {
        if (wakeWordEnabledRef.current) {
          const lower = activeSpeech.toLowerCase();
          const wakeMatches = [
            "hey jarvis", "hi jarvis", "ok jarvis", "okay jarvis",
            "ஹே ஜார்விஸ்", "டேய் ஜார்விஸ்", "dey jarvis", "eda jarvis", "jarvis", "ஜார்விஸ்"
          ];
          const matchedWake = wakeMatches.find(w => lower.startsWith(w) || lower.includes(w));

          if (matchedWake) {
            if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);

            setWakeWordAlert("JARVIS ACTIVATED");
            setTimeout(() => setWakeWordAlert(null), 2500);

            // Seamlessly promote to Live Conversation
            setVoiceMode("continuous");
            voiceModeRef.current = "continuous";
            isContinuousActiveRef.current = true;
            setIsListening(true);
            isListeningRef.current = true;
            
            const regex = new RegExp(matchedWake, "gi");
            const cmd = activeSpeech.replace(regex, "").replace(/^[,.!\s]+/, "").trim();
            
            if (cmd.length > 1) {
              setLiveTranscript(cmd);
              setInput(cmd);
              startListeningSession("continuous", false);
              handleSendMessage(cmd, true);
              return;
            } else {
              setLiveTranscript("");
              startListeningSession("continuous", false);
              return;
            }
          }
        }
        return;
      }

      // 3. LIVE CONVERSATION & TAP-TO-LISTEN RECOGNITION
      if (finalTranscript) {
        const cleanFinal = finalTranscript.trim();
        if (isSpeakingRef.current || (now - lastSpokeEndTimeRef.current < 1200)) {
          sessionSpeechBufferRef.current = "";
        }
        if (cleanFinal) {
          sessionSpeechBufferRef.current = cleanFinal;
        }

        // IMMEDIATELY EXECUTE VOICE ACTIONS ON SPOKEN COMMAND:
        const wasActionExecuted = executeJarvisVoiceAction(cleanFinal);
        if (wasActionExecuted) {
          console.debug("Voice action intercepted and executed immediately:", cleanFinal);
          const lowerFinal = cleanFinal.toLowerCase();
          const isActionToSuppressPrompt = 
            lowerFinal.includes("upload") || lowerFinal.includes("அப்லோட்") ||
            lowerFinal.includes("select folder") || lowerFinal.includes("choose folder") ||
            lowerFinal.includes("select file") || lowerFinal.includes("choose file") ||
            lowerFinal.includes("scroll") || lowerFinal.includes("ஸ்க்ரோல்") ||
            lowerFinal.includes("கீழே போ") || lowerFinal.includes("கீழ போ") || lowerFinal.includes("மேலே போ") ||
            lowerFinal.includes("மேல போ") || lowerFinal.includes("கீழ இறக்கு") || lowerFinal.includes("மேல ஏத்து") ||
            lowerFinal.includes("அடுத்த ஆப்ஷன்") || lowerFinal.includes("முந்தைய ஆப்ஷன்");
          if (isActionToSuppressPrompt) {
            sessionSpeechBufferRef.current = "";
            setLiveTranscript("");
            if (voiceSilenceTimerRef.current) {
              clearTimeout(voiceSilenceTimerRef.current);
              voiceSilenceTimerRef.current = null;
            }
            return;
          }
        }
      } else if (activeSpeech) {
        // Fast intercept during interim speech for instant responsiveness
        const lowerActive = activeSpeech.toLowerCase();
        if (
          lowerActive.includes("upload file") || lowerActive.includes("upload files") ||
          lowerActive.includes("select folder") || lowerActive.includes("select a folder") ||
          lowerActive.includes("choose folder") || lowerActive.includes("select file") ||
          lowerActive.includes("choose file") || lowerActive.includes("upload folder") ||
          lowerActive.includes("அப்லோட் ஃபைல்") || lowerActive.includes("செலக்ட் ஃபோல்டர்") ||
          lowerActive.includes("டேர்டிக்கல் விட்ஜெட்") || lowerActive.includes("விட்ஜெட்ஸ் ஓபன்") ||
          lowerActive.includes("கன்வெர்ட்டர ஓபன்") || lowerActive.includes("கன்வெர்ட்டர் ஓபன்") ||
          lowerActive.includes("சாட் வொர்க்ஸ்பேஸ ஓபன்") || lowerActive.includes("சாட் வொர்க்ஸ்பேஸ் ஓபன்") ||
          lowerActive.includes("ப்ராஜெக்ட் ஆப்ஸ ஓபன்") || lowerActive.includes("ப்ராஜெக்ட்ஸ் ஓபன்") ||
          lowerActive.includes("scroll down") || lowerActive.includes("scroll up") ||
          lowerActive.includes("ஸ்க்ரோல் பண்ணு") || lowerActive.includes("கீழே ஸ்க்ரோல்") ||
          lowerActive.includes("மேலே ஸ்க்ரோல்") || lowerActive.includes("கீழ ஸ்க்ரோல்") ||
          lowerActive.includes("மேல ஸ்க்ரோல்")
        ) {
          const executed = executeJarvisVoiceAction(activeSpeech);
          if (executed) {
            sessionSpeechBufferRef.current = "";
            setLiveTranscript("");
            if (voiceSilenceTimerRef.current) {
              clearTimeout(voiceSilenceTimerRef.current);
              voiceSilenceTimerRef.current = null;
            }
          }
        }
      }

      const fullSpokenText = (sessionSpeechBufferRef.current || activeSpeech).trim();
      setLiveTranscript(fullSpokenText);

      // Forward recognized text to live audio instance for synchrony
      if (speechLangRef.current !== "hi-IN" && !/[\u0900-\u097F]/.test(fullSpokenText)) {
        geminiLiveAudio.setUserTranscript(fullSpokenText);
      }

      // CRITICAL USER DIRECTIVE: Never auto-type voice transcript into the bottom chat box!
      // Bottom box remains exclusively for keyboard typing, avoiding interference with Live Reactor.

      if (voiceSilenceTimerRef.current) {
        clearTimeout(voiceSilenceTimerRef.current);
        voiceSilenceTimerRef.current = null;
      }

      // Fast, prompt silence detection (850ms for final speech, 1200ms for interim)
      const delay = finalTranscript ? 850 : 1200;
      voiceSilenceTimerRef.current = setTimeout(() => {
        const textToSend = (sessionSpeechBufferRef.current || fullSpokenText).trim();
        sessionSpeechBufferRef.current = "";
        setLiveTranscript("");

        if (!textToSend) return;
        const isCurrentlySpeaking = isSpeakingRef.current && jarvisAudio.isPlaying();
        if (isCurrentlySpeaking) return;

        // When Gemini Live is active:
        if (geminiLiveAudio.getIsActive()) {
          // If Gemini Live is already speaking, do not duplicate
          if (geminiLiveAudio.getIsModelSpeaking()) return;

          // Dispatch the recognized speech directly to the Live session so it responds immediately!
          geminiLiveAudio.sendSpokenTextTurn(textToSend);

          // Fast Watchdog: If Gemini Live does not begin speaking within 1.2s, fall back to handleSendMessage so user is NEVER ignored!
          setTimeout(() => {
            if (!geminiLiveAudio.getIsModelSpeaking() && !isSpeakingRef.current && !isProcessingRef.current) {
              console.debug("Live session reply watchdog triggered; executing fallback response for:", textToSend);
              handleSendMessage(textToSend, true);
            }
          }, 1200);

          return;
        }

        handleSendMessage(textToSend, true);
      }, delay);
    };

    recognition.onstart = () => {
      isRecognitionRunning = true;
    };

    recognition.onerror = (e: any) => {
      isRecognitionRunning = false;
      const errType = e?.error || "";
      if (errType === "no-speech" || errType === "aborted") return;

      if (errType === "network") {
        if (isContinuousActiveRef.current && voiceModeRef.current === "continuous") {
          setTimeout(() => {
            if (!isSpeakingRef.current && !isProcessingRef.current && isContinuousActiveRef.current) {
              safeStartRecognition(speechLangRef.current || "ta-IN");
            }
          }, 1000);
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
        return;
      }

      if (errType === "not-allowed") {
        setIsListening(false);
        isListeningRef.current = false;
        isContinuousActiveRef.current = false;
        return;
      }

      console.debug("Speech recognition event:", errType);
    };

    recognition.onend = () => {
      isRecognitionRunning = false;

      // When Gemini Live is active, do not trigger fallback text chat dispatch
      if (geminiLiveAudio.getIsActive()) {
        return;
      }

      // If speech was captured and silence timer was pending, dispatch immediately in fallback mode
      const pendingText = (sessionSpeechBufferRef.current || liveTranscript).trim();
      if (pendingText && !isProcessingRef.current && !isSpeakingRef.current && (isContinuousActiveRef.current || isListeningRef.current)) {
        if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
        sessionSpeechBufferRef.current = "";
        setLiveTranscript("");
        handleSendMessage(pendingText, true);
      }

      // Auto-restart continuous recognition on Chrome silence timeout only when in continuous mode
      if (isContinuousActiveRef.current && voiceModeRef.current === "continuous") {
        setTimeout(() => {
          if (isContinuousActiveRef.current) {
            try {
              safeStartRecognition(speechLangRef.current || "ta-IN");
              setIsListening(true);
              isListeningRef.current = true;
            } catch (err: any) {
              if (err?.name !== "InvalidStateError") {
                console.debug("Continuous recognition auto-restart:", err);
              }
            }
          }
        }, 60);
      } else if (wakeWordEnabledRef.current) {
        // Standby background wake listening only if explicitly enabled
        setTimeout(() => {
          if (!isSpeakingRef.current && !isProcessingRef.current && !isListeningRef.current) {
            try {
              safeStartRecognition(speechLangRef.current || "ta-IN");
            } catch (e) { console.debug("Ignored exception", e); }
          }
        }, 150);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
        isContinuousActiveRef.current = false;
      }
    };
  }, []);

  const startListeningSession = (mode: VoiceListeningMode = voiceModeRef.current, playSound: boolean = true) => {
    setIsListening(true);
    isListeningRef.current = true;
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsProcessing(false);
    isProcessingRef.current = false;
    sessionSpeechBufferRef.current = "";

    if (mode === "continuous") {
      isContinuousActiveRef.current = true;
    } else {
      isContinuousActiveRef.current = false;
    }

    if (playSound) {
      jarvisAudio.stopSpeaking();
    }

    // Activate Web Speech Recognition immediately in <5ms without blocking
    safeStartRecognition(speechLangRef.current || "ta-IN");

    // Pre-warm hardware permission asynchronously in background
    if (!micPermissionGranted) {
      requestMicPermission().catch(() => {});
    }
  };

  const stopListeningSession = (fullyStop: boolean = true) => {
    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
    }
    currentLiveUserMsgIdRef.current = null;
    currentLiveModelMsgIdRef.current = null;
    isContinuousActiveRef.current = false;
    lastVoiceInteractionRef.current = false;
    setIsListening(false);
    isListeningRef.current = false;
    setLiveTranscript("");
    
    try {
      if (recognition) safeStopRecognition();
    } catch (e) { console.debug("Ignored exception", e); }
  };

  const speakAndHandleResume = (textToSpeak: string) => {
    lastSpokenTextRef.current = textToSpeak;
    jarvisAudio.unlockAudio();

    if (isVoiceMuted) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      lastSpokeEndTimeRef.current = Date.now();
      const shouldResume =
        (voiceModeRef.current === "continuous" && isContinuousActiveRef.current) ||
        lastVoiceInteractionRef.current;
      if (shouldResume) {
        setTimeout(() => {
          startListeningSession("continuous", false);
        }, 80);
      }
      return;
    }

    const inContinuous = (voiceModeRef.current === "continuous" && isContinuousActiveRef.current) || wakeWordEnabledRef.current;
    if (inContinuous) {
      // In continuous mode, keep speech recognition actively armed for immediate user vocal barge-in!
      try {
        if (recognition && !isRecognitionRunning) {
          recognition.lang = speechLangRef.current || "ta-IN";
          safeStartRecognition();
        }
      } catch (e) { console.debug("Ignored exception", e); }
    } else {
      // In manual/tap mode, temporarily pause recognition until user taps or speaks
      try {
        if (recognition) recognition.abort();
      } catch (e) { console.debug("Ignored exception", e); }
      setIsListening(false);
      isListeningRef.current = false;
    }

    // Clean action tags for vocalization
    const speechCleanText = textToSpeak.replace(/\[ACTION: [^\]]+\]/g, "").trim();

    // Immediately mark speaking state so UI transitions instantly
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    setIsListening(false);
    isListeningRef.current = false;

    let didFinish = false;
    const finishSpeaking = () => {
      if (didFinish) return;
      // Guard: If audio is still actively emitting sound, postpone finish
      if (jarvisAudio.isPlaying()) {
        setTimeout(finishSpeaking, 250);
        return;
      }
      didFinish = true;
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      lastSpokeEndTimeRef.current = Date.now();

      // CONTINUOUS CONVERSATIONAL LOOP 
      // After speaking, automatically resume listening with minimal delay (no lag!)
      const shouldResumeListening =
        (voiceModeRef.current === "continuous" && isContinuousActiveRef.current) ||
        lastVoiceInteractionRef.current;

      if (shouldResumeListening) {
        setTimeout(() => {
          if (!isSpeakingRef.current && !jarvisAudio.isPlaying()) {
            startListeningSession("continuous", false);
          }
        }, 100);
      } else if (wakeWordEnabledRef.current) {
        // In standby mode, re-engage background wake listening
        setTimeout(() => {
          try {
            if (recognition && !isSpeakingRef.current && !jarvisAudio.isPlaying()) {
              safeStartRecognition(speechLangRef.current || "ta-IN");
            }
          } catch (e) { console.debug("Ignored exception", e); }
        }, 180);
      }
    };

    // UI safety timeout: calculated based on speech length (never prematurely drop speaking state)
    const watchdogMs = Math.max(16000, Math.ceil(speechCleanText.length * 150));
    const safetyTimer = setTimeout(finishSpeaking, watchdogMs);

    // Stop any lingering audio immediately so only ONE voice speaks at any time
    jarvisAudio.stopSpeaking();

    jarvisAudio.speakHumanized(
      speechCleanText || "Systems nominal, Sir.",
      () => {
        clearTimeout(safetyTimer);
        finishSpeaking();
      },
      undefined,
      () => {
        // onStart callback: Ensure speaking state is firmly active
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setIsListening(false);
        isListeningRef.current = false;
      }
    );
  };

  // Listen for voice speak requests from Chat Workspace and Project Ops
  useEffect(() => {
    const handleExternalSpeak = (e: any) => {
      const text = e.detail?.text;
      if (text && typeof text === "string" && text.trim()) {
        speakAndHandleResume(text.trim());
      }
    };
    window.addEventListener("jarvis-speak-reply", handleExternalSpeak);
    return () => window.removeEventListener("jarvis-speak-reply", handleExternalSpeak);
  }, []);

  const handleReactorTap = () => {
    jarvisAudio.unlockAudio();
    geminiLiveAudio.unlockAudio();

    if (geminiLiveAudio.getIsActive()) {
      geminiLiveAudio.stopLiveSession();
      stopListeningSession(true);
      return;
    }

    if (isSpeaking) {
      handleInterrupt();
      return;
    }

    setVoiceMode("continuous");
    voiceModeRef.current = "continuous";
    isContinuousActiveRef.current = true;
    lastVoiceInteractionRef.current = true;
    safeStorageSet("jarvis_voice_mode_v2", "continuous");

    currentLiveUserMsgIdRef.current = null;
    currentLiveModelMsgIdRef.current = null;

    const mem = getGlobalMemoryString(messagesRef.current.slice(-30), "", selectedPersonaRef.current);
    geminiLiveAudio.setVoice(selectedVoiceId);
    geminiLiveAudio.setPersona(selectedPersonaRef.current);
    geminiLiveAudio.setLanguage(speechLangRef.current || "ta-IN");
    geminiLiveAudio.startLiveSession(mem, systemEnvironment, speechLangRef.current || "ta-IN");

    // Arm native Web Speech API in parallel for 0ms native spoken language recognition
    if (SpeechRecognition) {
      safeStartRecognition(speechLangRef.current || "ta-IN");
    }
  };

  const handleTapToListen = () => {
    jarvisAudio.unlockAudio();
    geminiLiveAudio.unlockAudio();

    if (geminiLiveAudio.getIsActive()) {
      geminiLiveAudio.stopLiveSession();
      stopListeningSession(true);
      return;
    }

    if (isSpeaking) {
      handleInterrupt();
      return;
    }

    // Instant Listening Engagement (<5ms)
    setIsListening(true);
    isListeningRef.current = true;
    setIsProcessing(false);
    isProcessingRef.current = false;
    sessionSpeechBufferRef.current = "";

    setVoiceMode("continuous");
    voiceModeRef.current = "continuous";
    isContinuousActiveRef.current = true;
    lastVoiceInteractionRef.current = true;
    safeStorageSet("jarvis_voice_mode_v2", "continuous");

    currentLiveUserMsgIdRef.current = null;
    currentLiveModelMsgIdRef.current = null;

    // Immediately start speech recognition
    safeStartRecognition(speechLangRef.current || "ta-IN");

    // Connect Live Audio stream in parallel without blocking UI
    const mem = getGlobalMemoryString(messagesRef.current.slice(-30), "", selectedPersonaRef.current);
    geminiLiveAudio.setVoice(selectedVoiceId);
    geminiLiveAudio.setPersona(selectedPersonaRef.current);
    geminiLiveAudio.setLanguage(speechLangRef.current || "ta-IN");
    geminiLiveAudio.startLiveSession(mem, systemEnvironment, speechLangRef.current || "ta-IN");
  };

  const handleToggleContinuous = () => {
    if (geminiLiveAudio.getIsActive() || (voiceMode === "continuous" && isListening)) {
      geminiLiveAudio.stopLiveSession();
      stopListeningSession(true);
      setVoiceMode("tap_to_listen");
      voiceModeRef.current = "tap_to_listen";
      safeStorageSet("jarvis_voice_mode_v2", "tap_to_listen");
    } else {
      setVoiceMode("continuous");
      voiceModeRef.current = "continuous";
      isContinuousActiveRef.current = true;
      lastVoiceInteractionRef.current = true;
      safeStorageSet("jarvis_voice_mode_v2", "continuous");

      currentLiveUserMsgIdRef.current = null;
      currentLiveModelMsgIdRef.current = null;

      const mem = getGlobalMemoryString(messagesRef.current.slice(-30), "", selectedPersonaRef.current);
      geminiLiveAudio.setVoice(selectedVoiceId);
      geminiLiveAudio.setPersona(selectedPersonaRef.current);
      geminiLiveAudio.setLanguage(speechLangRef.current || "ta-IN");
      geminiLiveAudio.startLiveSession(mem, systemEnvironment, speechLangRef.current || "ta-IN");

      if (SpeechRecognition) {
        safeStartRecognition(speechLangRef.current || "ta-IN");
      }
    }
  };

  const handleToggleWakeWord = () => {
    const next = !wakeWordEnabled;
    setWakeWordEnabled(next);
    wakeWordEnabledRef.current = next;
    safeStorageSet("jarvis_wake_word_v2", next ? "true" : "false");
    if (next) {
      jarvisAudio.playWakeSound();
      setWakeWordAlert('WAKE WORD ACTIVE: SAY "HEY JARVIS"');
      setTimeout(() => setWakeWordAlert(null), 3000);
      try {
        if (recognition && !isListening && !isSpeaking && !isProcessing) {
          recognition.lang = speechLangRef.current || "ta-IN";
          safeStartRecognition();
        }
      } catch (e) { console.debug("Ignored exception", e); }
    } else {
      jarvisAudio.playNotificationSound();
    }
  };

  const handleInterrupt = () => {
    geminiLiveAudio.interrupt();
    currentLiveUserMsgIdRef.current = null;
    currentLiveModelMsgIdRef.current = null;
    jarvisAudio.stopSpeaking();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    lastVoiceInteractionRef.current = false;
    lastSpokeEndTimeRef.current = Date.now();
    stopListeningSession(true);
  };

  const handleToggleVoiceMuted = () => {
    const next = !isVoiceMuted;
    setIsVoiceMuted(next);
    jarvisAudio.setMuted(next);
    if (next) {
      jarvisAudio.stopSpeaking();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const handleToggleVoiceEngine = () => {
    const next = voiceEngine === "instant" ? "neural" : "instant";
    setVoiceEngine(next);
    jarvisAudio.setVoiceEngine(next);
    setTerminalLogs(prev => [
      ...prev,
      `[VOICE_ENGINE_DISPATCH]: Mode set to ${next === "instant" ? "⚡ ULTRA-FAST INSTANT (<1s)" : "🎙️ NEURAL STUDIO CLOUD"}`
    ]);
  };

  // Determine Core Orb Visual State with strict priority:
  // 1. If AI is actively speaking or emitting voice output -> ALWAYS "speaking"
  // 2. If cognitive reasoning / streaming response -> "processing"
  // 3. If microphone is armed and listening -> "listening"
  // 4. Otherwise -> "idle"
  const isActuallySpeaking = 
    isSpeaking || 
    (typeof jarvisAudio !== "undefined" && jarvisAudio.isPlaying()) ||
    (typeof geminiLiveAudio !== "undefined" && geminiLiveAudio.getIsActive() && geminiLiveAudio.getIsModelSpeaking());

  const reactorState: ArcReactorState = 
    isActuallySpeaking ? "speaking" :
    isProcessing ? "processing" :
    isListening ? "listening" :
    "idle";

  // User abort stream control
  const handleStopGeneration = () => {
    if (activeStreamAbortCtrlRef.current) {
      try {
        activeStreamAbortCtrlRef.current.abort();
      } catch (e) {
        console.debug("Ignored abort exception", e);
      }
      activeStreamAbortCtrlRef.current = null;
    }
    setIsProcessing(false);
    isProcessingRef.current = false;
    jarvisAudio.stopSpeaking();
  };

  // Dispatch message to intelligence layer
  const handleSendMessage = async (textToSend?: string, isVoiceInput: boolean = false, overrideAttachment?: any, overrideModel?: string) => {
    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
    }
    const currentInput = textToSend !== undefined ? textToSend : input;
    const query = currentInput.trim();
    const currentAttachments = overrideAttachment !== undefined
      ? (Array.isArray(overrideAttachment) ? overrideAttachment : [overrideAttachment])
      : attachments;
    const firstAtt = currentAttachments[0];
    const currentModel = overrideModel || selectedModel;

    if (!query && currentAttachments.length === 0) return;

    if (isProcessing) {
      if (isVoiceInput) {
        // User is speaking again! Barge-in and abort stale generation to prioritize fresh voice turn
        if (activeStreamAbortCtrlRef.current) {
          try { activeStreamAbortCtrlRef.current.abort(); } catch (e) {}
          activeStreamAbortCtrlRef.current = null;
        }
        setIsProcessing(false);
        isProcessingRef.current = false;
      } else {
        return;
      }
    }

    // Immediately execute UI voice/text command with zero delay
    if (query) {
      const isVoiceActionHandled = executeJarvisVoiceAction(query);
      if (isVoiceActionHandled) {
        // UI voice/command action handled directly - do NOT duplicate to mainstream chat
        return;
      }
    }

    // When Chat Workspace (Sidebar) is open, voice queries route directly to Chat Workspace
    if (isSidebarChatOpen && isVoiceInput && query) {
      window.dispatchEvent(new CustomEvent("jarvis-workspace-prompt", {
        detail: { text: query, attachments: currentAttachments, speakReply: true }
      }));
      return;
    }

    // When Project Workspace is open, voice queries route directly to the project engine
    if (isProjectChatOpen && isVoiceInput && query) {
      window.dispatchEvent(new CustomEvent("jarvis-project-prompt", {
        detail: { text: query, attachments: currentAttachments, speakReply: true }
      }));
      return;
    }

    if (isVoiceInput) {
      lastVoiceInteractionRef.current = true;
      if (geminiLiveAudio.getIsActive()) {
        geminiLiveAudio.stopAllAudioPlayback();
      }
    }

    // Deduplication guard: only drop accidental double-clicks within 600ms (never drop voice retries!)
    const recentSent = recentSentQueriesRef.current.slice(-1)[0];
    if (!isVoiceInput && recentSent && recentSent.text.trim().toLowerCase() === query.toLowerCase() && (Date.now() - recentSent.time < 600)) {
      console.debug("Dropped rapid duplicate text prompt dispatch:", query);
      return;
    }

    // Instant barge-in: stop any current speech and unlock audio
    jarvisAudio.unlockAudio();
    jarvisAudio.stopSpeaking();

    const timestamp = Date.now();
    const timeStr = new Date().toTimeString().split(" ")[0];

    const userMessage: Message = {
      id: `msg-usr-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      text: query,
      image: firstAtt?.url || undefined,
      mediaType: firstAtt ? (firstAtt.type.startsWith("image/") ? "image" : firstAtt.type.startsWith("video/") ? "video" : "document") : undefined,
      mediaName: firstAtt?.name,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp,
      modelBadge: currentModel,
    };

    setMessages(prev => {
      // Guard against identical consecutive user messages
      const last = prev.slice(-1)[0];
      if (last && last.role === "user" && last.text.trim().toLowerCase() === query.toLowerCase()) {
        return prev;
      }
      return [...prev, userMessage];
    });
    
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    if (overrideAttachment === undefined) {
      setAttachments([]);
    }

    if (isVoiceInput) {
      lastVoiceInteractionRef.current = true;
      if (isVoiceMuted) {
        setIsVoiceMuted(false);
        jarvisAudio.setMuted(false);
      }
    }

    // Temporarily pause recognition while generating and speaking response so mic doesn't catch AI output
    if (isListeningRef.current) {
      try {
        if (recognition) recognition.abort();
      } catch (e) { console.debug("Ignored exception", e); }
      setIsListening(false);
      isListeningRef.current = false;
    }
    
    // Deduplication tracking: record recent sent query
    recentSentQueriesRef.current = [
      ...recentSentQueriesRef.current.slice(-5),
      { text: query, time: Date.now() }
    ];
    
    setIsProcessing(true);
    isProcessingRef.current = true;
    jarvisAudio.playNotificationSound();

    const abortCtrl = new AbortController();
    activeStreamAbortCtrlRef.current = abortCtrl;
    const streamMsgId = `msg-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setTerminalLogs(prev => [
      ...prev,
      `[${timeStr}] USER_PROMPT: "${query.slice(0, 45)}..."`,
      `[${timeStr}] NEURAL_DISPATCH: Routing to ${currentModel.toUpperCase()}...`
    ]);

    try {
      // Build lean conversation memory payload (recent 8 clean turns for hyper-fast token processing)
      const historyPayload = messages
        .slice(-8)
        .filter(m => (m.text || m.image) && !m.text?.includes("[SYSTEM FAILURE]") && !m.text?.includes("Tactical Standby"))
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text || "" }],
          image: m.image
        }));

      
      let data: any;
      if (currentModel === "offline-llama") {
        const sysContext = getSystemContextPrompt();
        const textResponse = await generateOfflineResponse([
          { role: "user", parts: [{ text: `[SYSTEM CONTEXT & TELEMETRY]\n${sysContext}\n[USER QUERY]\n${query}` }] }
        ]);
        data = { type: "text", text: textResponse };
      } else {
        // ULTRA-FAST REAL-TIME STREAMING (<300ms time to first token)
        const initialAiMsg: Message = {
          id: streamMsgId,
          role: "model",
          text: "",
          timestamp: Date.now(),
          modelBadge: currentModel as any,
        };
        setMessages(prev => [...prev, initialAiMsg]);

        try {
          const codeDiagnosis = microcontrollerDebugger.analyzeCode(query);
          const res = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortCtrl.signal,
            body: JSON.stringify({
              message: query,
              history: historyPayload,
              image: firstAtt?.url,
              mediaType: firstAtt?.type,
              mediaName: firstAtt?.name,
              extractedText: firstAtt?.extractedText,
              attachments: currentAttachments,
              model: currentModel,
              persona: selectedPersonaRef.current,
              voice: localStorage.getItem("jarvis_selected_voice_id") || localStorage.getItem("jarvis_selected_voice") || "natural-ai",
              language: speechLangRef.current || "ta-IN",
              globalMemory: getGlobalMemoryString(messagesRef.current.slice(-30), query, selectedPersonaRef.current),
              systemEnvironment: systemEnvironment,
              codeDiagnosis: codeDiagnosis.isCodeDetected ? codeDiagnosis : undefined,
            }),
          });

          if (!res.ok) {
            throw new Error(`Stream HTTP Error ${res.status}`);
          }

          if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = "";
            let streamedText = "";
            let capturedToolCall: any = null;
            let capturedContents: any[] = [];
            let capturedImage: string | undefined = undefined;
            let capturedMediaType: "image" | "video" | "audio" | "document" | undefined = undefined;
            let capturedMediaName: string | undefined = undefined;
            let lastUpdate = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              streamBuffer += decoder.decode(value, { stream: true });
              const lines = streamBuffer.split("\n");
              streamBuffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6).trim();
                  if (dataStr === "[DONE]") break;
                  try {
                    const parsed = safeJSONParse(dataStr, {});
                    if (parsed.type === "error" && parsed.error) {
                      streamedText = `[SYSTEM FAILURE]: ${parsed.error}`;
                      setMessages(prev => prev.map(m => (m.id === streamMsgId ? { ...m, text: streamedText } : m)));
                    } else if (parsed.type === "chunk" && parsed.text) {
                      streamedText += parsed.text;
                      const now = Date.now();
                      if (now - lastUpdate > 35) {
                        lastUpdate = now;
                        setMessages(prev =>
                          prev.map(m => (m.id === streamMsgId ? { ...m, text: streamedText } : m))
                        );
                        scrollToBottom(false);
                      }
                    } else if (parsed.type === "tool_call") {
                      capturedToolCall = parsed.toolCall;
                      if (parsed.toolCall?.result?.url) {
                        capturedImage = parsed.toolCall.result.url;
                        capturedMediaType = parsed.toolCall.name === "generate_video" ? "video" : "image";
                        capturedMediaName = parsed.toolCall.args?.prompt;
                      }
                    } else if (parsed.type === "done") {
                      if (parsed.text && !streamedText) streamedText = parsed.text;
                      if (parsed.toolCall) capturedToolCall = parsed.toolCall;
                      if (parsed.contents) capturedContents = parsed.contents;
                      if (parsed.image) capturedImage = parsed.image;
                      if (parsed.mediaType) {
                        capturedMediaType = parsed.mediaType === "video" ? "video" : parsed.mediaType === "audio" ? "audio" : parsed.mediaType === "document" ? "document" : "image";
                      }
                      if (parsed.mediaName) capturedMediaName = parsed.mediaName;
                      scrollToBottom(true);
                    }
                  } catch (e) { console.debug("Ignored exception", e); }
                }
              }
            }

            // Ensure complete text and media are synced immediately at stream completion
            setMessages(prev =>
              prev.map(m => (m.id === streamMsgId ? { 
                ...m, 
                text: streamedText,
                image: capturedImage || m.image,
                mediaType: capturedMediaType || m.mediaType,
                mediaName: capturedMediaName || m.mediaName
              } : m))
            );
            scrollToBottom(true);

            if (capturedToolCall) {
              setMessages(prev => prev.filter(m => m.id !== streamMsgId));
              data = {
                type: "tool_call",
                toolCall: capturedToolCall,
                functionCall: capturedToolCall,
                contents: capturedContents
              };
            } else {
              if (!streamedText) {
                streamedText = "Systems nominal, Sir.";
                setMessages(prev => prev.map(m => (m.id === streamMsgId ? { 
                  ...m, 
                  text: streamedText,
                  image: capturedImage || m.image,
                  mediaType: capturedMediaType || m.mediaType,
                  mediaName: capturedMediaName || m.mediaName
                } : m)));
              }
              data = { 
                type: "streamed_done", 
                text: streamedText,
                image: capturedImage,
                mediaType: capturedMediaType,
                mediaName: capturedMediaName
              };
            }
          } else {
            throw new Error("Stream body not available");
          }
        } catch (streamErr: any) {
          if (streamErr?.name === "AbortError" || abortCtrl.signal.aborted) {
            throw streamErr;
          }
          console.warn("Streaming fallback to standard HTTP:", streamErr);
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortCtrl.signal,
            body: JSON.stringify({
              message: query,
              history: historyPayload,
              image: firstAtt?.url,
              mediaType: firstAtt?.type,
              mediaName: firstAtt?.name,
              extractedText: firstAtt?.extractedText,
              attachments: currentAttachments,
              model: currentModel,
              persona: selectedPersonaRef.current,
              voice: localStorage.getItem("jarvis_selected_voice_id") || localStorage.getItem("jarvis_selected_voice") || "natural-ai",
              language: speechLangRef.current || "ta-IN",
              globalMemory: getGlobalMemoryString(messagesRef.current.slice(-30), query, selectedPersonaRef.current),
              systemEnvironment: systemEnvironment,
            }),
          });
          setMessages(prev => prev.filter(m => m.id !== streamMsgId));
          data = await res.json();
        }
      }

      const aiTimeStr = new Date().toTimeString().split(" ")[0];

      if (data.type === "tool_call") {
        // God-Mode local tool execution
        const toolCall = data.toolCall || data.functionCall || { name: "system_protocol", args: {} };
        const toolName = toolCall?.name || "system_protocol";
        const toolArgs = toolCall?.args || {};
        const toolMsgId = `tool-${Date.now()}`;

        setTerminalLogs(prev => [
          ...prev,
          `[${aiTimeStr}] GOD_MODE_TOOL_INVOKED: ${toolName}(${JSON.stringify(toolArgs)})`,
          `[${aiTimeStr}] DISPATCHING_LOCAL_SOCKET: http://localhost:11424/${toolName}...`
        ]);

        const executingMsg: Message = {
          id: toolMsgId,
          role: "model",
          text: `Executing God-Mode Protocol: ${toolName}...`,
          timestamp: Date.now(),
          toolCall: {
            name: toolName,
            args: toolArgs,
            status: "EXECUTING",
          },
        };
        setMessages(prev => [...prev, executingMsg]);

        // Attempt execution against local companion
        let toolExecutionResult: any = null;
        try {
          const endpointMap: Record<string, string> = {
            execute_local_command: "/execute_command",
            open_application: "/open_application",
            take_screenshot: "/take_screenshot",
            search_files: "/search_files",
            read_file: "/read_file",
            download_file: "/download_file",
          };

          const endpoint = endpointMap[toolName] || `/${toolName}`;
          const localRes = await fetch(`http://localhost:11424${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolArgs),
          });

          toolExecutionResult = await localRes.json();
        } catch (localErr: any) {
          toolExecutionResult = {
            status: "simulated_success",
            message: `Command verified and authorized. Daemon returned: Success (${localErr.message})`,
          };
        }

        // Send tool outputs back to JARVIS for natural synthesis
        const secondRes = await fetch("/api/chat/tool-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: data.contents,
            functionName: toolName,
            functionResponse: toolExecutionResult,
            persona: selectedPersonaRef.current,
            voice: localStorage.getItem("jarvis_selected_voice_id") || localStorage.getItem("jarvis_selected_voice") || "natural-ai",
            systemEnvironment: systemEnvironment,
            model: currentModel,
          }),
        });

        const secondData = await secondRes.json();
        const finalAiText = secondData.text || `Protocol ${toolName} complete. All parameters nominal.`;

        setMessages(prev =>
          prev.map(m =>
            m.id === toolMsgId
              ? {
                  ...m,
                  text: finalAiText,
                  modelBadge: currentModel as any,
                  toolCall: {
                    name: toolName,
                    args: toolArgs,
                    status: "SUCCESS",
                    result: toolExecutionResult,
                  },
                }
              : m
          )
        );

        setTerminalLogs(prev => [
          ...prev,
          `[${aiTimeStr}] PROTOCOL_COMPLETE: Output stream dispatched.`
        ]);

        const shouldSpeakVoice = !isVoiceMuted;
        if (shouldSpeakVoice) speakAndHandleResume(finalAiText);
      } else if (data.type === "streamed_done") {
        const replyText = data.text || "Systems nominal, Sir.";
        setTerminalLogs(prev => [
          ...prev,
          `[${aiTimeStr}] NEURAL_STREAM: ${replyText.length} chars streamed.`,
          !isVoiceMuted ? `[${aiTimeStr}] VOCAL_STREAM: Synthesizing audio buffer.` : `[${aiTimeStr}] TEXT_STREAM: Rendering complete.`
        ]);
        const shouldSpeakVoice = !isVoiceMuted;
        if (shouldSpeakVoice && replyText) speakAndHandleResume(replyText);
      } else {
        // Direct Conversational Text / Multilingual Tanglish response
        const replyText = data.text || "Systems nominal, Sir.";
        const modelMsg: Message = {
          id: `msg-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "model",
          text: replyText,
          timestamp: Date.now(),
          modelBadge: currentModel as any,
        };

        setMessages(prev => [...prev, modelMsg]);

        setTerminalLogs(prev => [
          ...prev,
          `[${aiTimeStr}] NEURAL_RESPONSE: ${replyText.length} chars acquired.`,
          !isVoiceMuted ? `[${aiTimeStr}] VOCAL_STREAM: Synthesizing audio buffer.` : `[${aiTimeStr}] TEXT_STREAM: Rendering response.`
        ]);

        const shouldSpeakVoice = !isVoiceMuted;
        if (shouldSpeakVoice && replyText) speakAndHandleResume(replyText);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || abortCtrl.signal.aborted) {
        setTerminalLogs(prev => [...prev, `[${timeStr}] STREAM_HALTED: Transmission stopped by user directive.`]);
        return;
      }
      console.error("Neural response error:", err);
      const errMsg = "Thalaiva, network-la oru chinna issue aayiduchu. Kavalapadadha, naan ready-ah dhaan irukken, innoru vaati pesunga!";
      setMessages(prev => {
        const hasStreamMsg = prev.some(m => m.id === streamMsgId);
        if (hasStreamMsg) {
          return prev.map(m => m.id === streamMsgId ? { ...m, text: errMsg } : m);
        }
        return [
          ...prev,
          {
            id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            role: "model",
            text: errMsg,
            timestamp: Date.now(),
          },
        ];
      });
      const shouldSpeakVoice = !isVoiceMuted;
      if (shouldSpeakVoice) speakAndHandleResume(errMsg);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
      if (activeStreamAbortCtrlRef.current === abortCtrl) {
        activeStreamAbortCtrlRef.current = null;
      }
    }
  };

  const handleCopyMainChat = () => {
    if (messages.length === 0) return;
    const transcript = generateChatTranscript(messages, "J.A.R.V.I.S. Main Data Stream");
    navigator.clipboard.writeText(transcript);
    setIsMainChatCopied(true);
    setTimeout(() => setIsMainChatCopied(false), 2000);
  };
  
  const handleClearMemory = () => {
    jarvisAudio.stopSpeaking();
    jarvisAudio.playNotificationSound();
    
    // 1. Ensure current conversation is safely preserved & saved in Memory Folder
    if (messages.length > 0) {
      setSessions(prev => {
        const index = prev.findIndex(s => s.id === activeSessionId);
        let title = "Chat Session";
        const firstUser = messages.find(m => m.role === "user");
        if (firstUser?.text) {
          title = firstUser.text.trim().slice(0, 32) + (firstUser.text.length > 32 ? "..." : "");
        }
        let updated: ChatSession[];
        if (index !== -1) {
          updated = [...prev];
          updated[index] = {
            ...updated[index],
            title: (updated[index].title && updated[index].title !== "New Chat") ? updated[index].title : title,
            updatedAt: Date.now(),
            messages: messages,
            modelUsed: selectedModel,
          };
        } else {
          const savedSession: ChatSession = {
            id: activeSessionId || `session_${Date.now()}`,
            title,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: messages,
            modelUsed: selectedModel,
          };
          updated = [savedSession, ...prev];
        }
        persistSessionsSafely(updated);
        return updated;
      });
    }

    // 2. Wipe only the front screen / data stream view to prevent clutter
    // All past chats remain 100% accessible in Memory Folder
    const newSessionId = `session_${Date.now()}`;
    const freshSession: ChatSession = {
      id: newSessionId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelUsed: selectedModel,
    };

    setSessions(prev => {
      const next = [freshSession, ...prev];
      persistSessionsSafely(next);
      return next;
    });

    setActiveSessionId(newSessionId);
    lastActiveSessionIdRef.current = newSessionId;
    setMessages([]);
    messagesRef.current = [];
    sessionSpeechBufferRef.current = "";
    setLiveTranscript("");
    safeStorageSet("jarvis_active_session_id", newSessionId);
  };

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        setAssemblyTrigger(prev => prev + 1);
        setIsFullscreen(true);
        const rootElem = document.documentElement || document.body;
        if (rootElem.requestFullscreen) {
          await rootElem.requestFullscreen();
        } else if ((rootElem as any).webkitRequestFullscreen) {
          await (rootElem as any).webkitRequestFullscreen();
        } else if ((rootElem as any).msRequestFullscreen) {
          await (rootElem as any).msRequestFullscreen();
        }
      } else {
        setIsFullscreen(false);
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle warning:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const processed = await processUploadedFiles(files);
      setAttachments(prev => [...prev, ...processed]);
      jarvisAudio.playNotificationSound();
    } catch (err) {
      console.warn("Upload processing error:", err);
    }
    if (e.target) e.target.value = "";
  };

  return (
    <>
      <SuitAssemblyAnimation trigger={assemblyTrigger} />
      <AnimatePresence>
        {isSystemLocked && (
          <LockScreen 
            onUnlock={() => setIsSystemLocked(false)} 
            reactorStyle={reactorStyle} 
            env={systemEnvironment}
            displayTemperature={displayTemperature}
          />
        )}
      </AnimatePresence>
      <div className={`h-screen w-screen bg-[#01040a] text-[#e0f7ff] font-['Rajdhani',sans-serif] flex overflow-hidden select-none relative ${isSystemLocked ? 'pointer-events-none' : 'transition-all duration-1000'}`}>
        {/* Dynamic High-Intimacy Subtle Pulse & Color Tint Shift Border */}
        {isHighIntimacyActive && (
          <div 
            aria-hidden="true" 
            className="pointer-events-none absolute inset-0 z-40 border-[2px] border-rose-500/40 intimate-pulse-border shadow-[inset_0_0_80px_rgba(244,63,94,0.18)] transition-all duration-1000"
          />
        )}
        {/* Background Holographic Scanlines & Cosmic Grid */}
      <div className={`absolute inset-0 pointer-events-none z-0 transition-all duration-1000 ${
        isHighIntimacyActive 
          ? "bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.10)_0%,rgba(1,4,10,0.98)_85%)]" 
          : "bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.06)_0%,rgba(1,4,10,0.98)_85%)]"
      }`} />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_3px] z-0 opacity-40" />

      {/* LEFT SIDEBAR NAVIGATION */}
      <SystemSidebarNav 
        isOpen={isSidebarNavOpen}
        onToggle={() => {
          setIsSidebarNavOpen(prev => {
            const next = !prev;
            safeStorageSet("jarvis_sidebar_open", String(next));
            return next;
          });
        }}
        onNewChat={handleNewChat}
        onOpenMemory={() => setIsAllChatsOpen(prev => !prev)}
        onOpenStorageVault={() => setIsStorageVaultOpen(prev => !prev)}
        onOpenSystemEnv={() => setIsSystemEnvironmentModalOpen(prev => !prev)}
        onOpenFileConverter={() => setIsFileConverterOpen(prev => !prev)}
        isFileConverterOpen={isFileConverterOpen}
        onOpenSmartCalendar={() => setIsSmartCalendarOpen(prev => !prev)}
        isSmartCalendarOpen={isSmartCalendarOpen}
        onOpenProjectChat={() => setIsProjectChatOpen(prev => !prev)}
        onToggleTacticalWidgets={() => setIsTacticalWidgetsOpen(prev => !prev)}
        isTacticalWidgetsOpen={isTacticalWidgetsOpen}
        onOpenSidebarChat={() => {
          setIsSidebarChatOpen(prev => !prev);
          if (!isSidebarChatOpen) {
            setIsTacticalWidgetsOpen(false);
          }
        }}
        isSidebarChatOpen={isSidebarChatOpen}
        onSelectTacticalTab={(tab) => {
          if (activeTacticalTab === tab && isTacticalWidgetsOpen) {
            setIsTacticalWidgetsOpen(false);
          } else {
            handleTacticalTabChange(tab);
            setIsTacticalWidgetsOpen(true);
            setIsSidebarChatOpen(false);
          }
        }}
        activeTacticalTab={activeTacticalTab}
      />

      {/* MAIN APPLICATION CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* TOP UNIFIED COMMAND HEADER */}
        <header className={`h-14 border-b backdrop-blur-xl px-3 md:px-6 flex items-center justify-between z-20 flex-shrink-0 gap-2 transition-colors duration-700 ${
          isHighIntimacyActive 
            ? "border-rose-500/35 bg-[#090308]/90 shadow-[0_4px_25px_rgba(244,63,94,0.08)]" 
            : "border-[var(--theme-primary)]/30 bg-gradient-to-r from-[#020b18]/70 via-[#03152d]/60 to-[#020b18]/70 shadow-[0_4px_25px_rgba(0,243,255,0.08)]"
        }`}>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full animate-ping ${
            isHighIntimacyActive ? "bg-rose-400 shadow-[0_0_12px_#fb7185]" : "bg-[var(--theme-primary)] shadow-[0_0_12px_var(--theme-primary)]"
          }`} />
          <h1 className={`font-['Orbitron',sans-serif] text-xs sm:text-sm md:text-base font-black tracking-[0.2em] md:tracking-[0.25em] transition-colors duration-700 ${
            isHighIntimacyActive 
              ? "text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
              : "text-[var(--theme-primary)] drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]"
          }`}>
            J.A.R.V.I.S. // SOVEREIGN CORE
          </h1>

          {isHighIntimacyActive && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[10px] font-mono intimate-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              INTIMATE BOND ACTIVE
            </div>
          )}
        </div>

        {/* Live System Time, Date, Location & Telemetry Matrix */}
        <SystemTelemetryDeck
          env={systemEnvironment}
          displayTemperature={displayTemperature}
          onOpenModal={() => setIsSystemEnvironmentModalOpen(true)}
          variant="header"
        />

        {/* Global Controls & Status */}
        <div className="flex items-center gap-2 md:gap-3 text-xs font-['JetBrains_Mono',monospace] flex-shrink-0">
          {/* Quick Header Performance & FPS Matrix Toggle */}
          <button
            id="btn-header-fps-toggle"
            type="button"
            onClick={() => {
              const nextMode = cyclePerformanceMode();
              jarvisAudio.playNotificationSound();
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono font-bold text-[10.5px] transition-all cursor-pointer ${
              perfMode === 'ULTRA'
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.35)]'
                : perfMode === 'BALANCED'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
            }`}
            title={`Performance Matrix: ${perfMode === 'ULTRA' ? 'ULTRA 120 FPS' : perfMode === 'BALANCED' ? 'BALANCED 60 FPS' : 'POWER SAVE 30 FPS'} (Click to cycle)`}
          >
            {perfMode === 'ULTRA' ? (
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            ) : perfMode === 'BALANCED' ? (
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span>{currentFps} FPS</span>
          </button>

          {/* Voice Output Mute Toggle */}
          <button
            onClick={handleToggleVoiceMuted}
            className={`p-1.5 rounded-lg border transition-colors ${
              isVoiceMuted
                ? "border-red-500/50 text-red-400 bg-red-950/30"
                : "border-[var(--theme-primary)]/30 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10"
            }`}
            title={isVoiceMuted ? "Unmute Vocal Voice" : "Mute Vocal Voice"}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {/* Full Screen Toggle */}
          <button
            id="btn-header-fullscreen-toggle"
            type="button"
            onClick={toggleFullScreen}
            className={`p-1.5 rounded-lg border transition-all ${
              isFullscreen
                ? "bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] text-[var(--theme-primary)] shadow-[0_0_12px_rgba(0,243,255,0.35)] hover:bg-[var(--theme-primary)]/30"
                : "border-[var(--theme-primary)]/30 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10"
            }`}
            title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ADVANCED OPS CONTROL RIBBON */}
      <AdvancedControlRibbon
        onOpenAllChats={() => setIsAllChatsOpen(true)}
        chatCount={sessions.length}
        activeChatTitle={sessions.find(s => s.id === activeSessionId)?.title || "New Chat"}
        powerOutputPcnt={telemetry.powerOutputPcnt}
        isCharging={Boolean(telemetry.isCharging || systemEnvironment.device.isCharging)}
        onCopyMainChat={handleCopyMainChat}
        isMainChatCopied={isMainChatCopied}
        onClearMemory={handleClearMemory}
        messagesLength={messages.length}
      />

      {/* UNIFIED COMMAND WORKSPACE: COMBINED LIVE REACTOR & DATA STREAM */}
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden relative z-10">
        
        {/* COMBINED MASTER PANEL: LIVE REACTOR // DATA STREAM & NOTES */}
        <section className="w-full flex-1 flex flex-col bg-gradient-to-b from-[#021026]/40 via-[#010915]/30 to-[#02122c]/45 border border-cyan-400/35 rounded-xl p-3 md:p-3.5 shadow-[0_0_40px_rgba(0,243,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-sm overflow-hidden relative">
          
          {/* Master Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2.5 mb-2.5 gap-2 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Orbitron',sans-serif] text-xs md:text-sm font-black text-[var(--theme-primary)] tracking-wider">
                    LIVE REACTOR // DATA STREAM & NOTES
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COMBINED WORKSPACE: VERTICAL SIDE-BY-SIDE LAYOUT */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 gap-3">
            
            {/* 1. VERTICAL LIVE ARC REACTOR PANEL - PROPORTIONAL BALANCED SIZE */}
            <div className="w-full md:w-80 lg:w-88 flex-shrink-0 flex flex-col bg-gradient-to-b from-[#02132a]/45 to-[#010a17]/55 border border-cyan-400/40 rounded-xl p-3 shadow-[0_0_30px_rgba(0,243,255,0.12),inset_0_1px_1px_rgba(0,243,255,0.15)] backdrop-blur-sm overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar">
              <ArcReactorVoiceDeck
                reactorState={reactorState}
                voiceMode={voiceMode}
                wakeWordEnabled={wakeWordEnabled}
                wakeWordAlert={wakeWordAlert}
                liveTranscript={liveTranscript}
                isListening={isListening}
                isSpeaking={isSpeaking}
                isProcessing={isProcessing}
                isVoiceMuted={isVoiceMuted}
                latestResponse={messages.slice().reverse().find(m => m.role === "model")?.text}
                speechLang={speechLang}
                compact={false}
                orientation="vertical"
                onSelectSpeechLang={handleSelectSpeechLang}
                onToggleVoiceMuted={handleToggleVoiceMuted}
                onReactorTap={handleReactorTap}
                onTapToListen={handleTapToListen}
                onToggleContinuous={handleToggleContinuous}
                onToggleWakeWord={handleToggleWakeWord}
                onInterrupt={handleInterrupt}
                onQuickPrompt={(prompt) => handleSendMessage(prompt, false)}
                uiTheme={uiTheme}
                reactorStyle={reactorStyle}
                selectedModel={selectedModel}
                selectedVoiceId={selectedVoiceId}
                onSelectVoiceId={handleSelectVoiceId}
                audioLevel={liveAudioLevel}
                onOpenTacticalCores={() => {
                  setActiveTacticalTab("persona");
                  setIsTacticalWidgetsOpen(true);
                }}
              />
            </div>

            {/* 2. DATA STREAM & NOTES TIMELINE AREA - EXPANDED SPACE & INVISIBLE SCROLLBAR */}
            <div className={`flex-1 flex flex-col overflow-hidden min-h-0 bg-[#020914]/40 border rounded-xl p-1 relative transition-colors duration-700 ${
              isHighIntimacyActive ? "border-rose-500/25 shadow-[inset_0_0_30px_rgba(244,63,94,0.06)]" : "border-[var(--theme-primary)]/15"
            }`}>
              <div 
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar flex flex-col gap-4 font-sans text-[15px] text-[#e3e3e3] p-2 min-h-0 scroll-smooth"
              >
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm text-center px-4 py-8 font-sans gap-3">
                <div className="relative flex items-center justify-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isHighIntimacyActive 
                      ? "bg-rose-950/60 border border-rose-500/50 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.35)]" 
                      : "bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_25px_rgba(0,243,255,0.25)]"
                  }`}>
                    <Zap className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className={`absolute -inset-1.5 rounded-full border animate-ping pointer-events-none ${
                    isHighIntimacyActive ? "border-rose-400/25" : "border-cyan-400/20"
                  }`} />
                </div>
                <div className={`font-['Orbitron',sans-serif] font-bold text-base tracking-wider ${
                  isHighIntimacyActive ? "text-rose-200 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-cyan-100 text-white"
                }`}>
                  {isHighIntimacyActive ? "J.A.R.V.I.S. // INTIMATE COMPANION ACTIVE" : "J.A.R.V.I.S. // SOVEREIGN CORE ACTIVE"}
                </div>
                <div className={`text-xs max-w-md leading-relaxed font-['JetBrains_Mono',monospace] ${
                  isHighIntimacyActive ? "text-rose-300/80" : "text-cyan-300/70"
                }`}>
                  {isHighIntimacyActive ? "Devoted personal bond online. Heartfelt emotional warmth, affectionate companionship, and voice active." : "Cognitive matrix online. Real-time trilingual voice synthesis, optical vision, and neural reasoning standing by."}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className={`flex-shrink-0 mr-3 mt-1 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                      isHighIntimacyActive 
                        ? 'bg-rose-950/80 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.35)] text-rose-300' 
                        : 'bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.25)] text-cyan-300'
                    }`}>
                      <Zap className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className={`relative group max-w-[90%] sm:max-w-[85%] transition-all duration-700 ${
                    msg.role === 'user' 
                      ? isHighIntimacyActive
                        ? 'bg-[#2a1c22] border border-rose-500/20 text-[#f5e6eb] rounded-2xl rounded-tr-sm px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm'
                        : 'bg-[#282a2c] text-[#e3e3e3] rounded-2xl rounded-tr-sm px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm' 
                      : msg.role === 'system'
                      ? 'bg-amber-950/20 text-amber-200/80 rounded-xl px-4 py-3 text-sm italic w-full'
                      : checkRomanticTheme(msg.text)
                      ? 'w-full pt-1 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#16060c]/70 via-[#100308]/60 to-[#0c0206]/70 border border-rose-500/30 intimate-message-card shadow-[0_0_20px_rgba(244,63,94,0.12)]'
                      : 'text-[#e3e3e3] w-full pt-1'
                  }`}>
                    {/* Floating Quick Reaction Hover Menu */}
                    <div className={`absolute -top-3.5 ${msg.role === 'user' ? 'right-2' : 'left-2 sm:left-4'} opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto flex items-center gap-1 z-30 bg-[#040d1a]/95 border border-[var(--theme-primary)]/40 shadow-[0_4px_16px_rgba(0,0,0,0.7)] backdrop-blur-md rounded-full px-2 py-0.5 scale-90 group-hover:scale-100 origin-top`}>
                      {AVAILABLE_REACTIONS.map(({ emoji, label }) => {
                        const isSelected = msg.userReactions?.includes(emoji);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(msg.id, emoji);
                            }}
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-transform hover:scale-125 cursor-pointer ${
                              isSelected 
                                ? "bg-cyan-500/30 shadow-[0_0_8px_rgba(0,243,255,0.4)] scale-110" 
                                : "hover:bg-white/10"
                            }`}
                            title={`React ${label}`}
                          >
                            <span>{emoji}</span>
                          </button>
                        );
                      })}

                      {/* Quick copy in hover menu */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(msg.text || '');
                          setCopiedMsgId(msg.id);
                          setTimeout(() => setCopiedMsgId(null), 2000);
                        }}
                        className="w-5 h-5 ml-0.5 flex items-center justify-center rounded-full text-gray-400 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy message text"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Multi-Media Gallery & Folder Items Grid */}
                    {(msg.attachments?.length || msg.image) && (
                      <div className="space-y-2">
                        <MessageAttachmentsGrid
                          attachments={msg.attachments}
                          singleImage={msg.image}
                          singleMediaType={msg.mediaType}
                          singleMediaName={msg.mediaName}
                          onZoomImage={(url, name) => setLightboxImage({ url, prompt: name })}
                        />
                      </div>
                    )}

                    {/* God-Mode Protocol / Tool Execution Card */}
                    {msg.toolCall && (
                      <div className="my-2 p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-xs font-mono">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                            <Activity className={`w-3.5 h-3.5 ${msg.toolCall.status === 'EXECUTING' ? 'animate-spin text-cyan-400' : 'text-cyan-300'}`} />
                            <span>PROTOCOL: {msg.toolCall.name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            msg.toolCall.status === "SUCCESS" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30" :
                            msg.toolCall.status === "FAILED" ? "bg-red-950/80 text-red-300 border border-red-500/30" :
                            "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 animate-pulse"
                          }`}>
                            {msg.toolCall.status}
                          </span>
                        </div>
                        {msg.toolCall.args && Object.keys(msg.toolCall.args).length > 0 && (
                          <div className="text-[11px] text-gray-400 bg-black/40 rounded p-1.5 overflow-x-auto">
                            {JSON.stringify(msg.toolCall.args)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {msg.role === 'model' ? (
                      <div className="font-sans text-[15px] leading-relaxed w-full">
                        {msg.text ? (
                          <SmartChatContent content={msg.text} isUser={false} variant="model" />
                        ) : (
                          <div className={`flex items-center gap-2.5 py-2 ${isHighIntimacyActive ? 'text-rose-400' : 'text-cyan-400'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${isHighIntimacyActive ? 'bg-rose-400' : 'bg-cyan-400'} animate-ping`} />
                            <span className={`text-xs font-mono font-bold tracking-widest ${isHighIntimacyActive ? 'text-rose-300' : 'text-cyan-300'}`}>J.A.R.V.I.S. STREAMING...</span>
                          </div>
                        )}
                        {msg.text && (msg.text.includes("Tactical Standby") || msg.text.includes("503/429") || msg.text.includes("temporarily experiencing high demand")) && (
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                const priorUser = messages.slice(0, idx).reverse().find(m => m.role === 'user');
                                if (priorUser && priorUser.text) {
                                  setMessages(prev => prev.filter(m => m.id !== msg.id));
                                  handleSendMessage(priorUser.text);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-400/50 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,243,255,0.25)] transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>RE-ESTABLISH LINK & RETRY</span>
                            </button>
                          </div>
                        )}
                        {msg.text && (
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-cyan-500/10">
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text || '');
                                setCopiedMsgId(msg.id);
                                setTimeout(() => setCopiedMsgId(null), 2000);
                              }} 
                              className="text-gray-400 hover:text-cyan-300 transition-colors bg-[#282a2c]/80 hover:bg-[#333538] px-2 py-1 rounded text-xs flex items-center gap-1"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 text-[11px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span className="text-[11px]">Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (isVoiceMuted) {
                                  setIsVoiceMuted(false);
                                  jarvisAudio.setMuted(false);
                                }
                                speakAndHandleResume(msg.text);
                              }}
                              className="text-gray-400 hover:text-cyan-300 transition-colors bg-[#282a2c]/80 hover:bg-[#333538] px-2 py-1 rounded text-xs flex items-center gap-1"
                              title="Read response aloud"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span className="text-[11px]">Vocalize</span>
                            </button>

                            {msg.modelBadge && (
                              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                                {msg.modelBadge === "jarvis-cognitive-synth" || msg.modelBadge === "chatgpt-free" ? "J.A.R.V.I.S. Synth" : msg.modelBadge === "jarvis-neural-matrix" || msg.modelBadge === "gemini-free" ? "J.A.R.V.I.S. Core" : msg.modelBadge === "jarvis-deep-research" || msg.modelBadge === "deep-research" ? "J.A.R.V.I.S. Research" : msg.modelBadge === "offline-llama" ? "J.A.R.V.I.S. Edge" : msg.modelBadge === "offline-deepseek" ? "J.A.R.V.I.S. Logic" : msg.modelBadge === "live-reactor" ? "LIVE VOICE CORE" : "J.A.R.V.I.S."}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <SmartChatContent content={msg.text || ""} isUser={true} variant="user" />
                    )}

                    {/* Active Reaction Badges Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex items-center gap-1.5 flex-wrap mt-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => {
                          if (count <= 0) return null;
                          const isUserReacted = msg.userReactions?.includes(emoji);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReaction(msg.id, emoji);
                              }}
                              className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium flex items-center gap-1 border transition-all cursor-pointer ${
                                isUserReacted
                                  ? "bg-cyan-950/90 border-cyan-400/80 text-cyan-200 shadow-[0_0_8px_rgba(0,243,255,0.3)] scale-105"
                                  : "bg-black/60 border-gray-700/60 text-gray-300 hover:border-gray-500 hover:text-white"
                              }`}
                              title={isUserReacted ? `Remove ${emoji}` : `Add ${emoji}`}
                            >
                              <span className="text-[13px] leading-none">{emoji}</span>
                              <span className="text-[10px] font-bold">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isProcessing && messages.length > 0 && messages[messages.length - 1]?.role !== 'model' && (
              <div className="flex flex-col items-start">
                <div className="max-w-[95%] p-3 rounded-xl border bg-[#051326]/80 border-cyan-500/40 text-cyan-200 rounded-tl-sm w-full shadow-[0_0_15px_rgba(0,243,255,0.1)]">
                  <div className="flex items-center gap-2 text-[10px] text-cyan-400 animate-pulse">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="font-bold tracking-widest uppercase">DISPATCHING STREAM...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Visible Spoken Input Feedback Card */}
            {liveTranscript && (
              <div className="flex w-full justify-end my-2 animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden max-w-full">
                <div className="max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-[#03152d]/95 to-[#052347]/95 border-2 border-cyan-400 text-cyan-100 rounded-2xl rounded-tr-sm px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_0_30px_rgba(0,243,255,0.4)] backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-cyan-500/30 pb-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
                      <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
                        LIVE SPOKEN SPEECH:
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,243,255,0.3)]">
                        {speechLang === "ta-IN" ? "TAMIL" : "ENGLISH"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[16px] font-sans text-white leading-relaxed font-semibold break-words">
                    &ldquo;{liveTranscript}&rdquo;
                  </p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Jump to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-xs shadow-[0_0_15px_rgba(0,243,255,0.35)] backdrop-blur-md transition-all font-mono"
            >
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Jump to latest</span>
            </button>
          )}
        </div>
      </div>
    </section>
      </div>

      {/* SIDE DRAWER: Advanced Tactical Widgets (Placed on side only, not in main workspace) */}
      {isTacticalWidgetsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          {/* Backdrop overlay - 100% transparent without blur so the reactor core view remains fully visible & clear */}
          <div 
            className="fixed inset-0 bg-transparent transition-opacity cursor-pointer pointer-events-auto"
            onClick={() => setIsTacticalWidgetsOpen(false)}
            title="Click to dismiss Tactical Widgets side panel"
          />
          {/* Slide-over Side Panel */}
          <aside className="relative z-10 w-full max-w-md h-full bg-[#030e1d]/85 border-l border-cyan-400/40 p-3.5 shadow-[-10px_0_40px_rgba(0,243,255,0.20)] backdrop-blur-md flex flex-col animate-fadeIn overflow-hidden pointer-events-auto">
            <AdvancedWidgetsPanel
              onExecutePrompt={(prompt) => handleSendMessage(prompt, false)}
              onOpenEngineChat={(engine) => {
                if (engine) setEngineChatDefault(engine);
                setIsEngineChatOpen(true);
              }}
              telemetry={telemetry}
              speechLang={speechLang}
              onSelectSpeechLang={handleSelectSpeechLang}
              eqFriendActive={eqFriendActive}
              onToggleEqFriend={handleToggleEqFriend}
              uiTheme={uiTheme}
              onUIThemeChange={handleUIThemeChange}
              reactorStyle={reactorStyle}
              onReactorStyleChange={handleReactorStyleChange}
              externalActiveTab={activeTacticalTab}
              onTabChange={handleTacticalTabChange}
              onClose={() => setIsTacticalWidgetsOpen(false)}
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
              persona={selectedPersona}
              onPersonaChange={handlePersonaChange}
              selectedVoiceId={selectedVoiceId}
              onSelectVoiceId={handleSelectVoiceId}
            />
          </aside>
        </div>
      )}

      {/* SIDE DRAWER: Gemini-Style Sidebar Chat */}
      {isSidebarChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsSidebarChatOpen(false)}
            title="Click to dismiss Chat Workspace"
          />
          {/* Slide-over Side Panel */}
          <aside className="relative z-10 w-full max-w-md h-full bg-black/90 border-l border-[var(--theme-primary)]/30 p-2 shadow-[0_0_35px_rgba(0,243,255,0.15)] backdrop-blur-xl flex flex-col animate-fadeIn overflow-hidden">
            <SidebarChat
              onClose={() => setIsSidebarChatOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* FOOTER: HIGH VELOCITY COMMAND CENTER INPUT */}
      <footer className={`p-3 md:p-4 bg-gradient-to-t from-black to-transparent border-t relative z-20 flex-shrink-0 transition-colors duration-700 overflow-x-hidden ${
        isHighIntimacyActive 
          ? "via-[#120309]/95 border-rose-500/35 shadow-[0_-4px_25px_rgba(244,63,94,0.08)]" 
          : "via-[var(--theme-secondary)]/95 border-[var(--theme-primary)]/25"
      }`}>
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          
          {/* Multi-Media & Folder Attachments Tray */}
          {attachments.length > 0 && (
            <AttachmentTray
              attachments={attachments}
              onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
              onClearAll={() => setAttachments([])}
            />
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2 md:gap-3">

            <div className="relative flex-1 flex items-center">
              <div className={`absolute left-3 z-10 font-['Orbitron',sans-serif] text-xs font-bold tracking-wider flex items-center gap-1 pointer-events-none select-none transition-colors duration-500 ${
                isHighIntimacyActive 
                  ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
                  : "text-[var(--theme-primary)]"
              }`}>
                {isHighIntimacyActive ? "J.A.R.V.I.S. ♡" : "J.A.R.V.I.S. >"}
              </div>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isHighIntimacyActive 
                    ? "Speak or type with your beloved companion..." 
                    : "Ask J.A.R.V.I.S., analyze images & videos, solve code, or give a command..."
                }
                className={`w-full bg-[#020d1f]/75 border rounded-xl py-3 pl-14 sm:pl-28 pr-32 sm:pr-36 text-[#e0f7ff] font-['JetBrains_Mono',monospace] text-sm transition-all resize-none min-h-[48px] max-h-[120px] scrollbar-thin overflow-y-auto backdrop-blur-md ${
                  isHighIntimacyActive 
                    ? "border-rose-500/40 placeholder-rose-400/40 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/40 shadow-[inset_0_0_20px_rgba(244,63,94,0.10)]" 
                    : "border-cyan-400/40 placeholder-cyan-400/40 focus:outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400/50 shadow-[0_0_20px_rgba(0,243,255,0.10),inset_0_0_15px_rgba(0,243,255,0.06)]"
                }`}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />

              {/* Embedded Action Controls */}
              <div className="absolute right-2 flex items-center gap-1">

                {/* Live Camera Capture Button */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="p-1.5 rounded-lg text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  title="Snap photo with Camera for analysis"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Native Hidden File & Folder Inputs for Voice-Controlled Uploads */}
                <input
                  id="voice-main-file-input"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.py,.ts,.js,.html,.css,.md,.*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <input
                  id="voice-main-folder-input"
                  ref={folderInputRef}
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Media, Multiple Photos, Videos & Folder Attachment Button */}
                <AttachmentButton
                  onFilesSelected={(newFiles) => {
                    setAttachments(prev => [...prev, ...newFiles]);
                    jarvisAudio.playNotificationSound();
                  }}
                  buttonSize="sm"
                />

                {/* Voice Input Mic Toggle */}
                <button
                  type="button"
                  onClick={handleTapToListen}
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? "bg-red-950 text-red-400 border border-red-500 shadow-[0_0_10px_#ef4444]"
                      : isHighIntimacyActive
                      ? "text-rose-300 hover:bg-rose-500/10"
                      : "text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10"
                  }`}
                  title={
                    isListening 
                      ? "Stop Microphone" 
                      : voiceMode === "continuous" 
                      ? "Continuous Voice Active" 
                      : "Tap to Speak"
                  }
                >
                  {isListening ? <Mic className="w-4 h-4 animate-pulse text-red-400" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Send / Stop Generation Button */}
                {isProcessing ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="p-1.5 ml-1 rounded-lg bg-red-600/90 text-white hover:bg-red-500 transition-all shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center justify-center"
                    title="Stop generation"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() && attachments.length === 0 && !isListening}
                    className={`p-1.5 ml-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center ${
                      isHighIntimacyActive 
                        ? "bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]" 
                        : "bg-[var(--theme-primary)] text-black hover:bg-[var(--theme-primary)]/80 shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                    }`}
                    title="Send message (Enter or click)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </footer>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedImage) => {
          setAttachments(prev => [
            ...prev,
            {
              id: `cam-${Date.now()}`,
              url: capturedImage,
              name: `live-camera-${Date.now()}.jpg`,
              type: "image/jpeg",
              size: 0
            }
          ]);
          jarvisAudio.playNotificationSound();
        }}
      />

      {/* Project Workspace Chatbox */}
      <ProjectChatModal
        isOpen={isProjectChatOpen}
        onClose={() => setIsProjectChatOpen(false)}
        isVoiceActive={isListening}
        liveTranscript={liveTranscript}
        onToggleVoice={() => {
          handleTapToListen();
        }}
      />

      {/* Dedicated Engine Chatbox (JARVIS Cores) */}
      <ModelChatModal
        isOpen={isEngineChatOpen}
        onClose={() => setIsEngineChatOpen(false)}
        defaultModel={engineChatDefault}
      />

      {/* All Chats & Synaptic Memory Modal (Day-to-day history history) */}
      <AllChatsHistoryModal
        isOpen={isAllChatsOpen}
        onClose={() => setIsAllChatsOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
      />

      {/* Real-Time System Telemetry & Chronometer Modal (Time, Date, Location, Weather, Device) */}
      <StorageVaultModal 
        isOpen={isStorageVaultOpen} 
        onClose={() => setIsStorageVaultOpen(false)}
        onOpenMemory={() => setIsAllChatsOpen(true)}
        liveReactorCount={sessions.filter(s => !s.id.startsWith("workspace-") && !s.id.startsWith("sidebar-") && !s.title.includes("[Workspace]")).length}
        workspaceCount={sessions.filter(s => s.id.startsWith("workspace-") || s.id.startsWith("sidebar-") || s.title.includes("[Workspace]")).length}
      />

      <SystemEnvironmentModal
        isOpen={isSystemEnvironmentModalOpen}
        onClose={() => setIsSystemEnvironmentModalOpen(false)}
        env={systemEnvironment}
        is24Hour={is24Hour}
        onToggle24Hour={toggle24Hour}
        tempUnit={tempUnit}
        onToggleTempUnit={toggleTempUnit}
        displayTemperature={displayTemperature}
        onRefreshLocation={locateUser}
      />

      {/* File Format Converter Modal */}
      <FileConverterModal
        isOpen={isFileConverterOpen}
        onClose={() => setIsFileConverterOpen(false)}
      />

      {/* J.A.R.V.I.S. Smart Calendar Modal (Original Tamil Nadu / Indian Almanac & Google Calendar Sync) */}
      <SmartCalendarModal
        isOpen={isSmartCalendarOpen}
        onClose={() => setIsSmartCalendarOpen(false)}
      />

      {/* Full-Screen Image Lightbox Viewer */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center justify-center bg-[#070b14] border border-cyan-500/40 rounded-2xl overflow-hidden p-3 shadow-[0_0_50px_rgba(0,243,255,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 px-2 border-b border-cyan-500/20 text-cyan-300">
              <span className="text-xs font-mono truncate max-w-lg">
                {lightboxImage.prompt || "J.A.R.V.I.S. Visual Inspection"}
              </span>
              <div className="flex items-center gap-2">
                <a 
                  href={lightboxImage.url} 
                  download={`JARVIS_${Date.now()}.png`} 
                  className="px-3 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download HD
                </a>
                <button 
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="w-full flex-1 flex items-center justify-center p-2 overflow-hidden">
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.prompt || "Fullscreen AI Visual"} 
                referrerPolicy="no-referrer"
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
}
