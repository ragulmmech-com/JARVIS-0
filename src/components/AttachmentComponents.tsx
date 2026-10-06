import React, { useRef, useState, useEffect } from "react";
import { 
  Paperclip, 
  Folder, 
  FolderPlus, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  X, 
  Trash2, 
  Maximize, 
  Download, 
  Check, 
  ChevronRight,
  Layers,
  FileCode,
  Sparkles
} from "lucide-react";
import { MediaAttachment } from "../types";
import { processUploadedFiles, formatFileSize } from "../lib/mediaUpload";

interface AttachmentButtonProps {
  onFilesSelected: (attachments: MediaAttachment[]) => void;
  disabled?: boolean;
  className?: string;
  buttonSize?: "sm" | "md";
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFilesSelected,
  disabled = false,
  className = "",
  buttonSize = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFolderInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for voice-driven attachment upload triggers
  useEffect(() => {
    const handleVoiceTriggerFiles = () => {
      filesInputRef.current?.click();
    };
    const handleVoiceTriggerFolder = () => {
      folderInputRef.current?.click();
    };
    window.addEventListener("jarvis-trigger-upload-files", handleVoiceTriggerFiles);
    window.addEventListener("jarvis-trigger-upload-folder", handleVoiceTriggerFolder);
    return () => {
      window.removeEventListener("jarvis-trigger-upload-files", handleVoiceTriggerFiles);
      window.removeEventListener("jarvis-trigger-upload-folder", handleVoiceTriggerFolder);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setIsOpen(false);
    try {
      const processed = await processUploadedFiles(files);
      onFilesSelected(processed);
    } catch (err) {
      console.error("Error processing files:", err);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const btnPadding = buttonSize === "sm" ? "p-1.5" : "p-2";
  const iconSize = buttonSize === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="relative inline-flex items-center gap-1" ref={menuRef}>
      {/* Hidden File Inputs */}
      {/* 1. Multiple Files / Media Input */}
      <input
        id="jarvis-attachment-files-input"
        type="file"
        ref={filesInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.py,.ts,.js,.html,.css,.md,.*"
        className="hidden"
      />

      {/* 2. Folder Upload Input (Single Folder) */}
      <input
        id="jarvis-attachment-folder-input"
        type="file"
        ref={folderInputRef}
        onChange={handleFileChange}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        className="hidden"
      />

      {/* 3. Multiple Folders Upload Input */}
      <input
        type="file"
        ref={multiFolderInputRef}
        onChange={handleFileChange}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {/* Paperclip Button with Quick Popover */}
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={() => setIsOpen(!isOpen)}
        className={`${btnPadding} rounded-lg text-cyan-400/90 hover:text-cyan-200 hover:bg-cyan-500/10 transition-all border border-transparent hover:border-cyan-500/30 disabled:opacity-50 relative group ${className}`}
        title="Attach Multiple Media, Photos, Videos, or Whole Folders"
      >
        <Paperclip className={`${iconSize} ${isProcessing ? "animate-spin text-cyan-300" : ""}`} />
        {isProcessing && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        )}
      </button>

      {/* Direct Quick-Action Folder Upload Button */}
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={() => folderInputRef.current?.click()}
        className={`${btnPadding} rounded-lg text-amber-400/90 hover:text-amber-200 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/30 disabled:opacity-50 group`}
        title="Upload Folder (Upload all images & files inside a folder directly)"
      >
        <Folder className={iconSize} />
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#051326]/95 border border-cyan-500/40 rounded-xl shadow-[0_0_25px_rgba(0,243,255,0.25)] backdrop-blur-xl z-50 p-1.5 flex flex-col gap-1 text-xs font-['JetBrains_Mono',monospace] animate-fadeIn">
          <div className="px-2 py-1 text-[10px] text-cyan-400/70 border-b border-cyan-500/20 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>UPLINK ATTACHMENTS</span>
            <span className="text-[9px] text-cyan-300 bg-cyan-950/60 px-1 rounded">MULTI-FILE</span>
          </div>

          {/* Option 1: Multiple Photos/Videos/Files */}
          <button
            type="button"
            onClick={() => {
              filesInputRef.current?.click();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-cyan-200 hover:bg-cyan-500/20 hover:text-white transition-all text-left group"
          >
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[11px] text-cyan-100 flex items-center gap-1">
                Upload Files / Media
              </div>
              <div className="text-[10px] text-cyan-400/70 truncate">
                Select multiple photos, videos & docs
              </div>
            </div>
          </button>

          {/* Option 2: Upload Single Folder */}
          <button
            type="button"
            onClick={() => {
              folderInputRef.current?.click();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:text-white transition-all text-left group"
          >
            <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
              <Folder className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[11px] text-amber-100 flex items-center gap-1">
                Upload Entire Folder
              </div>
              <div className="text-[10px] text-amber-400/70 truncate">
                All photos & files inside folder
              </div>
            </div>
          </button>

          {/* Option 3: Multiple Folders Upload */}
          <button
            type="button"
            onClick={() => {
              multiFolderInputRef.current?.click();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-purple-200 hover:bg-purple-500/20 hover:text-white transition-all text-left group"
          >
            <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
              <FolderPlus className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[11px] text-purple-100 flex items-center gap-1">
                Upload Multiple Folders
              </div>
              <div className="text-[10px] text-purple-400/70 truncate">
                Batch ingest directory trees
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

interface AttachmentTrayProps {
  attachments: MediaAttachment[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({
  attachments,
  onRemove,
  onClearAll,
  className = "",
}) => {
  if (!attachments || attachments.length === 0) return null;

  const totalSize = attachments.reduce((sum, a) => sum + (a.size || 0), 0);
  const folders = Array.from(new Set(attachments.map(a => a.folderPath).filter(Boolean)));

  return (
    <div className={`flex flex-col gap-1.5 p-2 rounded-xl bg-[#030e1c]/95 border border-cyan-500/30 text-xs shadow-lg backdrop-blur-md ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1 text-[11px] text-cyan-300 font-['JetBrains_Mono',monospace]">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
            {attachments.length} {attachments.length === 1 ? "FILE" : "FILES"} READY
          </span>
          {folders.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30">
              <Folder className="w-3 h-3" />
              {folders.length} {folders.length === 1 ? `FOLDER (${folders[0]})` : `${folders.length} FOLDERS`}
            </span>
          )}
          {totalSize > 0 && (
            <span className="text-[10px] text-gray-400 font-mono">
              ({formatFileSize(totalSize)})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-0.5 rounded transition-colors"
          title="Clear all attached files"
        >
          <Trash2 className="w-3 h-3" />
          <span>CLEAR ALL</span>
        </button>
      </div>

      {/* Horizontal Scrollable Thumbnails / Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-cyan-500/30">
        {attachments.map((att) => {
          const isImg = att.type.startsWith("image/");
          const isVid = att.type.startsWith("video/");

          return (
            <div
              key={att.id}
              className="relative group flex-shrink-0 flex items-center gap-1.5 bg-[#08182b] border border-cyan-500/30 hover:border-cyan-400 rounded-lg p-1.5 pr-2 transition-all max-w-[200px]"
            >
              {/* Thumbnail or Icon */}
              {isImg ? (
                <div className="w-8 h-8 rounded bg-black/50 overflow-hidden flex-shrink-0 border border-cyan-500/20">
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                </div>
              ) : isVid ? (
                <div className="w-8 h-8 rounded bg-purple-950/60 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-300">
                  <Video className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-300">
                  {att.extractedText ? <FileCode className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
              )}

              {/* Title & Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] text-cyan-200 font-mono truncate" title={att.name}>
                  {att.name}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono">
                  {att.folderPath && (
                    <span className="text-amber-400 truncate max-w-[70px]" title={att.folderPath}>
                      📁 {att.folderPath}
                    </span>
                  )}
                  {att.size ? <span>{formatFileSize(att.size)}</span> : null}
                </div>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                className="w-4 h-4 rounded-full bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white flex items-center justify-center border border-red-500/40 text-[10px] ml-1 transition-all"
                title={`Remove ${att.name}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MessageAttachmentsGridProps {
  attachments?: MediaAttachment[];
  singleImage?: string;
  singleMediaType?: string;
  singleMediaName?: string;
  onZoomImage?: (url: string, name?: string) => void;
}

export const MessageAttachmentsGrid: React.FC<MessageAttachmentsGridProps> = ({
  attachments,
  singleImage,
  singleMediaType,
  singleMediaName,
  onZoomImage,
}) => {
  // Normalize items
  const items: MediaAttachment[] = attachments && attachments.length > 0 
    ? attachments 
    : singleImage 
    ? [{
        id: "single",
        url: singleImage,
        name: singleMediaName || "Media Attachment",
        type: singleMediaType === "video" ? "video/mp4" : "image/jpeg"
      }]
    : [];

  if (items.length === 0) return null;

  // Single Item View
  if (items.length === 1) {
    const item = items[0];
    const mediaSrc = item.previewUrl || item.url;
    const isVid = item.type.startsWith("video/") || item.type === "video" || item.url.startsWith("data:video/") || item.url.endsWith(".mp4") || item.url.includes(".mp4") || item.url.includes("type=video");
    const isImg = item.type.startsWith("image/") || item.url.startsWith("data:image/") || item.url.startsWith("http") || item.url.startsWith("/api/media-asset/");

    if (isVid) {
      return (
        <div className="max-w-xl w-full my-2 rounded-xl overflow-hidden border border-cyan-500/40 bg-black/95 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950/90 to-purple-950/80 border-b border-cyan-500/30 text-xs text-cyan-200">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold truncate max-w-[280px]">
              <Video className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
              {item.folderPath ? `📁 ${item.folderPath}/` : ""}{item.name || "Video Attachment"}
            </span>
            <div className="flex items-center gap-2">
              <a 
                href={mediaSrc} 
                download={item.name?.endsWith(".mp4") ? item.name : `${item.name || "JARVIS_VIDEO"}.mp4`}
                className="text-cyan-300 hover:text-white transition-colors text-[11px] font-mono flex items-center gap-1 bg-cyan-900/40 hover:bg-cyan-800/60 px-2 py-0.5 rounded border border-cyan-500/30"
              >
                <Download className="w-3 h-3" /> Save MP4
              </a>
            </div>
          </div>
          <video 
            src={mediaSrc} 
            controls 
            playsInline 
            className="w-full max-h-96 object-contain bg-black" 
          />
        </div>
      );
    }

    if (isImg) {
      return (
        <div className="max-w-md w-full my-2 rounded-xl overflow-hidden border border-cyan-500/40 bg-black/90 shadow-2xl group relative">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-b border-cyan-500/30 text-xs text-cyan-300">
            <span className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-[240px]">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              {item.folderPath ? `📁 ${item.folderPath}/` : ""}{item.name}
            </span>
            <div className="flex items-center gap-1.5">
              {onZoomImage && (
                <button
                  type="button"
                  onClick={() => onZoomImage(mediaSrc, item.name)}
                  className="text-cyan-300 hover:text-white text-[11px] flex items-center gap-1 bg-cyan-900/40 hover:bg-cyan-800/60 px-2 py-0.5 rounded border border-cyan-500/30"
                  title="Enlarge"
                >
                  <Maximize className="w-3 h-3" /> Zoom
                </button>
              )}
              <a 
                href={mediaSrc} 
                download={item.name || `JARVIS_IMG_${Date.now()}.png`} 
                className="text-cyan-300 hover:text-white text-[11px] flex items-center gap-1 bg-cyan-900/40 hover:bg-cyan-800/60 px-2 py-0.5 rounded border border-cyan-500/30"
                title="Download"
              >
                <Download className="w-3 h-3" /> Save
              </a>
            </div>
          </div>
          <div 
            className="relative cursor-pointer overflow-hidden"
            onClick={() => onZoomImage && onZoomImage(mediaSrc, item.name)}
          >
            <img src={mediaSrc} alt={item.name} className="w-full max-h-80 object-contain bg-black/80 group-hover:scale-[1.01] transition-transform duration-300" />
          </div>
        </div>
      );
    }

    // Document / Code / File
    return (
      <div className="my-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200 max-w-md">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-mono text-[11px] truncate">{item.folderPath ? `📁 ${item.folderPath}/` : ""}{item.name}</div>
            <div className="text-[9px] text-gray-400">{item.size ? formatFileSize(item.size) : "Attached Document"}</div>
          </div>
        </div>
        <a href={item.url} download={item.name} className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 text-[10px] font-mono">
          DOWNLOAD
        </a>
      </div>
    );
  }

  // Multiple Items Gallery Grid
  const folders = Array.from(new Set(items.map(i => i.folderPath).filter(Boolean)));

  return (
    <div className="my-2 w-full max-w-2xl flex flex-col gap-1.5 p-2 rounded-xl bg-black/60 border border-cyan-500/30 shadow-xl">
      {/* Gallery Header */}
      <div className="flex items-center justify-between px-1 text-[11px] text-cyan-300 font-mono border-b border-cyan-500/20 pb-1">
        <span className="flex items-center gap-1.5 font-bold">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          {items.length} ATTACHMENTS {folders.length > 0 ? `(FROM ${folders.length} ${folders.length === 1 ? 'FOLDER' : 'FOLDERS'})` : ""}
        </span>
        <span className="text-[10px] text-cyan-400/80">Click any image to enlarge</span>
      </div>

      {/* Grid */}
      <div className={`grid gap-2 ${items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
        {items.map((item) => {
          const mediaSrc = item.previewUrl || item.url;
          const isImg = item.type.startsWith("image/") || item.url.startsWith("data:image/") || item.url.startsWith("http");
          const isVid = item.type.startsWith("video/") || item.type === "video" || item.url.startsWith("data:video/") || item.url.endsWith(".mp4") || item.url.includes(".mp4") || item.url.includes("type=video");

          if (isImg) {
            return (
              <div 
                key={item.id}
                onClick={() => onZoomImage && onZoomImage(mediaSrc, item.name)}
                className="group relative rounded-lg overflow-hidden border border-cyan-500/30 bg-black/80 aspect-square cursor-pointer hover:border-cyan-400 transition-all shadow-md"
              >
                <img src={mediaSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                  <span className="text-[10px] font-mono text-cyan-200 truncate">{item.name}</span>
                  {item.folderPath && <span className="text-[8px] text-amber-400 truncate">📁 {item.folderPath}</span>}
                </div>
              </div>
            );
          }

          if (isVid) {
            return (
              <div 
                key={item.id}
                className="group relative rounded-lg overflow-hidden border border-purple-500/40 bg-black/80 aspect-square flex flex-col items-center justify-center p-2 text-center"
              >
                <video src={mediaSrc} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/40">
                  <Video className="w-6 h-6 text-purple-300 mb-1" />
                  <span className="text-[10px] font-mono text-purple-200 truncate max-w-full">{item.name}</span>
                  <a href={mediaSrc} download={item.name} className="mt-1 text-[9px] text-purple-300 underline">Save Video</a>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={item.id}
              className="rounded-lg border border-cyan-500/25 bg-[#051326] p-2 flex flex-col justify-between aspect-square text-cyan-200 font-mono text-[10px]"
            >
              <div className="flex items-center gap-1 text-cyan-400">
                <FileText className="w-4 h-4" />
                <span className="truncate">{item.name.split('.').pop()?.toUpperCase() || "FILE"}</span>
              </div>
              <div className="truncate font-semibold text-white my-1" title={item.name}>{item.name}</div>
              {item.folderPath && <div className="text-[8px] text-amber-400 truncate">📁 {item.folderPath}</div>}
              <a href={item.url} download={item.name} className="text-[9px] text-cyan-300 hover:text-white underline mt-auto">Download</a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
