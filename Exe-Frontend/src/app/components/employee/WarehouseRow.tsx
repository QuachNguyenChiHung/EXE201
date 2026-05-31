import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Trash2, MapPin, Package, Thermometer, DollarSign, Shield, LayoutGrid, ChevronDown, ChevronUp, AlertCircle, Building } from 'lucide-react';
import { ColdStorage } from '../../../types';

const STATUS_CFG: Record<ColdStorage['status'], { label: string; color: string }> = {
    pending: { label: 'Chờ duyệt', color: 'var(--color-warning, #f59e0b)' },
    active: { label: 'Đang hoạt động', color: 'var(--color-success, #22c55e)' },
    inactive: { label: 'Đã ẩn / vô hiệu', color: 'var(--color-text-muted)' },
};

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function WarehouseRow({ warehouse, ownerEmail, onApprove, onDeactivate, onDelete, }: {
    warehouse: ColdStorage;
    ownerEmail?: string;
    onApprove: (w: ColdStorage) => void;
    onDeactivate: (w: ColdStorage) => void;
    onDelete: (w: ColdStorage) => void;
}) {
    const [expanded, setExpanded] = useState(warehouse.status === 'pending');
    const cfg = STATUS_CFG[warehouse.status];

    return (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]" style={{ borderLeft: `3px solid ${cfg.color}` }}>
            <div className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex items-center gap-1 text-white text-[11px] px-2 py-0.5 shrink-0" style={{ background: cfg.color }}>
                    {warehouse.status === 'pending' && <Clock className="h-3 w-3" />}
                    {warehouse.status === 'active' && <CheckCircle className="h-3 w-3" />}
                    {warehouse.status === 'inactive' && <XCircle className="h-3 w-3" />}
                    {cfg.label}
                </span>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{warehouse.name}</p>
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{warehouse.location.address}, {warehouse.location.city}, {warehouse.location.province}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {warehouse.status === 'pending' && (
                        <button onClick={() => onApprove(warehouse)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-white transition-colors" style={{ background: 'var(--color-success, #22c55e)' }}>
                            <CheckCircle className="h-3.5 w-3.5" /> Duyệt
                        </button>
                    )}
                    {warehouse.status === 'active' && (
                        <button onClick={() => onDeactivate(warehouse)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-warning)] transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
                            <XCircle className="h-3.5 w-3.5" /> Tạm ẩn
                        </button>
                    )}
                    {warehouse.status === 'inactive' && (
                        <button onClick={() => onApprove(warehouse)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-success)] transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
                            <CheckCircle className="h-3.5 w-3.5" /> Kích hoạt lại
                        </button>
                    )}
                    <button onClick={() => onDelete(warehouse)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setExpanded(p => !p)} className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-4" style={{ background: 'var(--color-bg-secondary)' }}>
                    {warehouse.status === 'pending' && (
                        <div className="flex items-start gap-2 px-3 py-2 border text-sm" style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.3)', color: 'var(--color-text)' }}>
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-warning, #f59e0b)' }} />
                            <span>Kho lạnh này đang chờ bạn xem xét và duyệt. Hãy kiểm tra thông tin kỹ trước khi kích hoạt.</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                            <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <Package className="h-3 w-3" /> Công suất
                            </div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{warehouse.stats.totalCapacity.toLocaleString()} m³</p>
                            <p className="text-[10px]" style={{ color: 'var(--color-success, #22c55e)' }}>Còn: {warehouse.stats.availableCapacity.toLocaleString()} m³</p>
                        </div>
                        <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                            <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <Thermometer className="h-3 w-3" /> Nhiệt độ
                            </div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{warehouse.stats.temperatureMin}°C ~ {warehouse.stats.temperatureMax}°C</p>
                        </div>
                        <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                            <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <DollarSign className="h-3 w-3" /> Giá thuê
                            </div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>{fmtCurrency(warehouse.pricePerCubicMeter)}/m³</p>
                        </div>
                        <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                            <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <Shield className="h-3 w-3" /> Bảo mật
                            </div>
                            <p className="font-semibold text-sm capitalize" style={{ color: 'var(--color-text)' }}>{{ basic: 'Cơ bản', medium: 'Trung bình', high: 'Cao' }[warehouse.stats.securityLevel]}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
                            <Building className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Chủ kho</p>
                            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{warehouse.ownerName}</p>
                            {ownerEmail && (
                                <a href={`mailto:${ownerEmail}`} className="text-xs hover:underline" style={{ color: 'var(--color-primary)' }}>{ownerEmail}</a>
                            )}
                        </div>
                    </div>

                    {warehouse.sections && warehouse.sections.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <LayoutGrid className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>{warehouse.sections.length} phân khu</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {warehouse.sections.map(sec => (
                                    <div key={sec.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{sec.name}</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{sec.temperatureMin}°C ~ {sec.temperatureMax}°C · {sec.capacity.toLocaleString()} m³</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>Tài liệu chứng nhận (PDF)</p>
                        {warehouse.certifications.length > 0 ? (
                            <div className="space-y-1.5">
                                {warehouse.certifications.map(cert => (
                                    <div key={cert.id} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)]">
                                        <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-success, #22c55e)' }} />
                                        <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text)' }}>{cert.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-[var(--color-border)]">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Chủ kho chưa nộp tài liệu chứng nhận nào.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
