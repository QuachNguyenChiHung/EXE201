import React, { useState, useEffect } from 'react';
import {
    MapPin, LayoutGrid, Check, Info, Shield, Droplets, Zap, Lock, AlertTriangle
} from 'lucide-react';
import { CompositeWarehouse } from '../../../types';
import { WarehouseMapDisplay } from '../owner/WarehouseMapDisplay';
import { renterService } from '../../../services/renterService';
import { PRICE_TIER_OPTIONS } from '../owner/WarehouseFormUtils';

/** Extract time unit key (day/week/month/year) from a tier label like "Giá theo tháng" */
function tierTimeUnit(label: string | undefined): string {
    if (!label) return 'month';
    const match = PRICE_TIER_OPTIONS.find(o => o.label === label);
    return match?.unit || 'month';
}

interface WarehouseDetailInfoProps {
    warehouse: CompositeWarehouse;
    selectedTiers: Record<string, number>;
    selectedSectionIds: string[];
}

export function WarehouseDetailInfo({ warehouse, selectedTiers, selectedSectionIds }: WarehouseDetailInfoProps) {
    const [fetchedLocation, setFetchedLocation] = useState<{ lat: number, long: number } | null>(null);

    useEffect(() => {
        if (warehouse.id_warehouse) {
            renterService.getWarehouseLocation(warehouse.id_warehouse)
                .then(res => {
                    setFetchedLocation({ lat: res.locationLat, long: res.locationLong });
                })
                .catch(err => console.error("Failed to fetch location", err));
        }
    }, [warehouse.id_warehouse]);

    // If sections don't exist, we fallback to warehouse stats
    const sections = warehouse.sections || [];
    const hasCertifications = warehouse.certifications && warehouse.certifications.length > 0;

    const totalCapacity = sections.length > 0 ? sections.reduce((acc, s) => acc + s.total_capacity, 0) : (warehouse.stats?.totalCapacity || 0);
    const availableCapacity = sections.length > 0 ? sections.reduce((acc, s) => acc + s.available_capacity, 0) : (warehouse.stats?.availableCapacity || 0);
    const minTemp = sections.length > 0 ? Math.min(...sections.map(s => s.temp_min)) : (warehouse.stats?.temperatureMin ?? 0);
    const maxTemp = sections.length > 0 ? Math.max(...sections.map(s => s.temp_max)) : (warehouse.stats?.temperatureMax ?? 0);

    return (
        <div className="flex flex-col gap-5">
            {/* ── Overview Stats ── */}
            <div id="section-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] bento-card overflow-hidden" style={{ order: 1 }}>
                {[
                    { label: 'Tổng diện tích', value: `${totalCapacity.toLocaleString()} m³` },
                    { label: 'Có sẵn', value: `${availableCapacity.toLocaleString()} m³`, color: 'var(--color-success)' },
                    { label: 'Nhiệt độ', value: `${minTemp}°C ~ ${maxTemp}°C` },
                    { label: 'An ninh', value: warehouse.stats?.securityLevel === 'high' ? 'Cao' : 'Tiêu chuẩn' },
                ].map((s, i) => (
                    <div key={i} className="bg-[var(--color-surface)] p-5 text-center">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{s.label}</p>
                        <p className="font-extrabold text-lg" style={{ color: s.color || 'var(--color-text)' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Description ── */}
            <div id="section-description" className="bento-card p-6" style={{ order: 2, scrollMarginTop: '80px' }}>
                <h2 className="mb-4 text-lg font-semibold">Mô tả kho</h2>
                <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {warehouse.description || 'Chủ kho chưa cung cấp mô tả chi tiết cho kho lạnh này.'}
                </div>
            </div>

            {/* ── Sections ── */}
            <div id="section-sections" className="bento-card p-6" style={{ order: 3, scrollMarginTop: '80px' }}>
                <div className="flex items-center gap-2 mb-5">
                    <LayoutGrid className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-lg font-semibold">Phân khu kho</h2>
                    {sections.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 700 }}>
                            {sections.length} phân khu
                        </span>
                    )}
                </div>

                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-[var(--color-bg-secondary)] rounded-lg">
                        <LayoutGrid className="h-8 w-8 mb-3 text-[var(--color-text-muted)]" />
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Kho này chưa chia phân khu. Toàn bộ diện tích là một khu vực duy nhất.
                        </p>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 ${sections.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
                        {sections.map(sec => {
                            const used = sec.total_capacity > 0 ? Math.round(((sec.total_capacity - sec.available_capacity) / sec.total_capacity) * 100) : 0;
                            const availStatus = sec.availability || 'available';
                            const availColor = availStatus === "available" ? "var(--color-success)" : availStatus === "partially" ? "var(--color-warning)" : "var(--color-error)";
                            const availLbl = { available: "Còn trống", partially: "Gần đầy", full: "Đã đầy" }[availStatus] || 'Còn trống';
                            const barColor = used > 90 ? "var(--color-error)" : used > 65 ? "var(--color-warning)" : "var(--color-primary)";

                            return (
                                <div key={sec.id_section} className="border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-primary)] transition-colors bg-[var(--color-surface)] flex flex-col">
                                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-start gap-2">
                                        <div>
                                            <h4 className="font-semibold">{sec.name || `Phân khu ${sec.sector || ''}`}</h4>
                                            {sec.description && <p className="text-xs text-[var(--color-text-muted)] mt-1">{sec.description}</p>}
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-sm border" style={{ color: availColor, borderColor: availColor, background: `${availColor}10` }}>
                                            {availLbl}
                                        </span>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <div className="grid grid-cols-2 gap-y-4 mb-4">
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-1">Nhiệt độ</p>
                                                <p className="text-sm font-semibold">{sec.temp_min}°C ~ {sec.temp_max}°C</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-1">Độ ẩm</p>
                                                <p className="text-sm font-semibold">{sec.humidity}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-1">Sức chứa</p>
                                                <p className="text-sm font-semibold">{sec.total_capacity.toLocaleString()} m³</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-1">Còn trống</p>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>{sec.available_capacity.toLocaleString()} m³</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-[var(--color-bg-secondary)] h-2 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${used}%`, background: barColor }} />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-[var(--color-text-muted)]">
                                            <span>Đã dùng {used}%</span>
                                        </div>

                                        {sec.priceTiers && sec.priceTiers.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                                <p className="text-[10px] uppercase text-[var(--color-text-muted)] mb-2 font-semibold">Chọn gói giá thuê</p>
                                                <div className="grid grid-cols-1 gap-2 mt-1 relative z-10">
                                                    {sec.priceTiers.map((tier, tierIdx) => {
                                                        const sectionId = sec.id_section?.toString() ?? '';
                                                        const isSelected = selectedTiers[sectionId] === tierIdx;
                                                        const tierUnit = tierTimeUnit(tier.label);
                                                        const matchedOpt = PRICE_TIER_OPTIONS.find(o => o.label === tier.label);
                                                        const unitLabel = matchedOpt
                                                            ? matchedOpt.label.replace('Giá theo ', '')
                                                            : (tier.label?.replace('Giá theo ', '') ?? 'tháng');
                                                        return (
                                                            <div
                                                                key={tierIdx}
                                                                className="relative opacity-60"
                                                                style={{
                                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                    justifyContent: 'center', gap: '2px', padding: '12px 8px',
                                                                    minHeight: '56px', width: '100%', borderWidth: '2px',
                                                                    borderStyle: 'solid', borderRadius: '8px', textAlign: 'center',
                                                                    borderColor: 'var(--color-border)',
                                                                    backgroundColor: 'var(--color-bg-secondary)',
                                                                    cursor: 'default',
                                                                }}
                                                            >
                                                                {isSelected && (
                                                                    <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '9px', fontWeight: 700 }}>
                                                                        ✓
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3, color: 'var(--color-text-muted)' }}>{tier.value ? tier.value.toLocaleString('vi-VN') : 0} ₫</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 600, lineHeight: 1.3, color: 'var(--color-text-muted)' }}>
                                                                        / {unitLabel} / {tier.areaUnit === 'm3' ? 'm³' : tier.areaUnit === 'm2' ? 'm²' : tier.areaUnit}
                                                                    </span>
                                                                </div>

                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* ── Certifications ── */}
            <div id="section-certifications" className="bento-card p-6" style={{ order: 5, scrollMarginTop: '80px' }}>
                <h2 className="mb-4 text-lg font-semibold">Chứng chỉ & Kiểm định</h2>
                {!hasCertifications ? (
                    <div className="rounded-xl border-2 border-[var(--color-warning)] bg-[rgba(245,158,11,0.05)] p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--color-warning)] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-6 w-6 text-[var(--color-warning)]" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-amber-800 mb-1">Kho lạnh chưa cung cấp chứng chỉ</h4>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    Kho lạnh này chưa được cấp hoặc chưa upload chứng chỉ an toàn thực phẩm.
                                    Vui lòng liên hệ chủ kho để biết thêm thông tin.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 ${warehouse.certifications?.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
                        {warehouse.certifications?.map((cert: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-4 border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)] transition-colors">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                                    <Shield className="h-6 w-6 text-[var(--color-success)]" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{cert.label || 'Chứng chỉ Kiểm định'}</h4>
                                    <div className="flex gap-2 items-center mt-1">
                                        <p className="text-xs text-[var(--color-text-muted)]">#{cert.id || cert.id_cerfSubmit}</p>
                                        {cert.status === 'VERIFIED' ? (
                                            <span className="text-[10px] text-[var(--color-success)] font-semibold uppercase inline-block">Đã xác minh</span>
                                        ) : cert.status === 'PENDING' ? (
                                            <span className="text-[10px] text-[var(--color-warning)] font-semibold uppercase inline-block">Chờ xác minh</span>
                                        ) : null}
                                    </div>
                                    {cert.link && (
                                        <a href={cert.link} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] hover:underline mt-1 block">
                                            Xem tài liệu
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Location Map ── */}
            <div id="section-location" style={{ order: 6, scrollMarginTop: '80px' }}>
                {fetchedLocation ? (
                    <WarehouseMapDisplay
                        lat={fetchedLocation.lat}
                        long={fetchedLocation.long}
                        addressText={[warehouse.location_commune, warehouse.location_province].filter(Boolean).join(", ")}
                        obfuscateLocation={true}
                    />
                ) : (
                    <div className="h-80 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                        Đang tải bản đồ...
                    </div>
                )}
            </div>
        </div>
    );
}
