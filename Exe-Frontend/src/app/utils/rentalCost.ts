// ─── Rental cost calculation utilities ────────────────────────────────────────
// Shared between RentalRequestModal (renter-side) and WarehouseRequestCard
// (owner-side) so both views render the same number for the same data.
//
// Formula:
//   cost_per_section = tierValue × duration × convert(durUnit → tierUnit) × area
//
// `convert(durUnit → tierUnit)` collapses both the tier rate and the requested
// duration into a single normalised "tier units" basis, so e.g. a 260,000 VND
// per-year tier rented for 12 months becomes 260,000 × 12 × (1/12) = 260,000
// (the renter is paying for one full year at the annual rate).

export const UNIT_CONVERSION: Record<string, Record<string, number>> = {
    day:   { day: 1,           week: 1 / 7,       month: 1 / 30,      year: 1 / 365 },
    week:  { day: 7,           week: 1,           month: 7 / 30,      year: 7 / 365 },
    month: { day: 30,          week: 30 / 7,      month: 1,           year: 1 / 12 },
    year:  { day: 365,         week: 365 / 7,     month: 12,          year: 1 },
};

// Multiplier that turns "N <unit>" into "N <targetUnit>".
// e.g. unitMonths('year') = 12, unitMonths('day') = 1/30.
export function unitMonths(unit: string): number {
    const u = (unit || '').toLowerCase();
    if (u === 'year' || u === 'years' || u === 'năm' || u === 'nam') return 12;
    if (u === 'month' || u === 'months' || u === 'tháng' || u === 'thang') return 1;
    if (u === 'week' || u === 'weeks' || u === 'tuần' || u === 'tuan') return 7 / 30;
    if (u === 'day' || u === 'days' || u === 'ngày' || u === 'ngay') return 1 / 30;
    return 1;
}

// Vietnamese unit labels (matches `WarehouseFormUtils.PRICE_TIER_OPTIONS`).
const UNIT_LABEL_VI: Record<string, string> = {
    year: 'năm', year_plural: 'năm',
    month: 'tháng',
    week: 'tuần',
    day: 'ngày',
};

export function tierUnitLabelVi(unit: string): string {
    if (!unit) return unit;
    const u = unit.toLowerCase();
    if (UNIT_LABEL_VI[u]) return UNIT_LABEL_VI[u];
    if (u === 'years' || u === 'năm' || u === 'nam') return 'Năm';
    if (u === 'months' || u === 'tháng' || u === 'thang') return 'Tháng';
    if (u === 'weeks' || u === 'tuần' || u === 'tuan') return 'Tuần';
    if (u === 'days' || u === 'ngày' || u === 'ngay') return 'Ngày';
    return unit;
}

/**
 * Cost of a single section over the requested duration.
 *
 * @param tierValue   Price per m³ per `tierUnit` (e.g. 260_000).
 * @param tierUnit    Rate unit of the tier ("year" | "month" | "week" | "day", or Vietnamese variants).
 * @param durValue    Duration magnitude (e.g. 1).
 * @param durUnit     Duration unit (same vocabulary as `tierUnit`).
 * @param rentedArea  Volume booked in m³ (or whatever the section's area unit is).
 */
export function calcSectionCost(
    tierValue: number,
    tierUnit: string,
    durValue: number | string,
    durUnit: string,
    rentedArea: number,
): number {
    const v = typeof durValue === 'string' ? parseFloat(durValue) : durValue;
    const a = Number(rentedArea) || 0;
    if (!isFinite(v) || v <= 0 || a <= 0) return 0;

    // Convert "what the renter is paying for" (in durUnit) into "the tier's rate unit".
    // E.g. renting for 1 year against a per-month tier → multiply by 12.
    // Equivalently: tierUnit-months / durUnit-months.
    const durMonths = unitMonths(durUnit);
    const tierMonths = unitMonths(tierUnit);
    const conversion = durMonths / tierMonths; // same as UNIT_CONVERSION[durUnit][tierUnit]

    return (Number(tierValue) || 0) * v * conversion * a;
}

/**
 * Sum cost across all sections of a rental request, applying each section's
 * own tier unit (which may differ across sections).
 */
export interface SectionCostInput {
    tierValue: number;
    tierUnit: string;
    rentedArea: number;
}

export function sumRequestCost(
    sections: SectionCostInput[],
    durValue: number | string,
    durUnit: string,
): number {
    return sections.reduce(
        (acc, s) => acc + calcSectionCost(s.tierValue, s.tierUnit, durValue, durUnit, s.rentedArea),
        0,
    );
}
