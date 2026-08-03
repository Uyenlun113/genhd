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
    let socketUrl = 'ws://localhost:3001';
    if (typeof window !== 'undefined') {
      const host = window.location.hostname || 'localhost';
      socketUrl = `ws://${host}:3001`;
    }

    let ws: WebSocket | null = null;
    let retryTimer: NodeJS.Timeout;

    function connect() {
      try {
        ws = new WebSocket(socketUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Connected to WebSocket server
        };

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
          // Retry connection after 3 seconds if disconnected
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

    // Fallback polling interval every 8 seconds for serverless environments (Vercel)
    const fallbackInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (callbackRef.current) {
          callbackRef.current({ type: 'REFRESH_TEST_RESULTS' });
          callbackRef.current({ type: 'REFRESH_NOTIFICATIONS' });
        }
      }
    }, 8000);

    return () => {
      clearTimeout(retryTimer);
      clearInterval(fallbackInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
