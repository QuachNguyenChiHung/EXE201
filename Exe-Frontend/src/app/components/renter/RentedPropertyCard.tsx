import { useNavigate } from 'react-router';
import {
    MapPin, Thermometer, Package, Calendar, Phone, ExternalLink,
    FileText, XCircle, LayoutGrid, PenLine
} from 'lucide-react';
import { CompositeContract, CompositeWarehouse, ContractDetailDTO } from '../../../types';
import { ContractStatus, STATUS_CONFIG, fmtCurrency, fmtDate, mapBackendStatus } from './RentedPropertyUtils';
import { PRICE_TIER_OPTIONS } from '../owner/WarehouseFormUtils';
import { formatShortAddress } from '../../utils/addressFormat';

interface RentedPropertyCardProps {
    contract: CompositeContract;
    warehouse: CompositeWarehouse | undefined;
    onViewContract: () => void;
    onSignContract: () => void;
    onCancelContract: () => void;
}

export function RentedPropertyCard({
    contract,
    warehouse,
    onViewContract,
    onSignContract,
    onCancelContract,
}: RentedPropertyCardProps) {
    const navigate = useNavigate();

    const wh = warehouse;
    const mappedStatus = mapBackendStatus(contract.status, contract.ownerSigned, contract.renterSigned);
    const cfg = STATUS_CONFIG[mappedStatus] || STATUS_CONFIG['active'];
    const isPendingRenter = mappedStatus === 'pending_renter';

    // contractDetails comes from the page (requests API via id_rent_request).
    // Fallback: derive from warehouse sections when not available.
    const contractDetails: ContractDetailDTO[] = (() => {
        if (contract.contractDetails && contract.contractDetails.length > 0) return contract.contractDetails;
        if (!wh) return [];
        const active = (wh.sections ?? []).filter((s: any) => s.priceTiers && s.priceTiers.length > 0);
        return active.map((s: any) => {
            const tier = s.priceTiers?.[0];
            return {
                sectionId: s.id_section ?? 0,
                sectionName: s.name ?? s.label ?? `Phân khu ${s.sector}`,
                sector: s.sector,
                rentedArea: s.available_capacity ?? 0,
                areaUnit: tier?.areaUnit ?? 'm³',
                priceTierId: tier?.id_price_tier ?? 0,
                priceTierLabel: tier?.label,
                priceTierValue: tier?.value ?? 0,
                priceTierUnit: PRICE_TIER_OPTIONS.find(o => o.unit === tier?.unit)?.label ?? tier?.label ?? 'tháng',
            };
        });
    })();

    const totalCapacity = contractDetails.reduce((s, d) => s + (d.rentedArea || 0), 0) || contract.rentedCapacity || 0;
    const monthlyTotal = contractDetails.length > 0
        ? contractDetails.reduce((sum, d) => sum + (d.rentedArea || 0) * (d.priceTierValue || 0), 0)
        : (contract.rentedCapacity || 0) * (contract.monthlyRate || 0);

    // Temperature from first section or warehouse stats
    const firstDetail = contractDetails[0];
    const tempMin = firstDetail ? undefined : (wh?.stats?.temperatureMin);
    const tempMax = firstDetail ? undefined : (wh?.stats?.temperatureMax);

    const canCancel = mappedStatus === 'active';

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

                        <h3 className="mb-1">{wh ? wh.name : (contract.owner_legal_name || contract.ownerName || 'Kho')}</h3>

                        {wh && (
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-3">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{(wh.address ? wh.address + ", " : "")}{formatShortAddress({
                                    province: wh.location_province,
                                    commune: wh.location_commune,
                                    locationAddressText: wh.location_address_text,
                                })}</span>
                            </div>
                        )}
                        {!wh && (contract.owner_address || contract.ownerName || contract.owner_legal_name) && (
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-3">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{contract.owner_address || (contract.ownerName || contract.owner_legal_name)}</span>
                            </div>
                        )}

                        {/* ── Phân khu banner (from API or warehouse fallback) ── */}
                        {contractDetails.length > 0 ? (
                            contractDetails.length === 1 ? (
                                /* Single section */
                                <div
                                    className="flex items-start gap-3 mb-3 px-3 py-2.5"
                                    style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid var(--color-primary)' }}
                                >
                                    <LayoutGrid className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                                            Phân khu đang thuê
                                        </p>
                                        <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
                                            {firstDetail.sectionName}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-info, #3b82f6)' }}>
                                                <Thermometer className="h-3 w-3" />
                                                {firstDetail.sector != null ? `Phân khu ${firstDetail.sector}` : '—'}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                <Package className="h-3 w-3" />
                                                {firstDetail.rentedArea?.toLocaleString()} {firstDetail.areaUnit ?? 'm³'}
                                            </span>
                                            {firstDetail.priceTierLabel && (
                                                <span className="text-xs font-medium" style={{ color: 'var(--color-success, #22c55e)' }}>
                                                    {firstDetail.priceTierLabel} · {fmtCurrency(firstDetail.priceTierValue)}/{firstDetail.priceTierUnit ?? 'tháng'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Multiple sections */
                                <div className="space-y-2 mb-3">
                                    {contractDetails.map((detail) => (
                                        <div
                                            key={detail.sectionId}
                                            className="flex items-start gap-3 px-3 py-2.5"
                                            style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid var(--color-primary)' }}
                                        >
                                            <LayoutGrid className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                                                        Phân khu đang thuê
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.5 border"
                                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                                                        {detail.sector != null ? `Phân khu ${detail.sector}` : '—'}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
                                                    {detail.sectionName}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                        <Package className="h-3 w-3" />
                                                        {detail.rentedArea?.toLocaleString()} {detail.areaUnit ?? 'm³'}
                                                    </span>
                                                    {detail.priceTierLabel && (
                                                        <span className="text-xs font-medium" style={{ color: 'var(--color-success, #22c55e)' }}>
                                                            {fmtCurrency(detail.priceTierValue)}/{detail.priceTierUnit ?? 'tháng'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : null}

                        {/* Spec chips */}
                        <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                                    <Package className="h-4 w-4 text-[var(--color-primary)]" />
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--color-text-muted)]">Dung tích thuê</div>
                                    <div className="font-semibold">
                                        {totalCapacity > 0 ? `${totalCapacity.toLocaleString()} m³` : '—'}
                                    </div>
                                </div>
                            </div>

                            {tempMin !== undefined && tempMax !== undefined && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(2,132,199,0.1)' }}>
                                        <Thermometer className="h-4 w-4 text-[var(--color-info, #3b82f6)]" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Nhiệt độ phân khu</div>
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
                        {/* Owner contact */}
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

                    </div>

                    {/* ── Right panel: price + actions ── */}
                    <div className="lg:w-56 flex-shrink-0 flex flex-col gap-3">
                        <div className="bg-[var(--color-bg)] p-4">
                            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Chi phí / tháng</div>
                            <div className="font-extrabold text-[var(--color-primary)]">{fmtCurrency(monthlyTotal)}</div>

                            {contractDetails.length > 1 ? (
                                <div className="flex items-center gap-1 text-xs mt-2 pt-2"
                                    style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                                    <LayoutGrid className="h-3 w-3 flex-shrink-0" />
                                    <span>{contractDetails.length} phân khu</span>
                                </div>
                            ) : contractDetails.length === 1 ? (
                                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    {contractDetails[0].priceTierLabel ?? '—'}
                                </div>
                            ) : (
                                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    {fmtCurrency(contract.monthlyRate)}/m³
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

                            {isPendingRenter && (
                                <>
                                    <button
                                        onClick={onViewContract}
                                        className="flex items-center justify-center gap-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm px-4 py-2 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                                        <FileText className="h-3.5 w-3.5" /> Xem
                                    </button>
                                    <button
                                        onClick={onSignContract}
                                        className="flex items-center justify-center gap-2 text-white text-sm px-4 py-2"
                                        style={{ background: '#f59e0b' }}>
                                        <PenLine className="h-3.5 w-3.5" /> Ký kết
                                    </button>
                                    <button
                                        onClick={onViewContract}
                                        className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                                        style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                                        <XCircle className="h-3.5 w-3.5" /> Từ chối
                                    </button>
                                </>
                            )}

                            {!isPendingRenter && (
                                <button
                                    onClick={onViewContract}
                                    className="flex items-center justify-center gap-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm px-4 py-2 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                                    <FileText className="h-3.5 w-3.5" /> Xem hợp đồng
                                </button>
                            )}

                            {canCancel && (
                                <button
                                    onClick={onCancelContract}
                                    className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                                    style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                >
                                    <XCircle className="h-3.5 w-3.5" /> Huỷ hợp đồng
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
