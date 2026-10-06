/**
 * J.A.R.V.I.S. Sovereign File & Book Download Engine
 * Triggers authentic device-level downloads into the user's Downloads folder,
 * bypassing CORS and cross-origin restrictions via the backend stream proxy.
 */

export interface DownloadResult {
  success: boolean;
  filename: string;
  url: string;
  error?: string;
}

/**
 * Normalizes and extracts a clean, human-readable filename with appropriate extension.
 */
export function extractCleanFilename(rawUrl: string, fallbackName = "download"): string {
  try {
    const urlObj = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const pathnameParts = urlObj.pathname.split("/").filter(Boolean);
    const lastPart = pathnameParts.pop();
    if (lastPart && lastPart.includes(".")) {
      return decodeURIComponent(lastPart.split("?")[0]);
    }
  } catch {}

  const extMatch = rawUrl.match(/\.(pdf|epub|mobi|docx?|xlsx?|pptx?|txt|zip|rar|7z|mp4|mp3|mkv|wav|jpg|jpeg|png|webp|apk|exe)(?:\?|$)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
  const cleanBase = fallbackName.replace(/[^a-zA-Z0-9_\-\u0B80-\u0BFF]/g, "_").trim() || "document";
  return cleanBase.endsWith(`.${ext}`) ? cleanBase : `${cleanBase}.${ext}`;
}

/**
 * Initiates an authentic device-level file download into the user's Downloads folder.
 */
export async function downloadFileToDevice(
  targetUrl: string,
  preferredFilename?: string
): Promise<DownloadResult> {
  if (!targetUrl) {
    return { success: false, filename: "", url: "", error: "No URL provided" };
  }

  const cleanUrl = targetUrl.trim();
  const filename = preferredFilename 
    ? preferredFilename.trim() 
    : extractCleanFilename(cleanUrl);

  try {
    // 1. Direct blob: or data: URIs (e.g. locally synthesized PDFs, canvas, or audio)
    if (cleanUrl.startsWith("blob:") || cleanUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = cleanUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.dispatchEvent(
        new CustomEvent("jarvis-file-downloaded", {
          detail: { url: cleanUrl, filename, success: true }
        })
      );
      return { success: true, filename, url: cleanUrl };
    }

    // 2. Remote URLs:
    // Route through backend proxy /api/download-proxy to enforce:
    // Content-Disposition: attachment; filename="..."
    // This bypasses CORS and cross-origin security restrictions completely,
    // ensuring Chrome/Firefox/Safari immediately saves the file to Downloads!
    const proxyDownloadUrl = `/api/download-proxy?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(filename)}`;

    const a = document.createElement("a");
    a.href = proxyDownloadUrl;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1500);

    window.dispatchEvent(
      new CustomEvent("jarvis-file-downloaded", {
        detail: { url: cleanUrl, filename, success: true }
      })
    );

    return { success: true, filename, url: cleanUrl };
  } catch (err: any) {
    console.error("downloadFileToDevice failure:", err);
    return {
      success: false,
      filename,
      url: cleanUrl,
      error: err?.message || "Download initiation failed"
    };
  }
}
