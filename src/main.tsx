import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PerformanceProvider } from './context/PerformanceContext';
import './index.css';

// Prevent Vite WebSocket and transient runtime disconnection notices from interrupting UI
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = function (...args: any[]) {
    const joined = args.map(a => String((a && a.message) || a || '')).join(' ');
    if (
      joined.includes('failed to connect to websocket') ||
      joined.includes('WebSocket closed without opened') ||
      (joined.includes('[vite]') && joined.includes('websocket'))
    ) {
      return;
    }
    origConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('WebSocket closed without opened') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('vite')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event?.message || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('WebSocket closed without opened') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('vite')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <PerformanceProvider>
          <App />
        </PerformanceProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
