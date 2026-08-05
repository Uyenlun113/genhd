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
    let ws: WebSocket | null = null;
    let retryTimer: NodeJS.Timeout;

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${host}:3001`;

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
          retryTimer = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        retryTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
