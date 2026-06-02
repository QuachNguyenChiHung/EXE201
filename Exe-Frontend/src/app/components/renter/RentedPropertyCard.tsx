import { useNavigate } from 'react-router';
import {
    MapPin, Thermometer, Package, Calendar, AlertTriangle, Phone, ExternalLink, RotateCcw,
    FileText, XCircle, LayoutGrid, PenLine, Star
} from 'lucide-react';
import { CompositeContract, CompositeWarehouse } from '../../../../types';
import { ContractStatus, STATUS_CONFIG, fmtCurrency, fmtDate, daysUntil } from './RentedPropertyUtils';

interface RentedPropertyCardProps {
    contract: CompositeContract;
    warehouse: CompositeWarehouse | undefined;
    rating: any; // Using any for Rating type as it's defined elsewhere, or I can import it
    onViewContract: () => void;
    onRejectContract: () => void;
    onCancelContract: () => void;
    onRateWarehouse: () => void;
}

export function RentedPropertyCard({
    contract,
    warehouse,
    rating,
    onViewContract,
    onRejectContract,
    onCancelContract,
    onRateWarehouse
}: RentedPropertyCardProps) {
    const navigate = useNavigate();

    const wh = warehouse;
    const cfg = STATUS_CONFIG[contract.status as ContractStatus] || STATUS_CONFIG['draft'];
    const monthly = (contract.rentedCapacity || 0) * (contract.monthlyRate || 0);
    const days = daysUntil(contract.end_at);

    const rentedSection = contract.sectionId
        ? (wh?.sections?.find(s => s.id_section?.toString() === contract.sectionId?.toString()) ?? null)
        : null;

    const tempMin = rentedSection ? rentedSection.temp_min : wh?.temp_min;
    const tempMax = rentedSection ? rentedSection.temp_max : wh?.temp_max;

    const canRate = ['active', 'expiring_soon', 'expired'].includes(contract.status);

    return (
        <div className="bg-[var(--color-surface)] flex flex-col lg:flex-row">
            {/* Colour accent strip */}
            <div className={`w-full lg:w-1.5 h-1.5 lg:h-auto ${cfg.stripeBg} flex-shrink-0`} />

            <div className="flex-1 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* ── Warehouse info ── */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 ${cfg.bg} ${cfg.text}`}>
                                {cfg.icon} {cfg.label}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                                Hợp đồng: <span className="font-mono">{contract.contractRef || '—'}</span>
                            </span>
                        </div>

                        <h3 className="mb-1">{wh ? wh.name : `Kho #${contract.warehouseId}`}</h3>

                        {wh && (
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-3">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{wh.location_address}, {wh.location_commune}, {wh.location_province}</span>
                            </div>
                        )}

                        {/* Section banner */}
                        {rentedSection && (
                            <div
                                className="flex items-start gap-3 mb-3 px-3 py-2.5"
                                style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid var(--color-primary)' }}
                            >
                                <LayoutGrid className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                                            Phân khu đang thuê
                                        </span>
                                    </div>
                                    <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
                                        {rentedSection.name}
                                    </p>
                                    {rentedSection.description && (
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                            {rentedSection.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-info, #3b82f6)' }}>
                                            <Thermometer className="h-3 w-3" />
                                            {rentedSection.temp_min}°C ~ {rentedSection.temp_max}°C
                                        </span>
                                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            <Package className="h-3 w-3" />
                                            Tổng {rentedSection.total_capacity?.toLocaleString()} m³ · Còn {rentedSection.available_capacity?.toLocaleString()} m³
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Spec chips */}
                        <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                                    <Package className="h-4 w-4 text-[var(--color-primary)]" />
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--color-text-muted)]">Dung tích thuê</div>
                                    <div className="font-semibold">{(contract.rentedCapacity || 0).toLocaleString()} m³</div>
                                </div>
                            </div>

                            {tempMin !== undefined && tempMax !== undefined && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(2,132,199,0.1)' }}>
                                        <Thermometer className="h-4 w-4 text-[var(--color-info, #3b82f6)]" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--color-text-muted)]">
                                            Nhiệt độ{rentedSection ? ' phân khu' : ''}
                                        </div>
                                        <div className="font-semibold">{tempMin}°C ~ {tempMax}°C</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-[var(--color-bg-secondary)] flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-4 w-4 text-[var(--color-text-secondary)]" />
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--color-text-muted)]">Thời hạn</div>
                                    <div className="font-semibold">
                                        {fmtDate(contract.start_at)} → {fmtDate(contract.end_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expiry warning */}
                        {contract.status === 'expiring_soon' && days > 0 && (
                            <div className="flex items-center gap-2 border border-[var(--color-warning)] px-3 py-2 text-sm mb-3"
                                style={{ background: 'rgba(245,158,11,0.07)', color: 'var(--color-warning)' }}>
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                Còn <strong className="mx-1">{days} ngày</strong> nữa hết hạn — hãy gia hạn sớm!
                            </div>
                        )}

                        {/* Owner contact (if available) */}
                        {(contract.owner_phone || contract.owner_email) && (
                            <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <span>Chủ kho: <strong style={{ color: 'var(--color-text)' }}>{contract.ownerName || contract.owner_legal_name}</strong></span>
                                {contract.owner_phone && (
                                    <a href={`tel:${contract.owner_phone}`} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                                        <Phone className="h-3 w-3" />{contract.owner_phone}
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        {contract.notes && (
                            <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-3 py-2 border-l-2 border-[var(--color-border)] mt-2">
                                {contract.notes}
                            </p>
                        )}
                    </div>

                    {/* ── Right panel: price + actions ── */}
                    <div className="lg:w-56 flex-shrink-0 flex flex-col gap-3">
                        <div className="bg-[var(--color-bg)] p-4">
                            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Chi phí / tháng</div>
                            <div className="font-extrabold text-[var(--color-primary)]">{fmtCurrency(monthly)}</div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{fmtCurrency(contract.monthlyRate)}/m³</div>
                            {rentedSection && (
                                <div className="flex items-center gap-1 text-xs mt-2 pt-2"
                                    style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                                    <LayoutGrid className="h-3 w-3 flex-shrink-0" />
                                    <span>{rentedSection.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            {wh && (
                                <button
                                    onClick={() => navigate(`/renter/warehouse/${wh.id_warehouse}`)}
                                    className="flex items-center justify-center gap-2 text-white text-sm px-4 py-2 hover:opacity-90 transition-opacity"
                                    style={{ background: 'var(--color-primary)' }}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> Xem chi tiết kho
                                </button>
                            )}

                            {contract.status === 'pending_renter' && (
                                <>
                                    <button
                                        onClick={onViewContract}
                                        className="flex items-center justify-center gap-2 text-white text-sm px-4 py-2"
                                        style={{ background: '#f59e0b' }}>
                                        <PenLine className="h-3.5 w-3.5" /> Xem & Ký kết
                                    </button>
                                    <button
                                        onClick={onRejectContract}
                                        className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                                        style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                                        <XCircle className="h-3.5 w-3.5" /> Từ chối
                                    </button>
                                </>
                            )}

                            {(contract.status === 'active' || contract.status === 'expiring_soon') && (
                                <button className="flex items-center justify-center gap-2 border text-sm px-4 py-2 hover:opacity-80 transition-opacity"
                                    style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                                    <RotateCcw className="h-3.5 w-3.5" /> Gia hạn hợp đồng
                                </button>
                            )}

                            {contract.status !== 'pending_renter' && (
                                <button
                                    onClick={onViewContract}
                                    className="flex items-center justify-center gap-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm px-4 py-2 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                                    <FileText className="h-3.5 w-3.5" /> Xem hợp đồng
                                </button>
                            )}

                            {contract.status === 'active' && (
                                <button
                                    onClick={onCancelContract}
                                    className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                                    style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                >
                                    <XCircle className="h-3.5 w-3.5" /> Huỷ hợp đồng
                                </button>
                            )}

                            {canRate && (
                                <button
                                    onClick={onRateWarehouse}
                                    className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                                    style={rating
                                        ? { borderColor: '#f59e0b', color: '#f59e0b' }
                                        : { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
                                    }
                                >
                                    <Star
                                        className="h-3.5 w-3.5"
                                        style={rating ? { fill: '#f59e0b', color: '#f59e0b' } : {}}
                                    />
                                    {rating ? `Đánh giá: ${rating.stars}★` : 'Đánh giá kho'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
