import React from 'react';
import { SponsorTierDTO, CompositeWarehouse } from '../../../types';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { fmtVnd, getSponsorTierVisuals } from './SubscriptionUtils';

interface SubscriptionConfirmModalProps {
  sponsorTiers: SponsorTierDTO[];
  showConfirm: { warehouse: CompositeWarehouse; tier: SponsorTierDTO } | null;
  upgrading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SubscriptionConfirmModal({
  sponsorTiers,
  showConfirm,
  upgrading,
  onClose,
  onConfirm,
}: SubscriptionConfirmModalProps) {
  if (!showConfirm) return null;

  const currentTierId = showConfirm.warehouse?.isSponsor ? (showConfirm.warehouse?.sponsor_type || 0) : 0;
  const currentTierObj = sponsorTiers.find(t => t.id === currentTierId) || sponsorTiers[0];
  
  const currentVisuals = currentTierObj ? getSponsorTierVisuals(currentTierObj.priorityLevel) : getSponsorTierVisuals(0);
  const selectedVisuals = getSponsorTierVisuals(showConfirm.tier.priorityLevel);

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
                className="w-12 h-12 mx-auto flex items-center justify-center mb-1 rounded"
                style={{
                  background: currentVisuals.bgColor,
                  color: currentVisuals.color,
                }}
              >
                {currentVisuals.icon}
              </div>
              <div className="text-xs font-semibold">
                {currentTierObj ? currentTierObj.label.replace(/\s*\(Top\s*\d+\)/i, '') : 'Miễn phí'}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)]" />
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto flex items-center justify-center mb-1 rounded"
                style={{
                  background: selectedVisuals.bgColor,
                  color: selectedVisuals.color,
                }}
              >
                {selectedVisuals.icon}
              </div>
              <div className="text-xs font-semibold">
                {showConfirm.tier.label.replace(/\s*\(Top\s*\d+\)/i, '')}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
            <p>
              Kho: <strong>{showConfirm.warehouse.name}</strong>
            </p>
            <p className="mt-1">
              Phí hàng tháng:{' '}
              <strong style={{ color: selectedVisuals.color }}>
                {showConfirm.tier.pricingPerMonth === 0
                  ? 'Miễn phí'
                  : fmtVnd(showConfirm.tier.pricingPerMonth)}
              </strong>
            </p>
            <p className="mt-1">
              Ưu tiên hiển thị:{' '}
              <strong>Mức {showConfirm.tier.priorityLevel}</strong>
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
