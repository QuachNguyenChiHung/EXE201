import React from 'react';
import { AiSubscriptionTier } from '../../../types/public';
import { Sparkles, CheckCircle } from 'lucide-react';

interface Props {
  aiTiers: AiSubscriptionTier[];
  currentTierId?: number;
  onSelectTier: (tier: AiSubscriptionTier) => void;
  loading?: boolean;
}

const TIER_COLORS = [
  { color: '#6b7280', bgColor: '#f3f4f6' },
  { color: '#3b82f6', bgColor: '#eff6ff' },
  { color: '#f59e0b', bgColor: '#fffbeb' },
  { color: '#8b5cf6', bgColor: '#f5f3ff' },
];

const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function AISubscriptionPricingGrid({ aiTiers, currentTierId, onSelectTier, loading }: Props) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4  border border-[var(--color-border)] mb-8`}
      style={{ gridTemplateColumns: aiTiers.length >= 3 ? 'repeat(3, 1fr)' : undefined }}>
      {aiTiers.map((tier, idx) => {
        const visuals = TIER_COLORS[idx % TIER_COLORS.length];
        const isActive = tier.id_ai_subscription === currentTierId;

        return (
          <div
            key={tier.id_ai_subscription}
            className="relative bg-[var(--color-surface)] flex flex-col"
            style={isActive ? { boxShadow: `inset 0 3px 0 ${visuals.color}` } : {}}
          >
            {isActive && (
              <div
                className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-white"
                style={{ background: visuals.color }}
              >
                Đang dùng
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              {/* Icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded"
                  style={{ background: visuals.bgColor, color: visuals.color }}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: visuals.color }}>{tier.label}</div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-extrabold" style={{ color: visuals.color }}>
                  {tier.price === 0 ? 'Miễn phí' : fmtVnd(tier.price)}
                </span>
                {tier.price > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)] ml-1">/tháng</span>
                )}
              </div>

              {/* Description */}
              {tier.desciption && (
                <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                  {tier.desciption}
                </p>
              )}

              {/* Token limits */}
              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="font-medium">Token đầu vào:</span>
                  <span className="font-semibold" style={{ color: visuals.color }}>
                    {formatTokens(tier.token_input)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="font-medium">Token đầu ra:</span>
                  <span className="font-semibold" style={{ color: visuals.color }}>
                    {formatTokens(tier.token_output)}
                  </span>
                </div>
                {tier.unit && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="font-medium">Đơn vị:</span>
                    <span className="font-semibold" style={{ color: visuals.color }}>
                      {tier.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <ul className="space-y-2 flex-1 mt-2">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: visuals.color }} />
                  <span className="text-[var(--color-text-secondary)]">Tìm kiếm kho lạnh bằng AI</span>
                </li>
                {idx > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: visuals.color }} />
                    <span className="text-[var(--color-text-secondary)]">So sánh chi tiết</span>
                  </li>
                )}
                {idx > 1 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: visuals.color }} />
                    <span className="text-[var(--color-text-secondary)]">Hỗ trợ ưu tiên</span>
                  </li>
                )}
                {idx > 2 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: visuals.color }} />
                    <span className="text-[var(--color-text-secondary)]">Không giới hạn chat</span>
                  </li>
                )}
              </ul>

              {/* CTA */}
              <button
                onClick={() => !isActive && onSelectTier(tier)}
                disabled={isActive || loading}
                className="mt-6 w-full py-2 text-sm font-semibold transition-colors"
                style={{
                  background: isActive ? visuals.bgColor : visuals.color,
                  color: isActive ? visuals.color : '#fff',
                  opacity: isActive || loading ? 0.7 : 1,
                  cursor: isActive ? 'default' : 'pointer',
                }}
              >
                {isActive ? 'Đang sử dụng' : tier.price === 0 ? 'Dùng miễn phí' : 'Mua ngay'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
