import React, { useState } from 'react';
import { Package, Tag, Calendar, Snowflake, CheckCircle, XCircle, DollarSign, X } from 'lucide-react';
import { toast } from 'sonner';
import { CompositeWarehouse } from '../../../types/warehouse';
import { IncomingRequest, CARGO_LABEL, fmtDate, fmtCurrency } from './WarehouseRequestUtils';
import { PRICE_TIER_OPTIONS } from './WarehouseFormUtils';

export interface ResponseModalProps {
  request: IncomingRequest;
  warehouse?: CompositeWarehouse;
  onClose: () => void;
  onAccept: (id: string) => void;
  onNegotiate: (id: string, offeredPrice: number, note: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function WarehouseResponseModal({ request, warehouse, onClose, onAccept, onNegotiate, onReject }: ResponseModalProps) {
  const isNegotiating = request.status === 'NEGOTIATING';
  const [mode, setMode] = useState<'accept' | 'negotiate' | 'reject'>(isNegotiating ? 'negotiate' : 'accept');
  const [offeredPrice, setOfferedPrice] = useState(isNegotiating && request.renterOfferedPrice ? String(request.renterOfferedPrice) : '');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  const section = warehouse?.sections?.find(s => s.id_section === request.sectionId);
  const suggestedBasePrice = section
    ? (section.priceTiers?.find(t => t.label === 'Giá theo tháng' || t.unit === 'month')?.value ?? warehouse?.pricePerCubicMeter ?? request.priceTierValue)
    : (warehouse?.pricePerCubicMeter ?? request.priceTierValue);
  const suggestedTotalPrice = (suggestedBasePrice || 0) * (request.requestedCapacity || 1) * (parseInt(request.durationLabel || '') || 1);

  const handleSubmit = () => {
    if (mode === 'accept') {
      onAccept(request.id_rentRequest.toString());
    } else if (mode === 'negotiate') {
      const price = parseFloat(offeredPrice) || suggestedTotalPrice;
      if (!note.trim()) { toast.error('Vui lòng nhập lời nhắn cho người thuê'); return; }
      onNegotiate(request.id_rentRequest.toString(), price, note);
    } else {
      if (!reason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
      onReject(request.id_rentRequest.toString(), reason);
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
              {request.renterName} · {request.renterCompanyName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
            <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Request summary */}
        <div className="px-5 py-3 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {request.requestedCapacity?.toLocaleString() || request.duration} m³</span>
            {request.cargoType && (
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {CARGO_LABEL[request.cargoType] ?? request.cargoType}</span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(request.start_date)} · {request.durationLabel}</span>
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
            <CheckCircle className="h-4 w-4" /> Chấp nhận ngay
          </button>
          <button
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 border-b-2 transition-colors"
            style={{
              borderBottomColor: mode === 'negotiate' ? '#f59e0b' : 'transparent',
              color: mode === 'negotiate' ? '#f59e0b' : 'var(--color-text-secondary)',
              fontWeight: mode === 'negotiate' ? 600 : 400,
            }}
            onClick={() => setMode('negotiate')}
          >
            <DollarSign className="h-4 w-4" /> Đề xuất giá
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
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Xác nhận đồng ý với yêu cầu này</p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Yêu cầu sẽ được chuyển sang trạng thái "Đã chấp nhận". Bạn không cần gửi thêm lời nhắn hay thay đổi giá.
              </p>
            </div>
          ) : mode === 'negotiate' ? (
            <>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Tổng giá đề xuất (VNĐ) cho toàn bộ yêu cầu
                  <span className="ml-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    Dự kiến theo giá niêm yết: {fmtCurrency(suggestedTotalPrice || 0)}
                  </span>
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">

                    <input
                      type="text"
                      placeholder={suggestedTotalPrice ? Number(suggestedTotalPrice).toLocaleString('en-US') : ''}
                      value={offeredPrice ? Number(offeredPrice).toLocaleString('en-US') : ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setOfferedPrice(raw);
                      }}
                      className="w-full h-9 pl-3 pr-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <button
                    onClick={() => setOfferedPrice(suggestedTotalPrice?.toString() || '')}
                    className="text-xs px-2.5 py-1.5 border hover:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Dùng giá niêm yết
                  </button>
                </div>
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
            style={{ background: mode === 'accept' ? '#22c55e' : mode === 'negotiate' ? '#f59e0b' : '#ef4444' }}
          >
            {mode === 'accept'
              ? <><CheckCircle className="h-4 w-4" /> Chấp nhận yêu cầu</>
              : mode === 'negotiate'
                ? <><DollarSign className="h-4 w-4" /> Gửi đề xuất giá</>
                : <><XCircle className="h-4 w-4" /> Xác nhận từ chối</>}
          </button>
        </div>
      </div>
    </div>
  );
}
