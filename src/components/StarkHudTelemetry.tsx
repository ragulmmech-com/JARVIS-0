import React from "react";
import { 
  Activity, Cpu, HardDrive, Wifi, ShieldCheck, 
  Terminal, MonitorPlay, Zap, Power, Volume2, VolumeX,
  Layers, Database, Sliders
} from "lucide-react";
import { ArcReactorOrb } from "./ArcReactorOrb";
import { ArcReactorState, AIModelId, SystemDiagnostic, SystemEnvironment } from "../types";
import { SystemTelemetryDeck } from "./SystemTelemetryDeck";

interface StarkHudTelemetryProps {
  reactorState: ArcReactorState;
  onToggleVoice: () => void;
  selectedModel: AIModelId;
  onSelectModel: (m: AIModelId) => void;
  telemetry: SystemDiagnostic;
  onOpenLocalAgentModal: () => void;
  isVoiceMuted: boolean;
  onToggleMute: () => void;
  env?: SystemEnvironment;
  onOpenSystemModal?: () => void;
  displayTemperature?: string | null;
}

export const StarkHudTelemetry: React.FC<StarkHudTelemetryProps> = ({
  reactorState,
  onToggleVoice,
  selectedModel,
  onSelectModel,
  telemetry,
  onOpenLocalAgentModal,
  isVoiceMuted,
  onToggleMute,
  env,
  onOpenSystemModal,
  displayTemperature = null,
}) => {
  return (
    <div className="w-80 border-r border-cyan-500/20 bg-gray-950/90 backdrop-blur-xl flex flex-col justify-between relative z-20 overflow-y-auto">
      {/* Top Header: Mark 85 Arc Status */}
      <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-b from-cyan-950/40 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-hud text-xs text-cyan-300 font-bold tracking-widest">
              J.A.R.V.I.S. HUD v8.5
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-cyan-500/80 px-1.5 py-0.5 border border-cyan-500/30 rounded">
            SYS: SECURE
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 font-tech">
          <span>OPERATOR: ADMIN</span>
          <span className="text-cyan-400">ARC REACTOR: 100%</span>
        </div>
      </div>

      {/* Central Interactive Arc Reactor Core */}
      <div className="py-6 px-4 flex flex-col items-center justify-center relative">
        <div className="absolute top-2 text-[10px] font-hud text-cyan-500/60 uppercase tracking-widest">
          CORE FUSION CATALYST
        </div>
        
        <div className="my-3">
          <ArcReactorOrb 
            state={reactorState} 
            onClick={onToggleVoice} 
            size="md"
          />
        </div>

        <div className="w-full mt-4 flex items-center justify-center gap-2">
          <button
            onClick={onToggleVoice}
            className={`px-4 py-1.5 rounded text-xs font-hud tracking-wider flex items-center gap-2 border transition-all ${
              reactorState === "listening"
                ? "bg-red-950/60 border-red-500 text-red-300 animate-pulse shadow-lg shadow-red-950"
                : "bg-cyan-950/50 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 shadow-lg shadow-cyan-950/50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {reactorState === "listening" ? "LIVE VOICE: ACTIVE" : "ACTIVATE VOICE"}
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded border border-cyan-500/30 bg-gray-900 text-cyan-400 hover:bg-cyan-950 transition-colors"
            title={isVoiceMuted ? "Unmute Vocal Feedback" : "Mute Vocal Feedback"}
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5 text-gray-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Live Temporal, Date & Geospatial Telemetry */}
      {env && onOpenSystemModal && (
        <div className="px-4 pb-3">
          <SystemTelemetryDeck
            env={env}
            displayTemperature={displayTemperature}
            onOpenModal={onOpenSystemModal}
            variant="sidebar"
          />
        </div>
      )}

      {/* Live System Telemetry Gauges */}
      <div className="p-4 space-y-4 border-t border-b border-cyan-500/20 bg-black/40">
        <div className="flex items-center justify-between text-xs font-hud text-cyan-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> HARDWARE MATRIX
          </span>
          <span className="text-gray-400 text-[10px] font-mono-code">2.8 GHz MULTI-CORE</span>
        </div>

        {/* CPU Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-tech text-gray-300">
            <span>CPU THREAD LOAD</span>
            <span className="font-mono-code text-cyan-400">{telemetry.cpuUsage}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800">
            <div 
              className="h-full bg-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, telemetry.cpuUsage)}%` }}
            />
          </div>
        </div>

        {/* RAM Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-tech text-gray-300">
            <span>NEURAL MEMORY CACHE</span>
            <span className="font-mono-code text-cyan-400">{telemetry.memoryUsage}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800">
            <div 
              className="h-full bg-amber-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, telemetry.memoryUsage)}%` }}
            />
          </div>
        </div>

        {/* Diagnostic Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono-code text-[11px]">
          <div className="p-2 rounded bg-gray-900/60 border border-gray-800">
            <div className="text-[9px] text-gray-500 font-hud">POWER OUTPUT</div>
            <div className="text-cyan-300 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> {telemetry.powerOutputPcnt}% GW
            </div>
          </div>

          <div className="p-2 rounded bg-gray-900/60 border border-gray-800">
            <div className="text-[9px] text-gray-500 font-hud">LATENCY</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" /> {telemetry.networkLatencyMs}ms
            </div>
          </div>
        </div>
      </div>

      {/* Model & Agent Orchestration Controls */}
      <div className="p-4 space-y-3 bg-gray-950">
        {/* Model Switcher */}
        <div>
          <div className="flex items-center justify-between text-xs font-hud text-cyan-300 mb-1.5">
            <span className="flex items-center gap-1">
              <Sliders className="w-3 h-3" /> INTEL MATRIX
            </span>
            <span className="text-[9px] text-gray-500">HOT-SWAP</span>
          </div>

          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value as AIModelId)}
            className="w-full bg-gray-900 border border-cyan-500/30 text-cyan-100 text-xs rounded p-2 focus:outline-none focus:border-cyan-400 font-tech"
          >
            <option value="jarvis-core-mk1">Cognitive Core Alpha (God Speed)</option>
            <option value="jarvis-core-mk2">Cognitive Core Delta (Deep Reasoning)</option>
            <option value="jarvis-core-mk3">Analytical Neural Engine (Universal)</option>
            <option value="jarvis-core-mk5">Deep Thought Protocol (Complex Logic)</option>
            <option value="jarvis-core-mk4">Strategic Logic Matrix (Master Prose)</option>
          </select>
        </div>

        {/* Local PC Agent Link */}
        <button
          onClick={onOpenLocalAgentModal}
          className={`w-full p-2 rounded border text-xs font-tech flex items-center justify-between transition-colors ${
            telemetry.localAgentOnline
              ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/60"
              : "bg-orange-950/30 border-orange-500/50 text-orange-300 hover:bg-orange-950/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4" />
            <div className="text-left">
              <div className="font-hud text-[10px]">WINDOWS GOD MODE</div>
              <div className="text-[10px] text-gray-400">
                {telemetry.localAgentOnline ? "Daemon Connected (Port 11424)" : "Daemon Disconnected"}
              </div>
            </div>
          </div>
          <span className={`text-[10px] uppercase font-hud px-1.5 py-0.5 rounded ${
            telemetry.localAgentOnline ? "bg-emerald-900/60 text-emerald-200" : "bg-orange-900/60 text-orange-200"
          }`}>
            {telemetry.localAgentOnline ? "LINKED" : "SETUP"}
          </span>
        </button>
      </div>
    </div>
  );
};
