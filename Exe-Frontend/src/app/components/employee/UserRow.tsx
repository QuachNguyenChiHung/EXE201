import React, { useState } from 'react';
import { Warehouse, CheckCircle, Sparkles, Edit2, ChevronDown, ChevronUp, Building, Phone, Mail, Calendar, ShieldCheck } from 'lucide-react';
import { User, UserRole } from '../../../types';

const ROLE_CFG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    renter: { label: 'Doanh nghiệp', color: 'var(--color-primary)', icon: <Building className="h-3.5 w-3.5" /> },
    warehouse: { label: 'Chủ kho', color: 'var(--color-secondary, #7c3aed)', icon: <Warehouse className="h-3.5 w-3.5" /> },
    employee: { label: 'Nhân viên', color: 'var(--color-success, #22c55e)', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

export default function UserRow({ user, onEdit, onViewConversations, warehouseCount, requestCount }: {
    user: User;
    onEdit: (u: User) => void;
    onViewConversations: (u: User) => void;
    warehouseCount: number;
    requestCount: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const cfg = ROLE_CFG[user.role];

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]"
            style={{ borderLeft: `3px solid ${cfg.color}` }}>
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center text-white" style={{ background: cfg.color }}>
                    {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-white px-1.5 py-0.5" style={{ background: cfg.color }}>
                            {cfg.icon} {cfg.label}
                        </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {user.role === 'warehouse' && (
                        <span className="flex items-center gap-1"><Warehouse className="h-3 w-3" /> {warehouseCount} kho</span>
                    )}
                    {user.role === 'renter' && (
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {requestCount} yêu cầu</span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {user.role === 'renter' && (
                        <button onClick={() => onViewConversations(user)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                            style={{ color: 'var(--color-primary)' }}>
                            <Sparkles className="h-3 w-3" /> AI Chat
                        </button>
                    )}
                    <button onClick={() => onEdit(user)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        <Edit2 className="h-3 w-3" /> Sửa
                    </button>
                    <button onClick={() => setExpanded(p => !p)}
                        className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-[var(--color-border)] px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ background: 'var(--color-bg-secondary)' }}>
                    <div>
                        <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>ID người dùng</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{user.id_user}</p>
                    </div>
                    {user.company?.company_name && (
                        <div>
                            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Công ty</p>
                            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                                <Building className="h-3 w-3 shrink-0" style={{ color: 'var(--color-primary)' }} /> {user.company.company_name}
                            </p>
                        </div>
                    )}
                    {user.phone && (
                        <div>
                            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Điện thoại</p>
                            <a href={`tel:${user.phone}`} className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                                <Phone className="h-3 w-3 shrink-0" /> {user.phone}
                            </a>
                        </div>
                    )}
                    <div>
                        <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Email</p>
                        <a href={`mailto:${user.email}`} className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                            <Mail className="h-3 w-3 shrink-0" /> {user.email}
                        </a>
                    </div>
                    <div>
                        <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Ngày tham gia</p>
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                            <Calendar className="h-3 w-3 shrink-0" /> {fmtDate(user.create_at)}
                        </p>
                    </div>
                    {user.role === 'warehouse' && (
                        <div>
                            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Số kho đã đăng</p>
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{warehouseCount} kho</p>
                        </div>
                    )}
                    {user.role === 'renter' && (
                        <div>
                            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Số yêu cầu đã gửi</p>
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{requestCount} yêu cầu</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
