import React, { useState } from "react";
import { ExternalLink, Copy, Check, Globe, Download } from "lucide-react";
import { downloadFileToDevice } from "../lib/downloadManager";

interface InbuiltSmartLinkProps {
  href: string;
  children?: React.ReactNode;
  variant?: "user" | "model" | "tactical";
}

export const InbuiltSmartLink: React.FC<InbuiltSmartLinkProps> = ({
  href,
  children,
  variant = "model"
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Normalize URL (e.g. www.google.com -> https://www.google.com)
  const normalizedHref = React.useMemo(() => {
    if (!href) return "#";
    const trimmed = href.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    if (/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }, [href]);

  // Check if this link points to a downloadable file or download option
  const isDownloadable = React.useMemo(() => {
    if (!normalizedHref || normalizedHref === "#") return false;
    const textStr = typeof children === "string" ? children : "";
    return (
      /\.(pdf|epub|mobi|docx?|xlsx?|pptx?|txt|zip|rar|7z|mp4|mp3|mkv|wav|jpg|jpeg|png|webp|apk|exe)(\?|$)/i.test(normalizedHref) ||
      /(download|டவுன்லோட்|பதிவிறக்கம்|drive\.google\.com|mediafire)/i.test(normalizedHref + " " + textStr)
    );
  }, [normalizedHref, children]);

  // Determine human-readable label
  const displayText = React.useMemo(() => {
    if (children && typeof children === "string" && children.trim() !== "") {
      return children;
    }
    try {
      const urlObj = new URL(normalizedHref);
      return `${urlObj.hostname}${urlObj.pathname !== "/" ? urlObj.pathname.slice(0, 20) + (urlObj.pathname.length > 20 ? "…" : "") : ""}`;
    } catch {
      return href.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    }
  }, [children, normalizedHref, href]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(normalizedHref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = normalizedHref;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    });
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(normalizedHref, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      const fallbackName = typeof children === "string" ? children : undefined;
      const res = await downloadFileToDevice(normalizedHref, fallbackName);
      if (res.success) {
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }
    } finally {
      setDownloading(false);
    }
  };

  const isUserVariant = variant === "user";

  return (
    <span
      className={`inline-flex items-center align-middle gap-1.5 px-2 py-0.5 my-0.5 mx-1 rounded-lg border text-xs font-mono transition-all duration-200 group/smartlink select-none ${
        isUserVariant
          ? "bg-slate-800/90 border-slate-600/70 text-cyan-200 hover:border-cyan-400 hover:bg-slate-800"
          : isDownloadable
          ? "bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400/60 text-cyan-200 hover:border-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.2)]"
          : "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/70 shadow-[0_0_8px_rgba(0,243,255,0.12)]"
      }`}
      title={`Destination: ${normalizedHref}`}
    >
      {/* Globe / Download Icon */}
      {isDownloadable ? (
        <Download className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0 animate-pulse" />
      ) : (
        <Globe className={`w-3 h-3 flex-shrink-0 ${isUserVariant ? "text-slate-400" : "text-cyan-400"}`} />
      )}

      {/* Main Link Text (Clickable to open) */}
      <a
        href={normalizedHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="font-semibold underline decoration-dotted underline-offset-2 hover:decoration-solid hover:text-white truncate max-w-[180px] sm:max-w-[260px]"
      >
        {displayText}
      </a>

      {/* Inbuilt Action Options (Download, Copy & Open) */}
      <span className="flex items-center gap-1 pl-1 border-l border-white/15 flex-shrink-0">
        {/* Direct Download Button (For downloadable links) */}
        {isDownloadable && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={`p-1 px-1.5 rounded transition-colors flex items-center gap-1 text-[10px] font-bold ${
              downloaded
                ? "bg-emerald-900/90 text-emerald-300 border border-emerald-500/60"
                : downloading
                ? "bg-cyan-900/80 text-cyan-200 animate-pulse"
                : "bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 hover:text-white border border-cyan-400/40"
            }`}
            title="Download directly to your device folder"
            aria-label="Download File"
          >
            {downloaded ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px]">Saved</span>
              </>
            ) : downloading ? (
              <span className="text-[9px]">...</span>
            ) : (
              <>
                <Download className="w-3 h-3 text-cyan-300" />
                <span className="text-[9px]">Download</span>
              </>
            )}
          </button>
        )}

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`p-1 rounded transition-colors flex items-center gap-1 text-[10px] ${
            copied
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50"
              : isUserVariant
              ? "hover:bg-slate-700 text-slate-300 hover:text-white"
              : "hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-200"
          }`}
          title="Copy Link URL"
          aria-label="Copy Link"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="font-bold text-[9px] uppercase tracking-wider">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[9px] opacity-80 group-hover/smartlink:opacity-100 hidden sm:inline">Copy</span>
            </>
          )}
        </button>

        {/* Open Button */}
        <button
          type="button"
          onClick={handleOpen}
          className={`p-1 rounded transition-colors flex items-center gap-1 text-[10px] ${
            isUserVariant
              ? "hover:bg-slate-700 text-slate-300 hover:text-white"
              : "hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-200"
          }`}
          title="Open Link in New Window"
          aria-label="Open Link"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="text-[9px] opacity-80 group-hover/smartlink:opacity-100 hidden sm:inline">Open</span>
        </button>
      </span>
    </span>
  );
};
