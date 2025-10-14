export const createWSClient = (token: string): WebSocket => {
  const WS_URL = import.meta.env.PUBLIC_WS_URL || 'ws://localhost:3000/ws';
  const ws = new WebSocket(`${WS_URL}/events?token=${token}`);
  return ws;
};

export interface WSEvent {
  type: 'event' | 'connected' | 'ping' | 'pong';
  data?: any;
  message?: string;
  clientId?: string;
}

