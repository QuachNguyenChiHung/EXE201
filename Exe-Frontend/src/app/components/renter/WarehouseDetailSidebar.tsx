import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Send, LayoutGrid, Check, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { CompositeWarehouse, User } from '../../../types';
import { toast } from 'sonner';
import { useApp } from '../../../context/AppContext';
import { renterService } from '../../../services/renterService';

interface InquiryForm {
    name: string;
    phone: string;
    email: string;
    isWholeWarehouse: boolean;
    selectedSectionIds: string[];
    cargoType: string;
    sectionCapacities: Record<string, string>;
    durationValue: string;
    durationUnit: string;
    startDate: string;
    endDate: string;
    message: string;
    renterOfferedPrice: string;
}

const PRICE_TIER_LABELS: Record<string, string> = {
    day: 'Ngày',
    week: 'Tuần',
    month: 'Tháng',
    year: 'Năm',
    'Ngày': 'Ngày',
    'Tuần': 'Tuần',
    'Tháng': 'Tháng',
    'Năm': 'Năm'
};

interface WarehouseDetailSidebarProps {
    warehouse: CompositeWarehouse;
}

export function WarehouseDetailSidebar({ warehouse }: WarehouseDetailSidebarProps) {
    const { user, createRequest } = useApp();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [form, setForm] = useState<InquiryForm>({
        name: user?.name ?? "",
        phone: user?.phone ?? "",
        email: user?.email ?? "",
        isWholeWarehouse: false,
        selectedSectionIds: [],
        cargoType: "",
        sectionCapacities: {},
        durationValue: "",
        durationUnit: "month",
        startDate: "",
        endDate: "",
        message: "",
        renterOfferedPrice: "",
    });

    const availableUnits = React.useMemo(() => {
        if (!form.selectedSectionIds.length || !warehouse.sections) return [];
        
        const targetSections = warehouse.sections.filter(s => form.selectedSectionIds.includes(s.id_section?.toString() || ''));
        if (!targetSections.length) return [];

        let commonUnits: string[] | null = null;
        targetSections.forEach(sec => {
            const units = sec.priceTiers?.map(pt => pt.unit || pt.timeUnit) || [];
            if (commonUnits === null) {
                commonUnits = units;
            } else {
                commonUnits = commonUnits.filter(u => units.includes(u));
            }
        });

        return commonUnits || [];
    }, [warehouse, form.selectedSectionIds]);

    useEffect(() => {
        if (availableUnits.length > 0 && !availableUnits.includes(form.durationUnit)) {
            setForm(f => ({ ...f, durationUnit: availableUnits[0] as any }));
        }
    }, [availableUnits, form.durationUnit]);

    useEffect(() => {
        if (!form.startDate || !form.durationValue) return;
        const val = parseInt(form.durationValue, 10);
        if (isNaN(val) || val <= 0) return;
        const end = new Date(form.startDate);
        const unitStr = form.durationUnit.toLowerCase();
        if (unitStr === 'day' || unitStr === 'ngày') end.setDate(end.getDate() + val);
        if (unitStr === 'week' || unitStr === 'tuần') end.setDate(end.getDate() + val * 7);
        if (unitStr === 'month' || unitStr === 'tháng') end.setMonth(end.getMonth() + val);
        if (unitStr === 'year' || unitStr === 'năm') end.setFullYear(end.getFullYear() + val);
        setForm(f => ({ ...f, endDate: end.toISOString().split('T')[0] }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.startDate, form.durationValue, form.durationUnit]);

    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                name: f.name || user.name || "",
                phone: f.phone || user.phone || "",
                email: f.email || user.email || "",
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê kho");
            navigate("/login");
            return;
        }
        if (user.role?.toUpperCase() !== 'RENTER') {
            toast.error("Chỉ tài khoản Người Thuê mới có thể gửi yêu cầu thuê kho");
            return;
        }
        
        if (form.selectedSectionIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 phân khu");
            return;
        }

        for (const id of form.selectedSectionIds) {
            const cap = parseFloat(form.sectionCapacities[id]);
            const sec = warehouse.sections?.find(s => s.id_section?.toString() === id);
            if (isNaN(cap) || cap <= 0) {
                toast.error(`Vui lòng nhập dung tích hợp lệ cho phân khu ${sec?.name || sec?.sector}`);
                return;
            }
            if (sec && cap > sec.available_capacity) {
                toast.error(`Dung tích yêu cầu cho phân khu ${sec.name || sec.sector} vượt quá khả năng trống (${sec.available_capacity} m³).`);
                return;
            }
        }

        const duration = parseInt(form.durationValue);
        const du = form.durationUnit;
        
        let finalDuration = duration;
        
        setSubmitting(true);
        try {
            const targetSections = form.isWholeWarehouse 
                ? (warehouse.sections || []) 
                : (warehouse.sections || []).filter(s => form.selectedSectionIds.includes(s.id_section?.toString() || ''));
            
            const details = targetSections.map(s => {
                const requestedArea = parseFloat(form.sectionCapacities[s.id_section?.toString() || '']) || 0;
                const pt = s.priceTiers?.find(t => t.unit === du || t.timeUnit === du);
                if (!pt) {
                    throw new Error(`Phân khu ${s.name || s.sector} không có gói giá phù hợp với thời lượng thuê của bạn (${du}).`);
                }
                return {
                    sectionId: s.id_section,
                    // Fallback to sectionId since the backend PriceTierDTO omits the ID
                    priceTierId: pt.id_price_tier || pt.id || s.id_section || 1,
                    rentedArea: requestedArea,
                    areaUnit: "m3"
                };
            });

            const dto = {
                warehouseId: warehouse.id_warehouse,
                cargoDescription: form.cargoType,
                otherDetail: form.message,
                duration: finalDuration || 1,
                durationUnit: du,
                startDate: form.startDate,
                endDate: form.endDate,
                renterOfferedPrice: form.renterOfferedPrice ? parseFloat(form.renterOfferedPrice) : null,
                details: details
            };

            await renterService.createRentRequest(dto);
            setShowSuccess(true);
        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra khi gửi yêu cầu");
        } finally {
            setSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="bento-card p-6 text-center border-t-4 border-[var(--color-primary)]">
                <div className="w-16 h-16 bg-[var(--color-primary-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gửi yêu cầu thành công!</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    Chủ kho sẽ sớm liên hệ với bạn để xác nhận và thương lượng giá cả.
                </p>
                <button
                    onClick={() => navigate('/renter/requests')}
                    className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
                >
                    Xem yêu cầu của bạn
                </button>
            </div>
        );
    }

    return (
        <div className="bento-card sticky top-24 border border-[var(--color-border)] shadow-xl overflow-hidden">
            <div className="p-5 text-white" style={{ background: 'var(--color-primary)' }}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Send className="h-5 w-5" /> Đăng ký thuê kho
                </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-xs font-semibold mb-2 text-[var(--color-text-secondary)]">Chọn Phân Khu</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {warehouse.sections?.map(sec => {
                                const isSelected = form.selectedSectionIds.includes(sec.id_section?.toString() || '');
                                return (
                                <div key={sec.id_section} className={`p-2 border rounded-md transition-colors ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]' : 'hover:bg-[var(--color-bg-secondary)]'}`}>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                const val = sec.id_section?.toString() || '';
                                                setForm(f => ({
                                                    ...f,
                                                    selectedSectionIds: e.target.checked
                                                        ? [...f.selectedSectionIds, val]
                                                        : f.selectedSectionIds.filter(id => id !== val)
                                                }));
                                            }}
                                            className="mt-0.5 accent-[var(--color-primary)]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{sec.name || `Phân khu ${sec.sector}`}</p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                Nhiệt độ: {sec.temp_min}°C ~ {sec.temp_max}°C &bull; Độ ẩm: {sec.humidity}%
                                            </p>
                                        </div>
                                    </label>
                                    {isSelected && (() => {
                                        const valStr = form.sectionCapacities[sec.id_section?.toString() || ''] || '';
                                        const capVal = parseFloat(valStr);
                                        const isOverLimit = !isNaN(capVal) && capVal > sec.available_capacity;
                                        
                                        return (
                                        <div className="mt-3 pl-6">
                                            <input
                                                type="number"
                                                min="1"
                                                max={sec.available_capacity}
                                                required
                                                placeholder={`Dung tích cần thuê (tối đa: ${sec.available_capacity} m³)...`}
                                                className={`w-full text-xs px-2 py-1.5 border rounded focus:outline-none bg-[var(--color-surface)] ${isOverLimit ? 'border-red-500 focus:border-red-500' : 'focus:border-[var(--color-primary)]'}`}
                                                value={valStr}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setForm(f => ({
                                                        ...f,
                                                        sectionCapacities: { ...f.sectionCapacities, [sec.id_section?.toString() || '']: val }
                                                    }));
                                                }}
                                            />
                                            {isOverLimit && (
                                                <p className="text-[10px] text-red-500 mt-1">
                                                    Vượt quá sức chứa tối đa ({sec.available_capacity} m³)
                                                </p>
                                            )}
                                        </div>
                                        );
                                    })()}
                                </div>
                            )})}
                        </div>
                    </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Loại Hàng</label>
                    <input
                        type="text"
                        required
                        placeholder="Ví dụ: Hải sản đông lạnh, Trái cây..."
                        className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                        value={form.cargoType}
                        onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))}
                    />
                </div>
                

                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Thời Gian Bắt Đầu</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-full text-sm pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent text-left flex items-center">
                                    {form.startDate ? format(parseISO(form.startDate), 'dd/MM/yyyy') : <span className="text-[var(--color-text-muted)]">dd/mm/yyyy</span>}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white shadow-md border rounded-md" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={form.startDate ? parseISO(form.startDate) : undefined}
                                    onSelect={(date) => setForm(f => ({ ...f, startDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Thời Lượng Thuê</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            required
                            min="1"
                            className="flex-1 text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.durationValue}
                            onChange={e => setForm(f => ({ ...f, durationValue: e.target.value }))}
                        />
                        <select
                            className="w-32 text-sm px-2 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)] font-semibold"
                            value={form.durationUnit}
                            onChange={e => setForm(f => ({ ...f, durationUnit: e.target.value as any }))}
                        >
                            {availableUnits.length > 0 
                                ? availableUnits.map(u => <option key={u} value={u}>{PRICE_TIER_LABELS[u] || u}</option>)
                                : Object.entries(PRICE_TIER_LABELS).slice(0, 4).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    {form.startDate && form.endDate && (
                        <p className="mt-1.5 text-xs text-[var(--color-text-muted)] italic">
                            Dự kiến kết thúc: <span className="font-medium text-[var(--color-text)]">{new Date(form.endDate).toLocaleDateString('vi-VN')}</span>
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">
                        Đề xuất tổng giá thuê (tuỳ chọn)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Nhập giá bạn muốn đề xuất cho tổng hợp đồng..."
                            className="w-full text-sm pl-3 pr-12 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.renterOfferedPrice ? Number(form.renterOfferedPrice).toLocaleString('en-US') : ''}
                            onChange={e => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                setForm(f => ({ ...f, renterOfferedPrice: rawValue }));
                            }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-text-muted)] pointer-events-none">
                            VNĐ
                        </span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Ghi Chú</label>
                    <textarea
                        rows={2}
                        placeholder="Yêu cầu thêm..."
                        className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent resize-none"
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    />
                </div>

                {/* Price Estimate Calculation */}
                {form.selectedSectionIds.length > 0 && form.durationValue && (
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-4 space-y-2 mt-4">
                        <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Dự toán chi phí gốc</p>
                        {(() => {
                            const targetSections = warehouse.sections?.filter(s => form.selectedSectionIds.includes(s.id_section?.toString() || '')) || [];
                            let totalCost = 0;
                            
                            return (
                                <>
                                    {targetSections.map(sec => {
                                        const requestedArea = parseFloat(form.sectionCapacities[sec.id_section?.toString() || '']) || 0;
                                        const pt = sec.priceTiers?.find(t => t.unit === form.durationUnit || t.timeUnit === form.durationUnit);
                                        const ptValue = pt?.value || 0;
                                        const cost = requestedArea * ptValue;
                                        totalCost += cost;
                                        return (
                                            <div key={sec.id_section} className="flex justify-between text-xs text-[var(--color-text-muted)]">
                                                <span>{sec.name} ({requestedArea > 0 ? requestedArea.toFixed(1) : '0'} {pt?.areaUnit || 'm3'})</span>
                                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cost)} / {(PRICE_TIER_LABELS[form.durationUnit] || form.durationUnit).toLowerCase()}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="border-t border-[var(--color-border)] mt-2 pt-2 flex justify-between font-bold text-[var(--color-text)]">
                                        <span>Tổng dự kiến:</span>
                                        <span className="text-[var(--color-primary)]">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost * (parseInt(form.durationValue) || 1))}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] italic mt-1">* Ước tính dựa trên tổng thời lượng thuê</p>
                                </>
                            );
                        })()}
                    </div>
                )}

                <div className="pt-2 border-t border-[var(--color-border)]">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-md hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Thuê Kho'}
                    </button>
                    <p className="text-[10px] text-center mt-2 text-[var(--color-text-muted)]">
                        Sau khi gửi yêu cầu, chủ kho sẽ liên hệ qua SĐT/Email để thỏa thuận.
                    </p>
                </div>
            </form>
        </div>
    );
}
