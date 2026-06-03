import React from 'react';
import { SUBSCRIPTION_TIERS, SubscriptionTierLevel, CompositeWarehouse } from '../../../types';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { fmtVnd, TIER_ICONS, currentTier } from './SubscriptionUtils';

interface SubscriptionConfirmModalProps {
  showConfirm: { warehouse: CompositeWarehouse; tier: SubscriptionTierLevel } | null;
  upgrading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SubscriptionConfirmModal({
  showConfirm,
  upgrading,
  onClose,
  onConfirm,
}: SubscriptionConfirmModalProps) {
  if (!showConfirm) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-modal-overlay)', background: 'rgba(0,0,0,0.5)' }}
      onClick={() => !upgrading && onClose()}
    >
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-md"
        style={{ zIndex: 'var(--z-modal)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-bold">Xác nhận thay đổi gói</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto flex items-center justify-center mb-1"
                style={{
                  background: SUBSCRIPTION_TIERS[currentTier(showConfirm.warehouse)].bgColor,
                  color: SUBSCRIPTION_TIERS[currentTier(showConfirm.warehouse)].color,
                }}
              >
                {TIER_ICONS[currentTier(showConfirm.warehouse)]}
              </div>
              <div className="text-xs font-semibold">
                {SUBSCRIPTION_TIERS[currentTier(showConfirm.warehouse)].label}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)]" />
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto flex items-center justify-center mb-1"
                style={{
                  background: SUBSCRIPTION_TIERS[showConfirm.tier].bgColor,
                  color: SUBSCRIPTION_TIERS[showConfirm.tier].color,
                }}
              >
                {TIER_ICONS[showConfirm.tier]}
              </div>
              <div className="text-xs font-semibold">
                {SUBSCRIPTION_TIERS[showConfirm.tier].label}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
            <p>
              Kho: <strong>{showConfirm.warehouse.name}</strong>
            </p>
            <p className="mt-1">
              Phí hàng tháng:{' '}
              <strong style={{ color: SUBSCRIPTION_TIERS[showConfirm.tier].color }}>
                {SUBSCRIPTION_TIERS[showConfirm.tier].monthlyPrice === 0
                  ? 'Miễn phí'
                  : fmtVnd(SUBSCRIPTION_TIERS[showConfirm.tier].monthlyPrice)}
              </strong>
            </p>
            <p className="mt-1">
              Search boost:{' '}
              <strong>×{SUBSCRIPTION_TIERS[showConfirm.tier].boostFactor}</strong>
            </p>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Thanh toán sẽ được xử lý tự động hàng tháng. Bạn có thể thay đổi gói bất kỳ
            lúc nào.
          </p>
        </div>
        <div className="px-5 py-4 border-t border-[var(--color-border)] flex justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-none"
            disabled={upgrading}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button
            className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            disabled={upgrading}
            onClick={onConfirm}
          >
            {upgrading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </div>
  );
}
