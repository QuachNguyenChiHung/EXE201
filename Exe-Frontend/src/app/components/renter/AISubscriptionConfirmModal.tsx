import React from 'react';
import { AiSubscriptionTier } from '../../../types/public';
import { Loader2 } from 'lucide-react';

interface Props {
  tier: AiSubscriptionTier | null;
  aiTiers: AiSubscriptionTier[];
  currentTierId?: number;
  isDowngrade?: boolean;
  willSchedule?: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onForceConfirm?: () => void;
}

const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const TIER_COLORS = [
  { color: '#6b7280', bgColor: '#f3f4f6' },
  { color: '#3b82f6', bgColor: '#eff6ff' },
  { color: '#f59e0b', bgColor: '#fffbeb' },
  { color: '#8b5cf6', bgColor: '#f5f3ff' },
];

export function AISubscriptionConfirmModal({ tier, aiTiers, currentTierId, isDowngrade, willSchedule, loading, onClose, onConfirm, onForceConfirm }: Props) {
  if (!tier) return null;

  const tierIdx = aiTiers.findIndex(t => t.id_ai_subscription === tier.id_ai_subscription);
  const visuals = TIER_COLORS[Math.max(0, tierIdx) % TIER_COLORS.length];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-modal-overlay)', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-base">
            {isDowngrade
              ? 'Xác nhận hạ gói AI'
              : currentTierId === undefined
              ? 'Xác nhận đăng ký gói AI'
              : 'Xác nhận nâng cấp gói AI'}
          </h3>
        </div>

        {/* Tier info */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 flex items-center justify-center rounded"
              style={{ background: visuals.bgColor, color: visuals.color }}
            >
              <span className="text-xs font-bold">{tier.label.charAt(0)}</span>
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: visuals.color }}>{tier.label}</div>
              {tier.desciption && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{tier.desciption}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Giá gói</span>
              <span className="font-semibold" style={{ color: visuals.color }}>
                {tier.price === 0 ? 'Miễn phí' : fmtVnd(tier.price)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Token đầu vào</span>
              <span className="font-medium">{tier.token_input.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Token đầu ra</span>
              <span className="font-medium">{tier.token_output.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Thời hạn</span>
              <span className="font-medium">1 tháng</span>
            </div>
          </div>

          {isDowngrade ? (
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Bạn sẽ chuyển về gói miễn phí. Dịch vụ AI của bạn sẽ bị giới hạn theo gói cơ bản.
            </p>
          ) : willSchedule ? (
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Bạn sẽ không bị tính phí ngay. Gói này sẽ được thanh toán và áp dụng khi gói hiện tại của bạn kết thúc.
            </p>
          ) : tier.price > 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Bạn sẽ được chuyển hướng đến cổng thanh toán để hoàn tất giao dịch.
            </p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 text-sm border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: 'var(--color-primary)' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : isDowngrade || tier.price === 0 ? 'Xác nhận' : willSchedule ? 'Lên lịch' : 'Thanh toán'}
            </button>
          </div>
          {willSchedule && onForceConfirm && (
            <button
              onClick={onForceConfirm}
              disabled={loading}
              className="w-full py-2 text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-60"
            >
              Đổi ngay (tính phí ngay lập tức)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
