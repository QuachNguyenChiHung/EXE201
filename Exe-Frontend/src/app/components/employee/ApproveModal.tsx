import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { Loader2, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import type { CertificationSubmit, CertificationType } from '../../../types';

export default function ApproveModal({
    cert,
    certTypes,
    certTypesLoading,
    onConfirm,
    onCancel,
}: {
    cert: CertificationSubmit | any;
    certTypes: CertificationType[];
    certTypesLoading: boolean;
    onConfirm: (status: string, typeId: number | null, rejectReason?: string) => void;
    onCancel: () => void;
}) {
    const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
    const [status, setStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
    const [rejectReason, setRejectReason] = useState<string>('');

    const handleSubmit = () => {
        if (status === 'VERIFIED') {
            if (!selectedTypeId) {
                alert("Vui lòng chọn loại chứng nhận trước khi duyệt.");
                return;
            }
            onConfirm('VERIFIED', Number(selectedTypeId));
        } else {
            if (!rejectReason.trim()) {
                alert("Lý do từ chối không được để trống.");
                return;
            }
            onConfirm('REJECTED', null, rejectReason.trim());
        }
    };

    return (
        <Modal title="Xét duyệt chứng nhận" onClose={onCancel} className="max-w-md">
            <div className="px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'rgba(37,99,235,0.04)' }}>
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        Vui lòng kiểm tra tài liệu PDF bên dưới. Chọn trạng thái tương ứng để Duyệt hoặc Từ chối.
                    </p>
                </div>
            </div>

            <div className="px-5 py-5 space-y-5">
                {/* Certificate Link */}
                <div className="border border-[var(--color-border)] rounded-md p-4 bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {cert.link ? decodeURIComponent(cert.link.split('/').pop() || '') : (cert.label || `Chứng nhận #${cert.id || cert.id_cerfSubmit}`)}
                    </p>
                    {cert.link && cert.link !== '#' ? (
                        <a 
                            href={cert.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs font-medium hover:underline mt-1" 
                            style={{ color: 'var(--color-primary)' }}
                        >
                            Xem tài liệu (Mở tab mới)
                        </a>
                    ) : (
                        <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Không có liên kết tài liệu</span>
                    )}
                </div>

                {/* Status Selector */}
                <div>
                    <label className="block text-xs font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                        Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'VERIFIED' | 'REJECTED')}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-sm outline-none focus:border-[var(--color-primary)]"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                        <option value="VERIFIED">Duyệt tài liệu</option>
                        <option value="REJECTED">Từ chối</option>
                    </select>
                </div>

                {status === 'VERIFIED' && (
                    <div>
                        {/* Dropdown for Cert Type */}
                        <label className="block text-xs font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                            Chọn Loại Chứng Nhận <span className="text-red-500">*</span>
                        </label>
                        {certTypesLoading ? (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải danh sách...
                            </div>
                        ) : (
                            <select 
                                value={selectedTypeId} 
                                onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-sm outline-none focus:border-[var(--color-primary)]"
                                style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
                            >
                                <option value="">-- Chọn loại chứng nhận --</option>
                                {certTypes.map((ct: any) => {
                                    const idValue = ct.id_certification || ct.certID || ct.id;
                                    return (
                                        <option key={idValue} value={idValue}>
                                            {ct.label}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                )}

                {status === 'REJECTED' && (
                    <div>
                        {/* Textarea for Reject Reason */}
                        <label className="block text-xs font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                            Lý do từ chối <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--color-error, #ef4444)] rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--color-error, #ef4444)]"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
                            rows={3}
                            placeholder="Vui lòng nhập lý do từ chối tài liệu này..."
                        />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="px-5 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 bg-[var(--color-bg-secondary)] rounded-b-lg">
                <button 
                    onClick={onCancel} 
                    className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-md hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    Huỷ
                </button>
                <button 
                    onClick={handleSubmit} 
                    className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
                    style={{ background: status === 'VERIFIED' ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)' }}
                >
                    {status === 'VERIFIED' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    Xác nhận
                </button>
            </div>
        </Modal>
    );
}
