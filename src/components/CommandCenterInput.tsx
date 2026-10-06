import React, { useRef } from "react";
import { 
  Send, Camera, Image as ImageIcon, Mic, MicOff, 
  Trash2, X, Terminal, Paperclip, Zap
} from "lucide-react";

interface CommandCenterInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text: string, media?: string | null) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isProcessing: boolean;
  attachment: string | null;
  setAttachment: (val: string | null) => void;
  onOpenOpticalCamera: () => void;
  onClearMemory: () => void;
}

export const CommandCenterInput: React.FC<CommandCenterInputProps> = ({
  input,
  setInput,
  onSend,
  isListening,
  onToggleListening,
  isProcessing,
  attachment,
  setAttachment,
  onOpenOpticalCamera,
  onClearMemory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isProcessing) return;
    onSend(input, attachment);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent border-t border-cyan-500/20 relative z-20">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Attachment Ribbon preview */}
        {attachment && (
          <div className="flex items-center gap-3 p-2 bg-gray-900/90 border border-cyan-500/40 rounded-lg max-w-sm">
            <div className="w-12 h-12 rounded overflow-hidden border border-cyan-500/50 flex-shrink-0 bg-black">
              <img src={attachment} alt="Payload preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-hud text-cyan-400">MEDIA ATTACHMENT LOADED</div>
              <div className="text-[10px] text-gray-400 truncate">Base64 Encoded Stream Ready</div>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="*/*"
            className="hidden"
          />

          <div className="relative flex-1 flex items-center">
            {/* Pulsing indicator */}
            <div className="absolute left-4 pointer-events-none flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isListening
                    ? "bg-red-500 animate-ping"
                    : isProcessing
                    ? "bg-amber-400 animate-pulse"
                    : "bg-cyan-400 animate-pulse"
                }`}
              />
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? "Live audio stream active... (Speak now or say 'Hey JARVIS')"
                  : "Command JARVIS... (e.g., 'Open Chrome', 'Search my files', 'Summarize quantum physics')"
              }
              disabled={isProcessing}
              className="w-full bg-gray-900/90 border border-cyan-500/30 rounded-xl py-3.5 pl-11 pr-32 text-cyan-100 placeholder-cyan-700/60 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm font-mono-code transition-all shadow-inner"
            />

            {/* In-bar Quick Actions */}
            <div className="absolute right-2.5 flex items-center gap-1">
              {/* Optical camera button */}
              <button
                type="button"
                onClick={onOpenOpticalCamera}
                className="p-1.5 rounded-lg text-cyan-500 hover:text-cyan-300 hover:bg-gray-800 transition-colors"
                title="HUD Optical Camera Scan"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Upload media button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-cyan-500 hover:text-cyan-300 hover:bg-gray-800 transition-colors"
                title="Attach Media / Image / File"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Speech Toggle in Input */}
              <button
                type="button"
                onClick={onToggleListening}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? "bg-red-950/80 text-red-400 border border-red-500/50"
                    : "text-cyan-500 hover:text-cyan-300 hover:bg-gray-800"
                }`}
                title={isListening ? "Deactivate Microphone" : "Activate Microphone"}
              >
                {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={(!input.trim() && !attachment) || isProcessing}
                className="p-2 rounded-lg bg-cyan-500 text-gray-950 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 font-bold transition-all shadow-lg shadow-cyan-950"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Wipe memory button */}
          <button
            type="button"
            onClick={onClearMemory}
            className="p-3 rounded-xl border border-gray-800 bg-gray-900/60 text-gray-400 hover:text-red-400 hover:border-red-900/50 transition-colors"
            title="Purge Synaptic Memory Matrix"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </form>

        {/* Tactical Quick Command Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-[11px] font-tech text-gray-400 scrollbar-none">
          <span className="font-hud text-[9px] text-cyan-500/80 uppercase">Quick Protocols:</span>
          <button
            onClick={() => onSend("Jarvis, Chrome open pannunga and check system status.")}
            className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition-colors whitespace-nowrap"
          >
            Tanglish: &quot;Chrome open pannunga&quot;
          </button>
          <button
            onClick={() => onSend("Jarvis, indha programming structural bug ah summarize panni fix pannu.")}
            className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition-colors whitespace-nowrap"
          >
            Tanglish: &quot;Code bug ah fix pannu&quot;
          </button>
          <button
            onClick={() => onSend("Take a screenshot of my desktop and analyze what application is running.")}
            className="px-2.5 py-1 rounded bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 text-cyan-200/80 hover:text-cyan-200 transition-colors whitespace-nowrap"
          >
            Capture Desktop Screen
          </button>
          <button
            onClick={() => onSend("What are the latest breakthroughs in open-source AI models this week? Summarize them clearly.")}
            className="px-2.5 py-1 rounded bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 text-cyan-200/80 hover:text-cyan-200 transition-colors whitespace-nowrap"
          >
            Global Tech Intelligence
          </button>
          <button
            onClick={() => onSend("Search for all documents or code files in my user directory with pattern *.py or *.ts.")}
            className="px-2.5 py-1 rounded bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 text-cyan-200/80 hover:text-cyan-200 transition-colors whitespace-nowrap"
          >
            Deep File Matrix Search
          </button>
        </div>
      </div>
    </div>
  );
};
