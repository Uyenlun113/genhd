'use client';

import { useEffect, useRef } from 'react';

type EventCallback = (event: { type: string; payload?: unknown }) => void;

export function useWebSocket(onEvent: EventCallback) {
  const wsRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef<EventCallback>(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let ws: WebSocket | null = null;
    let retryTimer: NodeJS.Timeout;

    if (isLocalhost) {
      const socketUrl = `ws://${window.location.hostname}:3001`;

      function connect() {
        try {
          ws = new WebSocket(socketUrl);
          wsRef.current = ws;

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (callbackRef.current) {
                callbackRef.current(data);
              }
            } catch (err) {
              console.error('WS client parse error:', err);
            }
          };

          ws.onclose = () => {
            retryTimer = setTimeout(connect, 3000);
          };

          ws.onerror = () => {
            ws?.close();
          };
        } catch {
          retryTimer = setTimeout(connect, 3000);
        }
      }

      connect();
    }

    // Polling interval every 10 seconds for production (Vercel serverless) when tab is active
    const fallbackInterval = setInterval(() => {
      if (document.hidden) return; // Do not call API when tab is inactive/hidden
      if (!isLocalhost || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (callbackRef.current) {
          callbackRef.current({ type: 'REFRESH_TEST_RESULTS' });
          callbackRef.current({ type: 'REFRESH_NOTIFICATIONS' });
        }
      }
    }, 10000);

    return () => {
      clearTimeout(retryTimer);
      clearInterval(fallbackInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
