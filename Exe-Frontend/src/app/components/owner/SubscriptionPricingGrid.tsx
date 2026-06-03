import React from 'react';
import { SUBSCRIPTION_TIERS } from '../../../types';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { fmtVnd, TIER_ICONS } from './SubscriptionUtils';

export function SubscriptionPricingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] border border-[var(--color-border)] mb-8">
      {Object.keys(SUBSCRIPTION_TIERS).map(level => {
        const config = SUBSCRIPTION_TIERS[level as keyof typeof SUBSCRIPTION_TIERS];
        const isPopular = level === 'gold';
        return (
          <div
            key={level}
            className="relative bg-[var(--color-surface)] flex flex-col"
            style={isPopular ? { boxShadow: `inset 0 3px 0 ${config.color}` } : {}}
          >
            {isPopular && (
              <div
                className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-white"
                style={{ background: config.color }}
              >
                Phổ biến nhất
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              {/* Icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ background: config.bgColor, color: config.color }}
                >
                  {TIER_ICONS[level as keyof typeof TIER_ICONS]}
                </div>
                <div>
                  <div className="font-bold text-sm">{config.icon} {config.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{config.labelVi}</div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-extrabold" style={{ color: config.color }}>
                  {config.monthlyPrice === 0 ? 'Miễn phí' : fmtVnd(config.monthlyPrice)}
                </span>
                {config.monthlyPrice > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)] ml-1">/tháng</span>
                )}
              </div>

              {/* Boost indicator */}
              <div
                className="flex items-center gap-2 px-3 py-2 mb-4 text-sm"
                style={{ background: config.bgColor, color: config.color }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">
                  {config.boostFactor === 1
                    ? 'Xếp hạng cơ bản'
                    : `+${Math.round((config.boostFactor - 1) * 100)}% ưu tiên tìm kiếm`}
                </span>
              </div>

              {/* Benefits */}
              <ul className="space-y-2 flex-1">
                {config.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{ color: config.color }}
                    />
                    <span className="text-[var(--color-text-secondary)]">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
