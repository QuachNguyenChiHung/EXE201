import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { realtimeClient, type RealtimeEvent } from '../services/realtimeClient';

/**
 * Bridges the realtime WebSocket into the AppContext store.
 *
 * - On mount / when authenticated -> open socket.
 * - On unmount / logout -> close socket.
 * - "notification" events trigger an immediate refresh of the notifications list.
 * - "warehouse.revision" events bump the warehouseRevision counter, which causes
 *   all warehouse-listening pages (MyWarehouses, WarehouseDetail, etc.) to re-fetch.
 */
export function useRealtimeUpdates(): void {
  const { isAuthenticated, refreshNotifications, incrementWarehouseRevision } = useApp();
  const refreshedOnConnect = useRef(false);

  // Keep the latest function refs so the WebSocket callbacks always invoke the
  // current closures, even though the parent context recreates them on every render.
  const refreshRef = useRef(refreshNotifications);
  const incrementRef = useRef(incrementWarehouseRevision);
  useEffect(() => {
    refreshRef.current = refreshNotifications;
    incrementRef.current = incrementWarehouseRevision;
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    realtimeClient.connect();

    const offMessage = realtimeClient.onMessage((event: RealtimeEvent) => {
      switch (event.type) {
        case 'notification':
          void refreshRef.current();
          break;
        case 'warehouse.revision':
          incrementRef.current();
          break;
        default:
          break;
      }
    });

    const offStatus = realtimeClient.onStatus((status) => {
      if (status === 'open' && !refreshedOnConnect.current) {
        refreshedOnConnect.current = true;
        void refreshRef.current();
      } else if (status === 'closed' || status === 'idle') {
        refreshedOnConnect.current = false;
      }
    });

    return () => {
      offMessage();
      offStatus();
      realtimeClient.disconnect();
    };
    // We intentionally key only on auth state — the latest refreshNotifications /
    // incrementWarehouseRevision are read from a ref so the socket isn't torn down
    // every render when the parent context recreates them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}