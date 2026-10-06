import React, { useState } from "react";
import { 
  Activity, FolderKanban, ShieldCheck, 
  Zap, MessageSquare, Plus, ChevronDown, ChevronLeft, Cpu, Settings2, Globe, Disc, Palette, Sparkles, Database, BatteryCharging, ArrowRightLeft
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { TacticalTabType } from "../types";
import { usePerformance } from "../context/PerformanceContext";
import { jarvisAudio } from "../lib/audioSynthesizer";

export type { TacticalTabType };

interface SystemSidebarNavProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onNewChat: () => void;
  onOpenMemory: () => void;
  onOpenStorageVault: () => void;
  onOpenSystemEnv: () => void;
  onOpenFileConverter?: () => void;
  isFileConverterOpen?: boolean;
  onOpenSmartCalendar?: () => void;
  isSmartCalendarOpen?: boolean;
  onOpenProjectChat?: () => void;
  onToggleTacticalWidgets?: () => void;
  isTacticalWidgetsOpen?: boolean;
  onOpenSidebarChat?: () => void;
  isSidebarChatOpen?: boolean;
  onSelectTacticalTab?: (tab: TacticalTabType) => void;
  activeTacticalTab?: TacticalTabType;
}

export const SystemSidebarNav: React.FC<SystemSidebarNavProps> = ({
  isOpen = true,
  onToggle,
  onNewChat,
  onOpenMemory,
  onOpenStorageVault,
  onOpenSystemEnv,
  onOpenFileConverter,
  isFileConverterOpen,
  onOpenSmartCalendar,
  isSmartCalendarOpen,
  onOpenProjectChat,
  onToggleTacticalWidgets,
  isTacticalWidgetsOpen,
  onOpenSidebarChat,
  isSidebarChatOpen,
  onSelectTacticalTab,
  activeTacticalTab
}) => {
  const [isWidgetMenuExpanded, setIsWidgetMenuExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jarvis_sidebar_collapsed") === "true";
    }
    return false;
  });
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { mode, cyclePerformanceMode, fps, powerSave } = usePerformance();

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("jarvis_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const TACTICAL_TABS: { id: TacticalTabType; icon: React.ElementType; label: string }[] = [
    { id: "persona", icon: Sparkles, label: "Persona Matrix" },
    { id: "languages", icon: Globe, label: "Languages" },
    { id: "voice", icon: Disc, label: "Voice Matrix" },
    { id: "ui_change", icon: Palette, label: "UI Themes" },
    { id: "reactor_change", icon: Zap, label: "Reactor Core" }
  ];

  if (!isOpen) {
    return null;
  }

  const labelClass = isCollapsed ? "hidden" : "hidden lg:inline";
  const btnJustify = isCollapsed ? "justify-center" : "justify-center lg:justify-start";

  return (
    <aside 
      id="system-sidebar-nav"
      className={`${
        isCollapsed ? "w-16" : "w-16 lg:w-56"
      } flex-shrink-0 bg-[#040d1a]/95 border-r border-[var(--theme-primary)]/20 flex flex-col justify-between py-3.5 shadow-[5px_0_20px_rgba(0,0,0,0.6)] z-20 overflow-y-auto scrollbar-none relative transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-col gap-1.5 px-2">
        {/* Brand / Core Emblem Display Header */}
        <div
          id="sidebar-brand-emblem"
          onClick={toggleCollapse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleCollapse();
            }
          }}
          className={`flex items-center ${
            isCollapsed ? "justify-center p-2" : "justify-between px-2.5 py-1.5"
          } mb-3 text-[var(--theme-primary)] rounded-xl border border-[var(--theme-primary)]/25 bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 hover:border-[var(--theme-primary)]/50 cursor-pointer select-none transition-all group shadow-[0_0_15px_rgba(0,243,255,0.08)]`}
          title={
            isCollapsed
              ? "JARVIS Core • Click to Expand"
              : "Click to Collapse Sidebar"
          }
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} min-w-0`}>
            {/* Glowing Spinning Arc Reactor Core Icon */}
            <div className="relative flex items-center justify-center w-7 h-7 flex-shrink-0 group-hover:scale-110 transition-transform">
              <img 
                src="/icon.svg" 
                alt="J.A.R.V.I.S. Arc Reactor" 
                className="w-7 h-7 rounded-full object-contain animate-spin-slow drop-shadow-[0_0_8px_rgba(0,243,255,0.7)]" 
              />
              <span className="absolute -inset-1 rounded-full border border-[var(--theme-primary)]/40 animate-ping pointer-events-none" />
            </div>

            {/* Title & Version (Visible when expanded) */}
            {!isCollapsed && (
              <div className="hidden lg:flex flex-col">
                <span className="font-['Orbitron',sans-serif] font-bold tracking-widest text-sm text-[var(--theme-primary)] leading-tight">
                  J.A.R.V.I.S.
                </span>
                <span className="text-[9px] font-['JetBrains_Mono',monospace] text-[var(--theme-primary)]/70 tracking-wider font-semibold">
                  V1.0.0.0
                </span>
              </div>
            )}
          </div>

          {/* Collapse Indicator Button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              className="hidden lg:flex p-1 rounded-md text-[var(--theme-primary)]/60 hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/15 transition-all"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Stream Button */}
        <button 
          id="btn-sidebar-new-stream"
          type="button"
          onClick={onNewChat}
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-xl bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] transition-all group shadow-[0_0_12px_rgba(0,243,255,0.1)]`}
          title="Initialize New Neural Stream"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 group-hover:rotate-90 transition-transform" />
          <span className={`${labelClass} text-xs font-bold font-['JetBrains_Mono',monospace] tracking-wider`}>NEW STREAM</span>
        </button>

        <div className="w-full h-px bg-[var(--theme-primary)]/10 my-1.5" />

        {/* JARVIS Chat & Conversations */}
        <button 
          id="btn-sidebar-live-comms"
          type="button"
          onClick={onOpenMemory}
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-lg bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] transition-all group`}
          title="JARVIS Chat & Conversation History"
        >
          <MessageSquare className="w-4 h-4 text-[var(--theme-primary)] group-hover:scale-110 transition-transform" />
          <span className={`${labelClass} text-xs font-semibold tracking-wider font-['JetBrains_Mono',monospace]`}>JARVIS CHAT</span>
        </button>

        {/* Storage Vault (IndexedDB) */}
        <button 
          id="btn-sidebar-storage-vault"
          type="button"
          onClick={onOpenStorageVault}
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-lg hover:bg-emerald-950/20 text-gray-400 hover:text-emerald-400 transition-colors group`}
          title="Storage Vault (IndexedDB GB Memory)"
        >
          <Database className="w-4 h-4 group-hover:text-emerald-400 flex-shrink-0" />
          <span className={`${labelClass} text-xs font-medium`}>Storage Vault</span>
        </button>

        {/* Project Context */}
        <button 
          id="btn-sidebar-project-ops"
          type="button"
          onClick={onOpenProjectChat}
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-lg hover:bg-[var(--theme-primary)]/5 text-gray-400 hover:text-[var(--theme-primary)] transition-colors group`}
          title="Project Context Workspace"
        >
          <FolderKanban className="w-4 h-4 group-hover:text-[var(--theme-primary)] flex-shrink-0" />
          <span className={`${labelClass} text-xs font-medium`}>Project Ops</span>
        </button>

        {/* J.A.R.V.I.S. Workspace Chat */}
        <button 
          id="btn-sidebar-chat"
          type="button"
          onClick={onOpenSidebarChat}
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-lg transition-colors group ${
            isSidebarChatOpen
              ? "bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] font-medium shadow-[inset_2px_0_0_var(--theme-primary)]"
              : "hover:bg-[var(--theme-primary)]/5 text-gray-400 hover:text-[var(--theme-primary)]"
          }`}
          title="J.A.R.V.I.S. Workspace"
        >
          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isSidebarChatOpen ? "text-[var(--theme-primary)]" : "group-hover:text-[var(--theme-primary)]"}`} />
          <span className={`${labelClass} text-xs font-medium`}>Chat Workspace</span>
        </button>

        {/* System Environment */}
        <button 
          id="btn-sidebar-system-env"
          type="button"
          onClick={onOpenSystemEnv}
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-lg hover:bg-[var(--theme-primary)]/5 text-gray-400 hover:text-[var(--theme-primary)] transition-colors group`}
          title="Telemetry & Diagnostics"
        >
          <Activity className="w-4 h-4 group-hover:text-[var(--theme-primary)] flex-shrink-0" />
          <span className={`${labelClass} text-xs font-medium`}>Environment</span>
        </button>

        {/* Converter / File Format Converter - Directly under Environment */}
        <button 
          id="btn-sidebar-file-converter"
          type="button"
          onClick={onOpenFileConverter}
          className={`flex items-center ${btnJustify} gap-2.5 p-2.5 rounded-lg transition-all group ${
            isFileConverterOpen
              ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-semibold shadow-[inset_2px_0_0_var(--theme-primary)] border border-[var(--theme-primary)]/30"
              : "hover:bg-[var(--theme-primary)]/10 text-gray-400 hover:text-[var(--theme-primary)]"
          }`}
          title="File Format Converter (PDF, Word, Excel, Images, Multi-File & Folder)"
        >
          <ArrowRightLeft className={`w-4 h-4 flex-shrink-0 ${isFileConverterOpen ? "text-[var(--theme-primary)] animate-pulse" : "group-hover:text-[var(--theme-primary)]"}`} />
          <span className={`${labelClass} text-xs font-semibold`}>Converter</span>
        </button>

        <div className="w-full h-px bg-[var(--theme-primary)]/10 my-1.5" />

        {/* TACTICAL WIDGETS SECTION */}
        <div className="flex flex-col gap-1">
          <button 
            type="button"
            onClick={() => {
              setIsWidgetMenuExpanded(!isWidgetMenuExpanded);
            }}
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            } p-2.5 rounded-lg transition-all group ${isWidgetMenuExpanded ? 'bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 text-[var(--theme-primary)]' : 'hover:bg-white/5 text-gray-400 border border-transparent'}`}
            title="Tactical Widgets & Subsystems"
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-center lg:justify-start"} gap-3 ${isCollapsed ? "" : "w-full lg:w-auto"}`}>
              <Settings2 className={`w-4 h-4 flex-shrink-0 ${isWidgetMenuExpanded ? 'text-[var(--theme-primary)] animate-spin-slow' : 'group-hover:text-[var(--theme-primary)]'}`} />
              {!isCollapsed && (
                <span className="hidden lg:inline text-xs font-bold tracking-wider font-['JetBrains_Mono',monospace]">TACTICAL WIDGETS</span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`hidden lg:block w-4 h-4 transition-transform ${isWidgetMenuExpanded ? "rotate-180" : ""}`} />
            )}
          </button>

          {/* Expandable Tactical Options */}
          {isWidgetMenuExpanded && (
            <div className={`flex flex-col gap-1 mt-1 ${isCollapsed ? "pl-0" : "pl-1 lg:pl-4 border-l border-[var(--theme-primary)]/20 ml-0 lg:ml-5"} py-1 animate-fadeIn`}>
              {TACTICAL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTacticalTab?.(tab.id as TacticalTabType)}
                  className={`flex items-center ${btnJustify} gap-3 p-2 rounded-lg transition-colors group ${
                    activeTacticalTab === tab.id
                      ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold shadow-[inset_2px_0_0_var(--theme-primary)]"
                      : "text-gray-400 hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/5"
                  }`}
                  title={tab.label}
                >
                  <tab.icon className={`w-3.5 h-3.5 flex-shrink-0 ${activeTacticalTab === tab.id ? "text-[var(--theme-primary)] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]" : ""}`} />
                  <span className={`${labelClass} text-[11px] font-medium`}>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Protocol */}
      <div className="flex flex-col gap-1.5 px-2 mt-auto">
        {/* Performance & FPS Matrix Toggle */}
        <button
          id="btn-sidebar-performance-mode"
          type="button"
          onClick={() => {
            const next = cyclePerformanceMode();
            jarvisAudio.playNotificationSound();
          }}
          className={`flex items-center ${btnJustify} gap-2.5 p-2 rounded-lg border transition-all group ${
            mode === 'ULTRA'
              ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_15px_rgba(0,243,255,0.25)]'
              : mode === 'BALANCED'
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          }`}
          title={`Performance Matrix: ${
            mode === 'ULTRA' ? 'ULTRA 120 FPS Active (Click for Power Save 30 FPS)' :
            mode === 'BALANCED' ? 'BALANCED 60 FPS Active (Click for Ultra 120 FPS)' :
            'POWER SAVE 30 FPS Active (Click for Balanced 60 FPS)'
          }`}
        >
          {mode === 'ULTRA' ? (
            <Zap className="w-4 h-4 flex-shrink-0 text-cyan-400 animate-pulse" />
          ) : mode === 'BALANCED' ? (
            <Cpu className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <BatteryCharging className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
          )}
          <span className={`${labelClass} text-[11px] font-mono font-bold tracking-wider`}>
            {mode === 'ULTRA' ? 'ULTRA (120FPS)' : mode === 'BALANCED' ? 'PERFORMANCE (60FPS)' : 'POWER SAVE (30FPS)'}
          </span>
        </button>

        {/* PWA Installation Button */}
        {!isInstalled && isInstallable && (
          <button
            id="btn-sidebar-install-pwa"
            type="button"
            onClick={() => {
              if (isInstallable) {
                install();
              }
            }}
            className={`flex items-center ${btnJustify} gap-2.5 p-2 rounded-lg bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/40 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/25 transition-all group shadow-[0_0_10px_rgba(0,243,255,0.15)] mb-1`}
            title="Install J.A.R.V.I.S. Arc Reactor PWA"
          >
            <div className="relative w-4 h-4 flex-shrink-0 flex items-center justify-center">
              <img src="/icon.svg" alt="PWA" className="w-4 h-4 rounded-full object-contain group-hover:scale-110 transition-transform" />
            </div>
            <span className={`${labelClass} text-[11px] font-mono font-bold tracking-wider`}>
              INSTALL APP
            </span>
          </button>
        )}

        <div className="w-full h-px bg-gray-800/60 my-1" />
        <div 
          id="sidebar-security-badge"
          className={`flex items-center ${btnJustify} gap-3 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 group`}
          title="Security Protocols: ACTIVE & ENCRYPTED"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className={`${labelClass} text-[11px] font-mono font-semibold text-emerald-400/90 tracking-wider`}>DEFENSE NOMINAL</span>
        </div>
      </div>

    </aside>
  );
};
