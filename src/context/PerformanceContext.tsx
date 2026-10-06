import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type PerformanceMode = 'ULTRA' | 'BALANCED' | 'ECO';

interface PerformanceContextType {
  mode: PerformanceMode;
  setMode: (mode: PerformanceMode) => void;
  cyclePerformanceMode: () => PerformanceMode;
  fps: number;
  powerSave: boolean;
  setPowerSave: (enabled: boolean) => void;
  dataSave: boolean;
  setDataSave: (enabled: boolean) => void;
  isLowEnd: boolean;
  isUltra: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  mode: 'BALANCED',
  setMode: () => {},
  cyclePerformanceMode: () => 'BALANCED',
  fps: 60,
  powerSave: false,
  setPowerSave: () => {},
  dataSave: false,
  setDataSave: () => {},
  isLowEnd: false,
  isUltra: false,
});

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved preference: 'ULTRA' (120fps), 'BALANCED' (60fps), or 'ECO' (30fps)
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMode = localStorage.getItem("jarvis_perf_mode");
        if (savedMode === 'ULTRA' || savedMode === 'BALANCED' || savedMode === 'ECO') {
          return savedMode;
        }
        const savedPowerSave = localStorage.getItem("jarvis_power_save");
        if (savedPowerSave === "true") return 'ECO';
      } catch (e) {
        console.warn("Could not read initial perf mode from localStorage:", e);
      }
    }
    return 'BALANCED';
  });

  const [dataSave, setDataSave] = useState(false);

  const fps = mode === 'ULTRA' ? 120 : mode === 'BALANCED' ? 60 : 30;
  const powerSave = mode === 'ECO';
  const isLowEnd = mode === 'ECO';
  const isUltra = mode === 'ULTRA';

  // Synchronous ref to prevent stale closures during rapid toggle
  const modeRef = React.useRef<PerformanceMode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const setMode = useCallback((newMode: PerformanceMode) => {
    modeRef.current = newMode;
    setModeState(newMode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jarvis_perf_mode", newMode);
        localStorage.setItem("jarvis_power_save", String(newMode === 'ECO'));
      } catch (e) {
        console.warn("Could not save perf mode to localStorage:", e);
      }
      const newFps = newMode === 'ULTRA' ? 120 : newMode === 'BALANCED' ? 60 : 30;
      window.dispatchEvent(new CustomEvent("jarvis-perf-changed", {
        detail: {
          mode: newMode,
          fps: newFps,
          label: newMode === 'ULTRA' ? 'ULTRA (120 FPS)' : newMode === 'BALANCED' ? 'PERFORMANCE (60 FPS)' : 'POWER SAVE (30 FPS)'
        }
      }));
    }
  }, []);

  const cyclePerformanceMode = useCallback((): PerformanceMode => {
    const current = modeRef.current;
    const nextMode: PerformanceMode = 
      current === 'BALANCED' ? 'ULTRA' : 
      current === 'ULTRA' ? 'ECO' : 'BALANCED';
    setMode(nextMode);
    return nextMode;
  }, [setMode]);

  const setPowerSave = useCallback((enabled: boolean) => {
    setMode(enabled ? 'ECO' : 'BALANCED');
  }, [setMode]);

  // Sync with localStorage when updated from another tab or window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "jarvis_perf_mode" && e.newValue) {
        if (e.newValue === 'ULTRA' || e.newValue === 'BALANCED' || e.newValue === 'ECO') {
          setModeState(e.newValue as PerformanceMode);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    // Only auto-detect if the user hasn't explicitly set a preference
    if (typeof window !== "undefined" && localStorage.getItem("jarvis_perf_mode") === null && localStorage.getItem("jarvis_power_save") === null) {
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as any).deviceMemory || 8;
      if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
        setMode('ECO');
      }
    }
  }, [setMode]);

  // Reflect performance & FPS attributes across document elements
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty('--target-fps', `${fps}`);
      document.body.setAttribute('data-target-fps', `${fps}`);
      document.body.setAttribute('data-perf-mode', mode);

      if (mode === 'ECO') {
        document.body.classList.add('power-save-mode');
        document.body.classList.remove('ultra-mode');
        document.body.classList.remove('balanced-mode');
      } else if (mode === 'ULTRA') {
        document.body.classList.remove('power-save-mode');
        document.body.classList.add('ultra-mode');
        document.body.classList.remove('balanced-mode');
      } else {
        document.body.classList.remove('power-save-mode');
        document.body.classList.remove('ultra-mode');
        document.body.classList.add('balanced-mode');
      }
    }
  }, [mode, fps]);

  const contextValue = useMemo(() => ({
    mode,
    setMode,
    cyclePerformanceMode,
    fps,
    powerSave,
    setPowerSave,
    dataSave,
    setDataSave,
    isLowEnd,
    isUltra
  }), [mode, setMode, cyclePerformanceMode, fps, powerSave, setPowerSave, dataSave, setDataSave, isLowEnd, isUltra]);

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => useContext(PerformanceContext);
