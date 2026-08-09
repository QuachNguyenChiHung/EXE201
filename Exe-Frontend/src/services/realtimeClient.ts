import { getToken } from '../utils/auth';

export type RealtimeStatus = 'idle' | 'connecting' | 'open' | 'closed';

export interface RealtimeEvent {
  type: string;
  payload: unknown;
}

type MessageHandler = (event: RealtimeEvent) => void;
type StatusHandler = (status: RealtimeStatus) => void;

const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

function resolveWsUrl(): string {
  const explicit = (import.meta.env.VITE_WS_URL as string | undefined) ?? '';
  if (explicit) return explicit;
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080';
  return apiBase.replace(/^http/i, 'ws') + '/ws';
}

class RealtimeClient {
  private socket: WebSocket | null = null;
  private url: string | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();

  connect(): void {
    const token = getToken();
    if (!token) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.intentionalClose = false;
    this.url = resolveWsUrl();

    // Subprotocols are limited to ASCII and can't carry raw JWT cleanly across all browsers.
    // Use `authorization.<jwt>` so the server can parse it from the Sec-WebSocket-Protocol header.
    const socket = new WebSocket(this.url, [`authorization.${token}`]);
    this.socket = socket;
    this.emitStatus('connecting');

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.emitStatus('open');
    };

    socket.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as RealtimeEvent;
        if (parsed && typeof parsed.type === 'string') {
          for (const h of this.messageHandlers) h(parsed);
        }
      } catch {
        // ignore non-JSON frames
      }
    };

    socket.onerror = () => {
      // onclose will fire right after; let it handle reconnect.
    };

    socket.onclose = () => {
      this.socket = null;
      this.emitStatus('closed');
      if (!this.intentionalClose) this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.reconnectAttempt = 0;
    this.emitStatus('idle');
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.currentStatus());
    return () => this.statusHandlers.delete(handler);
  }

  private currentStatus(): RealtimeStatus {
    if (!this.socket) return 'idle';
    switch (this.socket.readyState) {
      case WebSocket.OPEN: return 'open';
      case WebSocket.CONNECTING: return 'connecting';
      default: return 'closed';
    }
  }

  private emitStatus(status: RealtimeStatus): void {
    for (const h of this.statusHandlers) h(status);
  }

  private scheduleReconnect(): void {
    if (!getToken()) return;
    const delay = Math.min(
      MAX_RECONNECT_DELAY,
      MIN_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempt)
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const realtimeClient = new RealtimeClient();