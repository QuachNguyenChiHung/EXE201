import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Send, LayoutGrid, Check } from 'lucide-react';
import { CompositeWarehouse, User } from '../../../types';
import { toast } from 'sonner';
import { useApp } from '../../../context/AppContext';

interface InquiryForm {
    name: string;
    phone: string;
    email: string;
    isWholeWarehouse: boolean;
    selectedSectionIds: string[];
    cargoType: string;
    capacity: string;
    durationValue: string;
    durationUnit: 'day' | 'month' | 'year';
    startDate: string;
    endDate: string;
    message: string;
}

const CARGO_TYPES = [
    { value: 'frozen_food', label: 'Thực phẩm đông lạnh', temp: '< -18°C' },
    { value: 'seafood', label: 'Hải sản tươi sống', temp: '-5°C ~ 2°C' },
    { value: 'vegetables', label: 'Rau củ quả tươi', temp: '2°C ~ 8°C' },
    { value: 'dairy', label: 'Sữa & chế phẩm', temp: '2°C ~ 6°C' },
    { value: 'other', label: 'Loại hàng khác', temp: '' },
];

const DURATION_UNITS = [
    { value: 'day', label: 'Ngày' },
    { value: 'month', label: 'Tháng' },
    { value: 'year', label: 'Năm' },
];

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
        capacity: "",
        durationValue: "",
        durationUnit: "month",
        startDate: "",
        endDate: "",
        message: "",
    });

    useEffect(() => {
        if (!form.startDate || !form.durationValue) return;
        const val = parseInt(form.durationValue, 10);
        if (isNaN(val) || val <= 0) return;
        const end = new Date(form.startDate);
        if (form.durationUnit === 'day') end.setDate(end.getDate() + val);
        if (form.durationUnit === 'month') end.setMonth(end.getMonth() + val);
        if (form.durationUnit === 'year') end.setFullYear(end.getFullYear() + val);
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
        if (user.role !== 'renter') {
            toast.error("Chỉ tài khoản doanh nghiệp mới có thể gửi yêu cầu thuê kho");
            return;
        }

        setSubmitting(true);
        try {
            await createRequest({
                id_rentRequest: Date.now(),
                other_detail: "",
                duration: parseInt(form.durationValue) || 1,
                duration_unit: form.durationUnit,
                renter_rejection_reason: "",
                id_warehouse: warehouse.id_warehouse,
                id_renter: user.id_user,
                isWholeWarehouse: form.isWholeWarehouse,
                sectionIds: form.selectedSectionIds,
                startDate: form.startDate,
                endDate: form.endDate,
                cargo_description: form.cargoType,
                requestedCapacity: form.capacity ? parseFloat(form.capacity) : 0,
                message: form.message,
                status: 'pending',
                renterName: form.name,
                renterPhone: form.phone,
                renterEmail: form.email,
            });
            setShowSuccess(true);
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi yêu cầu");
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
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Khu vực thuê</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, isWholeWarehouse: true, selectedSectionIds: [] }))}
                            className={`px-3 py-2 text-xs border rounded-md transition-colors ${form.isWholeWarehouse ? 'border-[var(--color-primary)] bg-[var(--color-primary-10)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'}`}
                        >
                            Nguyên Kho
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, isWholeWarehouse: false }))}
                            className={`px-3 py-2 text-xs border rounded-md transition-colors ${!form.isWholeWarehouse ? 'border-[var(--color-primary)] bg-[var(--color-primary-10)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'}`}
                        >
                            Theo Phân Khu
                        </button>
                    </div>
                </div>

                {!form.isWholeWarehouse && (
                    <div>
                        <label className="block text-xs font-semibold mb-2 text-[var(--color-text-secondary)]">Chọn Phân Khu</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {warehouse.sections?.map(sec => (
                                <label key={sec.id_section} className="flex items-start gap-2 p-2 border rounded-md cursor-pointer hover:bg-[var(--color-bg-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={form.selectedSectionIds.includes(sec.id_section?.toString() || '')}
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
                                        <p className="text-sm font-semibold truncate">{sec.name}</p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                            {sec.temp_min}°C ~ {sec.temp_max}°C
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Loại Hàng</label>
                        <select
                            required
                            className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.cargoType}
                            onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))}
                        >
                            <option value="" disabled>Chọn loại hàng</option>
                            {CARGO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Dung Tích (m³)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            placeholder="Ví dụ: 50"
                            className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.capacity}
                            onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Thời Gian Bắt Đầu</label>
                    <input
                        type="date"
                        required
                        className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                        value={form.startDate}
                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--color-text-secondary)]">Thời Lượng Thuê</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            required
                            min="1"
                            className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.durationValue}
                            onChange={e => setForm(f => ({ ...f, durationValue: e.target.value }))}
                        />
                        <select
                            className="w-24 text-sm px-2 py-2 border rounded-md focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                            value={form.durationUnit}
                            onChange={e => setForm(f => ({ ...f, durationUnit: e.target.value as any }))}
                        >
                            {DURATION_UNITS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
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
