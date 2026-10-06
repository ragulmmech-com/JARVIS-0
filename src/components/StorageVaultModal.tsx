import React, { useState, useEffect } from "react";
import { 
  X, Database, HardDrive, Cpu, Download, Folder, RefreshCw, Zap, MessageSquare, Box
} from "lucide-react";
import { indexedStorage } from "../utils/storage";

interface StorageVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMemory: () => void;
  liveReactorCount: number;
  workspaceCount: number;
}

export const StorageVaultModal: React.FC<StorageVaultModalProps> = ({
  isOpen,
  onClose,
  onOpenMemory,
  liveReactorCount,
  workspaceCount
}) => {
  const [usage, setUsage] = useState<number>(0);
  const [quota, setQuota] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hologramCount, setHologramCount] = useState<number>(0);

  const fetchStorageInfo = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        setIsRefreshing(true);
        const estimate = await navigator.storage.estimate();
        setUsage(estimate.usage || 0);
        setQuota(estimate.quota || 0);

        const scans = await indexedStorage.get<any[]>("jarvis_holographic_scans", []);
        setHologramCount(scans ? scans.length : 0);
      } catch (e) {
        console.error("Failed to estimate storage", e);
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStorageInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
  
  // Simulated GB conversion for the Sci-Fi UI flair 
  // (Assuming quota gives total available browser local storage max in bytes)
  const quotaGB = (quota / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#020914]/95 border border-[var(--theme-primary)]/40 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden font-['JetBrains_Mono',monospace]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3.5 border-b border-[var(--theme-primary)]/20 bg-[#041224]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Orbitron',sans-serif] text-sm md:text-base font-black text-emerald-400 tracking-wider">
                STORAGE VAULT // INDEXED_DB
              </h2>
              <p className="text-gray-400 text-xs">Offline Multi-Gigabyte Memory Subsystem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Storage Meter */}
          <div className="bg-[#010610] p-5 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-gray-300">LOCAL VAULT CAPACITY</span>
              </div>
              <button onClick={fetchStorageInfo} className={`text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000"
                style={{ width: `${Math.max(0.5, usagePercent)}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span className="font-bold text-emerald-400">{formatBytes(usage)} Used</span>
              <span>{quotaGB} GB Max ({formatBytes(quota)})</span>
            </div>
          </div>

          {/* Sync Status / Info */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-blue-300 block mb-1">INDEXED_DB OFFLINE SYNC ACTIVE</strong>
              Memory limits upgraded from 5MB to {quotaGB}GB. Jarvis will now automatically synchronize all synaptic memory structures securely to your local device drive using LocalForage. No cloud internet required.
            </div>
          </div>

          {/* Linked Folders */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Synchronized Matrix Folders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div 
                onClick={() => { onClose(); onOpenMemory(); }}
                className="p-4 rounded-xl border border-cyan-900/40 bg-cyan-950/10 hover:bg-cyan-950/30 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-200">LIVE REACTOR</div>
                    <div className="text-[10px] text-gray-400">Data Stream & Notes</div>
                  </div>
                </div>
                <div className="text-xl font-black text-cyan-500/30 group-hover:text-cyan-400/80 transition-colors">
                  {liveReactorCount}
                </div>
              </div>

              <div 
                onClick={() => { onClose(); onOpenMemory(); }}
                className="p-4 rounded-xl border border-purple-900/40 bg-purple-950/10 hover:bg-purple-950/30 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-200">CHAT WORKSPACE</div>
                    <div className="text-[10px] text-gray-400">Sidebar Sessions</div>
                  </div>
                </div>
                <div className="text-xl font-black text-purple-500/30 group-hover:text-purple-400/80 transition-colors">
                  {workspaceCount}
                </div>
              </div>

              {/* 3D Holographic Models & Scans Folder */}
              <div 
                className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/10 flex items-center justify-between group col-span-1 sm:col-span-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-300">3D HOLOGRAPHIC SCANS // RECONSTRUCTIONS</div>
                    <div className="text-[10px] text-gray-400">Exterior Dimensions, Chassis & Internal Core X-Ray Blueprints</div>
                  </div>
                </div>
                <div className="text-xl font-black text-emerald-500/30 group-hover:text-emerald-400/80 transition-colors">
                  {hologramCount}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
