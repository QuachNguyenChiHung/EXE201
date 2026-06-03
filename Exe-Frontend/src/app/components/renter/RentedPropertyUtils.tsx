import React from 'react';
import { FileText, PenLine, CheckCircle, Clock, XCircle } from 'lucide-react';
import { CompositeContract } from '../../../types';

export type ContractStatus = CompositeContract['status'];

export const STATUS_CONFIG: Record<string, {
    label: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
    stripeBg: string;
}> = {
    draft: {
        label: 'Bản nháp',
        bg: 'bg-[var(--color-text-muted)]',
        text: 'text-white',
        icon: <FileText className="h-3.5 w-3.5" />,
        stripeBg: 'bg-[var(--color-text-muted)]',
    },
    pending_renter: {
        label: 'Chờ bạn ký',
        bg: 'bg-[#f59e0b]',
        text: 'text-white',
        icon: <PenLine className="h-3.5 w-3.5" />,
        stripeBg: 'bg-[#f59e0b]',
    },
    active: {
        label: 'Đang thuê',
        bg: 'bg-[var(--color-success)]',
        text: 'text-white',
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        stripeBg: 'bg-[var(--color-success)]',
    },
    expiring_soon: {
        label: 'Sắp hết hạn',
        bg: 'bg-[var(--color-warning)]',
        text: 'text-white',
        icon: <Clock className="h-3.5 w-3.5" />,
        stripeBg: 'bg-[var(--color-warning)]',
    },
    expired: {
        label: 'Đã hết hạn',
        bg: 'bg-[var(--color-text-muted)]',
        text: 'text-white',
        icon: <XCircle className="h-3.5 w-3.5" />,
        stripeBg: 'bg-[var(--color-text-muted)]',
    },
    cancelled: {
        label: 'Đã huỷ',
        bg: 'bg-[var(--color-error)]',
        text: 'text-white',
        icon: <XCircle className="h-3.5 w-3.5" />,
        stripeBg: 'bg-[var(--color-error)]',
    },
};

export type FilterTab = 'all' | ContractStatus;

export const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending_renter', label: 'Chờ ký' },
    { key: 'active', label: 'Đang thuê' },
    { key: 'expiring_soon', label: 'Sắp hết hạn' },
    { key: 'expired', label: 'Đã hết hạn' },
    { key: 'cancelled', label: 'Đã huỷ' },
];

export const fmtCurrency = (n: number | undefined) => {
    if (n === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
};

export const fmtDate = (d: string | undefined) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return d;
    }
};

export const daysUntil = (d: string | undefined) => {
    if (!d) return 0;
    try {
        return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
    } catch {
        return 0;
    }
};
