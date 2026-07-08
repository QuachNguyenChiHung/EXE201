import { useState } from 'react';
import { X, AlertCircle, FileText, PenLine, XCircle, CheckCircle, Printer } from 'lucide-react';
import { CompositeContract } from '../../../types';
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
            <div className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] my-4 max-h-[92vh] overflow-y-auto">
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
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white border border-white/30 hover:bg-white/10 transition-colors">
                            <Printer className="h-4 w-4" /> In hợp đồng
                        </button>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Printable contract content */}
                <style>{`
                    @media print {
                        @page { margin: 0; }
                        body { margin: 1.6cm; background: white; }
                        body * { visibility: hidden; }
                        #contract-print-area, #contract-print-area * { visibility: visible; }
                        #contract-print-area {
                            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
                            box-shadow: none !important; border: none !important;
                        }
                        #contract-modal-root > * { display: none !important; }
                        #contract-modal-root { display: block !important; }
                    }
                    @media screen {
                        #contract-print-area {
                            background: white;
                        }
                    }
                `}</style>

                <div id="contract-print-area" style={{ background: 'white', fontFamily: '"Times New Roman", Times, serif', color: '#000', padding: '24px 28px' }}>
                    {/* Paper header */}
                    <div className="text-center mb-4" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13pt' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: '4px', fontSize: '14pt', marginTop: '4px' }}>Độc lập - Tự do - Hạnh phúc</div>
                        <div style={{ fontStyle: 'italic', fontSize: '13pt', marginTop: '12px' }}>
                            Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-4">
                        <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase' }}>HỢP ĐỒNG CHO THUÊ KHO BÃI</div>
                        <div style={{ fontSize: '13pt' }}>Số: {contract.contractRef || contract.id}/{new Date().getFullYear()}/HĐTK</div>
                    </div>

                    {/* Parties */}
                    <div style={{ marginBottom: '16px', fontSize: '13pt', lineHeight: '1.8' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14pt' }}>BÊN CHO THUÊ (BÊN A):</span>
                            <div style={{ paddingLeft: '16px' }}>
                                <div><strong>Cơ sở / Kho bãi:</strong> {contract.warehouseName || '—'}</div>
                                <div><strong>Đại diện pháp luật:</strong> {contract.owner_legal_name || contract.ownerName || '—'}</div>
                                <div><strong>Mã số thuế:</strong> {contract.owner_tax_code || '—'}</div>
                                <div><strong>Địa chỉ kho:</strong> {contract.owner_address || '—'}</div>
                                <div><strong>Điện thoại:</strong> {contract.owner_phone || '—'}</div>
                            </div>
                        </div>
                        <div>
                            <span style={{ fontWeight: 'bold', fontSize: '14pt' }}>BÊN THUÊ (BÊN B):</span>
                            <div style={{ paddingLeft: '16px' }}>
                                <div><strong>Đại diện pháp luật:</strong> {contract.renter_legal_name || contract.renterName || '—'}</div>
                                <div><strong>Công ty:</strong> {contract.renterCompany || '—'}</div>
                                <div><strong>Mã số thuế:</strong> {contract.renter_tax_code || '—'}</div>
                                <div><strong>Địa chỉ:</strong> {contract.renter_address || '—'}</div>
                                <div><strong>Điện thoại:</strong> {contract.renterPhone || '—'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Contract details */}
                    <div style={{ marginBottom: '16px', fontSize: '13pt', lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14pt' }}>ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</div>
                        <p style={{ marginBottom: '8px' }}>
                            Bên A đồng ý cho Bên B thuê không gian tại kho bãi <strong>{contract.warehouseName || '—'}</strong>.
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>Thời hạn:</strong> Từ ngày {fmtDate(contract.start_at)} đến ngày {fmtDate(contract.end_at)}.
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>Dung tích thuê:</strong> {capacity.toLocaleString()} m³ — <strong>Đơn giá:</strong> {fmtCur(rate)} / m³/tháng.
                        </p>
                    </div>

                    {/* Contract value */}
                    <div style={{ marginBottom: '16px', fontSize: '13pt', lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14pt' }}>ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & THANH TOÁN</div>
                        <p style={{ marginBottom: '8px' }}>
                            Tổng giá trị hợp đồng ({months} tháng): <strong style={{ color: 'var(--color-primary)' }}>{fmtCur(capacity * rate * months)}</strong> <em>(Chưa bao gồm thuế GTGT)</em>.
                        </p>
                        <p style={{ marginBottom: '8px' }}>{contract.payment_term || 'Chưa cập nhật phương thức và kỳ hạn thanh toán cụ thể.'}</p>
                    </div>

                    {/* Terms */}
                    <div style={{ marginBottom: '16px', fontSize: '13pt', lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14pt' }}>ĐIỀU 3: ĐIỀU KHOẢN PHẠT & CAM KẾT CHUNG</div>
                        <p style={{ marginBottom: '8px' }}>{contract.penalty_clause || 'Chưa cập nhật các điều khoản phạt vi phạm hợp đồng.'}</p>
                        <p style={{ marginBottom: '8px' }}>{contract.special_term || 'Chưa có các cam kết hoặc điều khoản đặc biệt nào khác.'}</p>
                    </div>

                    {/* Cargo */}
                    {contract.cargo_description && (
                        <div style={{ marginBottom: '16px', fontSize: '13pt', lineHeight: '1.8' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14pt' }}>ĐIỀU 4: HÀNG HÓA LƯU TRỮ</div>
                            <p style={{ marginBottom: '8px' }}>{contract.cargo_description}</p>
                        </div>
                    )}

                    {/* Legal effect */}
                    <div style={{ marginBottom: '24px', fontSize: '13pt', lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14pt' }}>ĐIỀU 5: HIỆU LỰC HỢP ĐỒNG</div>
                        <p>Hợp đồng này được tạo và lưu trữ trên hệ thống nền tảng AiLogis, có giá trị pháp lý tương đương văn bản thỏa thuận điện tử giữa các bên.</p>
                    </div>

                    {/* Signatures */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '40px', textAlign: 'center', fontSize: '13pt' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ĐẠI DIỆN BÊN A</div>
                            <div style={{ fontStyle: 'italic', marginBottom: '48px' }}>(Ký, ghi rõ họ tên)</div>
                            <div style={{ fontWeight: 'bold' }}>{contract.owner_legal_name || contract.ownerName}</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ĐẠI DIỆN BÊN B</div>
                            <div style={{ fontStyle: 'italic', marginBottom: '48px' }}>(Ký, ghi rõ họ tên)</div>
                            <div style={{ fontWeight: 'bold' }}>{contract.renter_legal_name || contract.renterName}</div>
                        </div>
                    </div>
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
