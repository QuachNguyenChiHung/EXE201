import React, { useState, useEffect, useMemo } from 'react';
import { Send, Check, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { CompositeWarehouse } from '../../../types';
import { toast } from 'sonner';
import { renterService } from '../../../services/renterService';
import { userService } from '../../../services/userService';
import { getUser } from '../../../utils/auth';
import { PRICE_TIER_OPTIONS } from '../owner/WarehouseFormUtils';
import {
    calcSectionCost,
    tierUnitLabelVi,
    unitMonths,
} from '../../utils/rentalCost';

// ─── Time unit constants & conversion ─────────────────────────────────────────

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

function computeEndDate(startDate: string, value: number, unit: string): string {
    if (!startDate || value <= 0) return '';
    const end = new Date(startDate);
    const u = unit.toLowerCase();
    if (u === 'day') end.setDate(end.getDate() + value);
    if (u === 'week') end.setDate(end.getDate() + value * 7);
    if (u === 'month') end.setMonth(end.getMonth() + value);
    if (u === 'year') end.setFullYear(end.getFullYear() + value);
    return end.toISOString().split('T')[0];
}

function rentalDays(value: number, unit: string): number {
    return value * (1 / unitMonths(unit));
}

function unitLabel(unit: string): string {
    return (
        PRICE_TIER_OPTIONS.find(o => o.unit === unit)?.label?.replace('Giá theo ', '') ??
        tierUnitLabelVi(unit)
    );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InquiryForm {
    name: string;
    phone: string;
    email: string;
    cargoType: string;
    sectionCapacities: Record<string, string>;
    durationValue: string;
    durationUnit: string;
    startDate: string;
    endDate: string;
    message: string;
}

export interface RentalRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouse: CompositeWarehouse;
    selectedSections: any[];
    selectedTiers: Record<string, number>;
    onSelectedTiersChange: (tiers: Record<string, number>) => void;
    sectionCapacities: Record<string, string>;
    onSectionCapacitiesChange: (caps: Record<string, string>) => void;
    /** Called after the request is successfully submitted — parent should clear selection state. */
    onRequestSubmitted?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RentalRequestModal({
    open, onOpenChange,
    warehouse,
    selectedSections,
    selectedTiers,
    onSelectedTiersChange,
    sectionCapacities,
    onSectionCapacitiesChange,
    onRequestSubmitted,
}: RentalRequestModalProps) {
    const user = useMemo(() => getUser(), []);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Reset form + success state whenever the modal closes
    useEffect(() => {
        if (!open) {
            setShowSuccess(false);
            setSubmitting(false);
            setForm({
                name: user?.name ?? '',
                phone: user?.phone ?? '',
                email: user?.email ?? '',
                cargoType: '',
                sectionCapacities,
                durationValue: '',
                durationUnit: defaultUnit,
                startDate: '',
                endDate: '',
                message: '',
            });
        }
    }, [open]);

    const availableUnits = useMemo(() => {
        if (selectedSections.length === 0) return ['day', 'week', 'month', 'year'];
        return getAllowedDurationUnits(getRestrictiveTierUnit(selectedSections, selectedTiers));
    }, [selectedSections, selectedTiers]);

    const defaultUnit = useMemo(() => {
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
    }, [selectedSections, selectedTiers, availableUnits, warehouse.priceTiers]);

    const [form, setForm] = useState<InquiryForm>({
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        email: user?.email ?? '',
        cargoType: '',
        sectionCapacities,
        durationValue: '',
        durationUnit: defaultUnit,
        startDate: '',
        endDate: '',
        message: '',
    });

    // Sync capacities from parent when they change
    useEffect(() => {
        setForm(f => ({ ...f, sectionCapacities }));
    }, [sectionCapacities]);

    // Sync durationUnit when defaultUnit changes
    useEffect(() => {
        setForm(f => ({ ...f, durationUnit: defaultUnit }));
    }, [defaultUnit]);

    // Sync end date
    useEffect(() => {
        if (!form.startDate || !form.durationValue) {
            setForm(f => ({ ...f, endDate: '' }));
            return;
        }
        const val = parseFloat(form.durationValue);
        if (isNaN(val) || val <= 0) {
            setForm(f => ({ ...f, endDate: '' }));
            return;
        }
        setForm(f => ({ ...f, endDate: computeEndDate(form.startDate, val, form.durationUnit) }));
    }, [form.startDate, form.durationValue, form.durationUnit]);

    // Fetch latest profile when modal opens so phone/email are always up-to-date
    useEffect(() => {
        if (open) {
            userService.getMyProfile().then(profile => {
                setForm(f => ({
                    ...f,
                    name: f.name || profile.fullName || user?.name || '',
                    phone: f.phone || profile.phone || user?.phone || '',
                    email: f.email || profile.email || user?.email || '',
                }));
            });
        }
    }, [open]);

    const durationDays = useMemo(() => {
        const val = parseFloat(form.durationValue);
        if (isNaN(val) || val <= 0) return 0;
        return rentalDays(val, form.durationUnit);
    }, [form.durationValue, form.durationUnit]);

    // ── Per-section breakdown (with duration — used for submit validation) ───
    const sectionBreakdown = useMemo(() => {
        const durVal = parseFloat(form.durationValue);
        if (isNaN(durVal) || durVal <= 0) return [];

        return selectedSections
            .map(sec => {
                const sectionId = sec.id_section?.toString() ?? '';
                const tierIdx = selectedTiers[sectionId];
                if (tierIdx === undefined) return null;

                const tier = sec.priceTiers?.[tierIdx];
                if (!tier) return null;

                const area = parseFloat(form.sectionCapacities[sectionId]);
                if (isNaN(area) || area <= 0) return null;

                const cost = calcSectionCost(
                    tier.value ?? 0,
                    tier.unit || 'month',
                    durVal,
                    form.durationUnit,
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
    }, [selectedSections, selectedTiers, form.sectionCapacities, form.durationValue, form.durationUnit]);

    // ── Sidebar-style breakdown (uses the user's selected duration) ──────────────
    const sidebarBreakdown = useMemo(() => {
        return selectedSections
            .map(sec => {
                const sectionId = sec.id_section?.toString() ?? '';
                const tierIdx = selectedTiers[sectionId];
                if (tierIdx === undefined) return null;

                const tier = sec.priceTiers?.[tierIdx];
                if (!tier) return null;

                const area = parseFloat(sectionCapacities[sectionId]);
                if (isNaN(area) || area <= 0) return null;

                const tUnit = tier.unit || 'month';
                // Apply unit conversion from the selected duration to the tier's unit,
                // so all sections are normalised to the same cost basis.
                const cost = calcSectionCost(
                    tier.value ?? 0,
                    tUnit,
                    form.durationValue,
                    form.durationUnit,
                    area,
                );

                return {
                    sectionId,
                    sectionName: sec.name || `Phân khu ${sec.sector}`,
                    area,
                    tierValue: tier.value ?? 0,
                    tierUnit: tUnit,
                    cost,
                };
            })
            .filter(Boolean);
    }, [selectedSections, selectedTiers, sectionCapacities, form.durationValue, form.durationUnit]);

    const sidebarTotal = useMemo(
        () => sidebarBreakdown.reduce((sum, b) => sum + (b?.cost ?? 0), 0),
        [sidebarBreakdown]
    );

    const pendingSections = useMemo(() =>
        selectedSections
            .filter(s => selectedTiers[s.id_section?.toString() || ''] === undefined)
            .map(s => s.name || `Phân khu ${s.sector}`),
        [selectedSections, selectedTiers]
    );

    const hasSelectedTier = Object.keys(selectedTiers).length > 0;

    const totalCost = useMemo(
        () => sectionBreakdown.reduce((sum, b) => sum + (b?.cost ?? 0), 0),
        [sectionBreakdown]
    );

    // ── Selected sections display ─────────────────────────────────────────────

    const selectedSectionIds = selectedSections.map(s => s.id_section?.toString() || '');

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('Vui lòng đăng nhập để gửi yêu cầu thuê kho');
            return;
        }
        if (user.role?.toUpperCase() !== 'RENTER') {
            toast.error('Chỉ tài khoản Người Thuê mới có thể gửi yêu cầu thuê kho');
            return;
        }
        if (selectedSectionIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 phân khu');
            return;
        }

        const durVal = parseFloat(form.durationValue);
        if (isNaN(durVal) || durVal <= 0) {
            toast.error('Vui lòng nhập thời hạn thuê hợp lệ');
            return;
        }
        if (!form.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu thuê');
            return;
        }

        for (const id of selectedSectionIds) {
            const sec = warehouse.sections?.find(s => s.id_section?.toString() === id);
            if (selectedTiers[id] === undefined) {
                toast.error(`Vui lòng chọn gói giá cho phân khu ${sec?.name || sec?.sector}`);
                return;
            }
            const cap = parseFloat(form.sectionCapacities[id]);
            if (isNaN(cap) || cap <= 0) {
                toast.error(`Vui lòng nhập dung tích hợp lệ cho phân khu ${sec?.name || sec?.sector}`);
                return;
            }
            if (sec && cap > sec.available_capacity) {
                toast.error(`Dung tích yêu cầu cho phân khu ${sec.name || sec.sector} vượt quá khả năng trống (${sec.available_capacity} m³).`);
                return;
            }
        }

        setSubmitting(true);
        // Prevent double-submit: guard immediately after setting submitting
        let cancelled = false;
        try {
            const details = selectedSections.map(s => {
                const sectionId = s.id_section?.toString() ?? '';
                const requestedArea = parseFloat(form.sectionCapacities[sectionId]) || 0;
                const tierIdx = selectedTiers[sectionId] ?? 0;
                const pt = s.priceTiers?.[tierIdx];
                if (!pt) throw new Error(`Phân khu ${s.name || s.sector} không có gói giá nào.`);
                return {
                    sectionId: s.id_section,
                    priceTierId: pt.id || pt.id_price_tier,
                    rentedArea: requestedArea,
                    areaUnit: 'm3',
                };
            });

            const created = await renterService.createRentRequest({
                warehouseId: warehouse.id_warehouse,
                cargoDescription: form.cargoType,
                otherDetail: form.message,
                duration: durVal,
                durationUnit: form.durationUnit,
                startDate: form.startDate,
                endDate: form.endDate,
                details,
            });

            if (cancelled) return;

            // Redirect to payment gateway first
            const payment = await renterService.payForRentalRequest(created.id);
            if (payment.paymentUrl) {
                window.location.href = payment.paymentUrl;
                onOpenChange(false);
                return;
            }

            // Fallback: show success if no payment URL returned
            setShowSuccess(true);
            onRequestSubmitted?.();
        } catch (error: any) {
            if (cancelled) return;
            toast.error(error.message || 'Có lỗi xảy ra khi gửi yêu cầu');
        } finally {
            if (!cancelled) setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SUCCESS VIEW
    // ─────────────────────────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="min-w-[60%] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 bg-[var(--color-bg-secondary)]">
                    <div className="text-center py-8 px-6 overflow-y-auto flex-1">
                        <div className="w-16 h-16 bg-[var(--color-primary-300)] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Yêu cầu thuê kho đã được tạo!</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            Vui lòng hoàn tất thanh toán. Sau khi thanh toán thành công, yêu cầu sẽ được gửi đến chủ kho.
                        </p>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
                        >
                            Đóng
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORM VIEW
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[60%] max-h-[90vh] flex flex-col overflow-hidden p-0 my-9 gap-0">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 text-white shrink-0" style={{ background: 'var(--color-primary)' }}>
                    <div className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        <DialogTitle className="text-lg font-bold text-white m-0">Đăng ký thuê kho</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto bg-white flex-1">

                    {/* ── Phân khu kho display ─────────────────────────────────────── */}
                    {selectedSections.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <LayoutGrid className="h-4 w-4 text-[var(--color-primary)]" />
                                <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                    Phân khu kho đã chọn
                                </label>
                                <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 700 }}>
                                    {selectedSections.length} phân khu
                                </span>
                            </div>
                            <div className={`grid grid-cols-1 ${selectedSections.length > 1 ? 'sm:grid-cols-2' : ''} gap-3`}>
                                {selectedSections.map(sec => {
                                    const sectionId = sec.id_section?.toString() || '';
                                    const tierIdx = selectedTiers[sectionId];
                                    const tier = sec.priceTiers?.[tierIdx];
                                    const capStr = form.sectionCapacities[sectionId] || '';
                                    const capVal = parseFloat(capStr);
                                    const isOverLimit = !isNaN(capVal) && capVal > sec.available_capacity;

                                    const tierLabel = tier
                                        ? `${tier.value?.toLocaleString('vi-VN')} đ/${PRICE_TIER_OPTIONS.find(o => o.unit === tier.unit)?.label?.replace('Giá theo ', '') ?? tier.unit}`
                                        : '—';

                                    const used = sec.total_capacity > 0
                                        ? Math.round(((sec.total_capacity - sec.available_capacity) / sec.total_capacity) * 100)
                                        : 0;
                                    const availStatus = sec.availability || 'available';
                                    const availColor = availStatus === "available" ? "var(--color-success)" : availStatus === "partially" ? "var(--color-warning)" : "var(--color-error)";
                                    const availLbl = { available: "Còn trống", partially: "Gần đầy", full: "Đã đầy" }[availStatus] || 'Còn trống';
                                    const barColor = used > 90 ? "var(--color-error)" : used > 65 ? "var(--color-warning)" : "var(--color-primary)";

                                    return (
                                        <div key={sec.id_section} className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)] flex flex-col">
                                            <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm">{sec.name || `Phân khu ${sec.sector || ''}`}</h4>
                                                    {sec.description && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sec.description}</p>}
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm border" style={{ color: availColor, borderColor: availColor, background: `${availColor}10` }}>
                                                    {availLbl}
                                                </span>
                                            </div>
                                            <div className="p-3 flex-1">
                                                <div className="grid grid-cols-2 gap-y-3 mb-3">
                                                    <div>
                                                        <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Nhiệt độ</p>
                                                        <p className="text-sm font-semibold">{sec.temp_min}°C ~ {sec.temp_max}°C</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Độ ẩm</p>
                                                        <p className="text-sm font-semibold">{sec.humidity}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Sức chứa</p>
                                                        <p className="text-sm font-semibold">{sec.total_capacity.toLocaleString()} m³</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Còn trống</p>
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>{sec.available_capacity.toLocaleString()} m³</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-[var(--color-bg-secondary)] h-1.5 rounded-full overflow-hidden mb-1">
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${used}%`, background: barColor }} />
                                                </div>
                                                <div className="flex justify-between mb-3 text-[10px] text-[var(--color-text-muted)]">
                                                    <span>Đã dùng {used}%</span>
                                                </div>

                                                {sec.priceTiers && sec.priceTiers.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-1 font-semibold">Chọn gói giá thuê</p>
                                                        <div className="grid grid-cols-1 gap-1.5 relative z-10">
                                                            {sec.priceTiers.map((tier, idx) => {
                                                                const isSelected = tierIdx === idx;
                                                                const tierUnit = tier.unit || 'month';
                                                                const tUnitLabel = unitLabel(tierUnit);
                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isSelected) {
                                                                                const updated = { ...selectedTiers };
                                                                                delete updated[sectionId];
                                                                                onSelectedTiersChange(updated);
                                                                            } else {
                                                                                onSelectedTiersChange({ ...selectedTiers, [sectionId]: idx });
                                                                            }
                                                                        }}
                                                                        className="relative"
                                                                        style={{
                                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                            justifyContent: 'center', gap: '1px', padding: '8px 6px',
                                                                            minHeight: '48px', width: '100%', borderWidth: '2px',
                                                                            borderStyle: 'solid', borderRadius: '6px', textAlign: 'center',
                                                                            transition: 'all 0.15s', cursor: 'pointer',
                                                                            ...(isSelected
                                                                                ? { borderColor: 'var(--color-primary)', backgroundColor: 'rgba(26,115,232,0.12)', color: 'var(--color-text)' }
                                                                                : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }
                                                                            )
                                                                        }}
                                                                    >
                                                                        {isSelected && (
                                                                            <div style={{
                                                                                position: 'absolute', top: '-1px', right: '-1px',
                                                                                width: '14px', height: '14px', borderRadius: '50%',
                                                                                background: 'var(--color-primary)', display: 'flex',
                                                                                alignItems: 'center', justifyContent: 'center',
                                                                                color: '#fff', fontSize: '8px', fontWeight: 700
                                                                            }}>
                                                                                ✓
                                                                            </div>
                                                                        )}
                                                                        <span style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.3, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                                                            {tier.value ? tier.value.toLocaleString('vi-VN') : 0} ₫
                                                                        </span>
                                                                        <span style={{ fontSize: '9px', fontWeight: 600, lineHeight: 1.3, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                                                            / {tUnitLabel} / {tier.areaUnit === 'm3' ? 'm³' : tier.areaUnit === 'm2' ? 'm²' : tier.areaUnit}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-medium mb-1 text-[var(--color-text-muted)]">
                                                            Dung tích cần thuê
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={sec.available_capacity}
                                                            required
                                                            placeholder={`Tối đa: ${sec.available_capacity} m³`}
                                                            className={`w-full text-sm px-3 py-1.5 border rounded-md focus:outline-none ${isOverLimit
                                                                ? 'border-red-500 focus:border-red-500'
                                                                : 'focus:border-[var(--color-primary)]'
                                                                } bg-transparent`}
                                                            value={capStr}
                                                            onChange={e => {
                                                                const updated = { ...form.sectionCapacities, [sectionId]: e.target.value };
                                                                setForm(f => ({ ...f, sectionCapacities: updated }));
                                                                onSectionCapacitiesChange(updated);
                                                            }}
                                                        />
                                                        {isOverLimit && (
                                                            <p className="text-[10px] text-red-500 mt-0.5">
                                                                Vượt quá sức chứa tối đa ({sec.available_capacity} m³)
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right pb-1">
                                                        <p className="text-[10px] text-[var(--color-text-muted)]">Đơn giá</p>
                                                        <p className="text-sm font-semibold text-[var(--color-primary)]">{tierLabel}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Contact info ────────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-3 sm:col-span-2">
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* ── Cargo type ──────────────────────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                            Loại Hàng
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ví dụ: Hải sản đông lạnh, Trái cây..."
                            className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.cargoType}
                            onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))}
                        />
                    </div>

                    {/* ── Dates + Duration ─────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                                Thời Gian Bắt Đầu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                                </div>
                                <input
                                    type="date"
                                    className="w-full text-sm pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                                    value={form.startDate}
                                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                                Thời Lượng Thuê
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    disabled={!hasSelectedTier}
                                    placeholder="0"
                                    className="w-20 text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] bg-transparent text-center font-semibold disabled:bg-[var(--color-bg-secondary)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed"
                                    value={form.durationValue}
                                    onChange={e => setForm(f => ({ ...f, durationValue: e.target.value }))}
                                />
                                <select
                                    disabled={!hasSelectedTier}
                                    className="flex-1 text-sm px-3 py-2 border-2 border-black rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] bg-white text-[var(--color-primary)] font-bold shadow-sm cursor-pointer disabled:bg-[var(--color-bg-secondary)] disabled:text-[var(--color-text-muted)] disabled:border-[var(--color-border)] disabled:cursor-not-allowed"
                                    value={form.durationUnit}
                                    onChange={e => setForm(f => ({ ...f, durationUnit: e.target.value as any }))}
                                >
                                    {availableUnits.map(u => (
                                        <option key={u} value={u}>
                                            {unitLabel(u)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {!hasSelectedTier && selectedSections.length > 0 && (
                                <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)] italic">
                                    Vui lòng chọn gói giá thuê trước để nhập thời lượng.
                                </p>
                            )}
                            {/* End date preview */}
                            {form.startDate && form.endDate && (
                                <p className="mt-1.5 text-xs text-[var(--color-text-muted)] italic">
                                    Ngày kết thúc:{' '}
                                    <span className="font-medium text-[var(--color-text)]">
                                        {form.endDate.split('-').reverse().join('/')}
                                    </span>

                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Message ──────────────────────────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                            Ghi Chú
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Yêu cầu thêm..."
                            className="w-full h-[10rem] text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent resize-none"
                            value={form.message}
                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        />
                    </div>

                    {/* ── Price estimate preview ─────────────────────────────────── */}
                    {selectedSectionIds.length > 0 && sidebarBreakdown.length > 0 && (
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-4">
                            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">
                                Dự toán chi phí (tham khảo)
                            </p>

                            {pendingSections.length > 0 && (
                                <div className="mb-3 p-3 rounded-md bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)]">
                                    <p className="text-xs font-medium text-[var(--color-warning)] mb-1">Chưa chọn gói giá</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        Vui lòng chọn gói giá cho: {pendingSections.join(', ')}
                                    </p>
                                </div>
                            )}

                            {sidebarBreakdown.map(b => {
                                if (!b) return null;
                                const ul = unitLabel(b.tierUnit);

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
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.cost)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-[var(--color-text-muted)]">
                                            {b.tierValue?.toLocaleString('vi-VN')} đ/{ul}/m³
                                            <span className="mx-1">·</span>
                                            {form.durationValue} {unitLabel(form.durationUnit)}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-[var(--color-text)]">
                                        Tổng ({form.durationValue} {unitLabel(form.durationUnit)})
                                    </span>
                                    <span className="text-base font-bold text-[var(--color-primary)]">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sidebarTotal)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                                    Giá chính xác phụ thuộc vào thời hạn thuê thực tế
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Submit ─────────────────────────────────────────────────── */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold rounded-md hover:bg-[var(--color-bg-secondary)] transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Đang chuyển...' : 'Thanh Toán'}
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-[var(--color-text-muted)]">
                        Bạn sẽ được chuyển đến cổng thanh toán để thanh toán phí đặt cọc trước khi gửi yêu cầu thuê kho.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
