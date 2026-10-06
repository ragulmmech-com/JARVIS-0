import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Check,
  Sparkles,
  Boxes,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Cpu,
  Code2,
  Type,
  Plus,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Mic,
} from "lucide-react";
import {
  UNIVERSAL_FORMATS,
  CATEGORY_INFO,
  FormatCategory,
  FormatDefinition,
  searchFormats,
  getFormatByExtension,
} from "../lib/formatRegistry";

interface FormatPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormat: string;
  onSelectFormat: (formatExt: string) => void;
  title?: string;
  subtitle?: string;
  mode?: "from" | "to";
}

export const FormatPickerModal: React.FC<FormatPickerModalProps> = ({
  isOpen,
  onClose,
  selectedFormat,
  onSelectFormat,
  title = "Select File Format",
  subtitle = "Choose from 250+ standard CAD, Document, Image, Audio, Video, Archive & Executable formats",
  mode = "to",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customExtInput, setCustomExtInput] = useState("");
  const formatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleVoiceScroll = (e: any) => {
      const direction = e.detail?.direction;
      const amount = e.detail?.amount || 360;
      if (!formatScrollRef.current) return;
      if (direction === "down") {
        formatScrollRef.current.scrollBy({ top: amount, behavior: "smooth" });
      } else if (direction === "up") {
        formatScrollRef.current.scrollBy({ top: -amount, behavior: "smooth" });
      } else if (direction === "bottom") {
        formatScrollRef.current.scrollTo({ top: formatScrollRef.current.scrollHeight, behavior: "smooth" });
      } else if (direction === "top") {
        formatScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("jarvis-scroll", handleVoiceScroll);
    return () => window.removeEventListener("jarvis-scroll", handleVoiceScroll);
  }, [isOpen]);

  const filteredFormats = useMemo(() => {
    return searchFormats(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const handleSelect = (ext: string) => {
    onSelectFormat(ext.toLowerCase().replace(/^\./, ""));
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExtInput.trim()) return;
    handleSelect(customExtInput.trim());
  };

  const getCategoryIcon = (cat: FormatCategory) => {
    switch (cat) {
      case "cad":
        return <Boxes className="w-3.5 h-3.5" />;
      case "document":
        return <FileText className="w-3.5 h-3.5" />;
      case "spreadsheet":
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case "presentation":
        return <Presentation className="w-3.5 h-3.5" />;
      case "image":
        return <ImageIcon className="w-3.5 h-3.5" />;
      case "audio":
        return <Music className="w-3.5 h-3.5" />;
      case "video":
        return <Video className="w-3.5 h-3.5" />;
      case "archive":
        return <Archive className="w-3.5 h-3.5" />;
      case "executable":
        return <Cpu className="w-3.5 h-3.5" />;
      case "code":
        return <Code2 className="w-3.5 h-3.5" />;
      case "font":
        return <Type className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-4xl h-[90vh] max-h-[820px] bg-[#030914] border border-[var(--theme-primary)]/35 rounded-2xl shadow-[0_0_60px_rgba(0,243,255,0.25)] flex flex-col overflow-hidden text-gray-200">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 bg-[#061426] border-b border-[var(--theme-primary)]/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/40 flex items-center justify-center text-[var(--theme-primary)] shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <Boxes className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-['Orbitron',sans-serif] tracking-wider text-white">
                  {title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/40 text-[var(--theme-primary)] font-bold">
                  {mode === "from" ? "SOURCE FORMAT" : "TARGET FORMAT"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold">
                  {UNIVERSAL_FORMATS.length}+ FORMATS
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= SEARCH & CUSTOM EXTENSION BAR ================= */}
        <div className="p-3 sm:p-4 bg-[#040d1c] border-b border-[var(--theme-primary)]/15 flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-primary)]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by format or extension (e.g. step, iges, sldprt, stl, docx, pdf, mp4, apk, exe)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#020712] border border-[var(--theme-primary)]/30 rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[var(--theme-primary)] shadow-inner transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Custom Any-Format Input Form */}
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="text"
                value={customExtInput}
                onChange={(e) => setCustomExtInput(e.target.value)}
                placeholder="Custom ext (e.g. step)..."
                className="w-full sm:w-36 px-3 py-2.5 bg-[#020712] border border-amber-500/40 rounded-xl text-xs font-mono text-amber-300 placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-3 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 flex-shrink-0 transition-colors"
                title="Use custom extension"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>USE</span>
              </button>
            </form>
          </div>

          {/* ================= CATEGORY TABS ================= */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === "all"
                  ? "bg-[var(--theme-primary)] text-black shadow-[0_0_12px_rgba(0,243,255,0.4)]"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ALL ({UNIVERSAL_FORMATS.length})</span>
            </button>

            {Object.entries(CATEGORY_INFO).map(([key, cat]) => {
              const count = UNIVERSAL_FORMATS.filter((f) => f.category === key).length;
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/40 shadow-sm"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                  }`}
                >
                  {getCategoryIcon(key as FormatCategory)}
                  <span>
                    {cat.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= FORMAT CARDS GRID ================= */}
        <div 
          ref={formatScrollRef}
          data-scroll-container="format-picker"
          className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin scrollbar-thumb-gray-800 relative"
        >
          {filteredFormats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <Boxes className="w-12 h-12 text-gray-600 mb-3" />
              <p className="font-bold text-gray-300">No formats found matching "{searchQuery}"</p>
              <p className="text-xs font-mono text-gray-500 mt-1">
                You can still type your custom extension above and click "USE" to convert to that exact format.
              </p>
              {searchQuery && (
                <button
                  onClick={() => handleSelect(searchQuery)}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono tracking-wider flex items-center gap-2 hover:bg-amber-500/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Convert to custom format: .{searchQuery.toLowerCase()}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredFormats.map((format) => {
                const isSelected = selectedFormat.toLowerCase() === format.ext.toLowerCase();
                const catInfo = CATEGORY_INFO[format.category];

                return (
                  <button
                    key={`${format.category}-${format.ext}`}
                    onClick={() => handleSelect(format.ext)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all group ${
                      isSelected
                        ? "bg-[var(--theme-primary)]/15 border-[var(--theme-primary)] text-white shadow-[0_0_20px_rgba(0,243,255,0.15)] ring-1 ring-[var(--theme-primary)]"
                        : "bg-[#051122]/70 hover:bg-[#07172e] border-white/5 hover:border-[var(--theme-primary)]/40 text-gray-300 hover:text-white"
                    }`}
                  >
                    {/* Format Badge */}
                    <div
                      className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 font-mono font-black text-xs border transition-all ${
                        isSelected
                          ? "bg-[var(--theme-primary)] text-black border-[var(--theme-primary)] font-extrabold shadow-sm"
                          : "bg-[#030914] text-[var(--theme-primary)] border-[var(--theme-primary)]/30 group-hover:border-[var(--theme-primary)]/60"
                      }`}
                    >
                      <span className="text-[11px] leading-tight font-black uppercase">
                        .{format.ext.slice(0, 4)}
                      </span>
                    </div>

                    {/* Format Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate text-white group-hover:text-[var(--theme-primary)] transition-colors">
                          {format.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-black flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400">
                          {catInfo?.label || format.categoryLabel}
                        </span>
                        {format.popular && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                            POPULAR
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-gray-500 truncate mt-1 group-hover:text-gray-400 transition-colors">
                        {format.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Floating Scroll Controls & Voice Indicator */}
          <div className="sticky bottom-2 right-2 flex items-center justify-between gap-2 p-1.5 rounded-xl bg-black/90 backdrop-blur-md border border-[var(--theme-primary)]/40 shadow-2xl mt-4 self-end z-20">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--theme-primary)]/10 text-[10px] text-[var(--theme-primary)] font-mono font-bold">
              <Mic className="w-3 h-3 text-[var(--theme-primary)] animate-pulse" />
              <span>Voice: "ஸ்க்ரோல் பண்ணு" (Scroll Down) / "மேல ஸ்க்ரோல்" (Scroll Up)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => formatScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
                title="Scroll to Top (தொடக்கத்திற்கு)"
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatScrollRef.current?.scrollBy({ top: -320, behavior: "smooth" })}
                className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
                title="Scroll Up (மேலே)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatScrollRef.current?.scrollBy({ top: 320, behavior: "smooth" })}
                className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
                title="Scroll Down (கீழே)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatScrollRef.current?.scrollTo({ top: formatScrollRef.current?.scrollHeight || 10000, behavior: "smooth" })}
                className="p-1 rounded-lg bg-white/5 hover:bg-[var(--theme-primary)] text-gray-300 hover:text-black transition-all"
                title="Scroll to Bottom (கடைசி வரைக்கும்)"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-3 sm:p-4 bg-[#040d1a] border-t border-[var(--theme-primary)]/20 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Selected format:</span>
            <span className="px-2.5 py-0.5 rounded bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/40 text-[var(--theme-primary)] font-bold">
              .{selectedFormat.toUpperCase()} ({getFormatByExtension(selectedFormat).name})
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
