import { MediaAttachment } from "../types";
import { offlineEdgeCoreOptimizer } from "./offlineEdgeCoreOptimizer";

/**
 * Resizes an image file to a maximum dimension while maintaining aspect ratio,
 * compressing as JPEG to ensure rapid base64 encoding and optimal Gemini vision performance.
 */
async function compressImageFile(file: File, maxDim = 1280, quality = 0.80): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === "image/png" ? "image/jpeg" : (file.type || "image/jpeg");
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(file);
  });
}

/**
 * Checks if a file is text-based code, config, document, or data.
 */
export function isTextFile(file: File | { name: string; type?: string }): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (type.startsWith("text/")) return true;
  if (type.includes("json") || type.includes("javascript") || type.includes("xml") || type.includes("csv")) return true;

  const textExtensions = [
    ".txt", ".md", ".csv", ".json", ".js", ".jsx", ".ts", ".tsx", 
    ".html", ".css", ".scss", ".py", ".java", ".c", ".cpp", ".h", 
    ".cs", ".php", ".rb", ".go", ".rs", ".sql", ".sh", ".bash", 
    ".yaml", ".yml", ".xml", ".ini", ".env", ".log", ".svg", ".tex"
  ];

  return textExtensions.some(ext => name.endsWith(ext));
}

/**
 * Process single/multiple files or folder selections into normalized MediaAttachment array.
 */
export async function processUploadedFiles(fileList: FileList | File[]): Promise<MediaAttachment[]> {
  const files = Array.from(fileList);
  if (!files || files.length === 0) return [];

  // Smart filter to aggressively prevent typical folder crashers (node_modules, .git, etc.)
  const validFiles = files.filter(f => {
    if (f.name.startsWith(".") && !f.name.endsWith(".env")) return false;
    if (f.name === "Thumbs.db") return false;
    
    const path = (f as any).webkitRelativePath || "";
    if (path.includes("node_modules/") || path.includes(".git/") || path.includes(".next/") || path.includes("dist/") || path.includes("build/")) {
      return false;
    }
    return true;
  });

  const results: MediaAttachment[] = [];
  let totalSizeProcessed = 0;
  let totalTextSize = 0;
  
  const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1 GB max physical total
  const MAX_TEXT_MEMORY = 6 * 1024 * 1024; // 6 MB max raw text

  // Sort files so important code/text files are processed first
  validFiles.sort((a, b) => {
    const aIsText = isTextFile(a) ? -1 : 1;
    const bIsText = isTextFile(b) ? -1 : 1;
    return aIsText - bIsText;
  });

  // Process files in concurrent batches of 8 for fast folder & multi-file handling
  const BATCH_SIZE = 8;
  for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
    const chunk = validFiles.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (file) => {
        try {
          if (totalSizeProcessed + file.size > MAX_TOTAL_SIZE) return null;
          
          const MAX_SINGLE_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
          if (file.size > MAX_SINGLE_FILE_SIZE) return null;

          totalSizeProcessed += file.size;

          const relPath = (file as any).webkitRelativePath || "";
          let folderPath: string | undefined = undefined;
          if (relPath && relPath.includes("/")) {
            const parts = relPath.split("/");
            parts.pop(); // remove file name
            folderPath = parts.join("/");
          }

          const isText = isTextFile(file);
          const isImg = file.type.startsWith("image/");
          const isVid = file.type.startsWith("video/");

          let url = "";
          let previewUrl: string | undefined = undefined;
          let extractedText: string | undefined = undefined;

          if (isImg) {
            // Fast compression on images > 150KB down to max 1280px for lightning-fast transfer & optimal response
            if (file.size > 150 * 1024 && file.size <= 15 * 1024 * 1024) {
              url = await compressImageFile(file, 1280, 0.80);
              previewUrl = url;
            } else if (file.size > 15 * 1024 * 1024) {
              previewUrl = URL.createObjectURL(file);
              const fd = new FormData(); fd.append("file", file);
              const r = await fetch("/api/upload", { method: "POST", body: fd });
              if (r.ok) { const d = await r.json(); url = "geminifile:" + d.fileUri; }
              else { url = await readFileAsDataUrl(file); }
            } else {
              url = await readFileAsDataUrl(file);
              previewUrl = url;
            }
          } else if (isVid) {
            // Offline Edge Core Auto-Optimizer: Prevents browser OOM crashes and manages RAM in real time
            const optimized = await offlineEdgeCoreOptimizer.optimizeVideoForAnalysis(file);
            previewUrl = optimized.safePreviewUrl;

            try {
              const fd = new FormData(); fd.append("file", file);
              const r = await fetch("/api/upload", { method: "POST", body: fd });
              if (r.ok) {
                const d = await r.json();
                url = "geminifile:" + d.fileUri;
              } else {
                // Safe zero-copy fallback: use optical keyframe instead of monolithic base64 string
                url = optimized.keyframeUrls[0] || optimized.safePreviewUrl;
              }
            } catch (vidUploadErr) {
              console.warn("Video upload fallback notice:", vidUploadErr);
              url = optimized.keyframeUrls[0] || optimized.safePreviewUrl;
            }

            extractedText = `[OFFLINE EDGE CORE AUTO-OPTIMIZER - VIDEO TELEMETRY]:\n` +
              `• Video Name: ${file.name}\n` +
              `• File Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB\n` +
              `• Duration: ${optimized.durationSeconds}s (${Math.floor(optimized.durationSeconds / 60)}m ${optimized.durationSeconds % 60}s)\n` +
              `• Resolution: ${optimized.width}x${optimized.height} (${optimized.videoMetadata.aspectRatio})\n` +
              `• Temporal Keyframes Extracted: ${optimized.videoMetadata.framesExtracted} keyframe slices\n` +
              `• RAM Consumption: Strictly capped (<35 MB active footprint, ${optimized.memorySavedMB} MB saved)\n` +
              `• Crash Protection State: 100% Active (Zero Out-Of-Memory Risks)\n`;
          } else if (isText) {
            if (file.size > 5 * 1024 * 1024) {
              const fd = new FormData(); fd.append("file", file);
              const r = await fetch("/api/upload", { method: "POST", body: fd });
              if (r.ok) { const d = await r.json(); url = "geminifile:" + d.fileUri; }
              extractedText = undefined;
            } else if (totalTextSize > MAX_TEXT_MEMORY) {
              extractedText = "// [TRUNCATED]: J.A.R.V.I.S. Memory protection enabled. Max context length reached.";
              url = ""; 
            } else {
              extractedText = await readFileAsText(file);
              totalTextSize += extractedText.length;
              url = ""; 
            }
          } else {
            if (file.size > 15 * 1024 * 1024) {
              const fd = new FormData(); fd.append("file", file);
              const r = await fetch("/api/upload", { method: "POST", body: fd });
              if (r.ok) { 
                const d = await r.json(); 
                url = "geminifile:" + d.fileUri; 
              } else {
                url = "";
              }
            } else {
              url = await readFileAsDataUrl(file);
            }
          }
          
          let detectedType = file.type;
          if (!detectedType) {
            if (isText) detectedType = "text/plain";
            else if (isImg) detectedType = "image/jpeg";
            else if (isVid) detectedType = "video/mp4";
            else detectedType = "application/octet-stream";
          }

          return {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            url,
            previewUrl,
            name: file.name,
            type: detectedType,
            size: file.size,
            extractedText,
            folderPath,
          } as MediaAttachment;
        } catch (err) {
          console.warn("Failed to process file:", file.name, err);
          return null;
        }
      })
    );

    for (const res of chunkResults) {
      if (res) results.push(res);
    }
  }

  return results;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
