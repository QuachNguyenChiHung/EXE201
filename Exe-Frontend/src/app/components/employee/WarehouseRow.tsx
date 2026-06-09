import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Trash2, MapPin, Shield, LayoutGrid, ChevronDown, ChevronUp, AlertCircle, Building, Loader2, AlignLeft, Image as ImageIcon, Droplets, BadgeCheck, Thermometer, ShieldCheck, Cctv } from 'lucide-react';
import { CompositeWarehouse } from '../../../types';
import { WarehouseResponseDTO } from '../../../types/employee';
import { employeeService } from '../../../services/employeeService';

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

export default function WarehouseRow({ warehouse, ownerEmail, onApprove, onReject, onDeactivate, onReviewCert, onDelete, }: {
    warehouse: CompositeWarehouse;
    ownerEmail?: string;
    onApprove: (w: CompositeWarehouse) => void;
    onReject?: (w: CompositeWarehouse) => void;
    onDeactivate: (w: CompositeWarehouse) => void;
    onReviewCert?: (cert: any) => void;
    onDelete: (w: CompositeWarehouse) => void;
}) {
    const rawStatus = String(warehouse.status || '').toUpperCase();
    const isPending = rawStatus === 'PENDING';
    const isApproved = rawStatus === 'APPROVED' || rawStatus === 'ACTIVE';
    const isHidden = rawStatus === 'HIDDEN' || rawStatus === 'INACTIVE';
    const isRejected = rawStatus === 'REJECTED';

    let lookupKey = rawStatus;
    if (rawStatus === 'ACTIVE') lookupKey = 'APPROVED';
    if (rawStatus === 'INACTIVE') lookupKey = 'HIDDEN';

    const [expanded, setExpanded] = useState(isPending);
    const [detailData, setDetailData] = useState<WarehouseResponseDTO | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (expanded && !detailData && !loadingDetail) {
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
    }, [expanded, warehouse.id_warehouse]);

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
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm rounded-md overflow-hidden" style={{ borderLeft: `4px solid ${cfg.color}` }}>
            <div 
                className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
                onClick={() => setExpanded(p => !p)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                        <p className="font-bold text-base truncate" style={{ color: 'var(--color-text)' }}>{warehouse.name}</p>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize border" style={{ color: cfg.color, borderColor: `${cfg.color}50`, background: `${cfg.color}10` }}>
                            {isPending && <Clock className="h-3 w-3" />}
                            {isApproved && <CheckCircle className="h-3 w-3" />}
                            {(isHidden || isRejected) && <XCircle className="h-3 w-3" />}
                            {cfg.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{warehouse.address}, {warehouse.location_commune}, {warehouse.location_province}</span>
                    </div>
                </div>

                {thumbUrl && (
                    <div className="hidden sm:block shrink-0 ml-4">
                        <FallbackImage src={thumbUrl} alt="Thumbnail" className="w-20 h-14 object-cover rounded border border-[var(--color-border)]" />
                    </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div className="p-1.5 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                                                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{cert.label || `Chứng nhận #${cert.id || cert.id_cerfSubmit}`}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {cert.isVerified ? (
                                                                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-success, #22c55e)' }}>
                                                                    <CheckCircle className="h-3 w-3" /> Đã xác thực
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                                                                    <Clock className="h-3 w-3" /> Chờ duyệt
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>• PDF</span>
                                                        </div>
                                                    </div>
                                                    {onReviewCert && !cert.isVerified && (
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
                            {isApproved && (
                                <button onClick={(e) => { e.stopPropagation(); onDeactivate(warehouse); }} className="flex items-center gap-2 text-sm px-5 py-2.5 font-bold border border-[var(--color-border)] hover:border-[var(--color-warning)] transition-colors rounded-md shadow-sm bg-[var(--color-surface)]" style={{ color: 'var(--color-text-secondary)' }}>
                                    <XCircle className="h-4 w-4" /> Tạm ẩn
                                </button>
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
