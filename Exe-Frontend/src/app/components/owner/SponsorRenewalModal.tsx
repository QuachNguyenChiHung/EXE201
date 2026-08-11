import React from 'react';
import type { SponsorRenewal } from '../../../types/public';
import type { SponsorTierDTO } from '../../../types';
import { Loader2 } from 'lucide-react';
import { fmtVnd, getSponsorTierVisuals } from './SubscriptionUtils';

interface Props {
  renewal: SponsorRenewal | null;
  sponsorTiers: SponsorTierDTO[];
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Post-login prompt for an OWNER whose warehouse's sponsor subscription window
// has lapsed. Mirrors AISubscriptionConfirmModal's renewal usage in LoginPage,
// but sponsor tiers are per-warehouse so the caller queues one renewal at a
// time rather than a single id.
export function SponsorRenewalModal({ renewal, sponsorTiers, loading, onClose, onConfirm }: Props) {
  if (!renewal) return null;

  const tier = sponsorTiers.find(t => t.id === renewal.sponsorTierId);
  const visuals = tier ? getSponsorTierVisuals(tier.priorityLevel) : getSponsorTierVisuals(0);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-modal-overlay)', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-sm">
        <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-base">Gói tài trợ đã hết hạn</h3>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Gói tài trợ cho kho <strong>{renewal.warehouseName}</strong> đã hết hạn. Gia hạn ngay để
            tiếp tục được ưu tiên hiển thị trong kết quả tìm kiếm.
          </p>

          {tier && (
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 flex items-center justify-center rounded"
                style={{ background: visuals.bgColor, color: visuals.color }}
              >
                {visuals.icon}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: visuals.color }}>
                  {tier.label.replace(/\s*\(Top\s*\d+\)/i, '')}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {tier.pricingPerMonth === 0 ? 'Miễn phí' : `${fmtVnd(tier.pricingPerMonth)}/tháng`}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            Bạn sẽ được chuyển hướng đến cổng thanh toán để hoàn tất gia hạn.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 text-sm border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Gia hạn ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
