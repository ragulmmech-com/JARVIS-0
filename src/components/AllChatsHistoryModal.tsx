import React, { useState, useMemo } from "react";
import { 
  X, History, Plus, Search, Trash2, Edit2, Check, 
  MessageSquare, Calendar, Download, ChevronRight, Zap, 
  Clock, ArrowRight, User, Cpu, AlertTriangle, Folder, Terminal, Layers
} from "lucide-react";
import { ChatSession, Message } from "../types";
import { SmartChatContent } from "./SmartChatContent";

interface AllChatsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  
}

export const AllChatsHistoryModal: React.FC<AllChatsHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolderTab, setActiveFolderTab] = useState<"ALL" | "LIVE_REACTOR" | "CHAT_WORKSPACE">("ALL");
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(activeSessionId || (sessions[0]?.id ?? ""));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [workspaceSessionsState, setWorkspaceSessionsState] = useState<ChatSession[]>([]);

  // Reload workspace sessions when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    const wsList: ChatSession[] = [];
    try {
      // 1. Load archived workspace sessions
      const archived = localStorage.getItem("jarvis_sidebar_workspace_sessions");
      if (archived) {
        const parsed = JSON.parse(archived);
        if (Array.isArray(parsed)) {
          wsList.push(...parsed);
        }
      }

      // 2. Load active workspace chat history if not empty
      const activeRaw = localStorage.getItem("jarvis_sidebar_workspace_history") || localStorage.getItem("jarvis_project_workspace_history");
      if (activeRaw) {
        const parsedActive = JSON.parse(activeRaw);
        if (Array.isArray(parsedActive) && parsedActive.length > 0) {
          const firstUser = parsedActive.find((m: any) => m.role === "user");
          const title = firstUser?.text ? firstUser.text.slice(0, 32) : "Active Chat Workspace";
          wsList.unshift({
            id: `workspace-chat-primary`,
            title: `[Workspace] ${title}`,
            createdAt: parsedActive[0]?.timestamp || Date.now(),
            updatedAt: parsedActive[parsedActive.length - 1]?.timestamp || Date.now(),
            messages: parsedActive,
            modelUsed: "gemini-free"
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load workspace sessions", e);
    }
    setWorkspaceSessionsState(wsList);
  }, [isOpen]);

  // Sync preview id when activeSessionId changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedPreviewId(activeSessionId || (sessions[0]?.id ?? ""));
    }
  }, [isOpen, activeSessionId, sessions]);

  // Combined & Filtered sessions based on search & folder tab
  const allCombinedSessions = useMemo(() => {
    return [...sessions, ...workspaceSessionsState];
  }, [sessions, workspaceSessionsState]);

  const liveReactorSessions = useMemo(() => {
    return allCombinedSessions.filter(s => !s.id.startsWith("workspace-") && !s.id.startsWith("sidebar-") && !s.title.includes("[Workspace]"));
  }, [allCombinedSessions]);

  const workspaceSessions = useMemo(() => {
    return allCombinedSessions.filter(s => s.id.startsWith("workspace-") || s.id.startsWith("sidebar-") || s.title.includes("[Workspace]"));
  }, [allCombinedSessions]);

  // Filtered sessions based on active folder tab and search query
  const filteredSessions = useMemo(() => {
    let baseList = allCombinedSessions;
    if (activeFolderTab === "LIVE_REACTOR") {
      baseList = liveReactorSessions;
    } else if (activeFolderTab === "CHAT_WORKSPACE") {
      baseList = workspaceSessions;
    }

    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase();
    return baseList.filter(session => {
      const matchTitle = session.title?.toLowerCase().includes(q);
      const matchMessages = session.messages?.some(m => m.text?.toLowerCase().includes(q));
      return matchTitle || matchMessages;
    });
  }, [allCombinedSessions, liveReactorSessions, workspaceSessions, activeFolderTab, searchQuery]);

  // Categorize sessions into Folders for visual groupings
  const categorizedSessions = useMemo<Record<string, ChatSession[]>>(() => {
    if (activeFolderTab === "LIVE_REACTOR") {
      return { "LIVE REACTOR AND DATA STREAM AND NOTES": filteredSessions };
    }
    if (activeFolderTab === "CHAT_WORKSPACE") {
      return { "CHAT WORKSPACE": filteredSessions };
    }

    const groups: Record<string, ChatSession[]> = {
      "LIVE REACTOR AND DATA STREAM AND NOTES": [],
      "CHAT WORKSPACE": []
    };

    filteredSessions.forEach(session => {
      if (session.id.startsWith("workspace-") || session.id.startsWith("sidebar-") || session.title.includes("[Workspace]")) {
        groups["CHAT WORKSPACE"].push(session);
      } else {
        groups["LIVE REACTOR AND DATA STREAM AND NOTES"].push(session);
      }
    });

    return groups;
  }, [filteredSessions, activeFolderTab]);

  // Helper for grouping chats by Day/Date (Today, Yesterday, Previous 7 Days, Older)
  const getSessionDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;
    const sessionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (sessionDay === today) {
      return "📅 TODAY (இன்று)";
    } else if (sessionDay === yesterday) {
      return "📅 YESTERDAY (நேற்று)";
    } else if (sessionDay >= sevenDaysAgo) {
      return "📅 PREVIOUS 7 DAYS (கடந்த 7 நாட்கள்)";
    } else {
      return `📅 ${date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
    }
  };

  const activePreviewSession = useMemo(() => {
    return allCombinedSessions.find(s => s.id === selectedPreviewId) || filteredSessions[0] || allCombinedSessions[0];
  }, [allCombinedSessions, filteredSessions, selectedPreviewId]);

  if (!isOpen) return null;

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      if (sessionId.startsWith("sidebar-") || sessionId.startsWith("workspace-")) {
        try {
          const updated = workspaceSessionsState.map(s => s.id === sessionId ? { ...s, title: editTitle.trim() } : s);
          setWorkspaceSessionsState(updated);
          localStorage.setItem("jarvis_sidebar_workspace_sessions", JSON.stringify(updated.filter(s => s.id !== "workspace-chat-primary")));
        } catch {}
      } else {
        onRenameSession(sessionId, editTitle.trim());
      }
    }
    setEditingId(null);
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessionId.startsWith("sidebar-") || sessionId.startsWith("workspace-")) {
      try {
        const remaining = workspaceSessionsState.filter(s => s.id !== sessionId);
        setWorkspaceSessionsState(remaining);
        localStorage.setItem("jarvis_sidebar_workspace_sessions", JSON.stringify(remaining.filter(s => s.id !== "workspace-chat-primary")));
        if (sessionId === "workspace-chat-primary") {
          localStorage.removeItem("jarvis_sidebar_workspace_history");
          localStorage.removeItem("jarvis_project_workspace_history");
        }
      } catch {}
    } else {
      onDeleteSession(sessionId);
    }
  };

  const handleExportSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const exportContent = (session.messages || []).map(m => {
      const sender = m.role === "user" ? "USER" : "JARVIS";
      const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : "";
      return `[${time}] ${sender}:\n${m.text || "[Media attachment]"}\n`;
    }).join("\n-------------------------\n\n");

    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(session.title || "session").replace(/[^a-z0-9]/gi, "_")}_transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isWorkspaceSession = (id: string) => id.startsWith("workspace-") || id.startsWith("sidebar-");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl h-[85vh] bg-[#020914]/95 border border-[var(--theme-primary)]/40 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden font-['JetBrains_Mono',monospace]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <header className="px-5 py-3.5 border-b border-[var(--theme-primary)]/20 bg-[#041224]/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Orbitron',sans-serif] text-sm md:text-base font-black text-[var(--theme-primary)] tracking-wider">
                  MEMORY MATRIX // SYNAPTIC STORAGE & FOLDERS
                </h2>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/30 text-cyan-300 text-[10px]">
                  {allCombinedSessions.length} MEMORIES STORED
                </span>
              </div>
              <p className="text-gray-400 text-xs hidden sm:block">
                Unified dual-folder memory: Live Reactor & Data Stream & Notes ⇄ Sidebar Chat Workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* New Chat Button */}
            <button
              id="btn-memory-new-chat"
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,243,255,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>NEW CHAT</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-memory-close-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* SEARCH & FOLDER SWITCHER BAR */}
        <div className="px-5 py-2.5 border-b border-[var(--theme-primary)]/15 bg-[#030d1c] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* FOLDER TABS */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-cyan-900/40 text-xs">
            <button
              onClick={() => setActiveFolderTab("ALL")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                activeFolderTab === "ALL"
                  ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>ALL FOLDERS ({allCombinedSessions.length})</span>
            </button>
            <button
              onClick={() => setActiveFolderTab("LIVE_REACTOR")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                activeFolderTab === "LIVE_REACTOR"
                  ? "bg-cyan-400 text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]"
                  : "text-cyan-300 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>LIVE REACTOR ({liveReactorSessions.length})</span>
            </button>
            <button
              onClick={() => setActiveFolderTab("CHAT_WORKSPACE")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                activeFolderTab === "CHAT_WORKSPACE"
                  ? "bg-purple-400 text-black shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  : "text-purple-300 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>CHAT WORKSPACE ({workspaceSessions.length})</span>
            </button>
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-cyan-500/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full bg-[var(--theme-secondary)] border border-cyan-500/30 rounded-lg pl-8 pr-3 py-1 text-xs text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TWO-PANEL WORKSPACE: SESSIONS LIST (LEFT) & PREVIEW (RIGHT) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANEL: CHAT SESSIONS TIMELINE (5 cols on desktop) */}
          <div className="md:col-span-5 border-r border-[var(--theme-primary)]/15 overflow-y-auto p-3 space-y-4 bg-[#020714]/70">
            {filteredSessions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <History className="w-10 h-10 text-gray-600 mb-2" />
                <div className="text-sm font-bold text-gray-400">No memory sessions found in this folder</div>
                <p className="text-xs mt-1 text-gray-500">
                  {searchQuery ? "Try a different search keyword" : "Start conversations in the Live Reactor or Chat Workspace to populate this folder."}
                </p>
                <button
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="mt-4 px-3 py-1.5 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/70"
                >
                  + Start New Chat
                </button>
              </div>
            ) : (
              (Object.entries(categorizedSessions) as [string, ChatSession[]][]).map(([category, catSessions]) => {
                if (catSessions.length === 0) return null;
                const isWorkspaceGroup = category === "CHAT WORKSPACE";

                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider uppercase border-b border-gray-800 pb-1">
                      <div className="flex items-center gap-1.5">
                        {isWorkspaceGroup ? (
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className={isWorkspaceGroup ? "text-purple-300" : "text-cyan-300"}>
                          {category}
                        </span>
                      </div>
                      <span className="text-gray-500 font-mono">({catSessions.length})</span>
                    </div>

                    {(() => {
                      const dateMap = new Map<string, ChatSession[]>();
                      catSessions.forEach(session => {
                        const label = getSessionDateLabel(session.updatedAt || session.createdAt);
                        if (!dateMap.has(label)) {
                          dateMap.set(label, []);
                        }
                        dateMap.get(label)!.push(session);
                      });

                      return Array.from(dateMap.entries()).map(([dateLabel, dateSessions]) => (
                        <div key={dateLabel} className="space-y-1.5 pt-1">
                          {/* Date Group Heading (Today, Yesterday, etc.) */}
                          <div className="flex items-center gap-2 px-1.5 pt-2 pb-0.5">
                            <Calendar className="w-3 h-3 text-cyan-400/80 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-cyan-300 tracking-wider uppercase">
                              {dateLabel}
                            </span>
                            <div className="flex-1 h-[1px] bg-cyan-900/40" />
                            <span className="text-[9px] text-gray-500 font-mono">
                              {dateSessions.length} {dateSessions.length === 1 ? "chat" : "chats"}
                            </span>
                          </div>

                          {dateSessions.map(session => {
                            const isActive = session.id === activeSessionId;
                            const isSelected = session.id === selectedPreviewId;
                            const lastMsg = (session.messages || [])[session.messages.length - 1];
                            const formattedTime = new Date(session.updatedAt || session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isWs = isWorkspaceSession(session.id);

                            return (
                              <div
                                key={session.id}
                                onClick={() => setSelectedPreviewId(session.id)}
                                onDoubleClick={() => {
                                  onSelectSession(session.id);
                                  onClose();
                                }}
                                className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? isWs 
                                      ? "bg-purple-950/40 border-purple-400/80 shadow-[0_0_12px_rgba(168,85,247,0.2)]" 
                                      : "bg-cyan-950/50 border-cyan-400/80 shadow-[0_0_12px_rgba(0,243,255,0.15)]"
                                    : "bg-[#030f1e]/60 border-cyan-900/40 hover:border-cyan-500/50 hover:bg-[#031326]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {/* Title / Edit Mode */}
                                    {editingId === session.id ? (
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={editTitle}
                                          onChange={(e) => setEditTitle(e.target.value)}
                                          className="w-full bg-[#02050b] border border-cyan-400 px-1.5 py-0.5 rounded text-xs text-white focus:outline-none"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveRename(session.id, e as any);
                                            if (e.key === "Escape") setEditingId(null);
                                          }}
                                        />
                                        <button
                                          onClick={(e) => handleSaveRename(session.id, e)}
                                          className="p-1 text-emerald-400 hover:text-emerald-300"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-xs font-semibold truncate ${isSelected ? (isWs ? "text-purple-200" : "text-cyan-200") : "text-gray-300 group-hover:text-cyan-100"}`}>
                                          {session.title || "Untitled Intelligence Log"}
                                        </span>
                                        {isActive && (
                                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500 text-emerald-400 text-[9px] font-bold flex-shrink-0 animate-pulse">
                                            ACTIVE
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Message snippet preview */}
                                    <p className="text-[11px] text-gray-400 line-clamp-1 mt-1">
                                      {lastMsg?.text || (lastMsg?.image ? "[Transmitted Visual Data]" : "Empty conversation")}
                                    </p>

                                    {/* Metadata footer */}
                                    <div className="flex items-center gap-2.5 mt-1.5 text-[10px] text-gray-500">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                                        isWs ? "bg-purple-950/80 text-purple-300 border border-purple-800" : "bg-cyan-950/80 text-cyan-300 border border-cyan-800"
                                      }`}>
                                        {isWs ? "WORKSPACE" : "LIVE REACTOR"}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formattedTime}
                                      </span>
                                      <span>{(session.messages || []).length} msgs</span>
                                    </div>
                                  </div>

                                  {/* Quick Open + Hover Actions Menu */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectSession(session.id);
                                        onClose();
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-800 text-[10px] font-bold"
                                      title="Open this chat immediately"
                                    >
                                      OPEN
                                    </button>
                                    <button
                                      onClick={(e) => handleStartRename(session, e)}
                                      className="p-1 rounded text-gray-400 hover:text-cyan-300 hover:bg-cyan-950"
                                      title="Rename Chat"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => handleExportSession(session, e)}
                                      className="p-1 rounded text-gray-400 hover:text-emerald-300 hover:bg-emerald-950"
                                      title="Export Transcript"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDelete(session.id, e)}
                                      className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-950"
                                      title="Delete Chat"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT PANEL: SELECTED CHAT DETAIL / PREVIEW (7 cols on desktop) */}
          <div className="hidden md:flex md:col-span-7 flex-col justify-between bg-[#010610] overflow-hidden">
            {activePreviewSession ? (
              <>
                {/* Preview Header */}
                <div className="px-5 py-3 border-b border-[var(--theme-primary)]/15 bg-[var(--theme-secondary)] flex items-center justify-between flex-shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isWorkspaceSession(activePreviewSession.id) 
                          ? "bg-purple-950 border border-purple-500 text-purple-300"
                          : "bg-cyan-950 border border-cyan-500 text-cyan-300"
                      }`}>
                        {isWorkspaceSession(activePreviewSession.id) ? "FOLDER: CHAT WORKSPACE" : "FOLDER: LIVE REACTOR"}
                      </span>
                      <h3 className="text-sm font-bold text-cyan-200 truncate max-w-sm">
                        {activePreviewSession.title}
                      </h3>
                      {activePreviewSession.id === activeSessionId && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px]">
                          CURRENTLY ENGAGED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-3">
                      <span>Created: {new Date(activePreviewSession.createdAt).toLocaleString()}</span>
                      <span>Total Exchanges: {(activePreviewSession.messages || []).length}</span>
                    </div>
                  </div>

                  {/* Switch to this chat button */}
                  <button
                    onClick={() => {
                      onSelectSession(activePreviewSession.id);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isWorkspaceSession(activePreviewSession.id)
                        ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                        : activePreviewSession.id === activeSessionId
                          ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-950"
                          : "bg-gradient-to-r from-blue-600 to-cyan-500 text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,243,255,0.3)]"
                    }`}
                  >
                    <span>
                      {isWorkspaceSession(activePreviewSession.id)
                        ? "OPEN IN CHAT WORKSPACE"
                        : activePreviewSession.id === activeSessionId ? "RESUME CHAT" : "LOAD THIS CHAT"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preview Transcript Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#01050e]">
                  {(!activePreviewSession.messages || activePreviewSession.messages.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                      <MessageSquare className="w-8 h-8 text-gray-600 mb-2" />
                      <div>No messages in this chat session yet.</div>
                    </div>
                  ) : (
                    activePreviewSession.messages.map((m, idx) => {
                      const isUser = m.role === "user";
                      return (
                        <div
                          key={m.id ? `${m.id}-${idx}` : `preview-msg-${idx}`}
                          className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                              <Cpu className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs border ${
                              isUser
                                ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-100 rounded-tr-none"
                                : "bg-[#041021] border-[var(--theme-primary)]/20 text-[#d8f4ff] rounded-tl-none"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1 text-[9px] opacity-60">
                              <span className="font-bold">{isUser ? "OPERATOR" : "J.A.R.V.I.S."}</span>
                              {m.timestamp && <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                            </div>
                            <SmartChatContent
                              content={m.text || ""}
                              isUser={isUser}
                              variant={isUser ? "user" : "model"}
                              className="text-xs leading-relaxed"
                            />
                          </div>

                          {isUser && (
                            <div className="w-6 h-6 rounded-md bg-blue-950 border border-blue-500/40 text-blue-300 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6">
                <History className="w-12 h-12 text-gray-700 mb-3" />
                <div className="text-sm font-semibold text-gray-400">Select a memory session to inspect transcript</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
