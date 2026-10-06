import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, Check } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopActiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  };

  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setCapturedImage(null);
      setError(null);
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user" } })
        .then((s) => {
          if (!isMounted) {
            s.getTracks().forEach((track) => {
              try { track.stop(); } catch {}
            });
            return;
          }
          streamRef.current = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError("HUD Optical Sensor (Camera) access denied or unavailable: " + err.message);
          }
        });
    } else {
      stopActiveCamera();
    }

    return () => {
      isMounted = false;
      stopActiveCamera();
    };
  }, [isOpen]);

  const handleSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-gray-950 border border-cyan-500/50 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        <div className="p-4 border-b border-cyan-900/50 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="font-hud text-sm text-cyan-200 tracking-wider">HUD OPTICAL SENSOR SCAN</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-cyan-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center justify-center bg-black relative min-h-[300px]">
          {error ? (
            <div className="p-4 text-center text-red-400 text-sm font-mono-code">
              {error}
            </div>
          ) : capturedImage ? (
            <div className="relative w-full aspect-video rounded border border-cyan-500/40 overflow-hidden">
              <img src={capturedImage} alt="Captured scan" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 text-[10px] font-hud bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/50">
                FRAME BUFFER CAPTURED
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded border border-cyan-500/40 overflow-hidden bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* HUD Targeting Reticle */}
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 m-6 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-cyan-400/60 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] font-mono-code text-cyan-400 bg-black/60 px-2 py-0.5 rounded">
                LIVE OPTICAL FEED // 1080P
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 border-t border-cyan-900/50 flex items-center justify-between bg-gray-900/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-hud text-gray-400 hover:text-white rounded border border-gray-800"
          >
            ABORT
          </button>

          <div className="flex gap-2">
            {capturedImage ? (
              <>
                <button
                  onClick={() => setCapturedImage(null)}
                  className="px-4 py-2 text-xs font-hud flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 rounded border border-yellow-800/60 bg-yellow-950/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> RETAKE
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-xs font-hud flex items-center gap-1.5 text-cyan-200 bg-cyan-600 hover:bg-cyan-500 rounded font-bold shadow-lg shadow-cyan-900/50"
                >
                  <Check className="w-3.5 h-3.5" /> TRANSMIT SCAN
                </button>
              </>
            ) : (
              <button
                onClick={handleSnap}
                disabled={!!error}
                className="px-5 py-2 text-xs font-hud flex items-center gap-2 text-cyan-950 bg-cyan-400 hover:bg-cyan-300 rounded font-bold transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" /> CAPTURE TARGET
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
