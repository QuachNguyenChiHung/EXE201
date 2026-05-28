/**
 * DataMigration.tsx — Employee-only page
 * Provides full visibility and control over the mock data store.
 *
 * Features:
 *  - Live KV counts vs mock source counts per resource
 *  - Migrate individual resource or all at once (with force-overwrite option)
 *  - Clear individual resource or all data
 *  - Activity log
 *  - Auto-refresh every 5s while a migration is in progress
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { seedAPI }         from '../../../services/apiClient';
import { MockUsers }       from '../../../data/mockUsers';
import { MockWarehouseData } from '../../../data/mockWarehouses';
import { MockRentRequests } from '../../../data/mockRequests';
import { MockRentalContracts } from '../../../data/mockContracts';
import { MockRatings }     from '../../../data/mockRatings';
import {
  Database, RefreshCw, UploadCloud, Trash2, CheckCircle, XCircle,
  AlertCircle, ChevronRight, Users, Warehouse, ClipboardList,
  FileText, Star, ArrowLeft, Loader, RotateCcw, ServerCrash,
} from 'lucide-react';

// ── Resource definitions ──────────────────────────────────────────────────────
type ResourceKey = 'users' | 'warehouses' | 'requests' | 'contracts' | 'ratings';

interface ResourceDef {
  key:       ResourceKey;
  label:     string;
  icon:      JSX.Element;
  color:     string;
  mockData:  any[];
  reduxKey:  string;
}

const RESOURCES: ResourceDef[] = [
  { key: 'users',      label: 'Người dùng',  icon: <Users        className="h-4 w-4" />, color: '#2563eb', mockData: MockUsers,            reduxKey: 'auth.users' },
  { key: 'warehouses', label: 'Kho lạnh',    icon: <Warehouse    className="h-4 w-4" />, color: '#7c3aed', mockData: MockWarehouseData,    reduxKey: 'warehouses.list' },
  { key: 'requests',   label: 'Yêu cầu thuê',icon: <ClipboardList className="h-4 w-4" />, color: '#0891b2', mockData: MockRentRequests,    reduxKey: 'requests.list' },
  { key: 'contracts',  label: 'Hợp đồng',    icon: <FileText     className="h-4 w-4" />, color: '#059669', mockData: MockRentalContracts,  reduxKey: 'contracts.list' },
  { key: 'ratings',    label: 'Đánh giá',    icon: <Star         className="h-4 w-4" />, color: '#d97706', mockData: MockRatings,          reduxKey: 'ratings.list' },
];

// ── Log entry ─────────────────────────────────────────────────────────────────
type LogLevel = 'info' | 'success' | 'error' | 'warn';
interface LogEntry { ts: string; level: LogLevel; msg: string; }

// ── Status for each resource ──────────────────────────────────────────────────
interface ResourceStatus {
  kvCount:   number;
  migrating: boolean;
  clearing:  boolean;
  error?:    string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DataMigration() {
  const navigate   = useNavigate();
  const { user, isAuthenticated, users, warehouses, requests, contracts, ratings, refreshUsers, refreshWarehouses, refreshRequests, refreshContracts, refreshRatings } = useApp();

  const reduxCounts: Record<ResourceKey, number> = {
    users:      users.length,
    warehouses: warehouses.length,
    requests:   requests.length,
    contracts:  contracts.length,
    ratings:    ratings.length,
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus]         = useState<Record<ResourceKey, ResourceStatus>>({
    users:      { kvCount: 0, migrating: false, clearing: false },
    warehouses: { kvCount: 0, migrating: false, clearing: false },
    requests:   { kvCount: 0, migrating: false, clearing: false },
    contracts:  { kvCount: 0, migrating: false, clearing: false },
    ratings:    { kvCount: 0, migrating: false, clearing: false },
  });
  const [seededAt, setSeededAt]     = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [migratingAll, setMigratingAll]   = useState(false);
  const [clearingAll, setClearingAll]     = useState(false);
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addLog = useCallback((level: LogLevel, msg: string) => {
    const entry: LogEntry = { ts: new Date().toLocaleTimeString('vi-VN'), level, msg };
    setLogs(prev => [entry, ...prev].slice(0, 100));
  }, []);

  const updateStatus = useCallback((
    key: ResourceKey,
    patch: Partial<ResourceStatus>,
  ) => {
    setStatus(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  // ── Fetch live KV counts ───────────────────────────────────────────────────
  const refreshStatus = useCallback(async (silent = false) => {
    if (!silent) setLoadingStatus(true);
    try {
      const data = await seedAPI.status();
      setSeededAt(data.seededAt);
      RESOURCES.forEach(r => {
        updateStatus(r.key, { kvCount: data.counts[r.key] ?? 0, error: undefined });
      });
      if (!silent) addLog('info', `Làm mới trạng thái KV: ${JSON.stringify(data.counts)}`);
    } catch (err: any) {
      addLog('error', `Không lấy được trạng thái KV: ${err.message}`);
    } finally {
      if (!silent) setLoadingStatus(false);
    }
  }, [addLog, updateStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Auto-refresh when any migration is in-progress
  useEffect(() => {
    const anyBusy = Object.values(status).some(s => s.migrating || s.clearing) || migratingAll || clearingAll;
    if (!anyBusy) return;
    const id = setInterval(() => refreshStatus(true), 2000);
    return () => clearInterval(id);
  }, [status, migratingAll, clearingAll, refreshStatus]);

  // Scroll log to top on new entries
  useEffect(() => {
    logRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [logs]);

  // ── Migrate single resource ────────────────────────────────────────────────
  const migrateResource = async (res: ResourceDef) => {
    updateStatus(res.key, { migrating: true, error: undefined });
    addLog('info', `Bắt đầu migrate ${res.label} (${res.mockData.length} records)…`);
    try {
      const result = await seedAPI.seedResource(res.key, res.mockData, forceOverwrite);
      if (result.status === 'already_exists') {
        addLog('warn', `${res.label}: đã có dữ liệu (${result.count} records). Bật "Force overwrite" để ghi đè.`);
        updateStatus(res.key, { kvCount: result.count as unknown as number });
      } else {
        addLog('success', `✓ ${res.label}: migrate ${result.count} records thành công`);
        updateStatus(res.key, { kvCount: result.count });
      }
      // Reload into Redux
      await reloadResource(res.key);
    } catch (err: any) {
      addLog('error', `✗ ${res.label}: ${err.message}`);
      updateStatus(res.key, { error: err.message });
    } finally {
      updateStatus(res.key, { migrating: false });
    }
  };

  // ── Clear single resource ──────────────────────────────────────────────────
  const clearResource = async (res: ResourceDef) => {
    if (!confirm(`Xóa tất cả ${res.label} khỏi KV store?`)) return;
    updateStatus(res.key, { clearing: true, error: undefined });
    addLog('warn', `Đang xóa ${res.label}…`);
    try {
      const result = await seedAPI.clearResource(res.key);
      addLog('success', `✓ ${res.label}: đã xóa ${result.cleared} records`);
      updateStatus(res.key, { kvCount: 0 });
    } catch (err: any) {
      addLog('error', `✗ ${res.label} clear: ${err.message}`);
      updateStatus(res.key, { error: err.message });
    } finally {
      updateStatus(res.key, { clearing: false });
    }
  };

  // ── Migrate all ────────────────────────────────────────────────────────────
  const migrateAll = async () => {
    setMigratingAll(true);
    addLog('info', `Bắt đầu migrate toàn bộ dữ liệu (force=${forceOverwrite})…`);
    try {
      const result = await seedAPI.seed(
        { users: MockUsers, warehouses: MockWarehouseData, requests: MockRentRequests, contracts: MockRentalContracts, ratings: MockRatings },
        forceOverwrite,
      );
      if ((result as any).status === 'already_seeded') {
        addLog('warn', 'Dữ liệu đã tồn tại. Bật "Force overwrite" để ghi đè.');
      } else {
        addLog('success', `✓ Migrate all: ${JSON.stringify((result as any).counts)}`);
        setSeededAt(new Date().toISOString());
      }
      await refreshStatus(true);
      // Reload all into Redux
      await Promise.all(RESOURCES.map(r => reloadResource(r.key)));
    } catch (err: any) {
      addLog('error', `✗ Migrate all: ${err.message}`);
    } finally {
      setMigratingAll(false);
    }
  };

  // ── Clear all ──────────────────────────────────────────────────────────────
  const clearAll = async () => {
    if (!confirm('Xóa TẤT CẢ dữ liệu khỏi KV store? Hành động này không thể hoàn tác.')) return;
    setClearingAll(true);
    addLog('warn', 'Đang xóa toàn bộ dữ liệu KV…');
    try {
      const result = await seedAPI.clear();
      addLog('success', `✓ ${result.message}`);
      setSeededAt(null);
      await refreshStatus(true);
    } catch (err: any) {
      addLog('error', `✗ Clear all: ${err.message}`);
    } finally {
      setClearingAll(false);
    }
  };

  // ── Reload resource into Redux ─────────────────────────────────────────────
  const reloadResource = async (key: ResourceKey) => {
    switch (key) {
      case 'users':      await refreshUsers(); break;
      case 'warehouses': await refreshWarehouses(); break;
      case 'requests':   await refreshRequests();   break;
      case 'contracts':  await refreshContracts();  break;
      case 'ratings':    await refreshRatings();    break;
    }
  };

  // ── Reload all Redux ────────────────────────────────────────────────────────
  const reloadAll = async () => {
    addLog('info', 'Đồng bộ Redux từ KV…');
    try {
      await Promise.all(RESOURCES.map(r => reloadResource(r.key)));
      addLog('success', '✓ Đã đồng bộ Redux');
    } catch (err: any) {
      addLog('error', `✗ Đồng bộ Redux: ${err.message}`);
    }
  };


  const anyBusy = Object.values(status).some(s => s.migrating || s.clearing) || migratingAll || clearingAll;

  // ── Compute per-resource sync status ──────────────────────────────────────
  const syncStatusOf = (res: ResourceDef): 'synced' | 'partial' | 'empty' | 'extra' => {
    const kv = status[res.key].kvCount;
    const src = res.mockData.length;
    if (kv === 0) return 'empty';
    if (kv >= src) return 'synced';
    return 'partial';
  };

  const syncBadge = {
    synced:  { label: 'Đã sync', bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
    partial: { label: 'Thiếu',   bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
    empty:   { label: 'Trống',   bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
    extra:   { label: 'Có dữ liệu', bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  };

  const logColors: Record<LogLevel, string> = {
    info:    'var(--color-text-secondary)',
    success: '#16a34a',
    warn:    '#d97706',
    error:   '#dc2626',
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container pb-12">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bento-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/employee')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} /> Quay lại
            </button>
            <ChevronRight style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Data Migration</span>
          </div>
          <h1 style={{ marginTop: 12 }}>Quản lý dữ liệu Mock</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 14 }}>
            Migrate mock data → In-memory store · Xem live counts
          </p>
        </div>

        {/* ── Global actions bar ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            padding: '14px 16px', marginBottom: 24,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          {/* Force overwrite toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={forceOverwrite}
              onChange={e => setForceOverwrite(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }}
            />
            <span style={{ color: 'var(--color-text-secondary)' }}>Force overwrite</span>
          </label>

          <div style={{ flex: 1, minWidth: 10 }} />

          {/* Refresh */}
          <button
            onClick={() => refreshStatus()}
            disabled={loadingStatus || anyBusy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 13, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: loadingStatus ? 'spin 1s linear infinite' : 'none' }} />
            Làm mới
          </button>

          {/* Sync Redux */}
          <button
            onClick={reloadAll}
            disabled={anyBusy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 13, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}
          >
            <RotateCcw style={{ width: 13, height: 13 }} />
            Đồng bộ Redux
          </button>

          {/* Migrate all */}
          <button
            onClick={migrateAll}
            disabled={anyBusy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: anyBusy ? 'not-allowed' : 'pointer', opacity: anyBusy ? 0.6 : 1 }}
          >
            {migratingAll ? <Loader style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <UploadCloud style={{ width: 13, height: 13 }} />}
            Migrate tất cả
          </button>

          {/* Clear all */}
          <button
            onClick={clearAll}
            disabled={anyBusy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)', cursor: anyBusy ? 'not-allowed' : 'pointer', opacity: anyBusy ? 0.6 : 1 }}
          >
            {clearingAll ? <Loader style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 13, height: 13 }} />}
            Xóa tất cả
          </button>
        </div>

        {/* ── Seed timestamp ──────────────────────────────────────────────── */}
        {seededAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', fontSize: 12 }}>
            <CheckCircle style={{ width: 14, height: 14, color: '#16a34a' }} />
            <span style={{ color: '#16a34a', fontFamily: 'monospace' }}>
              KV đã seed lúc {new Date(seededAt).toLocaleString('vi-VN')}
            </span>
          </div>
        )}
        {!seededAt && !loadingStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12 }}>
            <ServerCrash style={{ width: 14, height: 14, color: '#dc2626' }} />
            <span style={{ color: '#dc2626' }}>KV chưa được seed. Nhấn "Migrate tất cả" để bắt đầu.</span>
          </div>
        )}

        {/* ── Resource grid ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 1, background: 'var(--color-border)', marginBottom: 24 }}>
          {RESOURCES.map(res => {
            const s     = status[res.key];
            const sync  = syncStatusOf(res);
            const badge = syncBadge[sync];
            const busy  = s.migrating || s.clearing;

            return (
              <div
                key={res.key}
                style={{ background: 'var(--color-surface)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {/* Resource header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${res.color}18`, color: res.color }}>
                    {res.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{res.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{res.key}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', background: badge.bg, color: badge.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {badge.label}
                  </span>
                </div>

                {/* Counts: Source | KV | Redux */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--color-border)' }}>
                  {[
                    { label: 'Nguồn (mock)', value: res.mockData.length, color: '#6b7280' },
                    { label: 'KV Store', value: loadingStatus ? '…' : s.kvCount, color: res.color },
                    { label: 'Redux', value: reduxCounts[res.key], color: '#6b7280' },
                  ].map(col => (
                    <div key={col.label} style={{ background: 'var(--color-surface)', padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: col.color }}>{col.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{col.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar when migrating */}
                {busy && (
                  <div style={{ height: 2, background: 'var(--color-border)' }}>
                    <div style={{ height: '100%', background: res.color, animation: 'progress-pulse 1.5s ease infinite', width: '60%' }} />
                  </div>
                )}

                {/* Error */}
                {s.error && (
                  <div style={{ fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle style={{ width: 12, height: 12 }} />
                    {s.error}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => migrateResource(res)}
                    disabled={busy || anyBusy}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '7px 0', fontSize: 12, fontWeight: 600,
                      background: res.color, color: '#fff', border: 'none',
                      cursor: busy || anyBusy ? 'not-allowed' : 'pointer',
                      opacity: busy || anyBusy ? 0.6 : 1,
                    }}
                  >
                    {s.migrating
                      ? <Loader style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                      : <UploadCloud style={{ width: 12, height: 12 }} />}
                    {s.migrating ? 'Đang migrate…' : 'Migrate'}
                  </button>
                  <button
                    onClick={() => clearResource(res)}
                    disabled={busy || anyBusy || s.kvCount === 0}
                    style={{
                      padding: '7px 12px', fontSize: 12,
                      background: 'rgba(239,68,68,0.08)', color: '#dc2626',
                      border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                      opacity: (busy || anyBusy || s.kvCount === 0) ? 0.4 : 1,
                    }}
                    title="Xóa khỏi KV"
                  >
                    {s.clearing ? <Loader style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 12, height: 12 }} />}
                  </button>
                  <button
                    onClick={() => reloadResource(res.key)}
                    disabled={busy || anyBusy}
                    style={{
                      padding: '7px 12px', fontSize: 12,
                      background: 'transparent',
                      border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-secondary)',
                      opacity: (busy || anyBusy) ? 0.4 : 1,
                    }}
                    title="Tải lại vào Redux"
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Activity log ────────────────────────────────────────────────── */}
        <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
              <Database style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
              Activity Log
            </div>
            <button
              onClick={() => setLogs([])}
              style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Xóa log
            </button>
          </div>
          <div
            ref={logRef}
            style={{ height: 200, overflowY: 'auto', padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {logs.length === 0
              ? <span style={{ color: 'var(--color-text-muted)' }}>Chưa có hoạt động nào. Nhấn Migrate để bắt đầu.</span>
              : logs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 10 }}>{l.ts}</span>
                  <span style={{ color: logColors[l.level] }}>{l.msg}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes progress-pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
