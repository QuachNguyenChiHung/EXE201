import { SUBSCRIPTION_TIERS, SubscriptionTierLevel } from '../../types';
import { TrendingUp } from 'lucide-react';

interface SubscriptionTierBadgeProps {
  tier?: SubscriptionTierLevel;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBoost?: boolean;
}

const SIZE_MAP = {
  xs: { fontSize: '0.55rem', iconFontSize: '0.5rem', padding: '0px 4px', lineHeight: '1.3' },
  sm: { fontSize: '0.6rem', iconFontSize: '0.55rem', padding: '1px 6px', lineHeight: '1.3' },
  md: { fontSize: '0.7rem', iconFontSize: '0.65rem', padding: '2px 8px', lineHeight: '1.4' },
  lg: { fontSize: '0.8rem', iconFontSize: '0.75rem', padding: '4px 10px', lineHeight: '1.4' },
};

export function SubscriptionTierBadge({
  tier,
  size = 'sm',
  showLabel = true,
  showBoost = false,
}: SubscriptionTierBadgeProps) {
  const level = tier ?? 'free';
  if (level === 'free') return null;

  const config = SUBSCRIPTION_TIERS[level];
  const s = SIZE_MAP[size];

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold whitespace-nowrap shrink-0"
      style={{
        fontSize: s.fontSize,
        padding: s.padding,
        background: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}30`,
        lineHeight: s.lineHeight,
        letterSpacing: '0.03em',
      }}
    >
      <span style={{ fontSize: s.iconFontSize }}>{config.icon}</span>
      {showLabel && config.label}
      {showBoost && (
        <span className="inline-flex items-center gap-0.5 opacity-80">
          <TrendingUp style={{ width: '0.65em', height: '0.65em' }} />
          ×{config.boostFactor}
        </span>
      )}
    </span>
  );
}

/** Full tier info strip — used in cards for more detail */
export function SubscriptionTierStrip({ tier }: { tier?: SubscriptionTierLevel }) {
  const level = tier ?? 'free';
  if (level === 'free') return null;

  const config = SUBSCRIPTION_TIERS[level];

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 text-xs"
      style={{
        background: config.bgColor,
        color: config.color,
        borderLeft: `3px solid ${config.color}`,
      }}
    >
      <span style={{ fontSize: '0.85rem' }}>{config.icon}</span>
      <span className="font-semibold">{config.label}</span>
      <span className="opacity-70">·</span>
      <span className="flex items-center gap-0.5">
        <TrendingUp style={{ width: 12, height: 12 }} />
        +{Math.round((config.boostFactor - 1) * 100)}% ưu tiên tìm kiếm
      </span>
    </div>
  );
}
