import { useEffect } from 'react';
import { subscribe } from '../services/websocketService';

type WSMessage = { type: string; [key: string]: unknown };

/**
 * Subscribe to a specific websocket message `type` for the lifetime of the
 * calling component. Wrap `handler` in `useCallback` at the call site to
 * avoid resubscribing on every render.
 */
export function useWebSocketMessage(type: string, handler: (msg: WSMessage) => void) {
  useEffect(() => {
    return subscribe(type, handler);
  }, [type, handler]);
}
