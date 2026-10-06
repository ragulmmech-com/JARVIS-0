export type MessageRole = "user" | "model" | "system";

export type ExecutionStatus = "REQUESTED" | "AUTHORIZING" | "EXECUTING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface ToolCallData {
  name: string;
  args: any;
  status: ExecutionStatus;
  result?: any;
}

export interface MediaAttachment {
  id: string;
  url: string;
  previewUrl?: string;
  name: string;
  type: string;
  size?: number;
  extractedText?: string;
  folderPath?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text?: string;
  image?: string; // Base64 or media URL
  mediaType?: "image" | "video" | "audio" | "document";
  mediaName?: string;
  attachments?: MediaAttachment[]; // Multiple photos, videos, or folder items
  timestamp?: number;
  modelBadge?: string;
  toolCall?: ToolCallData;
  searchResults?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  reactions?: Record<string, number>;
  userReactions?: string[];
}

export type ArcReactorState = "idle" | "listening" | "processing" | "speaking" | "executing";

export type VoiceListeningMode = "continuous" | "tap_to_listen";

export type TacticalTabType = "languages" | "voice" | "ui_change" | "reactor_change" | "persona";

export type AIModelId = 
  | "jarvis-core-mk1" 
  | "jarvis-core-mk2" 
  | "jarvis-core-mk3"
  | "jarvis-core-mk4"
  | "jarvis-core-mk5"
  | "jarvis-cognitive-synth"
  | "jarvis-neural-matrix"
  | "jarvis-deep-research"
  | "jarvis-strategic-architect"
  | "jarvis-high-throughput"
  | "jarvis-quantum-adaptive"
  | "offline-llama"
  | "offline-deepseek"
  | string;

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  modelUsed?: AIModelId;
  previewText?: string;
  source?: "live_reactor" | "tactical_widget";
}

export interface SystemDiagnostic {
  cpuUsage: number;
  memoryUsage: number;
  networkLatencyMs: number;
  powerOutputPcnt: number;
  isCharging?: boolean;
  localAgentOnline: boolean;
  activeProcesses: number;
}

export interface SystemLocation {
  city: string;
  region: string;
  country: string;
  countryCode?: string;
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  status: "locating" | "granted" | "denied" | "fallback";
  source: "gps" | "ip" | "manual" | "default";
}

export interface SystemWeather {
  temperature: number;
  temperatureUnit: "C" | "F";
  weatherCode: number;
  description: string;
  humidity: number;
  windSpeed: number;
  isDay?: boolean;
  status: "loading" | "success" | "unavailable";
}

export interface SystemDeviceStats {
  batteryLevel: number | null;
  isCharging: boolean | null;
  online: boolean;
  networkType?: string;
  screenResolution: string;
  platform: string;
  language: string;
}

export interface SystemEnvironment {
  currentTime: string;
  currentDate: string;
  dayOfWeek: string;
  timeZone: string;
  timeZoneOffset: string;
  timestamp: number;
  isoString: string;
  is24Hour: boolean;
  location: SystemLocation;
  weather?: SystemWeather;
  device: SystemDeviceStats;
}

export type UITheme = string;

export type ReactorStyle = 
  | "core-mark1-classic"
  | "core-mark6-triangular"
  | "core-grid-matrix-suit"
  | "core-stealth-orbital-orb"
  | "core-cyber-neon-gradient"
  | "core-tactical-mark7-hud"
  | "core-matrix-neon-arc"
  | string;

export type PersonaType = 
  | "PROFESSIONAL"
  | "FRIEND"
  | "PROFESSOR"
  | "SCIENTIST"
  | "STUDENT"
  | "LOVER_BOY"
  | "LOVER_GIRL"
  | "DOCTOR"
  | "MILITARY"
  | "CYBER_SECURITY"
  | "SIBLINGS"
  | "NORMAL_JARVIS";
