import { useState } from 'react';
import { X, AlertCircle, FileText, PenLine, XCircle, CheckCircle, Upload } from 'lucide-react';
import { CompositeContract, ContractDetailDTO } from '../../../types';
import { toast } from 'sonner';

function isPendingRenterSign(contract: CompositeContract): boolean {
    const s = (contract.status || '').toUpperCase();
    if (s === 'PENDING') return !contract.renterSigned;
    return s === 'PENDING' && !contract.renterSigned;
}

export function RejectContractModal({
    contractRef,
    onConfirm,
    onClose,
}: {
    contractRef: string | undefined;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]"
                    style={{ background: 'var(--color-bg-secondary)' }}>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Từ chối hợp đồng</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Mã HĐ: <span className="font-mono">{contractRef || '—'}</span></p>
                    </div>
                    <button onClick={onClose}><X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-start gap-2 text-sm px-3 py-2.5"
                        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)' }}>
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                        <span style={{ color: 'var(--color-text)' }}>
                            Hợp đồng sẽ được trả lại cho chủ kho để chỉnh sửa. Bạn có thể ký sau khi hợp đồng được cập nhật.
                        </span>
                    </div>
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                            Lý do từ chối <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <textarea rows={3}
                            className="w-full text-sm px-3 py-2 border resize-none focus:outline-none focus:border-[var(--color-error)] transition-colors"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                            placeholder="Ví dụ: Sai thông tin mã số thuế, ngày bắt đầu chưa đúng..."
                            value={reason}
                            onChange={e => setReason(e.target.value)} />
                    </div>
                </div>
                <div className="px-5 pb-5 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 text-sm border transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        Hủy
                    </button>
                    <button
                        onClick={() => { if (!reason.trim()) { toast.error('Vui lòng nhập lý do'); return; } onConfirm(reason); }}
                        className="flex-1 py-2.5 text-sm text-white"
                        style={{ background: 'var(--color-error, #ef4444)' }}>
                        Xác nhận từ chối
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ContractDetailModal({
    contract,
    onAccept,
    onReject,
    onClose,
}: {
    contract: CompositeContract;
    onAccept?: () => void;
    onReject?: () => void;
    onClose: () => void;
}) {
    const readOnly = !isPendingRenterSign(contract);
    const fmtDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
    const fmtCur = (n: number | undefined) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
    const capacity = contract.rentedCapacity || 0;
    const rate = contract.monthlyRate || 0;
    const months = contract.start_at && contract.end_at
        ? Math.max(1, Math.ceil((new Date(contract.end_at).getTime() - new Date(contract.start_at).getTime()) / (30 * 86400000)))
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] my-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]"
                    style={{ background: readOnly ? 'var(--color-primary)' : '#f59e0b' }}>
                    <div className="flex items-center gap-2 text-white">
                        {readOnly ? <FileText className="h-5 w-5" /> : <PenLine className="h-5 w-5" />}
                        <div>
                            <p className="font-semibold">{readOnly ? 'Chi tiết hợp đồng' : 'Hợp đồng chờ ký xác nhận'}</p>
                            <p className="text-xs text-white/80 font-mono">{contract.contractRef || '—'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 text-sm" style={{ color: 'var(--color-text)' }}>
                    {/* Title */}
                    <div className="text-center pb-4 border-b border-[var(--color-border)]">
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </p>
                        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Độc lập – Tự do – Hạnh phúc</p>
                        <h2 className="text-base font-bold uppercase">{contract.contractTitle || 'HỢP ĐỒNG THUÊ KHO LẠNH'}</h2>
                    </div>

                    {/* PDF attachment notice */}
                    {contract.pdfFileName && (
                        <div className="flex items-center gap-3 px-4 py-3 border border-[var(--color-border)]"
                            style={{ background: 'rgba(37,99,235,0.05)' }}>
                            <div className="w-8 h-8 flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>File hợp đồng đính kèm</p>
                                <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{contract.pdfFileName}</p>
                            </div>
                            <span className="ml-auto text-xs px-2 py-0.5 border"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                                <Upload className="h-3 w-3 inline mr-1" /> PDF
                            </span>
                        </div>
                    )}

                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-primary)' }}>BÊN A — CHỦ KHO</p>
                            <dl className="space-y-1.5 text-xs">
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Tên:</dt><dd className="font-semibold">{contract.owner_legal_name || contract.ownerName || '—'}</dd></div>
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>MST:</dt><dd className="font-mono">{contract.owner_tax_code || '—'}</dd></div>
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Địa chỉ:</dt><dd>{contract.owner_address || '—'}</dd></div>
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>ĐT:</dt><dd>{contract.owner_phone || '—'}</dd></div>
                            </dl>
                        </div>
                        <div className="p-4 border border-[var(--color-border)]" style={{ background: 'rgba(34,197,94,0.05)' }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-success, #22c55e)' }}>BÊN B — NGƯỜI THUÊ (BẠN)</p>
                            <dl className="space-y-1.5 text-xs">
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Tên:</dt><dd className="font-semibold">{contract.renter_legal_name || '—'}</dd></div>
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Công ty:</dt><dd>{contract.renterCompany || '—'}</dd></div>
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>MST:</dt><dd className="font-mono">{contract.renter_tax_code || '—'}</dd></div>
                                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Địa chỉ:</dt><dd>{contract.renter_address || '—'}</dd></div>
                            </dl>
                        </div>
                    </div>

                    {/* Key terms */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>CHI TIẾT HỢP ĐỒNG</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            {[
                                { label: 'Bắt đầu', value: fmtDate(contract.start_at) },
                                { label: 'Kết thúc', value: fmtDate(contract.end_at) },
                                { label: 'Dung tích', value: `${capacity.toLocaleString()} m³` },
                                { label: 'Đơn giá/m³/tháng', value: fmtCur(rate) },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-3 border border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
                                    <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                                    <p className="font-semibold text-xs">{value}</p>
                                </div>
                            ))}
                        </div>
                        {months > 0 && (
                            <div className="flex items-center justify-between px-4 py-3"
                                style={{ background: 'rgba(37,99,235,0.07)', borderLeft: '3px solid var(--color-primary)' }}>
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    Tổng giá trị hợp đồng ({months} tháng):
                                </span>
                                <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{fmtCur(capacity * rate * months)}</span>
                            </div>
                        )}
                    </div>

                    {/* Terms */}
                    {(contract.payment_term || contract.penalty_clause || contract.special_term || contract.cargo_description) && (
                        <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
                            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>ĐIỀU KHOẢN</p>
                            {contract.cargo_description && (
                                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Hàng hóa</p>
                                    <p className="text-xs">{contract.cargo_description}</p></div>
                            )}
                            {contract.payment_term && (
                                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Thanh toán</p>
                                    <p className="text-xs">{contract.payment_term}</p></div>
                            )}
                            {contract.penalty_clause && (
                                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Phạt vi phạm</p>
                                    <p className="text-xs">{contract.penalty_clause}</p></div>
                            )}
                            {contract.special_term && (
                                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Điều khoản đặc biệt</p>
                                    <p className="text-xs">{contract.special_term}</p></div>
                            )}
                        </div>
                    )}

                </div>

                {/* Action footer */}
                <div className="sticky bottom-0 px-6 py-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-3"
                    style={{ background: 'var(--color-bg-secondary)' }}>
                    <button onClick={onClose}
                        className="sm:flex-none px-4 py-2.5 text-sm border transition-colors bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        Đóng
                    </button>
                    {!readOnly && (
                        <>
                            <div className="flex-1" />
                            <button onClick={onReject}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm border transition-colors bg-[var(--color-surface)]"
                                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                                <XCircle className="h-4 w-4" /> Từ chối hợp đồng
                            </button>
                            <button onClick={onAccept}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-white"
                                style={{ background: 'var(--color-success, #22c55e)' }}>
                                <CheckCircle className="h-4 w-4" /> Xác nhận ký kết
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
