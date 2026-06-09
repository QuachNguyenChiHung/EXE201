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
    onConfirm: (isVerified: boolean, typeId: number | null) => void;
    onCancel: () => void;
}) {
    const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');

    const handleApprove = () => {
        if (!selectedTypeId) {
            alert("Vui lòng chọn loại chứng nhận trước khi duyệt.");
            return;
        }
        onConfirm(true, Number(selectedTypeId));
    };

    const handleReject = () => {
        onConfirm(false, null);
    };

    return (
        <Modal title="Xét duyệt chứng nhận" onClose={onCancel} className="max-w-md">
            <div className="px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'rgba(37,99,235,0.04)' }}>
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        Vui lòng kiểm tra tài liệu PDF bên dưới. Nếu hợp lệ, chọn loại chứng nhận tương ứng và Duyệt. Nếu không hợp lệ, hãy Từ chối.
                    </p>
                </div>
            </div>

            <div className="px-5 py-5 space-y-4">
                {/* Certificate Link */}
                <div className="border border-[var(--color-border)] rounded-md p-4 bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {cert.label || `Chứng nhận #${cert.id || cert.id_cerfSubmit}`}
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

                {/* Dropdown for Cert Type */}
                <div>
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
                            {certTypes.map(ct => (
                                <option key={ct.id_certification} value={ct.id_certification}>
                                    {ct.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
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
                    onClick={handleReject} 
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[var(--color-error)] rounded-md transition-colors"
                    style={{ color: 'var(--color-error, #ef4444)', background: 'var(--color-surface)' }}
                >
                    <XCircle className="h-4 w-4" /> Từ chối
                </button>
                <button 
                    onClick={handleApprove} 
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
                    style={{ background: 'var(--color-success, #22c55e)' }}
                    disabled={!selectedTypeId}
                >
                    <CheckCircle className="h-4 w-4" /> Duyệt
                </button>
            </div>
        </Modal>
    );
}
