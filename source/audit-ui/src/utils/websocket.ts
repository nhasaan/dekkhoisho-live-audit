import { getToken } from './auth';

export const createWSClient = (token: string): WebSocket => {
  const WS_URL = import.meta.env.PUBLIC_WS_URL || 'ws://localhost:5001/ws';
  const ws = new WebSocket(`${WS_URL}/events?token=${token}`);
  return ws;
};

export interface WSEvent {
  type: 'event' | 'connected' | 'ping' | 'pong';
  data?: any;
  message?: string;
  clientId?: string;
}

// Helper function to create WebSocket with message handler
export function connectWebSocket(onMessage: (event: any) => void): WebSocket {
  const token = getToken();
  const ws = createWSClient(token || '');
  
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === 'event') {
      onMessage(data.data);
    }
  };
  
  return ws;
}
