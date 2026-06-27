import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, Trash2, MapPin, Shield, LayoutGrid, ChevronDown, ChevronUp, AlertCircle, Building, Loader2, AlignLeft, Image as ImageIcon, Droplets, BadgeCheck, Thermometer, ShieldCheck, Cctv, Warehouse, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { CompositeWarehouse } from '../../../types';
import { WarehouseResponseDTO } from '../../../types/employee';
import { employeeService } from '../../../services/employeeService';
import { formatShortAddress } from '../../utils/addressFormat';

const FallbackImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [error, setError] = useState(false);
    const classes = className || "h-16 w-24 object-cover rounded border border-[var(--color-border)] shrink-0";
    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] ${classes}`}>
                <ImageIcon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-[8px] uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>Lỗi</span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className={classes}
        />
    );
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Chờ duyệt', color: 'var(--color-warning, #f59e0b)' },
    APPROVED: { label: 'Đang hoạt động', color: 'var(--color-success, #22c55e)' },
    HIDDEN: { label: 'Đã ẩn / vô hiệu', color: 'var(--color-text-muted)' },
    REJECTED: { label: 'Đã từ chối', color: 'var(--color-error, #ef4444)' },
};

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

interface WarehouseRowProps {
    warehouse: CompositeWarehouse;
    ownerEmail?: string;
    onApprove: (w: CompositeWarehouse) => void;
    onReject?: (w: CompositeWarehouse) => void;
    onDeactivate: (w: CompositeWarehouse) => void;
    onReviewCert?: (cert: any) => void;
    onDelete: (w: CompositeWarehouse) => void;
    expandWarehouseId?: number;
    refetchCounter?: number;
}

export default function WarehouseRow({
    warehouse,
    ownerEmail,
    onApprove,
    onReject,
    onDeactivate,
    onReviewCert,
    onDelete,
    expandWarehouseId,
    refetchCounter
}: WarehouseRowProps) {
    const rawStatus = String(warehouse.status || '').toUpperCase();
    const isPending = rawStatus === 'PENDING';
    const isApproved = rawStatus === 'APPROVED' || rawStatus === 'ACTIVE';
    const isHidden = rawStatus === 'HIDDEN' || rawStatus === 'INACTIVE';
    const isRejected = rawStatus === 'REJECTED';

    let lookupKey = rawStatus;
    if (rawStatus === 'ACTIVE') lookupKey = 'APPROVED';
    if (rawStatus === 'INACTIVE') lookupKey = 'HIDDEN';

    const [expanded, setExpanded] = useState(isPending || (expandWarehouseId ? warehouse.id_warehouse === expandWarehouseId : false));
    const [detailData, setDetailData] = useState<WarehouseResponseDTO | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [viewStats, setViewStats] = useState<any[] | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [viewStatsDays, setViewStatsDays] = useState<number | 'ALL'>(7);

    useEffect(() => {
        if (expandWarehouseId && warehouse.id_warehouse === expandWarehouseId) {
            setExpanded(true);
        }
    }, [expandWarehouseId, warehouse.id_warehouse]);

    const prevRefetchCounterRef = useRef<number | undefined>(refetchCounter);

    useEffect(() => {
        const needsRefetch = prevRefetchCounterRef.current !== refetchCounter;
        
        if (expanded && (!detailData || needsRefetch)) {
            if (needsRefetch) {
                prevRefetchCounterRef.current = refetchCounter;
            }
            let mounted = true;
            setLoadingDetail(true);
            employeeService.getWarehouseDetail(warehouse.id_warehouse)
                .then(res => {
                    if (mounted) setDetailData(res);
                })
                .catch(err => console.error("Failed to fetch detail", err))
                .finally(() => {
                    if (mounted) setLoadingDetail(false);
                });
            return () => { mounted = false; };
        }
    }, [expanded, warehouse.id_warehouse, refetchCounter]);

    useEffect(() => {
        if (expanded && !viewStats && !loadingStats) {
            let mounted = true;
            setLoadingStats(true);
            
            let daysToFetch = 7;
            if (viewStatsDays === 'ALL') {
                const createdDate = warehouse.create_at || (warehouse as any).createdAt;
                if (createdDate) {
                    const diffTime = Math.abs(new Date().getTime() - new Date(createdDate).getTime());
                    daysToFetch = Math.max(7, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                } else {
                    daysToFetch = 365; // fallback
                }
            } else {
                daysToFetch = viewStatsDays;
            }

            employeeService.getWarehouseViewStats(warehouse.id_warehouse, daysToFetch)
                .then(res => {
                    if (mounted) {
                        let formatted: any[] = [];
                        if (res.dates && res.viewTrend) {
                            formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.viewTrend[i] || 0 }));
                        } else if (res.dates && res.views) {
                            formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.views[i] || 0 }));
                        } else if (res.dates && res.data) {
                            formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.data[i] || 0 }));
                        } else if (res.dates && res.series) {
                            formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.series[0]?.data[i] || 0 }));
                        } else if (Array.isArray(res)) {
                            formatted = res;
                        }
                        if (formatted.length > 0 && typeof formatted[0] === 'object' && 'name' in formatted[0]) {
                            formatted.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
                        }
                        setViewStats(formatted);
                    }
                })
                .catch(err => console.error("Failed to fetch view stats", err))
                .finally(() => {
                    if (mounted) setLoadingStats(false);
                });
            return () => { mounted = false; };
        }
    }, [expanded, warehouse.id_warehouse, viewStatsDays]);

    const cfg = STATUS_CFG[lookupKey] || { label: warehouse.status || 'Unknown', color: 'var(--color-text-muted)' };

    // Attempt to find a thumbnail from loaded details or warehouse object
    let thumbUrl: string | null = null;
    if (detailData?.images && detailData.images.length > 0) {
        thumbUrl = detailData.images.find(i => i.isThumbnail)?.imageUrl || detailData.images[0].imageUrl;
    } else if (warehouse.images && warehouse.images.length > 0) {
        const wImg = warehouse.images[0];
        if (typeof wImg === 'string') thumbUrl = wImg;
        else if ((wImg as any).image_url) thumbUrl = (wImg as any).image_url;
    }

    return (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]" style={{ borderLeft: `3px solid ${cfg.color}` }}>
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
                onClick={() => setExpanded(p => !p)}
            >
                <div className="w-9 h-9 shrink-0 flex items-center justify-center text-white" style={{ background: cfg.color }}>
                    <Warehouse className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{warehouse.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-white px-1.5 py-0.5" style={{ background: cfg.color }}>
                            {isPending && <Clock className="h-3 w-3" />}
                            {isApproved && <CheckCircle className="h-3 w-3" />}
                            {(isHidden || isRejected) && <XCircle className="h-3 w-3" />}
                            {cfg.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{warehouse.address}, {formatShortAddress({
                            province: warehouse.location_province,
                            commune: warehouse.location_commune,
                            locationAddressText: warehouse.location_address_text,
                        })}</span>
                    </div>
                </div>

                {thumbUrl && (
                    <div className="hidden sm:block shrink-0 ml-4">
                        <FallbackImage src={thumbUrl} alt="Thumbnail" className="w-12 h-8 object-cover rounded border border-[var(--color-border)]" />
                    </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-[var(--color-border)] px-4 py-5 space-y-5" style={{ background: 'var(--color-bg-secondary)' }}>
                    {isPending && (
                        <div className="flex items-start gap-2 px-4 py-3 border rounded-md text-sm" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)', color: 'var(--color-text)' }}>
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-warning, #f59e0b)' }} />
                            <span>Kho lạnh này đang chờ bạn xem xét và duyệt. Hãy kiểm tra thông tin kỹ trước khi kích hoạt.</span>
                        </div>
                    )}

                    {loadingDetail ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                        </div>
                    ) : detailData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                            {/* LEFT COLUMN */}
                            <div className="lg:col-span-2 flex flex-col gap-5">

                                {/* DESCRIPTION CARD */}
                                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                        <AlignLeft className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Mô tả</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed mb-5" style={{ color: 'var(--color-text)' }}>
                                        {detailData.description || 'Không có mô tả.'}
                                    </p>
                                </div>

                                {/* OWNER CARD */}
                                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                        <Building className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Chủ kho</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-md" style={{ background: 'var(--color-primary-100)' }}>
                                            <Building className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{warehouse.ownerName}</p>
                                            {ownerEmail && (
                                                <a href={`mailto:${ownerEmail}`} className="text-xs hover:underline flex items-center gap-1.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    {ownerEmail}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* IMAGES CARD */}
                                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Hình ảnh ({detailData.images?.length || 0})</span>
                                        </div>
                                    </div>
                                    {detailData.images && detailData.images.length > 0 ? (
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {detailData.images.map((img) => (
                                                <FallbackImage key={img.id} src={img.imageUrl} alt="Warehouse" className="h-24 w-36 object-cover rounded-md border border-[var(--color-border)] shrink-0 shadow-sm" />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>Chưa có hình ảnh.</p>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="flex flex-col gap-5">

                                {/* SECTIONS CARD */}
                                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                        <LayoutGrid className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{detailData.sections?.length || 0} Phân khu</span>
                                    </div>
                                    {detailData.sections && detailData.sections.length > 0 ? (
                                        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                            {detailData.sections.map((sec, idx) => (
                                                <div key={idx} className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 rounded-md flex flex-col gap-3 shrink-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Khu {sec.sector}</p>
                                                        {sec.hasCertification && (
                                                            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ color: 'var(--color-success, #22c55e)', background: 'var(--color-success-100, #dcfce7)' }}>
                                                                <BadgeCheck className="h-3 w-3" /> Đạt chuẩn
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                                                        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                                            <Thermometer className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} /> {sec.tempMin}°C ~ {sec.tempMax}°C
                                                        </p>
                                                        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                                            <Droplets className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} /> Độ ẩm: {sec.humidity}%
                                                        </p>
                                                        <p className="text-xs font-medium flex items-center gap-1.5 col-span-2" style={{ color: 'var(--color-text-muted)' }}>
                                                            <LayoutGrid className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} /> Sức chứa: {sec.totalCapacity?.toLocaleString()} m³
                                                        </p>
                                                    </div>
                                                    {sec.priceTiers && sec.priceTiers.length > 0 && (
                                                        <div className="mt-2 pt-3 border-t border-[var(--color-border)] flex flex-col gap-1.5">
                                                            {sec.priceTiers.map((tier, tidx) => (
                                                                <div key={tidx} className="flex justify-between items-center text-xs">
                                                                    <span className="font-medium" style={{ color: 'var(--color-text-muted)' }}>{tier.label}</span>
                                                                    <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                                                                        {fmtCurrency(tier.value)} <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>/{tier.areaUnit}</span>
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>Chưa có phân khu.</p>
                                    )}
                                </div>

                                {/* CERTIFICATES CARD */}
                                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                        <Shield className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Tài liệu chứng nhận (PDF)</span>
                                    </div>
                                    {detailData.certificates && detailData.certificates.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {detailData.certificates.map((cert: any) => (
                                                <div key={cert.id || cert.id_cerfSubmit} className="flex items-center gap-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
                                                    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-md" style={{ background: 'var(--color-primary-100)' }}>
                                                        <Shield className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                          {cert.link ? decodeURIComponent(cert.link.split('/').pop() || '') : (cert.label || `Chứng nhận #${cert.id || cert.id_cerfSubmit}`)}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {cert.status === 'VERIFIED' ? (
                                                                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-success, #22c55e)' }}>
                                                                    <CheckCircle className="h-3 w-3" /> Đã xác thực
                                                                </span>
                                                            ) : cert.status === 'REJECTED' ? (
                                                                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-error, #ef4444)' }}>
                                                                    <XCircle className="h-3 w-3" /> Đã từ chối
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                                                                    <Clock className="h-3 w-3" /> Chờ duyệt
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>• PDF</span>
                                                        </div>
                                                        {cert.status === 'REJECTED' && cert.rejectReason && (
                                                            <div className="mt-1 text-[10px] italic" style={{ color: 'var(--color-error, #ef4444)' }}>
                                                                Lý do: {cert.rejectReason}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {onReviewCert && (!cert.status || cert.status === 'PENDING') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onReviewCert(cert); }}
                                                            className="px-3 py-1.5 text-xs font-medium border border-[var(--color-primary)] rounded transition-colors bg-[var(--color-surface)] hover:bg-[var(--color-primary)] hover:text-white"
                                                            style={{ color: 'var(--color-primary)' }}
                                                        >
                                                            Xét duyệt
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-6 border border-dashed border-[var(--color-border)] rounded-md bg-[var(--color-bg-secondary)]">
                                            <AlertCircle className="h-8 w-8 mb-3" style={{ color: 'var(--color-text-muted)' }} />
                                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Chưa có tài liệu</p>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Chủ kho chưa nộp tài liệu chứng nhận nào.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-center py-4" style={{ color: 'var(--color-error, #ef4444)' }}>
                            Không tải được chi tiết kho.
                        </div>
                    )}

                    {/* CHART SECTION */}
                    {!loadingDetail && detailData && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                                    <Activity className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                                    Lượt truy cập kho
                                </h4>
                                <select 
                                    value={viewStatsDays} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setViewStatsDays(val === 'ALL' ? 'ALL' : Number(val));
                                        setViewStats(null);
                                    }}
                                    className="text-xs border border-[var(--color-border)] rounded px-2 py-1 bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    <option value={7}>7 ngày qua</option>
                                    <option value={30}>30 ngày qua</option>
                                    <option value="ALL">Từ khi tạo</option>
                                </select>
                            </div>
                            {loadingStats ? (
                                <div className="flex items-center justify-center py-6 text-[var(--color-text-muted)]">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            ) : (!viewStats || viewStats.length === 0) ? (
                                <p className="text-xs text-[var(--color-text-muted)] text-center py-4">Chưa có dữ liệu thống kê.</p>
                            ) : (
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={viewStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} minTickGap={30} />
                                            <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '13px' }}
                                                itemStyle={{ color: 'var(--color-text)' }}
                                            />
                                            <Line type="monotone" dataKey="views" name="Lượt xem" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTION BAR */}
                    {!loadingDetail && detailData && (
                        <div className="mt-4 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-end gap-3">
                            {isPending && (
                                <>
                                    {onReject && (
                                        <button onClick={(e) => { e.stopPropagation(); onReject(warehouse); }} className="flex items-center gap-2 text-sm px-5 py-2.5 font-bold border border-[var(--color-error, #ef4444)] transition-colors rounded-md shadow-sm" style={{ color: 'var(--color-error, #ef4444)', background: 'var(--color-surface)' }}>
                                            <XCircle className="h-4 w-4" /> Từ chối
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onApprove(warehouse); }} className="flex items-center gap-2 text-sm px-5 py-2.5 font-bold text-white transition-colors rounded-md shadow-sm" style={{ background: 'var(--color-success, #22c55e)' }}>
                                        <CheckCircle className="h-4 w-4" /> Duyệt kho
                                    </button>
                                </>
                            )}

                            {isHidden && (
                                <button onClick={(e) => { e.stopPropagation(); onApprove(warehouse); }} className="flex items-center gap-2 text-sm px-5 py-2.5 font-bold border border-[var(--color-border)] hover:border-[var(--color-success)] transition-colors rounded-md shadow-sm bg-[var(--color-surface)]" style={{ color: 'var(--color-text-secondary)' }}>
                                    <CheckCircle className="h-4 w-4" /> Kích hoạt lại
                                </button>
                            )}
                            {isRejected && (
                                <button onClick={(e) => { e.stopPropagation(); onApprove(warehouse); }} className="flex items-center gap-2 text-sm px-5 py-2.5 font-bold border border-[var(--color-border)] hover:border-[var(--color-success)] transition-colors rounded-md shadow-sm bg-[var(--color-surface)]" style={{ color: 'var(--color-text-secondary)' }}>
                                    <CheckCircle className="h-4 w-4" /> Duyệt lại
                                </button>
                            )}
                            <div className="w-px h-8 mx-2 bg-[var(--color-border)] hidden sm:block" />
                            <button onClick={(e) => { e.stopPropagation(); onDelete(warehouse); }} className="flex items-center gap-2 text-sm px-5 py-2.5 font-bold border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors rounded-md shadow-sm bg-[var(--color-surface)]" style={{ color: 'var(--color-text-secondary)' }}>
                                <Trash2 className="h-4 w-4" /> Xóa kho
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
