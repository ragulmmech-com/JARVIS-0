import React, { useState } from "react";
import { 
  ShieldAlert, X, Copy, Check, Terminal, ExternalLink, 
  Cpu, FileCode, Play, AlertOctagon 
} from "lucide-react";
import { LOCAL_AGENT_PYTHON_SCRIPT } from "./LocalAgentScript";

interface LocalAgentGodModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAgentConnected: boolean;
}

export const LocalAgentGodModeModal: React.FC<LocalAgentGodModeModalProps> = ({
  isOpen,
  onClose,
  isAgentConnected,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(LOCAL_AGENT_PYTHON_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-gray-950 border border-cyan-500/50 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center bg-gradient-to-r from-gray-900 via-gray-900/90 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="font-hud text-sm text-cyan-200 tracking-wider">
                JARVIS GOD-MODE: WINDOWS PC INTEGRATION (LAYER B)
              </h2>
              <p className="text-[11px] font-tech text-gray-400">
                Grant JARVIS direct control over files, apps, games, and terminal execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded text-xs font-hud tracking-wider border ${
              isAgentConnected 
                ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                : "bg-orange-950/60 border-orange-500 text-orange-300 animate-pulse"
            }`}>
              {isAgentConnected ? "DAEMON LINKED (PORT 11424)" : "WAITING FOR LOCAL AGENT"}
            </span>

            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-tech text-sm text-gray-300">
          {/* Overview */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-100 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-hud text-xs text-cyan-300 mb-1">SOVEREIGN TWO-LAYER ARCHITECTURE</div>
              <p className="text-xs text-cyan-200/80 leading-relaxed font-mono-code">
                In accordance with core security protocols, web browsers cannot directly access your Windows operating system without a local bridge. Running the agent script on your PC opens a high-speed local RPC socket at <code>http://localhost:11424</code>, allowing JARVIS to launch games, open software, search hard drives, download tools, and take screenshots via natural voice commands.
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="font-hud text-xs text-cyan-400 tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-[10px]">1</span>
              INSTALL PYTHON DEPENDENCIES ON WINDOWS
            </h3>
            <div className="bg-black/80 p-3 rounded-lg border border-gray-800 font-mono-code text-xs text-cyan-300 select-all flex items-center justify-between">
              <code>pip install flask flask-cors pyautogui pillow psutil requests</code>
              <span className="text-[10px] text-gray-500 font-tech uppercase">Run in CMD / PowerShell</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-hud text-xs text-cyan-400 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-[10px]">2</span>
                SAVE & RUN GOD-MODE AGENT (jarvis_agent.py)
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-hud bg-cyan-600 hover:bg-cyan-500 text-gray-950 px-3 py-1.5 rounded font-bold transition-colors shadow-md shadow-cyan-950"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "COPIED TO CLIPBOARD" : "COPY AGENT CODE"}
              </button>
            </div>

            <p className="text-xs text-gray-400 font-mono-code">
              Save as <code>jarvis_agent.py</code> on your computer and execute with <code>python jarvis_agent.py</code>
            </p>

            <div className="relative rounded-xl border border-gray-800 overflow-hidden bg-black/90">
              <pre className="p-4 text-xs font-mono-code text-gray-400 overflow-x-auto max-h-72 leading-relaxed">
                <code>{LOCAL_AGENT_PYTHON_SCRIPT}</code>
              </pre>
            </div>
          </div>

          {/* Capabilities unlocked */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <div className="font-hud text-[11px] text-cyan-400 mb-1">APP & GAME LAUNCHER</div>
              <p className="text-[11px] text-gray-400 font-mono-code">
                Voice command: &quot;Open Steam&quot;, &quot;Launch Cyberpunk&quot;, &quot;Start VS Code&quot;
              </p>
            </div>

            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <div className="font-hud text-[11px] text-cyan-400 mb-1">DEEP FILE INTELLIGENCE</div>
              <p className="text-[11px] text-gray-400 font-mono-code">
                Voice command: &quot;Find all invoices in Documents&quot;, &quot;Read my python script&quot;
              </p>
            </div>

            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <div className="font-hud text-[11px] text-cyan-400 mb-1">DOWNLOADER & INSTALLER</div>
              <p className="text-[11px] text-gray-400 font-mono-code">
                Voice command: &quot;Download latest Node.js installer to my Downloads folder&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-gray-900/60 flex items-center justify-between">
          <div className="text-[11px] text-gray-400 font-mono-code">
            Listening on socket: <span className="text-cyan-400">http://localhost:11424</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-gray-950 font-hud text-xs font-bold transition-all shadow-md shadow-cyan-950"
          >
            CONFIRM & RETURN TO HUD
          </button>
        </div>
      </div>
    </div>
  );
};
