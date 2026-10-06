import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || String(error || "");
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("vite") ||
      msg.includes("failed to connect") ||
      msg.includes("closed without opened")
    ) {
      return { hasError: false, errorMessage: "" };
    }
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error?.message || String(error || "");
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("vite") ||
      msg.includes("failed to connect") ||
      msg.includes("closed without opened")
    ) {
      return;
    }
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.errorMessage.includes("RATE") || this.state.errorMessage.includes("quota")) {
        return (
          <div style={{ background: "#000", color: "#00f3ff", padding: "20px", height: "100vh", fontFamily: "monospace", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <h2>⚠️ J.A.R.V.I.S. API RATE LIMIT EXCEEDED</h2>
            <p style={{ opacity: 0.8, maxWidth: "600px", textAlign: "center", marginTop: "20px" }}>
              The AI Studio backend has reached its generation quota limits. Please wait 1-2 minutes for the tokens to replenish before trying again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ marginTop: "30px", padding: "10px 20px", background: "rgba(0, 243, 255, 0.1)", border: "1px solid #00f3ff", color: "#00f3ff", cursor: "pointer" }}
            >
              REBOOT SYSTEM
            </button>
          </div>
        );
      }
      return (
        <div style={{ background: "#000", color: "#f00", padding: "20px", height: "100vh", fontFamily: "monospace", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <h2>SYSTEM FAILURE</h2>
          <p>{this.state.errorMessage}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: "30px", padding: "10px 20px", background: "rgba(255, 0, 0, 0.1)", border: "1px solid #f00", color: "#f00", cursor: "pointer" }}>
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
