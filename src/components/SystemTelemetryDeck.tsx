import React from "react";
import { Clock, Calendar, MapPin, CloudSun, ChevronRight } from "lucide-react";
import { SystemEnvironment } from "../types";

interface SystemTelemetryDeckProps {
  env: SystemEnvironment;
  displayTemperature: string | null;
  onOpenModal: () => void;
  variant?: "header" | "ribbon" | "sidebar";
}

export const SystemTelemetryDeck: React.FC<SystemTelemetryDeckProps> = ({
  env,
  displayTemperature,
  onOpenModal,
  variant = "header",
}) => {
  if (variant === "sidebar") {
    return (
      <div 
        onClick={onOpenModal}
        className="p-3 rounded-lg border border-cyan-500/25 bg-gray-950/80 hover:border-cyan-400 cursor-pointer transition-all group space-y-2.5 font-['JetBrains_Mono',monospace]"
        title="Click to view full System Telemetry & Geolocation Matrix"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-['Orbitron',sans-serif] text-cyan-400 font-bold tracking-wider">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> TEMPORAL & GEOSPATIAL
          </span>
          <span className="text-[9px] text-cyan-400/70 group-hover:text-cyan-300 flex items-center gap-0.5">
            EXPAND <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Live Clock & Date */}
        <div className="bg-black/60 p-2 rounded border border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[9px] text-gray-500 uppercase">SYSTEM TIME</div>
            <div className="text-sm font-bold text-cyan-300 font-['Orbitron',sans-serif]">
              {env.currentTime}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-gray-500 uppercase">DATE</div>
            <div className="text-[11px] text-gray-300 font-medium">{env.currentDate}</div>
          </div>
        </div>

        {/* Location & Weather chips */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="p-1.5 rounded bg-black/40 border border-gray-800 flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 truncate font-medium">
              {env.location.city || "Detected Node"}
            </span>
          </div>
          <div className="p-1.5 rounded bg-black/40 border border-gray-800 flex items-center gap-1.5 truncate">
            <CloudSun className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 truncate font-medium">
              {displayTemperature || "Fair"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Header and ribbon variant
  return (
    <div 
      onClick={onOpenModal}
      className="flex items-center gap-1.5 md:gap-2 cursor-pointer group text-xs font-['JetBrains_Mono',monospace]"
      title="Click to view full System Telemetry, Atomic Clock, Geolocation & Weather"
    >
      {/* 1. Live Time Pill */}
      <div className="flex items-center gap-1.5 bg-[#030a16] border border-cyan-500/30 group-hover:border-cyan-400 px-2.5 py-1 rounded-lg transition-all shadow-[0_0_10px_rgba(0,243,255,0.08)]">
        <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="font-['Orbitron',sans-serif] text-cyan-300 font-bold text-[11px] tracking-wide">
          {env.currentTime}
        </span>
      </div>

      {/* 2. Date Pill (hidden on tiny screens) */}
      <div className="hidden sm:flex items-center gap-1.5 bg-[#030a16] border border-cyan-500/20 group-hover:border-cyan-400/60 px-2.5 py-1 rounded-lg transition-all text-gray-300 text-[11px]">
        <Calendar className="w-3 h-3 text-cyan-400/80" />
        <span className="truncate max-w-[130px] font-medium">{env.currentDate}</span>
      </div>

      {/* 4. Weather / Temp Pill (if available) */}
      {displayTemperature && (
        <div className="hidden lg:flex items-center gap-1.5 bg-[#030a16] border border-amber-500/25 group-hover:border-amber-400/60 px-2 py-1 rounded-lg transition-all text-amber-300 text-[11px]">
          <CloudSun className="w-3 h-3 text-amber-400" />
          <span>{displayTemperature}</span>
        </div>
      )}
    </div>
  );
};
