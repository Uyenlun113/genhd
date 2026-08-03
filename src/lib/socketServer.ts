import { WebSocketServer, WebSocket } from 'ws';

declare global {
  // eslint-disable-next-line no-var
  var wssInstance: WebSocketServer | undefined;
}

export function getWebSocketServer(): WebSocketServer {
  if (!global.wssInstance) {
    const port = Number(process.env.WS_PORT || 3001);
    try {
      global.wssInstance = new WebSocketServer({ port });
      console.log(`🚀 WebSocket Server initialized on port ${port}`);

      global.wssInstance.on('connection', (ws) => {
        ws.on('message', (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            // Broadcast message to all connected clients
            global.wssInstance?.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(parsed));
              }
            });
          } catch (err) {
            console.error('WebSocket parse error:', err);
          }
        });
      });
    } catch (err) {
      console.error('Failed to start WebSocket server:', err);
    }
  }
  return global.wssInstance!;
}

export function broadcastEvent(event: { type: string; payload?: unknown }) {
  try {
    const server = getWebSocketServer();
    if (server && server.clients) {
      const message = JSON.stringify(event);
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  } catch (err) {
    console.error('WebSocket broadcast failed:', err);
  }
}
