export type NeuralCoreId =
  | "gemini-3.1-flash-lite"
  | "gemini-flash-latest"
  | "deep-research"
  | "gemini-3.1-pro-preview";

export type UIThemeId =
  | "cyan-prime"
  | "emerald-matrix"
  | "crimson-protocol"
  | "amber-hazard"
  | "violet-void";

export type PersonalityId =
  | "jarvis-normal"
  | "best-friend"
  | "professional"
  | "coding-assistant"
  | "sarcastic";

export type LanguageId = "ta" | "en-IN" | "en-US" | "hi";

export interface ArcReactorProps {
  mark: number;
  size?: number;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "jarvis";
  content: string;
  timestamp: number;
  imageUrl?: string;
  hasAttachment?: boolean;
}
