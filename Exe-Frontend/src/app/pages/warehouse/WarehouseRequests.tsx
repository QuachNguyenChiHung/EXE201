import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { RentRequest, ColdStorage, RentalContract } from '../../../types';
import {
  ClipboardList, Send, Eye, XCircle, MessageSquare, CheckCircle,
  Clock, Phone, Mail, Building, User, Calendar, ChevronDown,
  AlertCircle, ArrowLeft, Snowflake, Tag, X, DollarSign,
  FileText, LayoutGrid, FilePlus, ExternalLink, Package,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
type RequestStatus = RentRequest['status'];
type IncomingRequest = RentRequest;

const CARGO_LABEL: Record<string, string> = {
  frozen_food: 'Thực phẩm đông lạnh',
  seafood:     'Hải sản tươi sống',
  vegetables:  'Rau củ quả tươi',
  dairy:       'Sữa & chế phẩm',
  pharma:      'Dược phẩm / y tế',
  beverage:    'Đồ uống / nước giải khát',
  cosmetics:   'Mỹ phẩm',
  chemical:    'Hóa chất kiểm soát',
  other:       'Loại hàng khác',
};

const UNIT_LABEL: Record<string, string> = { month: 'tháng', day: 'ngày', year: 'năm' };

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent:        { label: 'Chờ xem',           color: '#3b82f6', icon: <Send className="h-3 w-3" /> },
  viewed:      { label: 'Đã xem',            color: '#f59e0b', icon: <Eye className="h-3 w-3" /> },
  inprogress:  { label: 'Đang thương lượng', color: '#22c55e', icon: <MessageSquare className="h-3 w-3" /> },
  rejected:    { label: 'Đã từ chối',        color: '#ef4444', icon: <XCircle className="h-3 w-3" /> },
  contracted:  { label: 'Có hợp đồng',       color: '#7c3aed', icon: <FileText className="h-3 w-3" /> },
};

type FilterTab = 'all' | RequestStatus;
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'sent',       label: 'Chờ xem' },
  { key: 'viewed',     label: 'Đã xem' },
  { key: 'inprogress', label: 'Thương lượng' },
  { key: 'contracted', label: 'Có hợp đồng' },
  { key: 'rejected',   label: 'Đã từ chối' },
];

// ── Contract status config ────────────────────────────────────────────────────
const CONTRACT_CFG: Record<string, { label: string; sublabel: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:          { label: 'Nháp hợp đồng',         sublabel: 'Chưa gửi cho người thuê',        color: '#6b7280', bg: 'rgba(107,114,128,0.07)', icon: <FileText className="h-3.5 w-3.5" /> },
  pending_renter: { label: 'Chờ người thuê ký',      sublabel: 'Đã gửi — đang đợi xác nhận',    color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',  icon: <Clock className="h-3.5 w-3.5" /> },
  active:         { label: 'Hợp đồng đang hiệu lực', sublabel: 'Người thuê đã ký — đang chạy', color: '#22c55e', bg: 'rgba(34,197,94,0.07)',   icon: <CheckCircle className="h-3.5 w-3.5" /> },
  expired:        { label: 'Hợp đồng hết hạn',       sublabel: 'Đã kết thúc',                   color: '#9ca3af', bg: 'rgba(156,163,175,0.07)', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled:      { label: 'Hợp đồng đã hủy',        sublabel: 'Đã bị hủy',                     color: '#ef4444', bg: 'rgba(239,68,68,0.07)',   icon: <XCircle className="h-3.5 w-3.5" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 2)  return 'vừa xong';
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days  < 7)  return `${days} ngày trước`;
  return fmtDate(iso);
}

// ── Response modal ────────────────────────────────────────────────────────────
interface ResponseModalProps {
  request: IncomingRequest;
  warehouse: ColdStorage;
  onClose: () => void;
  onAccept: (id: string, offeredPrice: number, note: string) => void;
  onReject: (id: string, reason: string) => void;
}

function ResponseModal({ request, warehouse, onClose, onAccept, onReject }: ResponseModalProps) {
  const [mode, setMode] = useState<'accept' | 'reject'>('accept');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [note, setNote]     = useState('');
  const [reason, setReason] = useState('');

  const section = warehouse.sections?.find(s => s.id === request.sectionId);
  const suggestedPrice = section
    ? (section.priceTiers?.find(t => t.unit === 'month')?.value ?? warehouse.pricePerCubicMeter)
    : warehouse.pricePerCubicMeter;

  const handleSubmit = () => {
    if (mode === 'accept') {
      const price = parseFloat(offeredPrice) || suggestedPrice;
      if (!note.trim()) { toast.error('Vui lòng nhập lời nhắn cho người thuê'); return; }
      onAccept(request.id, price, note);
    } else {
      if (!reason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
      onReject(request.id, reason);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Phản hồi yêu cầu
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {request.renterName} · {request.renterCompany}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
            <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Request summary */}
        <div className="px-5 py-3 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {request.requestedCapacity.toLocaleString()} m³</span>
            <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {CARGO_LABEL[request.cargoType] ?? request.cargoType}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(request.startDate)} · {request.durationLabel}</span>
            {request.sectionName && (
              <span className="flex items-center gap-1"><Snowflake className="h-3 w-3" /> {request.sectionName}</span>
            )}
          </div>
          {request.message && (
            <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-muted)' }}>"{request.message}"</p>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-[var(--color-border)]">
          <button
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 border-b-2 transition-colors"
            style={{
              borderBottomColor: mode === 'accept' ? '#22c55e' : 'transparent',
              color: mode === 'accept' ? '#22c55e' : 'var(--color-text-secondary)',
              fontWeight: mode === 'accept' ? 600 : 400,
            }}
            onClick={() => setMode('accept')}
          >
            <CheckCircle className="h-4 w-4" /> Chấp nhận
          </button>
          <button
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 border-b-2 transition-colors"
            style={{
              borderBottomColor: mode === 'reject' ? '#ef4444' : 'transparent',
              color: mode === 'reject' ? '#ef4444' : 'var(--color-text-secondary)',
              fontWeight: mode === 'reject' ? 600 : 400,
            }}
            onClick={() => setMode('reject')}
          >
            <XCircle className="h-4 w-4" /> Từ chối
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {mode === 'accept' ? (
            <>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Giá đề xuất (VND/m³/tháng)
                  <span className="ml-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    Giá niêm yết: {fmtCurrency(suggestedPrice)}
                  </span>
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="number"
                      placeholder={suggestedPrice.toString()}
                      value={offeredPrice}
                      onChange={e => setOfferedPrice(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <button
                    onClick={() => setOfferedPrice(suggestedPrice.toString())}
                    className="text-xs px-2.5 py-1.5 border hover:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Dùng giá niêm yết
                  </button>
                </div>
                {offeredPrice && !isNaN(parseFloat(offeredPrice)) && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Tổng ước tính ({request.durationLabel}):&nbsp;
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {fmtCurrency(parseFloat(offeredPrice) * request.requestedCapacity * (parseInt(request.durationLabel) || 1))}
                    </strong>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Lời nhắn gửi người thuê <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Chào anh/chị, tôi đã xem yêu cầu và rất quan tâm..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full text-sm px-3 py-2 border resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                Lý do từ chối <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Rất tiếc, kho hiện đã được đặt kín trong thời gian yêu cầu..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full text-sm px-3 py-2 border resize-none focus:outline-none transition-colors"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Lý do sẽ được hiển thị cho người thuê.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 text-sm text-white flex items-center justify-center gap-2"
            style={{ background: mode === 'accept' ? '#22c55e' : '#ef4444' }}
          >
            {mode === 'accept'
              ? <><CheckCircle className="h-4 w-4" /> Xác nhận chấp nhận</>
              : <><XCircle className="h-4 w-4" /> Xác nhận từ chối</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({
  req, warehouse, existingContract, onOpenModal, onMarkViewed, onCreateContract, onViewContract,
}: {
  req: IncomingRequest;
  warehouse: ColdStorage | undefined;
  existingContract: RentalContract | undefined;
  onOpenModal: (r: IncomingRequest) => void;
  onMarkViewed: (id: string) => void;
  onCreateContract: (requestId: string) => void;
  onViewContract: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);

  if (!warehouse) return null;
  const cfg = STATUS_CFG[req.status as RequestStatus] ?? {
    label: req.status, color: 'var(--color-text-muted)', icon: <Clock className="h-3 w-3" />,
  };

  const section = req.sectionId
    ? warehouse.sections?.find(s => s.id === req.sectionId)
    : undefined;

  return (
    <div
      className="border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* ── Collapsed header ── */}
      <button
        onClick={() => setIsExpanded(p => !p)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        {/* Status badge */}
        <span
          className="inline-flex items-center gap-1 text-white text-[11px] px-2 py-0.5 shrink-0"
          style={{ background: cfg.color }}
        >
          {cfg.icon} {cfg.label}
        </span>

        {/* Renter identity */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {req.renterName}
            {req.renterCompany && (
              <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
                · {req.renterCompany}
              </span>
            )}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {warehouse.name}
            {req.sectionName && <span style={{ color: 'var(--color-primary)' }}> · {req.sectionName}</span>}
            {' · '}{relativeTime(req.submittedAt)}
          </p>
        </div>

        {/* Quick chips */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-2 py-0.5 border border-[var(--color-border)]" style={{ color: 'var(--color-text-secondary)' }}>
            {req.requestedCapacity.toLocaleString()} m³
          </span>
          {req.cargoType && (
            <span className="text-[11px] px-2 py-0.5 border border-[var(--color-border)]" style={{ color: 'var(--color-text-secondary)' }}>
              {CARGO_LABEL[req.cargoType] ?? req.cargoType}
            </span>
          )}
        </div>

        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* ── Expanded: two-box layout ── */}
      {isExpanded && (
        <div className="border-t border-[var(--color-border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--color-border)' }}>

            {/* ┌──────────────────────────────┐
                │    YÊU CẦU TỪ KHÁCH HÀNG    │
                └──────────────────────────────┘ */}
            <div className="p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest pb-2 border-b border-[var(--color-border)]" style={{ color: 'var(--color-text-muted)' }}>
                Yêu cầu từ khách hàng
              </p>

              {/* Renter identity + contacts */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)' }}>
                    <User className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{req.renterName}</p>
                    {req.renterCompany && (
                      <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                        <Building className="h-2.5 w-2.5 shrink-0" /> {req.renterCompany}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a href={`tel:${req.renterPhone}`}
                    className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] hover:border-[#22c55e] transition-colors"
                    title={req.renterPhone}>
                    <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </a>
                  <a href={`mailto:${req.renterEmail}`}
                    className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                    title={req.renterEmail}>
                    <Mail className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </a>
                </div>
              </div>

              {/* Request detail fields */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Dung tích</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {req.requestedCapacity.toLocaleString()} m³
                  </p>
                </div>
                {req.cargoType && (
                  <div>
                    <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Loại hàng</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {CARGO_LABEL[req.cargoType] ?? req.cargoType}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Từ ngày</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{fmtDate(req.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Thời hạn</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{req.durationLabel ?? '—'}</p>
                </div>
                {req.priceTierValue && (
                  <div className="col-span-2">
                    <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{req.priceTierLabel ?? 'Giá mục tiêu'}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      {fmtCurrency(req.priceTierValue)}
                      <span className="font-normal text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                        /m³/{UNIT_LABEL[req.priceTierUnit ?? 'month']}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Message */}
              {req.message && (
                <div
                  className="px-3 py-2 text-xs border-l-2"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                >
                  {req.message}
                </div>
              )}

              {/* Section toggle */}
              {section && (
                <div>
                  <button
                    onClick={() => setSectionOpen(o => !o)}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <LayoutGrid className="h-3 w-3 shrink-0" />
                    Phân khu: <span className="font-semibold">{section.name}</span>
                    <ChevronDown
                      className="h-3 w-3 transition-transform"
                      style={{ transform: sectionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  {sectionOpen && (
                    <div
                      className="mt-2 border border-[var(--color-border)] p-3 grid grid-cols-2 gap-x-4 gap-y-2"
                      style={{ background: 'var(--color-bg-secondary)' }}
                    >
                      <div>
                        <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Nhiệt độ</p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                          {section.temperatureMin}°C ~ {section.temperatureMax}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Sức chứa trống</p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                          {section.availableCapacity.toLocaleString()} / {section.capacity.toLocaleString()} m³
                        </p>
                      </div>
                      {section.description && (
                        <div className="col-span-2">
                          <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Mô tả</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{section.description}</p>
                        </div>
                      )}
                      {/* Revenue estimate */}
                      {req.priceTierValue && (() => {
                        const months = parseInt(req.durationLabel);
                        if (!isNaN(months) && months > 0) return (
                          <div className="col-span-2 flex items-center justify-between px-3 py-2"
                            style={{ background: 'var(--color-primary-100)', borderLeft: '3px solid var(--color-primary)' }}>
                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              Ước tính doanh thu ({req.requestedCapacity.toLocaleString()} m³ × {req.durationLabel})
                            </span>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                              ~{fmtCurrency(req.priceTierValue * req.requestedCapacity * months)}
                            </span>
                          </div>
                        );
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ┌──────────────────────────────┐
                │       PHẢN HỒI CỦA BẠN       │
                └──────────────────────────────┘ */}
            <div className="p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest pb-2 border-b border-[var(--color-border)]" style={{ color: 'var(--color-text-muted)' }}>
                Phản hồi của bạn
              </p>

              {/* Awaiting action */}
              {(req.status === 'sent' || req.status === 'viewed') && (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <Clock className="h-6 w-6" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                      {req.status === 'sent' ? 'Yêu cầu mới — chưa phản hồi' : 'Đã xem — chưa phản hồi'}
                    </p>
                  </div>
                  {/* Action buttons inline */}
                  <div className="flex flex-col gap-2 w-full">
                    {req.status === 'sent' && (
                      <button
                        onClick={() => onMarkViewed(req.id)}
                        className="w-full text-xs py-2 border flex items-center justify-center gap-1.5 transition-colors hover:border-[#f59e0b]"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                      >
                        <Eye className="h-3.5 w-3.5" /> Đánh dấu đã xem
                      </button>
                    )}
                    <button
                      onClick={() => onOpenModal(req)}
                      className="w-full text-xs py-2 text-white flex items-center justify-center gap-1.5 transition-colors hover:opacity-80"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Phản hồi yêu cầu
                    </button>
                  </div>
                </div>
              )}

              {/* Rejected */}
              {req.status === 'rejected' && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: 'rgba(239,68,68,0.07)', borderLeft: '3px solid #ef4444' }}
                  >
                    <XCircle className="h-4 w-4 shrink-0" style={{ color: '#ef4444' }} />
                    <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>Bạn đã từ chối yêu cầu này</p>
                  </div>
                  {req.rejectionReason && (
                    <div
                      className="px-3 py-2 text-xs border-l-2"
                      style={{ borderColor: '#ef4444', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                    >
                      {req.rejectionReason}
                    </div>
                  )}
                </div>
              )}

              {/* Inprogress */}
              {req.status === 'inprogress' && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: 'rgba(34,197,94,0.07)', borderLeft: '3px solid #22c55e' }}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" style={{ color: '#22c55e' }} />
                    <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Đã chấp nhận thương lượng</p>
                  </div>
                  {req.ownerNote && (
                    <div
                      className="px-3 py-2 text-xs border-l-2"
                      style={{ borderColor: '#22c55e', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                    >
                      {req.ownerNote}
                    </div>
                  )}
                  {req.offeredPrice && (
                    <div
                      className="flex items-center justify-between px-3 py-2 border border-[var(--color-border)]"
                      style={{ background: 'var(--color-bg-secondary)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Giá đề xuất</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                        {fmtCurrency(req.offeredPrice)}
                        <span className="text-xs font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>/m³/tháng</span>
                      </span>
                    </div>
                  )}
                  {/* Contract actions */}
                  <div className="pt-1">
                    {!existingContract ? (
                      <button
                        onClick={() => onCreateContract(req.id)}
                        className="w-full text-xs py-2 text-white flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        <FilePlus className="h-3.5 w-3.5" /> Soạn hợp đồng
                      </button>
                    ) : existingContract.status === 'draft' ? (
                      <button
                        onClick={onViewContract}
                        className="w-full text-xs py-2 text-white flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        <FilePlus className="h-3.5 w-3.5" /> Tiếp tục soạn hợp đồng
                      </button>
                    ) : null}
                    {/* Quick call */}
                    <a
                      href={`tel:${req.renterPhone}`}
                      className="mt-2 w-full text-xs py-2 border flex items-center justify-center gap-1.5 transition-colors hover:border-[#22c55e]"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      <Phone className="h-3.5 w-3.5" /> Gọi {req.renterPhone}
                    </a>
                  </div>
                </div>
              )}

              {/* Contract banner */}
              {existingContract && (() => {
                const ccfg = CONTRACT_CFG[existingContract.status] ?? CONTRACT_CFG['draft'];
                return (
                  <div className="space-y-2">
                    <div
                      className="flex items-start gap-2 px-3 py-2.5"
                      style={{ background: ccfg.bg, borderLeft: `3px solid ${ccfg.color}` }}
                    >
                      <span style={{ color: ccfg.color, flexShrink: 0, marginTop: 1 }}>{ccfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: ccfg.color }}>{ccfg.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          {ccfg.sublabel}
                          {existingContract.status === 'active' && existingContract.startDate && (
                            <> · {fmtDate(existingContract.startDate)} — {fmtDate(existingContract.endDate)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {req.status !== 'inprogress' && (
                      <button
                        onClick={onViewContract}
                        className="w-full text-xs py-2 flex items-center justify-center gap-1.5 border transition-colors hover:opacity-80"
                        style={{ borderColor: ccfg.color, color: ccfg.color }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {existingContract.status === 'draft' ? 'Chỉnh sửa hợp đồng' : 'Xem hợp đồng'}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Contracted, no contract yet */}
              {req.status === 'contracted' && !existingContract && (
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: 'rgba(124,58,237,0.07)', borderLeft: '3px solid #7c3aed' }}
                >
                  <FileText className="h-4 w-4 shrink-0" style={{ color: '#7c3aed' }} />
                  <p className="text-xs" style={{ color: '#7c3aed' }}>Hợp đồng đang được soạn thảo.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Action row ── */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--color-border)]"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            <p className="text-[11px] flex-1" style={{ color: 'var(--color-text-muted)' }}>
              Gửi {relativeTime(req.submittedAt)}
            </p>
            {(req.status === 'sent' || req.status === 'viewed') && (
              <button
                onClick={() => onOpenModal(req)}
                className="text-xs px-3 py-1.5 border transition-colors hover:border-[var(--color-primary)]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
              >
                Phản hồi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WarehouseRequests() {
  const navigate = useNavigate();
  const { user, isAuthenticated, requests: allRequests, warehouses: warehouseList, contracts, updateRequest } = useApp();
  const [tab, setTab]         = useState<FilterTab>('all');
  const [modalReq, setModalReq] = useState<IncomingRequest | null>(null);

  const warehouses = useMemo<Record<string, ColdStorage>>(() =>
    Object.fromEntries(warehouseList.map(w => [w.id, w])),
  [warehouseList]);

  const ownerWarehouseIds = useMemo(
    () => warehouseList.filter(w => w.ownerId === user?.id).map(w => w.id),
    [warehouseList, user],
  );

  const requests = useMemo(() =>
    allRequests.filter(r => ownerWarehouseIds.includes(r.warehouseId)) as IncomingRequest[],
  [allRequests, ownerWarehouseIds]);

  const handleMarkViewed = async (id: string) => {
    await updateRequest(id, { status: 'viewed' });
    toast.success('Đã đánh dấu là đã xem.');
  };

  const handleAccept = async (id: string, offeredPrice: number, ownerNote: string) => {
    try {
      await updateRequest(id, { status: 'inprogress', offeredPrice, ownerNote });
      setModalReq(null);
      toast.success('Đã chấp nhận thương lượng. Người thuê sẽ nhận được thông báo!');
    } catch (err) {
      toast.error('Không thể chấp nhận yêu cầu');
    }
  };

  const handleReject = async (id: string, rejectionReason: string) => {
    try {
      await updateRequest(id, { status: 'rejected', rejectionReason });
      setModalReq(null);
      toast.success('Đã từ chối yêu cầu và gửi lý do cho người thuê.');
    } catch (err) {
      toast.error('Không thể từ chối yêu cầu');
    }
  };

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  const counts: Record<FilterTab, number> = {
    all:        requests.length,
    sent:       requests.filter(r => r.status === 'sent').length,
    viewed:     requests.filter(r => r.status === 'viewed').length,
    inprogress: requests.filter(r => r.status === 'inprogress').length,
    contracted: requests.filter(r => r.status === 'contracted').length,
    rejected:   requests.filter(r => r.status === 'rejected').length,
  };

  const pendingCount = counts.sent + counts.viewed;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {modalReq && warehouses[modalReq.warehouseId] && (
        <ResponseModal
          request={modalReq}
          warehouse={warehouses[modalReq.warehouseId]}
          onClose={() => setModalReq(null)}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <button
            onClick={() => navigate('/warehouse')}
            className="flex items-center gap-1 text-sm mb-2 hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary)' }}>
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1>Yêu cầu thuê kho</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Quản lý và phản hồi các yêu cầu từ khách hàng</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div
                className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
              >
                <AlertCircle className="h-4 w-4" />
                {pendingCount} yêu cầu cần phản hồi
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[var(--color-border)] mb-6">
          {(Object.keys(STATUS_CFG) as RequestStatus[]).map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button
                key={s}
                onClick={() => setTab(tab === s ? 'all' : s)}
                className="bg-[var(--color-surface)] p-4 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                style={{ outline: tab === s ? `2px solid ${cfg.color}` : 'none', outlineOffset: -2 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 shrink-0" style={{ background: cfg.color }} />
                  <span className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>{counts[s]}</span>
                </div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5"
                  style={{
                    background: tab === t.key ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                    color: tab === t.key ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{filtered.length} yêu cầu</p>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="border border-[var(--color-border)] p-16 text-center" style={{ background: 'var(--color-surface)' }}>
            <ClipboardList className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="mb-2" style={{ color: 'var(--color-text)' }}>Không có yêu cầu nào</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {tab === 'all' ? 'Chưa có khách hàng gửi yêu cầu thuê kho.' : 'Không có yêu cầu trong mục này.'}
            </p>
            {tab !== 'all' && (
              <button onClick={() => setTab('all')} className="mt-4 px-5 py-2 text-sm text-white" style={{ background: 'var(--color-primary)' }}>
                Xem tất cả
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tab === 'all' && pendingCount > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-3 border text-sm"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--color-text)' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: '#ef4444' }} />
                Có <strong className="mx-1">{pendingCount} yêu cầu chưa được phản hồi</strong>. Hãy phản hồi sớm!
              </div>
            )}
            {filtered.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                warehouse={warehouses[req.warehouseId]}
                existingContract={contracts.find(c => c.requestId === req.id)}
                onOpenModal={r => setModalReq(r)}
                onMarkViewed={handleMarkViewed}
                onCreateContract={id => navigate(`/warehouse/contracts/create/${id}`)}
                onViewContract={() => navigate(`/warehouse/contracts/create/${req.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
