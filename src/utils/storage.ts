import localforage from "localforage";

localforage.config({
  name: "JarvisMemoryMatrix",
  storeName: "jarvis_vault"
});

// A separate isolated store specifically for the Master Key so it isn't wiped if localStorage clears
const keyVault = localforage.createInstance({
  name: "JarvisSecurityVault",
  storeName: "crypto_keys"
});

// --- MILITARY-GRADE ENCRYPTION LAYER ---
// Generates or retrieves a persistent master key safely
const getMasterKey = async (): Promise<CryptoKey> => {
  let rawKey = await keyVault.getItem<string>("jarvis_vault_master_key");
  
  // Fallback: If it's still in localStorage from the previous version, migrate it securely.
  if (!rawKey) {
    const legacyKey = localStorage.getItem("jarvis_vault_master_key");
    if (legacyKey) {
      rawKey = legacyKey;
      await keyVault.setItem("jarvis_vault_master_key", rawKey);
      localStorage.removeItem("jarvis_vault_master_key");
    }
  }

  if (rawKey) {
    const keyData = Uint8Array.from(atob(rawKey), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      "raw", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
    );
  }
  
  const newKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", newKey);
  const base64Key = btoa(String.fromCharCode.apply(null, new Uint8Array(exported) as unknown as number[]));
  
  // Save securely to isolated IndexedDB vault
  await keyVault.setItem("jarvis_vault_master_key", base64Key);
  
  return await crypto.subtle.importKey(
    "raw", exported, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
  );
};

// Helper function to safely convert ArrayBuffer to Base64 without call stack overflow for large files
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192; // Process in chunks to avoid stack overflow
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as unknown as number[]);
  }
  return btoa(binary);
};

const encryptData = async (data: any): Promise<{ cipher: string; iv: string }> => {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, encoded
  );
  
  return {
    cipher: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer)
  };
};

const decryptData = async (encryptedObj: { cipher: string; iv: string }): Promise<any> => {
  const key = await getMasterKey();
  const ivStr = atob(encryptedObj.iv);
  const iv = new Uint8Array(ivStr.length);
  for (let i = 0; i < ivStr.length; i++) {
    iv[i] = ivStr.charCodeAt(i);
  }
  
  const cipherStr = atob(encryptedObj.cipher);
  const cipherData = new Uint8Array(cipherStr.length);
  for (let i = 0; i < cipherStr.length; i++) {
    cipherData[i] = cipherStr.charCodeAt(i);
  }
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, cipherData
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
};
// ---------------------------------------

export const indexedStorage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const encryptedItem = await localforage.getItem<{ cipher: string; iv: string }>(key);
      if (encryptedItem && encryptedItem.cipher && encryptedItem.iv) {
        return await decryptData(encryptedItem);
      }
      return fallback;
    } catch {
      return fallback;
    }
  },
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const encrypted = await encryptData(value);
      await localforage.setItem(key, encrypted);
      return true;
    } catch (e) {
      console.error("Encryption/storage failed:", e);
      return false;
    }
  },
  async remove(key: string): Promise<boolean> {
    try {
      await localforage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  async clear(): Promise<boolean> {
    try {
      await localforage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err: unknown) {
      if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.code === 22)) {
        try {
          const rawHistory = localStorage.getItem("jarvis_chat_history");
          if (rawHistory) {
            const parsed = JSON.parse(rawHistory);
            if (Array.isArray(parsed)) {
              const pruned = parsed.slice(-15).map((msg: any) => ({
                ...msg,
                imageUrl: msg.imageUrl?.startsWith("data:") ? undefined : msg.imageUrl,
              }));
              localStorage.setItem("jarvis_chat_history", JSON.stringify(pruned));
              localStorage.setItem(key, JSON.stringify(value));
              return true;
            }
          }
        } catch {
          return false;
        }
      }
      return false;
    }
  }
};

export function safeStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("Storage quota exceeded for key:", key);
  }
}

// --- DEEP STORAGE ARCHIVE & COMPRESSION UTILITY ---
export const archiveVault = localforage.createInstance({
  name: "JarvisMemoryMatrix",
  storeName: "jarvis_deep_archive"
});

export async function compressAndArchiveChatSessions(sessions: any[]): Promise<any[]> {
  if (!Array.isArray(sessions) || sessions.length <= 8) {
    return sessions;
  }
  
  // Sort by updatedAt or timestamp descending
  const sorted = [...sessions].sort((a, b) => (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0));
  
  const activeSessions = sorted.slice(0, 8);
  const archiveSessions = sorted.slice(8);
  
  // Save older sessions to deep archive store asynchronously
  if (archiveSessions.length > 0) {
    try {
      const existingArchive = await archiveVault.getItem<any[]>("archived_sessions") || [];
      const combinedArchive = [...archiveSessions, ...existingArchive].slice(0, 40); // cap archive at 40 sessions
      await archiveVault.setItem("archived_sessions", combinedArchive);
    } catch (e) {
      console.warn("Deep archive write failed:", e);
    }
  }
  
  // Clean active sessions (strip bulky base64 images older than last 3 messages)
  return activeSessions.map(session => ({
    ...session,
    messages: (session.messages || []).map((msg: any, idx: number, arr: any[]) => {
      if (idx < arr.length - 3 && msg.image && typeof msg.image === 'string' && msg.image.length > 15000) {
        return {
          ...msg,
          image: undefined,
          text: (msg.text || "") + "\n[Image purged for storage efficiency]"
        };
      }
      return msg;
    })
  }));
}

