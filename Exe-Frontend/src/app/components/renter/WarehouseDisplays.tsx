import { CompositeWarehouse } from '../../../../types';
import { AlertTriangle, FileCheck, Tag } from 'lucide-react';

const UNIT_SHORT: Record<string, string> = { month: 'tháng', day: 'ngày', year: 'năm' };

const fmt = (n: number | undefined) => {
    if (n === undefined) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
};

const CERT_LABELS: Record<string, string> = {
    '1': 'HACCP',
    '2': 'ISO 22000',
    '3': 'GMP',
    '4': 'GDP',
    '5': 'ISO 9001',
    '6': 'ATTP',
};

export function CertificationList({ warehouse }: { warehouse: CompositeWarehouse }) {
    const hasCert = warehouse.certifications && warehouse.certifications.length > 0;

    if (!hasCert) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-2 py-3 px-4"
                style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '2px solid var(--color-error)',
                }}
            >
                <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
                <span style={{ color: 'var(--color-error)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.3 }}>
                    CHƯA CÓ CHỨNG CHỈ
                </span>
                <span style={{ color: 'var(--color-error)', fontSize: '0.7rem', textAlign: 'center', opacity: 0.8 }}>
                    Không đảm bảo tiêu chuẩn vệ sinh an toàn thực phẩm
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 text-left">
            {warehouse.certifications?.map((cert: any, idx) => {
                const label = CERT_LABELS[cert.id_type?.toString() || ''] || `Chứng chỉ ${cert.id_type || idx + 1}`;
                return (
                    <div
                        key={cert.id_cerfSubmit || idx}
                        className="p-2 text-xs flex items-center gap-2"
                        style={{ border: '1px solid var(--color-success)', background: 'rgba(34,197,94,0.04)' }}
                    >
                        <FileCheck className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{label}</span>
                        {cert.isVerified && (
                            <span className="text-[9px] px-1 py-0.5 ml-auto" style={{ background: 'var(--color-success)', color: '#fff', fontWeight: 700 }}>
                                Đã duyệt
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function PriceDisplay({ warehouse }: { warehouse: CompositeWarehouse }) {
    const tiers = warehouse.priceTiers?.filter((t: any) => t.value > 0);

    if (tiers && tiers.length > 0) {
        return (
            <div className="flex flex-col gap-1.5 text-left">
                {tiers.map((tier: any, idx: number) => (
                    <div key={tier.id_price_tier || idx} className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 flex-shrink-0" style={{ color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                        <div>
                            {tier.label && (
                                <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>
                                    {tier.label}
                                </span>
                            )}
                            <span style={{ fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: idx === 0 ? '0.85rem' : '0.78rem' }}>
                                {fmt(tier.value)}
                                <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    /m³/{UNIT_SHORT[tier.unit] ?? tier.unit}
                                </span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const sectionTiers = warehouse.sections
        ?.map((s) => ({ section: s, tier: s.priceTiers?.find((t: any) => t.value > 0) }))
        .filter((x): x is { section: typeof x.section; tier: NonNullable<typeof x.tier> } => !!x.tier);

    if (sectionTiers && sectionTiers.length > 0) {
        return (
            <div className="flex flex-col gap-1 text-left">
                {sectionTiers.map(({ section, tier }, idx) => (
                    <div key={section.id_section || idx} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)', maxWidth: 90 }}>
                            {section.name}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                            {fmt(tier.value)}
                            <span style={{ fontWeight: 400, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                                /{UNIT_SHORT[tier.unit] ?? tier.unit}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {fmt(warehouse.pricePerCubicMeter)}
            <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/m³/tháng</span>
        </span>
    );
}

export function SectionsDisplay({ warehouse }: { warehouse: CompositeWarehouse }) {
    const secs = warehouse.sections;
    if (!secs || secs.length === 0) {
        return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Không có phân khu</span>;
    }

    const availColor = (a: string) =>
        a === 'available' ? 'var(--color-success)' : a === 'partially' ? 'var(--color-warning)' : 'var(--color-error)';
    const availLabel = (a: string) =>
        ({ available: 'Trống', partially: 'Gần đầy', full: 'Đầy' }[a] ?? a);

    return (
        <div className="flex flex-col gap-1.5 text-left">
            {secs.map((sec, idx) => {
                const firstTier = sec.priceTiers?.find((t: any) => t.value > 0);
                return (
                    <div
                        key={sec.id_section || idx}
                        className="p-2 text-xs"
                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                    >
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{sec.name}</span>
                            <span style={{ color: availColor(sec.availability || 'full'), fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {availLabel(sec.availability || 'full')}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            <span>{sec.total_capacity?.toLocaleString()} m³</span>
                            <span>{sec.temp_min}°C ~ {sec.temp_max}°C</span>
                            {firstTier && (
                                <span style={{ color: 'var(--color-primary)' }}>
                                    {fmt(firstTier.value)}/{UNIT_SHORT[firstTier.unit] ?? firstTier.unit}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
