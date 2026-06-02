import React from 'react';
import {
    MapPin, LayoutGrid, Check, Info, Shield, Droplets, Zap, Lock, AlertTriangle
} from 'lucide-react';
import { CompositeWarehouse } from '../../../types';
import { MapComponent } from '../MapComponent';

interface WarehouseDetailInfoProps {
    warehouse: CompositeWarehouse;
}

export function WarehouseDetailInfo({ warehouse }: WarehouseDetailInfoProps) {
    // If sections don't exist, we fallback to warehouse stats
    const sections = warehouse.sections || [];
    const hasCertifications = warehouse.certifications && warehouse.certifications.length > 0;

    return (
        <div className="flex flex-col gap-5">
            {/* ── Overview Stats ── */}
            <div id="section-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] bento-card overflow-hidden" style={{ order: 1 }}>
                {[
                    { label: 'Tổng diện tích', value: `${(warehouse.stats?.totalCapacity || 0).toLocaleString()} m³` },
                    { label: 'Có sẵn', value: `${(warehouse.stats?.availableCapacity || 0).toLocaleString()} m³`, color: 'var(--color-success)' },
                    { label: 'Nhiệt độ', value: `${warehouse.stats?.temperatureMin ?? 0}°C ~ ${warehouse.stats?.temperatureMax ?? 0}°C` },
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sections.map(sec => {
                            const used = sec.total_capacity > 0 ? Math.round(((sec.total_capacity - sec.available_capacity) / sec.total_capacity) * 100) : 0;
                            const availColor = sec.availability === "available" ? "var(--color-success)" : sec.availability === "partially" ? "var(--color-warning)" : "var(--color-error)";
                            const availLbl = { available: "Còn trống", partially: "Gần đầy", full: "Đã đầy" }[sec.availability || 'available'] || 'Còn trống';
                            const barColor = used > 90 ? "var(--color-error)" : used > 65 ? "var(--color-warning)" : "var(--color-primary)";

                            return (
                                <div key={sec.id_section} className="border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-primary)] transition-colors bg-[var(--color-surface)] flex flex-col">
                                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-start gap-2">
                                        <div>
                                            <h4 className="font-semibold">{sec.name}</h4>
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Features ── */}
            {warehouse.features && warehouse.features.length > 0 && (
                <div id="section-services" className="bento-card p-6" style={{ order: 4, scrollMarginTop: '80px' }}>
                    <h2 className="mb-4 text-lg font-semibold">Tiện ích & Dịch vụ</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {warehouse.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-[var(--color-primary)]" />
                                </div>
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {warehouse.certifications?.map((cert: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-4 border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)] transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-success)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                                    <Shield className="h-6 w-6 text-[var(--color-success)]" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Chứng chỉ Kiểm định</h4>
                                    <p className="text-xs text-[var(--color-text-muted)]">#{cert.id_cerfSubmit}</p>
                                    <span className="text-[10px] text-[var(--color-success)] font-semibold uppercase mt-1 inline-block">Đã xác minh</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Location Map ── */}
            <div id="section-location" className="bento-card p-6" style={{ order: 6, scrollMarginTop: '80px' }}>
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-lg font-semibold">Vị trí</h2>
                </div>
                <p className="text-sm mb-4 text-[var(--color-text-secondary)]">
                    {warehouse.location_address_text}
                </p>
                <div className="h-80 w-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)] relative">
                    <MapComponent
                        center={[warehouse.location_lat, warehouse.location_long]}
                        markers={[{ position: [warehouse.location_lat, warehouse.location_long], popup: warehouse.location_address_text }]}
                        zoom={15}
                        height="100%"
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }} />
                </div>
            </div>
        </div>
    );
}
