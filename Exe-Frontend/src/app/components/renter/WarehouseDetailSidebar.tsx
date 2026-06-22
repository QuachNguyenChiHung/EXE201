import React, { useState, useEffect, useMemo } from 'react';
import { Send } from 'lucide-react';
import { CompositeWarehouse } from '../../../types';
import { PRICE_TIER_OPTIONS } from '../owner/WarehouseFormUtils';

// ─── Time unit constants & conversion ─────────────────────────────────────────

const DAYS_PER_UNIT: Record<string, number> = {
    day: 1, week: 7, month: 30, year: 365,
};

const UNIT_CONVERSION: Record<string, Record<string, number>> = {
    day:   { day: 1,     week: 1/7,   month: 1/30,  year: 1/365 },
    week:  { day: 7,     week: 1,     month: 7/30,  year: 7/365 },
    month: { day: 30,    week: 30/7,  month: 1,     year: 1/12  },
    year:  { day: 365,   week: 365/7, month: 12,    year: 1     },
};

const TIER_RANK: Record<string, number> = { day: 0, week: 1, month: 2, year: 3 };

function getRestrictiveTierUnit(selectedSections: any[], selectedTiers: Record<string, number>): string {
    const hasUnit = (unit: string) =>
        selectedSections.some(sec => {
            const sid = sec.id_section?.toString() || '';
            const tierIdx = selectedTiers[sid];
            if (tierIdx === undefined) return false;
            const tier = sec.priceTiers?.[tierIdx];
            if (!tier) return false;
            return (tier.unit || 'month') === unit;
        });

    if (hasUnit('year'))  return 'year';
    if (hasUnit('month')) return 'month';
    if (hasUnit('week'))  return 'week';
    return 'day';
}

function getAllowedDurationUnits(restrictiveUnit: string): string[] {
    const unitOrder = ['day', 'week', 'month', 'year'];
    const restrictiveRank = TIER_RANK[restrictiveUnit] ?? 0;
    return unitOrder.filter(u => (TIER_RANK[u] ?? 0) >= restrictiveRank);
}

function calcSectionCost(
    tierValue: number, tierUnit: string,
    durValue: number, durUnit: string, rentedArea: number
): number {
    const conversion = UNIT_CONVERSION[durUnit]?.[tierUnit] ?? 1;
    return tierValue * durValue * conversion * rentedArea;
}

function rentalDays(value: number, unit: string): number {
    return value * (DAYS_PER_UNIT[unit] ?? 1);
}

function rentalMonths(value: number, unit: string): number {
    return rentalDays(value, unit) / 30;
}

// ─── Component props ───────────────────────────────────────────────────────────

export interface WarehouseDetailSidebarProps {
    warehouse: CompositeWarehouse;
    selectedTiers: Record<string, number>;
    selectedSectionIds: string[];
    onSelectSectionIds: (ids: string[], clearedTierIds: string[]) => void;
    // Section capacities shared with the modal
    sectionCapacities: Record<string, string>;
    onSectionCapacitiesChange: (caps: Record<string, string>) => void;
    // Trigger to open the rental modal
    onOpenRentalModal: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WarehouseDetailSidebar({
    warehouse,
    selectedTiers,
    selectedSectionIds,
    onSelectSectionIds,
    sectionCapacities,
    onSectionCapacitiesChange,
    onOpenRentalModal,
}: WarehouseDetailSidebarProps) {

    // ── Computed: selected section objects ─────────────────────────────────────
    const selectedSections = useMemo(() => {
        return (warehouse.sections || []).filter(s =>
            selectedSectionIds.includes(s.id_section?.toString() || '')
        );
    }, [warehouse.sections, selectedSectionIds]);

    // ── Auto-fill per-section capacities when new sections are added ───────────
    useEffect(() => {
        const updated = { ...sectionCapacities };
        let changed = false;
        selectedSectionIds.forEach(id => {
            if (!updated[id]) {
                const sec = warehouse.sections!.find(
                    s => (s.id_section?.toString() || '') === id
                );
                if (sec) {
                    updated[id] = String(sec.available_capacity || 0);
                    changed = true;
                }
            }
        });
        if (changed) {
            onSectionCapacitiesChange(updated);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSectionIds]);

    // ── Price estimate (sidebar preview) ──────────────────────────────────────
    // Uses the most-permissive duration (month) as a reference preview.
    const estimateResult = useMemo(() => {
        const breakdowns = selectedSections
            .map(sec => {
                const sectionId = sec.id_section?.toString() ?? '';
                const tierIdx = selectedTiers[sectionId];
                if (tierIdx === undefined) return null;

                const tier = sec.priceTiers?.[tierIdx];
                if (!tier) return null;

                const area = parseFloat(sectionCapacities[sectionId]);
                if (isNaN(area) || area <= 0) return null;

                // Preview using month as reference duration
                const cost = calcSectionCost(
                    tier.value ?? 0,
                    tier.unit || 'month',
                    1,
                    'month',
                    area
                );

                return {
                    sectionId,
                    sectionName: sec.name || `Phân khu ${sec.sector}`,
                    area,
                    tierValue: tier.value ?? 0,
                    tierUnit: tier.unit || 'month',
                    cost,
                };
            })
            .filter(Boolean);

        const total = breakdowns.reduce((sum, b) => sum + (b?.cost ?? 0), 0);

        // Available units for the estimate badge
        const availableUnits = selectedSections.length === 0
            ? ['day', 'week', 'month', 'year']
            : getAllowedDurationUnits(getRestrictiveTierUnit(selectedSections, selectedTiers));

        // Default unit for the estimate
        const defaultUnit = (() => {
            for (const sec of selectedSections) {
                const sid = sec.id_section?.toString() || '';
                const tierIdx = selectedTiers[sid];
                if (tierIdx !== undefined) {
                    const tier = sec.priceTiers?.[tierIdx];
                    if (tier) {
                        const u = tier.unit || 'month';
                        if (availableUnits.includes(u)) return u;
                    }
                }
            }
            const restrictive = getRestrictiveTierUnit(selectedSections, selectedTiers);
            if (availableUnits.includes(restrictive)) return restrictive;
            return warehouse.priceTiers?.[0]?.unit || 'month';
        })();

        return { breakdowns, total, defaultUnit };
    }, [selectedSections, selectedTiers, sectionCapacities, warehouse.priceTiers]);

    const { breakdowns: sidebarBreakdown, total: sidebarTotal, defaultUnit: sidebarDefaultUnit } = estimateResult;

    const pendingSections = useMemo(() =>
        selectedSections
            .filter(s => selectedTiers[s.id_section?.toString() || ''] === undefined)
            .map(s => s.name || `Phân khu ${s.sector}`),
        [selectedSections, selectedTiers]
    );

    const allSectionsHaveCapacity = useMemo(() =>
        selectedSections.every(s => {
            const area = parseFloat(sectionCapacities[s.id_section?.toString() || '']);
            return !isNaN(area) && area > 0;
        }),
        [selectedSections, sectionCapacities]
    );

    const allSectionsHaveTier = useMemo(() =>
        selectedSections.every(s =>
            selectedTiers[s.id_section?.toString() || ''] !== undefined
        ),
        [selectedSections, selectedTiers]
    );

    const canOpenModal = selectedSectionIds.length > 0 && allSectionsHaveCapacity && allSectionsHaveTier;

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="bento-card sticky top-24 border border-[var(--color-border)] shadow-xl overflow-hidden">
            <div className="p-5 text-white" style={{ background: 'var(--color-primary)' }}>
                <h3 className="text-lg font-bold">Kho {warehouse.name || 'Chi tiết kho'}</h3>
                {selectedSections.length > 0 && (
                    <p className="text-xs opacity-80 mt-0.5">
                        {selectedSections.length} phân khu đang chọn
                    </p>
                )}
            </div>

            <div className="p-5 space-y-4">

                {/* ── Section selector ─────────────────────────────────────────── */}
                <div>
                    <label className="block text-xs font-semibold mb-2 text-[var(--color-text-secondary)]">
                        Chọn Phân Khu
                    </label>
                    <div className="space-y-2 overflow-y-auto pr-2 max-h-64">
                        {warehouse.sections?.map(sec => {
                            const sectionId = sec.id_section?.toString() || '';
                            const isSelected = selectedSectionIds.includes(sectionId);

                            return (
                                <div
                                    key={sec.id_section}
                                    className={`p-2 border rounded-md transition-colors ${isSelected
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]'
                                        : 'hover:bg-[var(--color-bg-secondary)]'
                                        }`}
                                >
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={e => {
                                                const newIds = e.target.checked
                                                    ? [...selectedSectionIds, sectionId]
                                                    : selectedSectionIds.filter(id => id !== sectionId);
                                                const clearedTierIds = e.target.checked ? [] : [sectionId];
                                                onSelectSectionIds(newIds, clearedTierIds);
                                            }}
                                            className="mt-0.5 accent-[var(--color-primary)]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">
                                                {sec.name || `Phân khu ${sec.sector}`}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                Nhiệt độ: {sec.temp_min}°C ~ {sec.temp_max}°C
                                                &bull; Độ ẩm: {sec.humidity}%
                                            </p>
                                        </div>
                                    </label>

                                    {/* Capacity input — shown only when selected */}
                                    {isSelected && (() => {
                                        const capStr = sectionCapacities[sectionId] || '';
                                        const capVal = parseFloat(capStr);
                                        const isOverLimit = !isNaN(capVal) && capVal > sec.available_capacity;

                                        return (
                                            <div className="mt-3 pl-6">
                                                <label className="block text-[10px] font-medium mb-1 text-[var(--color-text-muted)]">
                                                    Dung tích cần thuê
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={sec.available_capacity}
                                                    required
                                                    placeholder={`Tối đa: ${sec.available_capacity} m³`}
                                                    className={`w-full text-xs px-2 py-1.5 border rounded focus:outline-none bg-[var(--color-surface)] ${isOverLimit
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : 'focus:border-[var(--color-primary)]'
                                                        }`}
                                                    value={capStr}
                                                    onChange={e => {
                                                        onSectionCapacitiesChange({
                                                            ...sectionCapacities,
                                                            [sectionId]: e.target.value,
                                                        });
                                                    }}
                                                />
                                                {isOverLimit && (
                                                    <p className="text-[10px] text-red-500 mt-1">
                                                        Vượt quá sức chứa tối đa ({sec.available_capacity} m³)
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Price estimate preview ───────────────────────────────────── */}
                {selectedSectionIds.length > 0 && sidebarBreakdown.length > 0 && (
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-4">
                        <p className="text-sm font-semibold text-[var(--color-text)] mb-3">
                            Dự toán chi phí (tham khảo)
                        </p>

                        {pendingSections.length > 0 && (
                            <div className="mb-3 p-3 rounded-md bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)]">
                                <p className="text-xs font-medium text-[var(--color-warning)] mb-1">
                                    Chưa chọn gói giá
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    Vui lòng chọn gói giá cho: {pendingSections.join(', ')}
                                </p>
                            </div>
                        )}

                        {sidebarBreakdown.map(b => {
                            if (!b) return null;
                            const unitLabel =
                                PRICE_TIER_OPTIONS.find(o => o.unit === b.tierUnit)?.label?.replace('Giá theo ', '') ?? b.tierUnit;

                            return (
                                <div key={b.sectionId} className="mb-2 last:mb-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <span className="text-xs font-medium text-[var(--color-text)]">
                                            {b.sectionName}
                                            <span className="text-[var(--color-text-muted)] font-normal ml-1">
                                                ({b.area > 0 ? b.area.toFixed(1) : '0'} m³)
                                            </span>
                                        </span>
                                        <span className="text-xs font-semibold text-[var(--color-text)]">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(b.cost)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-[var(--color-text-muted)]">
                                        {b.tierValue?.toLocaleString('vi-VN')} đ/{unitLabel}/m³
                                        <span className="mx-1">·</span>
                                        1 {unitLabel}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-[var(--color-text)]">
                                    Tổng/tháng (ước tính)
                                </span>
                                <span className="text-base font-bold text-[var(--color-primary)]">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(sidebarTotal)}
                                </span>
                            </div>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                                Giá chính xác phụ thuộc vào thời hạn thuê thực tế
                            </p>
                        </div>
                    </div>
                )}

                {/* ── CTA button ───────────────────────────────────────────────── */}
                <div className="pt-2 border-t bg-white border-[var(--color-border)]">
                    <button
                        type="button"
                        onClick={onOpenRentalModal}
                        disabled={!canOpenModal}
                        className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md hover:opacity-90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Send className="h-4 w-4" />
                        Đăng ký thuê kho
                    </button>
                    {!canOpenModal && selectedSectionIds.length > 0 && (
                        <p className="text-[10px] text-center mt-2 text-[var(--color-warning)]">
                            {!allSectionsHaveCapacity
                                ? 'Vui lòng nhập dung tích cho các phân khu đã chọn'
                                : 'Vui lòng chọn gói giá cho các phân khu đã chọn'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
