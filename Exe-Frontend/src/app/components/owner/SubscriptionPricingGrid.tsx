import React from 'react';
import { SponsorTierDTO } from '../../../types';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { fmtVnd, getSponsorTierVisuals } from './SubscriptionUtils';

interface Props {
  sponsorTiers: SponsorTierDTO[];
}

export function SubscriptionPricingGrid({ sponsorTiers }: Props) {
  let gridColsClass = "lg:grid-cols-4";
  if (sponsorTiers.length === 2) gridColsClass = "lg:grid-cols-2";
  if (sponsorTiers.length === 3) gridColsClass = "lg:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-px bg-[var(--color-border)] border border-[var(--color-border)] mb-8`}>
      {sponsorTiers.map(tier => {
        const visuals = getSponsorTierVisuals(tier.priorityLevel);
        const isPopular = tier.priorityLevel === 1; // Highlight Top 1 (Vàng)
        return (
          <div
            key={tier.id}
            className="relative bg-[var(--color-surface)] flex flex-col"
            style={isPopular ? { boxShadow: `inset 0 3px 0 ${visuals.color}` } : {}}
          >
            {isPopular && (
              <div
                className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-white"
                style={{ background: visuals.color }}
              >
                Phổ biến nhất
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              {/* Icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded"
                  style={{ background: visuals.bgColor, color: visuals.color }}
                >
                  {visuals.icon}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: visuals.color }}>{tier.label.replace(/\s*\(Top\s*\d+\)/i, '')}</div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-extrabold" style={{ color: visuals.color }}>
                  {tier.pricingPerMonth === 0 ? 'Miễn phí' : fmtVnd(tier.pricingPerMonth)}
                </span>
                {tier.pricingPerMonth > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)] ml-1">/tháng</span>
                )}
              </div>

              {/* Boost indicator */}
              <div
                className="flex items-center gap-2 px-3 py-2 mb-4 text-sm rounded"
                style={{ background: visuals.bgColor, color: visuals.color }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">
                  {tier.priorityLevel === 0
                    ? 'Xếp hạng cơ bản'
                    : `Ưu tiên hiển thị`}
                </span>
              </div>


            </div>
          </div>
        );
      })}
    </div>
  );
}
