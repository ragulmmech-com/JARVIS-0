import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, Cpu, Wifi, ShieldCheck, Terminal, 
  Mic, MicOff, Send, Zap, Sliders, Volume2, 
  VolumeX, Power, Globe, Layers, AlertCircle
} from "lucide-react";
import { jarvisAudio } from "../lib/audioSynthesizer";
import { AIModelId, SystemDiagnostic } from "../types";

interface HolographicDashboardProps {
  onOpenGodMode: () => void;
  telemetry: SystemDiagnostic;
  selectedModel: AIModelId;
  onSelectModel: (m: AIModelId) => void;
}

export const HolographicDashboard: React.FC<HolographicDashboardProps> = ({
  onOpenGodMode,
  telemetry: initialTelemetry,
  selectedModel,
  onSelectModel,
}) => {
  const [coreState, setCoreState] = useState<"idle" | "thinking">("idle");
  const [promptInput, setPromptInput] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [matrixOutput, setMatrixOutput] = useState(
    "J.A.R.V.I.S. Core Matrix Initialized. All sovereign neural links active. Ready for high-velocity computing, deep telemetry diagnostics, and local operating system control."
  );
  const [displayedText, setDisplayedText] = useState("");
  const [typewriterIndex, setTypewriterIndex] = useState(0);

  // Live fluctuating diagnostics
  const [diagnostics, setDiagnostics] = useState({
    cpu: 42,
    neuralNet: 89,
    quantumSync: 99,
    securityLevel: "LEVEL 5 // OMNI CIPHER",
    uplinkRate: "1.42 GB/S",
    memoryUsage: 38,
  });

  // System log lines
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "[00:00:01] KERNEL_INIT: Holographic HUD rendering pipeline engaged.",
    "[00:00:02] ORB_CORE: Arc fusion resonance stable at 100%.",
    "[00:00:03] TELEMETRY: Concentric rings synchronized to 120 FPS.",
    "[00:00:04] PROTOCOL: Ready for natural language & voice streams."
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fluctuating diagnostics every second to make it feel organic and alive
  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics(prev => ({
        ...prev,
        cpu: Math.min(98, Math.max(25, prev.cpu + Math.floor(Math.random() * 5) - 2)),
        neuralNet: Math.min(99, Math.max(78, prev.neuralNet + Math.floor(Math.random() * 3) - 1)),
        quantumSync: Math.min(100, Math.max(94, prev.quantumSync + (Math.random() > 0.5 ? 0 : -1))),
        memoryUsage: Math.min(92, Math.max(30, prev.memoryUsage + Math.floor(Math.random() * 3) - 1)),
      }));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Typewriter Effect
  useEffect(() => {
    setDisplayedText("");
    setTypewriterIndex(0);
  }, [matrixOutput]);

  useEffect(() => {
    if (typewriterIndex < matrixOutput.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + matrixOutput[typewriterIndex]);
        setTypewriterIndex(idx => idx + 1);
      }, 18);
      return () => clearTimeout(timeout);
    }
  }, [typewriterIndex, matrixOutput]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [systemLogs]);

  // Handle Command Submission
  const handleCommandSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = promptInput.trim();
    if (!query) return;

    setPromptInput("");
    setCoreState("thinking");
    jarvisAudio.playWakeSound();

    const timestamp = new Date().toTimeString().split(" ")[0];
    setSystemLogs(prev => [
      ...prev,
      `[${timestamp}] USER_INPUT: "${query}"`,
      `[${timestamp}] NEURAL_SEARCH: Dispatching query to ${selectedModel.toUpperCase()}...`
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      const reply = data.text || (data.functionCall?.name ? `[Executing Local Command: ${data.functionCall.name}]` : (data.toolCall?.name ? `[Executing Local Command: ${data.toolCall.name}]` : "Protocol executed successfully."));
      
      setMatrixOutput(reply);
      setSystemLogs(prev => [
        ...prev,
        `[${timestamp}] RESPONSE_ACQUIRED: Payload size ${reply.length} chars.`,
        `[${timestamp}] AUDIO_SYNTH: Vocal feedback streamed.`
      ]);

      if (!isMuted) {
        jarvisAudio.speak(reply);
      }
    } catch (err: any) {
      const errorMsg = "System Anomaly: Unable to connect with neural core. Fallback engaged.";
      setMatrixOutput(errorMsg);
      setSystemLogs(prev => [
        ...prev,
        `[${timestamp}] ERR_EXCEPTION: ${err.message || "Failed request"}`
      ]);
    } finally {
      setTimeout(() => setCoreState("idle"), 1400);
    }
  };

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      jarvisAudio.playWakeSound();
      setSystemLogs(prev => [
        ...prev,
        `[${new Date().toTimeString().split(" ")[0]}] MIC_ENGAGED: Speech recognition stream active.`
      ]);
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-between bg-transparent text-[#e0f7ff] font-['Rajdhani',sans-serif] select-none relative overflow-hidden">
      {/* Dynamic scanlines & cyber grid overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.06)_0%,rgba(0,0,0,0.85)_80%)]" />

      {/* Top Holographic Navigation Ribbon */}
      <header className="h-14 border-b border-[var(--theme-primary)]/20 bg-[var(--theme-secondary)]/90 backdrop-blur-xl px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--theme-primary)] shadow-[0_0_12px_var(--theme-primary)] animate-ping" />
          <h1 className="font-['Orbitron',sans-serif] text-sm md:text-base font-bold tracking-[0.25em] text-[var(--theme-primary)] drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]">
            J.A.R.V.I.S. // HOLOGRAPHIC CORE
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-['JetBrains_Mono',monospace]">
          {/* Persona selector */}
          <div className="hidden sm:flex items-center gap-2 bg-[#051326] border border-[var(--theme-primary)]/30 px-3 py-1 rounded-md">
            <Sliders className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value as AIModelId)}
              className="bg-transparent text-[var(--theme-primary)] text-xs focus:outline-none cursor-pointer"
            >
                            <option value="jarvis-core-mk1" className="bg-[#051326] text-[var(--theme-primary)]">Core MK1 (God Speed)</option>
              <option value="jarvis-core-mk2" className="bg-[#051326] text-[var(--theme-primary)]">Core MK2 (Deep Intel)</option>
              <option value="jarvis-core-mk3" className="bg-[#051326] text-[var(--theme-primary)]">Core MK3 (Universal)</option>
              <option value="jarvis-core-mk4" className="bg-[#051326] text-[var(--theme-primary)]">Core MK4 (Strategic)</option>
              <option value="jarvis-core-mk5" className="bg-[#051326] text-[var(--theme-primary)]">Core MK5 (Deep Thought)</option>
            </select>
          </div>

          <button
            onClick={onOpenGodMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-[var(--theme-primary)]/40 bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] transition-all"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GOD MODE</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-md border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10"
            title={isMuted ? "Unmute Vocal Audio" : "Mute Vocal Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Holographic Tri-Panel Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-6 relative z-10 overflow-hidden">
        
        {/* PANEL 1: System Diagnostics Grid (Left Panel, 3 cols) */}
        <section className="lg:col-span-3 flex flex-col justify-between bg-[#040d1a]/80 border border-[var(--theme-primary)]/20 rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.05)] backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--theme-primary)]" />
                <h2 className="font-['Orbitron',sans-serif] text-xs font-bold tracking-widest text-[var(--theme-primary)]">
                  SYSTEM METRICS
                </h2>
              </div>
              <span className="text-[10px] font-['JetBrains_Mono',monospace] text-emerald-400 animate-pulse">LIVE</span>
            </div>

            {/* Diagnostic Progress Bars */}
            <div className="space-y-4 font-['JetBrains_Mono',monospace]">
              {/* CPU Node */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-gray-300">
                  <span>CPU NODE LOAD</span>
                  <span className="text-[var(--theme-primary)] font-bold">{diagnostics.cpu}%</span>
                </div>
                <div className="w-full bg-[var(--theme-secondary)] h-2 rounded-full overflow-hidden border border-[var(--theme-primary)]/30">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0044ff] to-[var(--theme-primary)] transition-all duration-700 rounded-full"
                    style={{ width: `${diagnostics.cpu}%` }}
                  />
                </div>
              </div>

              {/* Neural Net */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-gray-300">
                  <span>NEURAL NET CAPACITY</span>
                  <span className="text-[#9900ff] font-bold">{diagnostics.neuralNet}%</span>
                </div>
                <div className="w-full bg-[var(--theme-secondary)] h-2 rounded-full overflow-hidden border border-[#9900ff]/30">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0044ff] via-[#9900ff] to-[#c084fc] transition-all duration-700 rounded-full"
                    style={{ width: `${diagnostics.neuralNet}%` }}
                  />
                </div>
              </div>

              {/* Quantum Sync */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-gray-300">
                  <span>QUANTUM SYNC</span>
                  <span className="text-emerald-400 font-bold">{diagnostics.quantumSync}%</span>
                </div>
                <div className="w-full bg-[var(--theme-secondary)] h-2 rounded-full overflow-hidden border border-emerald-500/30">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-emerald-400 transition-all duration-700 rounded-full"
                    style={{ width: `${diagnostics.quantumSync}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-gray-300">
                  <span>RAM MATRIX</span>
                  <span className="text-[var(--theme-primary)] font-bold">{diagnostics.memoryUsage}%</span>
                </div>
                <div className="w-full bg-[var(--theme-secondary)] h-2 rounded-full overflow-hidden border border-[var(--theme-primary)]/30">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-[var(--theme-primary)] transition-all duration-700 rounded-full"
                    style={{ width: `${diagnostics.memoryUsage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling System Log Terminal */}
          <div className="mt-4 pt-3 border-t border-[var(--theme-primary)]/20 flex flex-col flex-1 min-h-[140px] max-h-[220px]">
            <div className="text-[10px] font-['Orbitron',sans-serif] text-gray-400 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>TERMINAL TELEMETRY LOG</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-black/60 p-2.5 rounded border border-gray-800 text-[10px] font-['JetBrains_Mono',monospace] text-gray-400 space-y-1 scrollbar-thin">
              {systemLogs.map((log, index) => (
                <div key={index} className="leading-tight">
                  <span className="text-[var(--theme-primary)]/80">{log.slice(0, 10)}</span>
                  <span className={log.includes("USER") ? "text-yellow-300" : log.includes("ERR") ? "text-red-400" : "text-gray-300"}>
                    {log.slice(10)}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </section>

        {/* PANEL 2: Central Core Node (AI Orb) & Concentric Telemetry Rings (Center, 6 cols) */}
        <section className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[380px] p-4">
          {/* Concentric Telemetry Rings & Glowing Sphere */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center select-none">
            
            {/* Outer Background Blur Sphere */}
            <div 
              className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
                coreState === "thinking" 
                  ? "bg-[#9900ff]/30 scale-110 shadow-[0_0_100px_#9900ff]" 
                  : "bg-[var(--theme-primary)]/20 scale-100 shadow-[0_0_80px_var(--theme-primary)]"
              }`}
            />

            {/* SVG Orbiting Concentric Telemetry Rings */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 400 400"
            >
              {/* Ring 3: Outer Segmented Ring (Clockwise, Fast in thinking, normal in idle) */}
              <circle
                cx="200"
                cy="200"
                r="185"
                fill="none"
                stroke={coreState === "thinking" ? "#c084fc" : "var(--theme-primary)"}
                strokeWidth="1.5"
                strokeDasharray="25 15 5 15 45 15"
                className={`origin-center ${coreState === "thinking" ? "animate-[spin_4s_linear_infinite]" : "animate-[spin_24s_linear_infinite]"}`}
              />

              {/* Ring 2: Middle Dashed Ring (Counter-Clockwise, Medium) */}
              <circle
                cx="200"
                cy="200"
                r="155"
                fill="none"
                stroke={coreState === "thinking" ? "#9900ff" : "#0044ff"}
                strokeWidth="2"
                strokeDasharray="12 8"
                className={`origin-center ${coreState === "thinking" ? "animate-[spin_6s_linear_infinite_reverse]" : "animate-[spin_32s_linear_infinite_reverse]"}`}
              />

              {/* Ring 1: Inner Solid/Segmented Ring (Clockwise, Slow) */}
              <circle
                cx="200"
                cy="200"
                r="125"
                fill="none"
                stroke="var(--theme-primary)"
                strokeWidth="1.5"
                strokeDasharray="80 20 40 20"
                className={`origin-center ${coreState === "thinking" ? "animate-[spin_3s_linear_infinite]" : "animate-[spin_40s_linear_infinite]"}`}
              />
            </svg>

            {/* Central Core Node (AI Orb) with Breathing Animation */}
            <div 
              onClick={() => handleCommandSubmit()}
              className={`relative z-10 w-40 h-40 md:w-52 md:h-52 rounded-full cursor-pointer flex items-center justify-center transition-all duration-700 group ${
                coreState === "thinking"
                  ? "bg-gradient-to-tr from-[#2e0854] via-[#7e22ce] to-[#c084fc] shadow-[0_0_70px_#9900ff,inset_0_0_30px_#ffffff] scale-105"
                  : "bg-gradient-to-tr from-[#00173d] via-[#0044ff] to-[var(--theme-primary)] shadow-[0_0_60px_var(--theme-primary),inset_0_0_25px_#ffffff] animate-[pulse_2.2s_ease-in-out_infinite]"
              }`}
            >
              {/* Internal Holographic Geometric Star / Unibeam */}
              <div className="absolute inset-4 rounded-full border border-white/40 flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/40 absolute" />
                <div className="h-full w-[1px] bg-white/40 absolute" />
                
                {/* Central Hyper-Luminous Heart */}
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-[0_0_35px_#ffffff] animate-ping opacity-75" />
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--theme-primary)] shadow-[0_0_20px_var(--theme-primary)]" />
              </div>
            </div>

            {/* Status Pill beneath Orb */}
            <div className="absolute -bottom-6 flex items-center gap-2 bg-[#051326]/90 border border-[var(--theme-primary)]/40 px-3 py-1 rounded-full text-[10px] font-['Orbitron',sans-serif] tracking-widest text-[var(--theme-primary)]">
              <span className={`w-2 h-2 rounded-full ${coreState === "thinking" ? "bg-purple-400 animate-ping" : "bg-[var(--theme-primary)] animate-pulse"}`} />
              <span>{coreState === "thinking" ? "STATE: NEURAL SYNAPSE COMPUTING" : "STATE: CORE IDLE & MONITORING"}</span>
            </div>
          </div>
        </section>

        {/* PANEL 3: AI Matrix Response & Widgets (Right Panel, 3 cols) */}
        <section className="lg:col-span-3 flex flex-col justify-between bg-[#040d1a]/80 border border-[var(--theme-primary)]/20 rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.05)] backdrop-blur-md">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--theme-primary)]" />
                <h2 className="font-['Orbitron',sans-serif] text-xs font-bold tracking-widest text-[var(--theme-primary)]">
                  MATRIX OUTPUT
                </h2>
              </div>
              <span className="text-[10px] font-['JetBrains_Mono',monospace] text-[var(--theme-primary)]">v8.5</span>
            </div>

            {/* Dedicated Dynamic Typewriter Output Box */}
            <div className="flex-1 p-3 bg-black/60 border border-[var(--theme-primary)]/30 rounded-lg text-xs md:text-sm font-['JetBrains_Mono',monospace] text-[#cbf3ff] leading-relaxed overflow-y-auto scrollbar-thin relative min-h-[160px]">
              <div className="text-[9px] text-[var(--theme-primary)]/70 font-['Orbitron',sans-serif] mb-2 uppercase tracking-wider">
                DECRYPTED TELEMETRY STREAM:
              </div>
              <p className="whitespace-pre-wrap selection:bg-[var(--theme-primary)] selection:text-black">
                {displayedText}
                <span className="inline-block w-1.5 h-3.5 bg-[var(--theme-primary)] ml-1 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Active Status Widgets */}
          <div className="mt-4 pt-3 border-t border-[var(--theme-primary)]/20 grid grid-cols-2 gap-2 text-[10px] font-['JetBrains_Mono',monospace]">
            <div className="p-2 bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 rounded">
              <div className="text-gray-400 font-['Orbitron',sans-serif] text-[8px]">NETWORK STATUS</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> SECURE
              </div>
            </div>

            <div className="p-2 bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 rounded">
              <div className="text-gray-400 font-['Orbitron',sans-serif] text-[8px]">UPLINK NODE</div>
              <div className="text-[var(--theme-primary)] font-bold flex items-center gap-1 mt-0.5">
                <Wifi className="w-3 h-3 text-[var(--theme-primary)]" /> ACTIVE
              </div>
            </div>

            <div className="p-2 bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 rounded">
              <div className="text-gray-400 font-['Orbitron',sans-serif] text-[8px]">BANDWIDTH</div>
              <div className="text-cyan-300 font-bold mt-0.5">
                {diagnostics.uplinkRate}
              </div>
            </div>

            <div className="p-2 bg-[var(--theme-secondary)] border border-[var(--theme-primary)]/20 rounded">
              <div className="text-gray-400 font-['Orbitron',sans-serif] text-[8px]">PROTOCOL</div>
              <div className="text-[#9900ff] font-bold mt-0.5 truncate">
                OMEGA-V85
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER: User Prompt Interface */}
      <footer className="p-4 md:p-6 bg-gradient-to-t from-black via-[var(--theme-secondary)]/95 to-transparent border-t border-[var(--theme-primary)]/20 relative z-20">
        <form onSubmit={handleCommandSubmit} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-4 font-['Orbitron',sans-serif] text-xs font-bold text-[var(--theme-primary)] select-none pointer-events-none tracking-wider">
              J.A.R.V.I.S. &gt;
            </span>

            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Command in English or Tanglish (e.g. 'Jarvis, Chrome open pannunga', 'Fix bug')..."
              className="w-full bg-[#040d1a]/90 border border-[var(--theme-primary)]/40 rounded-xl py-3.5 pl-32 pr-12 text-[#e0f7ff] placeholder-[var(--theme-primary)]/40 focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] font-['JetBrains_Mono',monospace] text-sm shadow-[inset_0_0_15px_rgba(0,243,255,0.08)] transition-all"
            />

            {/* Mic button embedded in footer */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`absolute right-3 p-2 rounded-lg transition-all ${
                isVoiceActive
                  ? "bg-red-950 text-red-400 border border-red-500 shadow-[0_0_10px_#ef4444]"
                  : "text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10"
              }`}
              title={isVoiceActive ? "Disable Voice Input" : "Enable Voice Input"}
            >
              {isVoiceActive ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!promptInput.trim()}
            className="p-3.5 rounded-xl bg-gradient-to-r from-[#0044ff] to-[var(--theme-primary)] text-black font-bold hover:brightness-125 disabled:opacity-30 disabled:hover:brightness-100 transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
