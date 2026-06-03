import React from 'react';
import { SUBSCRIPTION_TIERS, SubscriptionTierLevel, CompositeWarehouse } from '../../../types';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { fmtVnd, TIER_ICONS, currentTier, tierIdx } from './SubscriptionUtils';

interface SubscriptionTierPickerProps {
  selectedWarehouse: CompositeWarehouse | null;
  onClose: () => void;
  onSelectTier: (warehouse: CompositeWarehouse, tier: SubscriptionTierLevel) => void;
}

export function SubscriptionTierPicker({
  selectedWarehouse,
  onClose,
  onSelectTier,
}: SubscriptionTierPickerProps) {
  if (!selectedWarehouse) return null;

  return (
    <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Chọn gói cho: {selectedWarehouse.name}</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Gói hiện tại:{' '}
            <strong style={{ color: SUBSCRIPTION_TIERS[currentTier(selectedWarehouse)].color }}>
              {SUBSCRIPTION_TIERS[currentTier(selectedWarehouse)].icon}{' '}
              {SUBSCRIPTION_TIERS[currentTier(selectedWarehouse)].label}
            </strong>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)]">
        {Object.keys(SUBSCRIPTION_TIERS).map(level => {
          const config = SUBSCRIPTION_TIERS[level as keyof typeof SUBSCRIPTION_TIERS];
          const isCurrent = currentTier(selectedWarehouse) === level;
          const isDowngrade = tierIdx(level as SubscriptionTierLevel) < tierIdx(currentTier(selectedWarehouse));
          const isUpgrade = tierIdx(level as SubscriptionTierLevel) > tierIdx(currentTier(selectedWarehouse));

          return (
            <div
              key={level}
              className="bg-[var(--color-surface)] p-4 flex flex-col items-center text-center gap-2"
              style={isCurrent ? { boxShadow: `inset 0 0 0 2px ${config.color}` } : {}}
            >
              <div
                className="w-10 h-10 flex items-center justify-center mb-1"
                style={{ background: config.bgColor, color: config.color }}
              >
                {TIER_ICONS[level as keyof typeof TIER_ICONS]}
              </div>
              <div className="text-sm font-bold">
                {config.icon} {config.label}
              </div>
              <div className="text-lg font-extrabold" style={{ color: config.color }}>
                {config.monthlyPrice === 0 ? 'Free' : fmtVnd(config.monthlyPrice)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                ×{config.boostFactor} boost
              </div>

              {isCurrent ? (
                <div
                  className="mt-auto text-xs font-semibold px-3 py-1.5"
                  style={{ background: config.bgColor, color: config.color }}
                >
                  Gói hiện tại
                </div>
              ) : isUpgrade ? (
                <Button
                  size="sm"
                  className="mt-auto rounded-none text-xs w-full"
                  style={{ background: config.color, color: '#fff' }}
                  onClick={() => onSelectTier(selectedWarehouse, level as SubscriptionTierLevel)}
                >
                  Nâng cấp
                </Button>
              ) : isDowngrade ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto rounded-none text-xs w-full border-[var(--color-border)]"
                  onClick={() => onSelectTier(selectedWarehouse, level as SubscriptionTierLevel)}
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
