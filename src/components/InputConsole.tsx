import React, { useRef, useEffect, useState, useCallback } from "react";

interface InputConsoleProps {
  onSend: (message: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

export const InputConsole: React.FC<InputConsoleProps> = ({
  onSend,
  isListening,
  setIsListening,
}) => {
  const [input, setInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true); // ERROR 1C Guard

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCamera();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // BUG 3C: Reset height cleanly on input changes
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  }, [input]);

  // BUG 5A: Halts all video tracks on tab change or stream unmount
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (isMountedRef.current) setIsCameraActive(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (isMountedRef.current) setIsCameraActive(true);
    } catch {
      stopCamera();
    }
  };

  // ERROR 4B: Graceful mic permission denial handling
  const toggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        if (isMountedRef.current) setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && isMountedRef.current) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        if (isMountedRef.current) setIsListening(false);
      };

      recognition.onend = () => {
        if (isMountedRef.current) setIsListening(false);
      };

      recognition.start();
    } catch {
      if (isMountedRef.current) setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 flex flex-col gap-2 z-30">
      {isCameraActive && (
        <div className="relative w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-cyan-500/40 bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-600 text-white rounded"
          >
            Close
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <button
          type="button"
          onClick={isCameraActive ? stopCamera : startCamera}
          className="p-2 text-cyan-400 hover:text-cyan-300"
          title="Toggle Camera"
        >
          📷
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Initiate message or query..."
          className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 resize-none outline-none max-h-44 text-sm md:text-base py-1.5 px-2"
        />
        <button
          type="button"
          disabled={!input.trim()}
          onClick={() => {
            if (!input.trim()) return;
            onSend(input.trim());
            setInput("");
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white text-sm font-semibold rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)] transition"
        >
          Engage
        </button>
      </div>
    </div>
  );
};
