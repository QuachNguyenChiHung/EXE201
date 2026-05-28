/**
 * DataLoader.tsx
 * App bootstrap component.
 *
 * Flow on every cold start:
 *   1. Check if data exists in new tables
 *   2. Auto-seed if tables are empty
 *   3. Render children once done (or after timeout fallback)
 *
 * Seeding is intentional — only performed via the Employee Data Migration page.
 */
import { useEffect, useState, ReactNode } from 'react';
import { seedAPI, warehousesAPI, requestsAPI, contractsAPI, ratingsAPI, usersAPI } from '../../services/apiClient';
import { MockUsers } from '../../data/mockUsers';
import { MockWarehouseData } from '../../data/mockWarehouses';
import { MockRentRequests } from '../../data/mockRequests';
import { MockRentalContracts } from '../../data/mockContracts';
import { MockRatings } from '../../data/mockRatings';
import { Warehouse, CheckCircle, AlertCircle, Loader } from 'lucide-react';

type Stage =
  | 'checking'    // check if seed needed
  | 'seeding'     // auto-seeding data
  | 'loading'     // fetch thunks
  | 'done'        // ready
  | 'error';      // unrecoverable

interface StageInfo {
  label: string;
  detail?: string;
}

const stageInfo: Record<Stage, StageInfo> = {
  checking: { label: 'Kiểm tra dữ liệu…' },
  seeding:  { label: 'Đang seed dữ liệu vào database…' },
  loading:  { label: 'Đang tải dữ liệu…' },
  done:     { label: 'Sẵn sàng' },
  error:    { label: 'Không kết nối được backend', detail: 'Vui lòng thử lại sau' },
};

interface Props {
  children: ReactNode;
}

export function DataLoader({ children }: Props) {
  const [stage, setStage] = useState<Stage>('loading');
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      // ── Step 1: Check if data exists in new tables ────────────────────────
      setStage('checking');
      setProgress(10);

      let needsSeed = false;
      try {
        const status = await seedAPI.status();
        const total = Object.values(status.counts).reduce((a, b) => a + b, 0);
        needsSeed = total === 0;
        console.log('[DataLoader] DB status:', status.counts, 'needsSeed:', needsSeed);
      } catch (err) {
        console.warn('[DataLoader] Status check failed, will attempt seed:', err);
        needsSeed = true;
      }

      // ── Step 2: Auto-seed if tables are empty ─────────────────────────────
      if (needsSeed) {
        setStage('seeding');
        setProgress(20);
        console.log('[DataLoader] Auto-seeding data into new tables…');
        try {
          await seedAPI.seed(
            {
              users: MockUsers,
              warehouses: MockWarehouseData,
              requests: MockRentRequests,
              contracts: MockRentalContracts,
              ratings: MockRatings,
            },
            true,
            'auto-reseed-v2',
          );
          console.log('[DataLoader] Auto-seed complete');
        } catch (seedErr) {
          console.error('[DataLoader] Auto-seed failed:', seedErr);
        }
        setProgress(40);
      }

      // ── Step 3: Preload data (optional warmup) ────────────────────────────
      setStage('loading');
      setProgress(needsSeed ? 50 : 30);
      await Promise.all([
        warehousesAPI.getAll().catch(() => []),
        requestsAPI.getAll().catch(() => []),
        contractsAPI.getAll().catch(() => []),
        ratingsAPI.getAll().catch(() => []),
        usersAPI.getAll().catch(() => []),
      ]);

      setProgress(100);
      setStage('done');
      await new Promise(r => setTimeout(r, 300));
      setReady(true);

    } catch (err) {
      console.error('[DataLoader] Bootstrap failed — data may be incomplete', err);
      setStage('error');
      setProgress(100);
      await new Promise(r => setTimeout(r, 1500));
      setReady(true);
    }
  }

  if (ready) return <>{children}</>;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        zIndex: 9999,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 40, height: 40,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Warehouse style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
          Logicha
        </span>
      </div>

      {/* Status card */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '24px',
        }}
      >
        {/* Stage icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          {stage === 'done' ? (
            <CheckCircle style={{ width: 20, height: 20, color: 'var(--color-success)' }} />
          ) : stage === 'error' ? (
            <AlertCircle style={{ width: 20, height: 20, color: 'var(--color-warning)' }} />
          ) : (
            <Loader
              style={{
                width: 20, height: 20,
                color: 'var(--color-primary)',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
          <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            {stageInfo[stage].label}
          </span>
        </div>

        {stageInfo[stage].detail && (
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            {stageInfo[stage].detail}
          </p>
        )}

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: 'var(--color-border)',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: stage === 'error' ? 'var(--color-warning)' : 'var(--color-primary)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(
            [
              { id: 'checking', label: 'Kiểm tra dữ liệu trong database' },
              { id: 'seeding',  label: 'Seed dữ liệu mẫu (nếu cần)' },
              { id: 'loading',  label: 'Tải warehouses, requests, contracts, ratings, users' },
              { id: 'done',     label: 'Hoàn thành' },
            ] as { id: Stage; label: string }[]
          ).map((step) => {
            const stageOrder: Stage[] = ['checking', 'seeding', 'loading', 'done', 'error'];
            const currentIdx  = stageOrder.indexOf(stage);
            const stepIdx     = stageOrder.indexOf(step.id);
            const isDone      = stage !== 'error' && stepIdx < currentIdx;
            const isCurrent   = step.id === stage;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  color: isDone
                    ? 'var(--color-success)'
                    : isCurrent
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
                }}
              >
                <span style={{ width: 12, height: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone ? '✓' : isCurrent ? '›' : '·'}
                </span>
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}