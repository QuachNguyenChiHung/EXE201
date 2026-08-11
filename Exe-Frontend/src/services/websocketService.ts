import { getToken } from '../utils/auth';

type WSMessage = { type: string; [key: string]: unknown };
type Listener = (msg: WSMessage) => void;

function wsUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
  const wsBase = base.replace(/^http/, 'ws');
  return `${wsBase}/ws/notifications?token=${encodeURIComponent(getToken() ?? '')}`;
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let manuallyClosed = false;
const listeners = new Map<string, Set<Listener>>();

function scheduleReconnect(): void {
  if (reconnectTimer) return; // already scheduled, don't stack timers
  const delay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!manuallyClosed) connect();
  }, delay);
}

export function connect(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  manuallyClosed = false;
  socket = new WebSocket(wsUrl());

  socket.onopen = () => {
    reconnectAttempt = 0;
    console.log('[WebSocket] Kết nối realtime thành công.');
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const set = listeners.get(msg.type);
      set?.forEach((fn) => fn(msg));
    } catch {
      // ignore malformed messages
    }
  };

  socket.onclose = () => {
    if (!manuallyClosed) scheduleReconnect();
  };

  // The browser itself will still print its own native
  // "WebSocket connection to '<url>' failed" line to devtools on a failed
  // handshake — that comes from the browser engine before any JS runs and
  // cannot be suppressed or overridden from application code. `onclose`
  // fires right after `onerror` for a failed connection, so we surface our
  // own non-leaking message there instead of logging anything here (in
  // particular, never log `socket.url`, which contains the auth token).
  socket.onerror = () => {
    if (!manuallyClosed) scheduleReconnect();
  };
}

export function disconnect(): void {
  manuallyClosed = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}

export function subscribe(type: string, listener: Listener): () => void {
  const set = listeners.get(type) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(type, set);

  return () => {
    const current = listeners.get(type);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listeners.delete(type);
    }
  };
}
