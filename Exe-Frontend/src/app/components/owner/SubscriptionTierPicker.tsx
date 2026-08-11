import React from 'react';
import { SponsorTierDTO, CompositeWarehouse } from '../../../types';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { fmtVnd, getSponsorTierVisuals } from './SubscriptionUtils';

interface SubscriptionTierPickerProps {
  sponsorTiers: SponsorTierDTO[];
  selectedWarehouse: CompositeWarehouse | null;
  /** true when this warehouse's current tier stopped billing and needs renewal. */
  isLapsed?: boolean;
  onClose: () => void;
  onSelectTier: (warehouse: CompositeWarehouse, tier: SponsorTierDTO) => void;
}

export function SubscriptionTierPicker({
  sponsorTiers,
  selectedWarehouse,
  isLapsed,
  onClose,
  onSelectTier,
}: SubscriptionTierPickerProps) {
  if (!selectedWarehouse) return null;

  const currentTierId = selectedWarehouse?.isSponsor ? (selectedWarehouse?.sponsor_type || 0) : 0;
  const currentTierObj = sponsorTiers.find(t => t.id === currentTierId) || sponsorTiers[0];
  const currentVisuals = currentTierObj ? getSponsorTierVisuals(currentTierObj.priorityLevel) : getSponsorTierVisuals(0);

  let gridColsClass = "lg:grid-cols-4";
  if (sponsorTiers.length === 2) gridColsClass = "lg:grid-cols-2";
  if (sponsorTiers.length === 3) gridColsClass = "lg:grid-cols-3";

  return (
    <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Chọn gói cho: {selectedWarehouse.name}</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Gói hiện tại:{' '}
            <strong style={{ color: currentVisuals.color }}>
              {currentVisuals.icon}{' '}
              {currentTierObj ? currentTierObj.label.replace(/\s*\(Top\s*\d+\)/i, '') : 'Miễn phí'}
            </strong>
            {isLapsed && <span className="text-red-600 font-semibold"> — Đã hết hạn</span>}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`grid grid-cols-2 ${gridColsClass} gap-px bg-[var(--color-border)]`}>
        {sponsorTiers.map(tier => {
          const visuals = getSponsorTierVisuals(tier.priorityLevel);
          const isCurrent = currentTierId === tier.id;
          const isDowngrade = tier.priorityLevel < (currentTierObj?.priorityLevel || 0);
          const isUpgrade = tier.priorityLevel > (currentTierObj?.priorityLevel || 0);

          return (
            <div
              key={tier.id}
              className="bg-[var(--color-surface)] p-4 flex flex-col items-center text-center gap-2"
              style={isCurrent ? { boxShadow: `inset 0 0 0 2px ${visuals.color}` } : {}}
            >
              <div
                className="w-10 h-10 flex items-center justify-center mb-1 rounded"
                style={{ background: visuals.bgColor, color: visuals.color }}
              >
                {visuals.icon}
              </div>
              <div className="text-sm font-bold">
                {tier.label.replace(/\s*\(Top\s*\d+\)/i, '')}
              </div>
              <div className="text-lg font-extrabold" style={{ color: visuals.color }}>
                {tier.pricingPerMonth === 0 ? 'Free' : fmtVnd(tier.pricingPerMonth)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {tier.priorityLevel === 0 ? 'Xếp hạng cơ bản' : `Ưu tiên hiển thị`}
              </div>

              {isCurrent ? (
                isLapsed && tier.id !== 0 ? (
                  <Button
                    size="sm"
                    className="mt-auto rounded-none text-xs w-full"
                    style={{ background: visuals.color, color: '#fff' }}
                    onClick={() => onSelectTier(selectedWarehouse, tier)}
                  >
                    Gia hạn ngay
                  </Button>
                ) : selectedWarehouse.isSponsor ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-auto rounded-none text-xs w-full border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onSelectTier(selectedWarehouse, sponsorTiers.find(t => t.id === 0) || sponsorTiers[0])}
                  >
                    Hủy Gói
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-auto rounded-none text-xs w-full border-[var(--color-border)] text-[var(--color-text-muted)] cursor-default"
                    disabled
                  >
                    Gói hiện tại
                  </Button>
                )
              ) : isUpgrade ? (
                <Button
                  size="sm"
                  className="mt-auto rounded-none text-xs w-full"
                  style={{ background: visuals.color, color: '#fff' }}
                  onClick={() => onSelectTier(selectedWarehouse, tier)}
                >
                  Nâng cấp gói
                </Button>
              ) : isDowngrade ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto rounded-none text-xs w-full border-[var(--color-border)]"
                  onClick={() => onSelectTier(selectedWarehouse, tier)}
                >
                  Hạ xuống
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
