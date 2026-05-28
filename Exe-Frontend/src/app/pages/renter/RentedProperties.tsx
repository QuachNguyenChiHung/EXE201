import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { contractsAPI, warehousesAPI, ratingsAPI } from '../../../services/apiClient';
import { RentalContract, ColdStorage } from '../../../types';
import { RateWarehouseModal } from '../../components/RateWarehouseModal';
import {
  MapPin, Thermometer, Package, Calendar, Clock, CheckCircle,
  AlertTriangle, ArrowLeft, Phone, ExternalLink, RotateCcw,
  Snowflake, FileText, XCircle, LayoutGrid, PenLine, X, Hash,
  Building, User, DollarSign, AlertCircle, Upload, Star,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<RentalContract['status'], {
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

type FilterTab = 'all' | RentalContract['status'];

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',            label: 'Tất cả'        },
  { key: 'pending_renter', label: 'Chờ ký'         },
  { key: 'active',         label: 'Đang thuê'      },
  { key: 'expiring_soon',  label: 'Sắp hết hạn'   },
  { key: 'expired',        label: 'Đã hết hạn'    },
  { key: 'cancelled',      label: 'Đã huỷ'        },
];

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectContractModal({
  contractRef,
  onConfirm,
  onClose,
}: {
  contractRef: string;
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
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Mã HĐ: <span className="font-mono">{contractRef}</span></p>
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

// ── Contract detail drawer (pending_renter) ───────────────────────────────────
function ContractDetailModal({
  contract,
  onAccept,
  onReject,
  onClose,
}: {
  contract: RentalContract;
  onAccept?: () => void;
  onReject?: () => void;
  onClose: () => void;
}) {
  const readOnly = contract.status !== 'pending_renter';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const fmtCur = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  const capacity = contract.rentedCapacity;
  const rate = contract.monthlyRate;
  const months = contract.startDate && contract.endDate
    ? Math.max(1, Math.ceil((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (30 * 86400000)))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]"
          style={{ background: readOnly ? 'var(--color-primary)' : '#f59e0b' }}>
          <div className="flex items-center gap-2 text-white">
            {readOnly ? <FileText className="h-5 w-5" /> : <PenLine className="h-5 w-5" />}
            <div>
              <p className="font-semibold">{readOnly ? 'Chi tiết hợp đồng' : 'Hợp đồng chờ ký xác nhận'}</p>
              <p className="text-xs text-white/80 font-mono">{contract.contractRef}</p>
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
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Tên:</dt><dd className="font-semibold">{contract.ownerLegalName || contract.ownerName || '—'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>MST:</dt><dd className="font-mono">{contract.ownerTaxCode || '—'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Địa chỉ:</dt><dd>{contract.ownerAddress || '—'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>ĐT:</dt><dd>{contract.ownerPhone || '—'}</dd></div>
              </dl>
            </div>
            <div className="p-4 border border-[var(--color-border)]" style={{ background: 'rgba(34,197,94,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-success, #22c55e)' }}>BÊN B — NGƯỜI THUÊ (BẠN)</p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Tên:</dt><dd className="font-semibold">{contract.renterLegalName || '—'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Công ty:</dt><dd>{contract.renterCompany || '—'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>MST:</dt><dd className="font-mono">{contract.renterTaxCode || '—'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 70 }}>Địa chỉ:</dt><dd>{contract.renterAddress || '—'}</dd></div>
              </dl>
            </div>
          </div>

          {/* Key terms */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>CHI TIẾT HỢP ĐỒNG</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Bắt đầu', value: fmtDate(contract.startDate) },
                { label: 'Kết thúc', value: fmtDate(contract.endDate) },
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
          {(contract.paymentTerms || contract.penaltyClause || contract.specialTerms || contract.cargoDescription) && (
            <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>ĐIỀU KHOẢN</p>
              {contract.cargoDescription && (
                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Hàng hóa</p>
                  <p className="text-xs">{contract.cargoDescription}</p></div>
              )}
              {contract.paymentTerms && (
                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Thanh toán</p>
                  <p className="text-xs">{contract.paymentTerms}</p></div>
              )}
              {contract.penaltyClause && (
                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Phạt vi phạm</p>
                  <p className="text-xs">{contract.penaltyClause}</p></div>
              )}
              {contract.specialTerms && (
                <div><p className="text-[10px] uppercase mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Điều khoản đặc biệt</p>
                  <p className="text-xs">{contract.specialTerms}</p></div>
              )}
            </div>
          )}

          {/* Notes */}
          {contract.notes && (
            <div className="px-3 py-2 border-l-2 border-[var(--color-border)] text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <strong>Ghi chú:</strong> {contract.notes}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-3"
          style={{ background: 'var(--color-bg-secondary)' }}>
          <button onClick={onClose}
            className="sm:flex-none px-4 py-2.5 text-sm border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            Đóng
          </button>
          {!readOnly && (
            <>
              <div className="flex-1" />
              <button onClick={onReject}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm border transition-colors"
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const daysUntil = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RentedProperties() {
  const navigate = useNavigate();
  const { user, isAuthenticated, contracts: allContracts, warehouses: warehouseList, ratings: allRatings, refreshContracts, refreshWarehouses, refreshRatings } = useApp();
  
  const [tab, setTab] = useState<FilterTab>('all');
  const [viewingContract, setViewingContract] = useState<RentalContract | null>(null);
  const [rejectingContract, setRejectingContract] = useState<RentalContract | null>(null);
  const [ratingContract, setRatingContract] = useState<RentalContract | null>(null);

  // Helper: refresh data from API
  const refreshData = async () => {
    try {
      await Promise.all([
        refreshContracts(),
        refreshWarehouses(),
        refreshRatings(),
      ]);
    } catch (err) {
      console.warn('[RentedProperties] refreshData failed', err);
    }
  };

  const warehouses = useMemo<Record<string, ColdStorage>>(
    () => Object.fromEntries(warehouseList.map(w => [w.id, w])),
    [warehouseList],
  );

  const contracts = useMemo(
    () => allContracts.filter(c => c.renterId === user?.id),
    [allContracts, user],
  );

  useEffect(() => {
    // initial load
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await contractsAPI.update(id, { status: 'cancelled', notes: 'Huỷ theo yêu cầu của người thuê.' });
      await refreshData();
      toast.success('Đã huỷ hợp đồng.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể huỷ hợp đồng');
    }
  };

  const handleAcceptContract = async (id: string) => {
    try {
      await contractsAPI.update(id, { status: 'active', acceptedAt: new Date().toISOString() });
      await refreshData();
      setViewingContract(null);
      toast.success('Đã ký xác nhận hợp đồng! Hợp đồng hiện đang có hiệu lực.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể xác nhận hợp đồng');
    }
  };

  const handleRejectContract = async (id: string, reason: string) => {
    try {
      await contractsAPI.update(id, { status: 'draft', renterRejectionReason: reason });
      await refreshData();
      setRejectingContract(null);
      setViewingContract(null);
      toast.success('Đã gửi phản hồi từ chối. Chủ kho sẽ chỉnh sửa và gửi lại.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể từ chối hợp đồng');
    }
  };

  const filtered = contracts.filter(c => tab === 'all' || c.status === tab);

  const counts = contracts.reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const pendingSignCount = counts['pending_renter'] ?? 0;

  const activeCount = counts['active'] ?? 0;


  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      {viewingContract && (
        <ContractDetailModal
          contract={viewingContract}
          onAccept={() => handleAcceptContract(viewingContract.id)}
          onReject={() => { setRejectingContract(viewingContract); setViewingContract(null); }}
          onClose={() => setViewingContract(null)}
        />
      )}

      {rejectingContract && (
        <RejectContractModal
          contractRef={rejectingContract.contractRef}
          onConfirm={reason => handleRejectContract(rejectingContract.id, reason)}
          onClose={() => setRejectingContract(null)}
        />
      )}

      {ratingContract && (() => {
        const wh = warehouses[ratingContract.warehouseId];
        const existingRating = allRatings.find(r => r.contractId === ratingContract.id);
        return (
          <RateWarehouseModal
            warehouseId={ratingContract.warehouseId}
            warehouseName={wh?.name ?? `Kho #${ratingContract.warehouseId}`}
            contractId={ratingContract.id}
            contractRef={ratingContract.contractRef}
            existingRating={existingRating}
            onClose={() => setRatingContract(null)}
          />
        );
      })()}

      <div className="bento-container">
        {/* ── Header ── */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/renter')}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chính
          </button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1>Kho đang thuê</h1>
              <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                Quản lý các hợp đồng thuê kho lạnh của bạn
              </p>
            </div>
            <button
              onClick={() => navigate('/renter/search')}
              className="bg-[var(--color-primary)] text-white px-5 py-2.5 text-sm hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2"
            >
              <Package className="h-4 w-4" /> Tìm thêm kho
            </button>
          </div>
        </div>

        {/* ── Pending sign banner ── */}
        {pendingSignCount > 0 && (
          <div className="flex items-center gap-4 px-4 py-3 mb-6 border"
            style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.4)' }}>
            <PenLine className="h-5 w-5 shrink-0" style={{ color: '#f59e0b' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Bạn có {pendingSignCount} hợp đồng đang chờ ký xác nhận
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Xem nội dung và ký kết để hợp đồng có hiệu lực.
              </p>
            </div>
            <button onClick={() => setTab('pending_renter')}
              className="text-sm px-3 py-1.5 text-white shrink-0"
              style={{ background: '#f59e0b' }}>
              Xem ngay
            </button>
          </div>
        )}

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
          {[
            { label: 'Đang thuê',    key: 'active',        color: 'var(--color-success)'      },
            { label: 'Sắp hết hạn',  key: 'expiring_soon', color: 'var(--color-warning)'      },
            { label: 'Đã hết hạn',   key: 'expired',       color: 'var(--color-text-muted)'   },
            { label: 'Đã huỷ',       key: 'cancelled',     color: 'var(--color-error)'        },
          ].map(s => (
            <div key={s.label} className="bg-[var(--color-surface)] p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: s.color }} />
                <p className="text-2xl font-extrabold">{counts[s.key] ?? 0}</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[var(--color-border)] mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {t.label}
              {t.key !== 'all' && counts[t.key] ? (
                <span className="ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 py-0.5">
                  {counts[t.key]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Contract list ── */}
        {contracts.length === 0 ? (
          <div className="mt-2 border p-8 text-center"
            style={{ background: 'rgba(37,99,235,0.04)', borderColor: 'rgba(37,99,235,0.2)' }}>
            <Snowflake className="h-10 w-10 text-[var(--color-primary)] mx-auto mb-3" />
            <h3 className="mb-2">Bạn chưa có kho nào đang hoạt động</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-5">
              Khám phá hàng trăm kho lạnh trên toàn quốc và bắt đầu thuê ngay hôm nay.
            </p>
            <button
              onClick={() => navigate('/renter/search')}
              className="text-white px-6 py-2.5 text-sm hover:opacity-90 transition-opacity"
              style={{ background: 'var(--color-primary)' }}
            >
              Tìm kho lạnh →
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-16 text-center">
            <Snowflake className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-text-secondary)]">Không có hợp đồng nào trong mục này.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-[var(--color-border)]">
            {filtered.map(contract => {
              const wh   = warehouses[contract.warehouseId];
              const cfg  = STATUS_CONFIG[contract.status];
              const monthly = contract.rentedCapacity * contract.monthlyRate;
              const days = daysUntil(contract.endDate);

              const rentedSection = contract.sectionId
                ? (wh?.sections?.find(s => s.id === contract.sectionId) ?? null)
                : null;

              const tempMin = rentedSection ? rentedSection.temperatureMin : wh?.stats.temperatureMin;
              const tempMax = rentedSection ? rentedSection.temperatureMax : wh?.stats.temperatureMax;

              // Rating state for this contract
              const myRating = allRatings.find(r => r.contractId === contract.id);
              const canRate = ['active', 'expiring_soon', 'expired'].includes(contract.status);

              return (
                <div key={contract.id} className="bg-[var(--color-surface)] flex flex-col lg:flex-row">
                  {/* Colour accent strip */}
                  <div className={`w-full lg:w-1.5 h-1.5 lg:h-auto ${cfg.stripeBg} flex-shrink-0`} />

                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* ── Warehouse info ── */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 ${cfg.bg} ${cfg.text}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Hợp đồng: <span className="font-mono">{contract.contractRef}</span>
                          </span>
                        </div>

                        <h3 className="mb-1">{wh ? wh.name : `Kho #${contract.warehouseId}`}</h3>

                        {wh && (
                          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-3">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{wh.location.address}, {wh.location.city}, {wh.location.province}</span>
                          </div>
                        )}

                        {/* Section banner */}
                        {rentedSection && (
                          <div
                            className="flex items-start gap-3 mb-3 px-3 py-2.5"
                            style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid var(--color-primary)' }}
                          >
                            <LayoutGrid className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                                  Phân khu đang thuê
                                </span>
                              </div>
                              <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
                                {rentedSection.name}
                              </p>
                              {rentedSection.description && (
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                  {rentedSection.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-info, #3b82f6)' }}>
                                  <Thermometer className="h-3 w-3" />
                                  {rentedSection.temperatureMin}°C ~ {rentedSection.temperatureMax}°C
                                </span>
                                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  <Package className="h-3 w-3" />
                                  Tổng {rentedSection.capacity.toLocaleString()} m³ · Còn {rentedSection.availableCapacity.toLocaleString()} m³
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Spec chips */}
                        <div className="flex flex-wrap gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-[var(--color-primary)]" />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--color-text-muted)]">Dung tích thuê</div>
                              <div className="font-semibold">{contract.rentedCapacity.toLocaleString()} m³</div>
                            </div>
                          </div>

                          {tempMin !== undefined && tempMax !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(2,132,199,0.1)' }}>
                                <Thermometer className="h-4 w-4 text-[var(--color-info, #3b82f6)]" />
                              </div>
                              <div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  Nhiệt độ{rentedSection ? ' phân khu' : ''}
                                </div>
                                <div className="font-semibold">{tempMin}°C ~ {tempMax}°C</div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[var(--color-bg-secondary)] flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-4 w-4 text-[var(--color-text-secondary)]" />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--color-text-muted)]">Thời hạn</div>
                              <div className="font-semibold">
                                {fmtDate(contract.startDate)} → {fmtDate(contract.endDate)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expiry warning */}
                        {contract.status === 'expiring_soon' && days > 0 && (
                          <div className="flex items-center gap-2 border border-[var(--color-warning)] px-3 py-2 text-sm mb-3"
                            style={{ background: 'rgba(245,158,11,0.07)', color: 'var(--color-warning)' }}>
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            Còn <strong className="mx-1">{days} ngày</strong> nữa hết hạn — hãy gia hạn sớm!
                          </div>
                        )}

                        {/* Owner contact (if available) */}
                        {(contract.ownerPhone || contract.ownerEmail) && (
                          <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span>Chủ kho: <strong style={{ color: 'var(--color-text)' }}>{contract.ownerName}</strong></span>
                            {contract.ownerPhone && (
                              <a href={`tel:${contract.ownerPhone}`} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                                <Phone className="h-3 w-3" />{contract.ownerPhone}
                              </a>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {contract.notes && (
                          <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-3 py-2 border-l-2 border-[var(--color-border)] mt-2">
                            {contract.notes}
                          </p>
                        )}
                      </div>

                      {/* ── Right panel: price + actions ── */}
                      <div className="lg:w-56 flex-shrink-0 flex flex-col gap-3">
                        <div className="bg-[var(--color-bg)] p-4">
                          <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Chi phí / tháng</div>
                          <div className="font-extrabold text-[var(--color-primary)]">{fmtCurrency(monthly)}</div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{fmtCurrency(contract.monthlyRate)}/m³</div>
                          {rentedSection && (
                            <div className="flex items-center gap-1 text-xs mt-2 pt-2"
                              style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                              <LayoutGrid className="h-3 w-3 flex-shrink-0" />
                              <span>{rentedSection.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {wh && (
                            <button
                              onClick={() => navigate(`/renter/warehouse/${wh.id}`)}
                              className="flex items-center justify-center gap-2 text-white text-sm px-4 py-2 hover:opacity-90 transition-opacity"
                              style={{ background: 'var(--color-primary)' }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Xem chi tiết kho
                            </button>
                          )}

                          {contract.status === 'pending_renter' && (
                            <>
                              <button
                                onClick={() => setViewingContract(contract)}
                                className="flex items-center justify-center gap-2 text-white text-sm px-4 py-2"
                                style={{ background: '#f59e0b' }}>
                                <PenLine className="h-3.5 w-3.5" /> Xem & Ký kết
                              </button>
                              <button
                                onClick={() => setRejectingContract(contract)}
                                className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                                <XCircle className="h-3.5 w-3.5" /> Từ chối
                              </button>
                            </>
                          )}

                          {(contract.status === 'active' || contract.status === 'expiring_soon') && (
                            <button className="flex items-center justify-center gap-2 border text-sm px-4 py-2 hover:opacity-80 transition-opacity"
                              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                              <RotateCcw className="h-3.5 w-3.5" /> Gia hạn hợp đồng
                            </button>
                          )}

                          {contract.status !== 'pending_renter' && (
                            <button
                              onClick={() => setViewingContract(contract)}
                              className="flex items-center justify-center gap-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm px-4 py-2 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                              <FileText className="h-3.5 w-3.5" /> Xem hợp đồng
                            </button>
                          )}

                          {contract.status === 'active' && (
                            <button
                              onClick={() => handleCancel(contract.id)}
                              className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                              style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Huỷ hợp đồng
                            </button>
                          )}

                          {canRate && (
                            <button
                              onClick={() => setRatingContract(contract)}
                              className="flex items-center justify-center gap-2 border text-sm px-4 py-2 transition-colors"
                              style={myRating
                                ? { borderColor: '#f59e0b', color: '#f59e0b' }
                                : { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
                              }
                            >
                              <Star
                                className="h-3.5 w-3.5"
                                style={myRating ? { fill: '#f59e0b', color: '#f59e0b' } : {}}
                              />
                              {myRating ? `Đánh giá: ${myRating.stars}★` : 'Đánh giá kho'}
                            </button>
                          )}


                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}