import React, { useState, useEffect, useMemo } from 'react';
import { Send } from 'lucide-react';
import { CompositeWarehouse } from '../../../types';
import { PRICE_TIER_OPTIONS } from '../owner/WarehouseFormUtils';

// ─── Time unit helpers ─────────────────────────────────────────────────────────

/** Extract time unit key (day/week/month/year) from a tier label like "Giá theo tháng" */
function tierTimeUnit(label: string | undefined): string {
    if (!label) return 'month';
    const match = PRICE_TIER_OPTIONS.find(o => o.label === label);
    return match?.unit || 'month';
}

/** Human-readable period short label from a tier label, e.g. "Giá theo tháng" → "tháng" */
function tierPeriodLabel(label: string | undefined): string {
    if (!label) return 'tháng';
    const matched = PRICE_TIER_OPTIONS.find(o => o.label === label);
    return matched ? matched.label.replace('Giá theo ', '') : label.replace('Giá theo ', '') || 'tháng';
}

// ─── Time unit constants & conversion ─────────────────────────────────────────

const DAYS_PER_UNIT: Record<string, number> = {
    day: 1, week: 7, month: 30, year: 365,
};

const UNIT_CONVERSION: Record<string, Record<string, number>> = {
    day: { day: 1, week: 1 / 7, month: 1 / 30, year: 1 / 365 },
    week: { day: 7, week: 1, month: 7 / 30, year: 7 / 365 },
    month: { day: 30, week: 30 / 7, month: 1, year: 1 / 12 },
    year: { day: 365, week: 365 / 7, month: 12, year: 1 },
};

const TIER_RANK: Record<string, number> = { day: 0, week: 1, month: 2, year: 3 };

function getRestrictiveTierUnit(selectedSections: any[], selectedTiers: Record<string, number>): string {
    const hasUnit = (unit: string) =>
        selectedSections.some(sec => {
            const sid = sec.id_section?.toString() || '';
            const tierIdx = selectedTiers[sid];
            const tier = sec.priceTiers?.[tierIdx as number];
            if (tierIdx === undefined || !tier) return false;
            return tierTimeUnit(tier.label) === unit;
        });

    if (hasUnit('year')) return 'year';
    if (hasUnit('month')) return 'month';
    if (hasUnit('week')) return 'week';
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
    // Capacity strings — used only for the sidebar price estimate
    sectionCapacities: Record<string, string>;
    onSectionCapacitiesChange: (caps: Record<string, string>) => void;
    // Tier selection — shared so sidebar can drive canOpenModal
    onSelectedTiersChange: (tiers: Record<string, number>) => void;
    // Trigger to open the rental modal
    onOpenRentalModal: () => void;
    // Whether the warehouse is currently open for new rental requests (status === ACTIVE)
    isRentable: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WarehouseDetailSidebar({
    warehouse,
    selectedTiers,
    selectedSectionIds,
    onSelectSectionIds,
    sectionCapacities,
    onSectionCapacitiesChange,
    onSelectedTiersChange,
    onOpenRentalModal,
    isRentable,
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
                const tier = sec.priceTiers?.[tierIdx as number];
                if (tierIdx === undefined || !tier) return null;

                const area = parseFloat(sectionCapacities[sectionId]);
                if (isNaN(area) || area <= 0) return null;

                const timeUnit = tierTimeUnit(tier.label);
                // Preview using month as reference duration
                const cost = calcSectionCost(
                    tier.value ?? 0,
                    timeUnit,
                    1,
                    'month',
                    area
                );

                return {
                    sectionId,
                    sectionName: sec.name || `Phân khu ${sec.sector}`,
                    area,
                    tierValue: tier.value ?? 0,
                    tierUnit: timeUnit,
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
                const tier = sec.priceTiers?.[tierIdx as number];
                if (tierIdx !== undefined && tier) {
                    const u = tierTimeUnit(tier.label);
                    if (availableUnits.includes(u)) return u;
                }
            }
            const restrictive = getRestrictiveTierUnit(selectedSections, selectedTiers);
            if (availableUnits.includes(restrictive)) return restrictive;
            return tierTimeUnit(warehouse.priceTiers?.[0]?.label);
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

    const canOpenModal = selectedSectionIds.length > 0
        && selectedSections.every(s => selectedTiers[s.id_section?.toString() || ''] !== undefined);

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

                                    {/* Tier selector — shown when section is selected */}
                                    {isSelected && sec.priceTiers && sec.priceTiers.length > 0 && (() => {
                                        const tierIdx = selectedTiers[sectionId];
                                        return (
                                            <div className="mt-3 pl-6">

                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>



                {/* ── CTA button ───────────────────────────────────────────────── */}
                <div className="pt-2 border-t bg-white border-[var(--color-border)]">
                    {!isRentable && (
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">
                            {String(warehouse.status || '').toUpperCase() === 'RENTED'
                                ? 'Kho đã cho thuê hết công suất, hiện không nhận thêm yêu cầu.'
                                : 'Kho hiện không mở cho yêu cầu thuê mới.'}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={onOpenRentalModal}
                        disabled={!isRentable || selectedSectionIds.length === 0}
                        className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Send className="h-4 w-4" />
                        Đăng ký thuê kho
                    </button>

                </div>
            </div>
        </div>
    );
}
