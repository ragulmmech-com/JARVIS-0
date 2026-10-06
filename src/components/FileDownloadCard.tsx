import React, { useState } from "react";
import { 
  Download, FileText, Check, ExternalLink, Copy, 
  FileCode, Music, Video, Image as ImageIcon, Archive, BookOpen, AlertCircle
} from "lucide-react";
import { downloadFileToDevice, extractCleanFilename } from "../lib/downloadManager";

export interface FileDownloadItem {
  url: string;
  filename?: string;
  title?: string;
  ext?: string;
  fileType?: "pdf" | "book" | "video" | "audio" | "image" | "archive" | "doc" | "other";
  size?: string;
}

interface FileDownloadCardProps {
  item: FileDownloadItem;
  className?: string;
  autoDownloadOnMount?: boolean;
}

export const FileDownloadCard: React.FC<FileDownloadCardProps> = ({
  item,
  className = "",
  autoDownloadOnMount = false
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanFilename = item.filename || extractCleanFilename(item.url, item.title || "document");
  const ext = (item.ext || cleanFilename.split(".").pop() || "FILE").toUpperCase();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setErrorMsg(null);
      const res = await downloadFileToDevice(item.url, cleanFilename);
      if (res.success) {
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 4000);
      } else {
        setErrorMsg(res.error || "Download failed");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  React.useEffect(() => {
    if (autoDownloadOnMount) {
      handleDownload();
    }
  }, [autoDownloadOnMount]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  // Determine Icon based on extension
  const renderIcon = () => {
    const lower = ext.toLowerCase();
    if (lower === "pdf") return <FileText className="w-5 h-5 text-red-400" />;
    if (["epub", "mobi", "azw3"].includes(lower)) return <BookOpen className="w-5 h-5 text-amber-400" />;
    if (["mp4", "mkv", "webm", "avi"].includes(lower)) return <Video className="w-5 h-5 text-purple-400" />;
    if (["mp3", "wav", "flac", "ogg"].includes(lower)) return <Music className="w-5 h-5 text-emerald-400" />;
    if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(lower)) return <ImageIcon className="w-5 h-5 text-sky-400" />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(lower)) return <Archive className="w-5 h-5 text-yellow-400" />;
    if (["doc", "docx", "txt", "rtf", "odt"].includes(lower)) return <FileText className="w-5 h-5 text-blue-400" />;
    return <FileCode className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div
      className={`my-3 p-3.5 sm:p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-[#031526]/95 via-[#061e38]/90 to-[#031221]/95 shadow-[0_0_20px_rgba(0,243,255,0.12)] transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: File Icon, Name, and Details */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/30 flex-shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
                {ext}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                நேரடி பதிவிறக்கம் (Direct File)
              </span>
            </div>
            <h4 
              className="text-sm font-semibold text-slate-100 truncate mt-0.5 tracking-wide max-w-[280px] sm:max-w-[420px]"
              title={cleanFilename}
            >
              {item.title || cleanFilename}
            </h4>
            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[260px] sm:max-w-[380px]">
              {item.url}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {/* Main Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all shadow-md select-none ${
              downloaded
                ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : downloading
                ? "bg-cyan-700/60 text-cyan-200 cursor-wait animate-pulse"
                : "bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] active:scale-95"
            }`}
            title="Download file directly into your device's Downloads folder"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>பதிவிறக்கப்பட்டது! (Saved)</span>
              </>
            ) : downloading ? (
              <>
                <Download className="w-4 h-4 animate-bounce" />
                <span>சேமிக்கப்படுகிறது...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>டவுன்லோட் செய் (Download)</span>
              </>
            )}
          </button>

          {/* Quick Open in New Tab */}
          <button
            type="button"
            onClick={handleOpen}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white transition-colors"
            title="Open in new window"
            aria-label="Open link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white transition-colors"
            title="Copy download URL"
            aria-label="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-mono">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
