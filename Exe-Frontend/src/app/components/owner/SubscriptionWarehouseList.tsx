import React from 'react';
import { SponsorTierDTO, CompositeWarehouse } from '../../../types';
import { Warehouse, Search, Zap, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getSponsorTierVisuals } from './SubscriptionUtils';

interface SubscriptionWarehouseListProps {
  warehouses: CompositeWarehouse[];
  sponsorTiers: SponsorTierDTO[];
  onSelectWarehouse: (wh: CompositeWarehouse) => void;
}

export function SubscriptionWarehouseList({
  warehouses,
  sponsorTiers,
  onSelectWarehouse,
}: SubscriptionWarehouseListProps) {
  if (warehouses.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
        <Warehouse className="h-10 w-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Bạn chưa có kho lạnh nào. Hãy thêm kho trước khi nâng cấp gói.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
      {warehouses.map(wh => {
        const currentTierId = wh.isSponsor ? (wh.sponsor_type || 0) : 0;
        const currentTierObj = sponsorTiers.find(t => t.id === currentTierId) || sponsorTiers[0];
        const visuals = currentTierObj ? getSponsorTierVisuals(currentTierObj.priorityLevel) : getSponsorTierVisuals(0);
        
        // Find highest tier priority to know if it's "Platinum" equivalent
        const maxPriority = Math.max(...sponsorTiers.map(t => t.priorityLevel));

        return (
          <div
            key={wh.id_warehouse}
            className="bg-[var(--color-surface)] p-5 flex flex-col gap-3 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
            onClick={() => onSelectWarehouse(wh)}
          >
            {/* Name + tier badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{wh.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {wh.location?.city || wh.location_province}, {wh.location?.province || wh.location_province}
                </p>
              </div>
              <span
                className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded"
                style={{
                  background: visuals.bgColor,
                  color: visuals.color,
                  border: `1px solid ${visuals.color}30`,
                }}
              >
                {visuals.icon} {currentTierObj ? currentTierObj.label.replace(/\s*\(Top\s*\d+\)/i, '') : 'Miễn phí'}
              </span>
            </div>

            {/* Boost info */}
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <strong style={{ color: visuals.color }}>
                {(currentTierObj?.priorityLevel || 0) === 0 ? 'Xếp hạng cơ bản' : 'Ưu tiên hiển thị'}
              </strong>
            </div>

            {wh.isSponsor && currentTierObj?.priorityLevel !== 0 ? (
              <button
                className="mt-auto flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  onSelectWarehouse(wh);
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
                Hủy Gói
              </button>
            ) : currentTierObj?.priorityLevel !== 0 ? (
              <div className="mt-auto flex items-center gap-1 text-xs font-semibold" style={{ color: visuals.color }}>
                <CheckCircle className="h-3.5 w-3.5" />
                {(currentTierObj?.priorityLevel || 0) === maxPriority ? 'Gói cao nhất' : 'Đã đăng ký'}
              </div>
            ) : (
              <div className="mt-auto flex items-center gap-1 text-xs font-semibold" style={{ color: visuals.color }}>
                <CheckCircle className="h-3.5 w-3.5" />
                Mặc định
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
