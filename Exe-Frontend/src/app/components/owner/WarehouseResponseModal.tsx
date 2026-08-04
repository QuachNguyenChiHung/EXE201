import React, { useState } from 'react';
import { Package, Tag, Calendar, Snowflake, CheckCircle, XCircle, X, Phone, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CompositeWarehouse } from '../../../types/warehouse';
import { IncomingRequest, CARGO_LABEL, fmtDate } from './WarehouseRequestUtils';
import { ownerService } from '../../../services/ownerService';

export interface ResponseModalProps {
  request: IncomingRequest;
  warehouse?: CompositeWarehouse;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

interface AcceptResult { renterPhone: string; ownerPhone: string; message: string }
type ModalPhase = 'action' | 'accept-result' | 'reject-result';

export function WarehouseResponseModal({ request, warehouse, onClose, onAccept, onReject }: ResponseModalProps) {
  const isPendingPayment = request.status === 'PENDING_PAYMENT';
  const [phase, setPhase] = useState<ModalPhase>('action');
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<'accept' | 'reject' | null>(null);
  const [acceptResult, setAcceptResult] = useState<AcceptResult | null>(null);
  const [rejectResult, setRejectResult] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const handleAcceptPayment = async () => {
    setChosen('accept');
    setLoading(true);
    try {
      const result = await ownerService.acceptRequest(request.id_rentRequest.toString());
      setAcceptResult(result);
      setPhase('accept-result');
    } catch (err: any) {
      toast.error(err?.response?.data || 'Không thể chấp nhận yêu cầu');
      setChosen(null);
      setLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    setChosen('reject');
    setLoading(true);
    try {
      const msg = await ownerService.rejectRequest(request.id_rentRequest.toString(), reason);
      setRejectResult(msg);
      setPhase('reject-result');
    } catch (err: any) {
      toast.error(err?.response?.data || 'Không thể từ chối yêu cầu');
      setChosen(null);
      setLoading(false);
    }
  };

  const handleGeneralAccept = async () => {
    setChosen('accept');
    setLoading(true);
    try {
      await onAccept(request.id_rentRequest.toString());
    } catch (err: any) {
      toast.error(err?.response?.data || 'Không thể chấp nhận yêu cầu');
      setChosen(null);
      setLoading(false);
    }
  };

  const handleGeneralReject = async () => {
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    setChosen('reject');
    setLoading(true);
    try {
      await onReject(request.id_rentRequest.toString(), reason);
    } catch (err: any) {
      toast.error(err?.response?.data || 'Không thể từ chối yêu cầu');
      setChosen(null);
      setLoading(false);
    }
  };

  // ─── PENDING_PAYMENT phases ───────────────────────────────────────────────
  if (isPendingPayment) {
    if (phase === 'accept-result' && acceptResult) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Thông tin liên hệ</p>
              <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
                <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
            <div className="px-5 py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <CheckCircle className="h-6 w-6" style={{ color: '#22c55e' }} />
              </div>
              <div>
                <p className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>Đã chấp nhận yêu cầu!</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{acceptResult.message}</p>
              </div>
              <div className="space-y-3 text-left border border-[var(--color-border)] rounded-lg p-4" style={{ background: 'var(--color-bg-secondary)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide pb-2 border-b border-[var(--color-border)]" style={{ color: 'var(--color-text-muted)' }}>
                  Thông tin liên hệ bên thuê
                </p>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Số điện thoại</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{acceptResult.renterPhone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Tên người thuê</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{request.renterName}</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-white rounded" style={{ background: 'var(--color-primary)' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'reject-result' && rejectResult) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Đã từ chối</p>
              <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
                <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
            <div className="px-5 py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <XCircle className="h-6 w-6" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>Đã từ chối yêu cầu</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{rejectResult}</p>
              </div>
              {reason && (
                <div className="text-left border border-[var(--color-border)] rounded-lg p-4" style={{ background: 'var(--color-bg-secondary)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>Lý do bạn đã gửi:</p>
                  <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>"{reason}"</p>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <RefreshCw className="h-4 w-4 shrink-0" style={{ color: '#8b5cf6' }} />
                <p className="text-xs" style={{ color: '#8b5cf6' }}>
                  Khoản thanh toán sẽ được hoàn lại cho người thuê trong thời gian sớm nhất.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-white rounded" style={{ background: '#ef4444' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Initial: Accept / Reject
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Xác minh thanh toán</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {request.renterName} · {request.renterCompanyName}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
              <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {request.requestedCapacity?.toLocaleString() || request.duration} m³</span>
              {request.cargoType && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {CARGO_LABEL[request.cargoType] ?? request.cargoType}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(request.start_date)} · {request.durationLabel}</span>
              {request.sectionName && <span className="flex items-center gap-1"><Snowflake className="h-3 w-3" /> {request.sectionName}</span>}
            </div>
          </div>

          <div className="px-5 py-6 space-y-4">
            <p className="text-sm font-semibold text-center mb-4" style={{ color: 'var(--color-text)' }}>
              Người thuê đã thanh toán phí đặt cọc. Bạn muốn phản hồi thế nào?
            </p>

            <button
              onClick={handleAcceptPayment}
              disabled={loading || chosen !== null}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 transition-all disabled:opacity-50"
              style={{ borderColor: '#22c55e', background: 'rgba(34,197,94,0.04)' }}
            >
              {chosen === 'reject'
                ? <Loader2 className="h-5 w-5 animate-spin shrink-0" style={{ color: '#22c55e' }} />
                : loading && chosen === 'accept'
                  ? <Loader2 className="h-5 w-5 animate-spin shrink-0" style={{ color: '#22c55e' }} />
                  : <CheckCircle className="h-5 w-5 shrink-0" style={{ color: '#22c55e' }} />}
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: '#22c55e' }}>Chấp nhận yêu cầu</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Hiển thị SĐT người thuê để liên hệ</p>
              </div>
            </button>

            <button
              onClick={handleRejectPayment}
              disabled={loading || chosen !== null}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 transition-all disabled:opacity-50"
              style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.04)' }}
            >
              {chosen === 'accept'
                ? <Loader2 className="h-5 w-5 animate-spin shrink-0" style={{ color: '#ef4444' }} />
                : loading && chosen === 'reject'
                  ? <Loader2 className="h-5 w-5 animate-spin shrink-0" style={{ color: '#ef4444' }} />
                  : <XCircle className="h-5 w-5 shrink-0" style={{ color: '#ef4444' }} />}
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: '#ef4444' }}>Từ chối yêu cầu</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Khoản thanh toán sẽ được hoàn lại cho người thuê</p>
              </div>
            </button>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                Lý do từ chối <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>(bắt buộc nếu từ chối)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do từ chối (nếu cần)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={chosen !== null}
                className="w-full text-sm px-3 py-2 border resize-none focus:outline-none transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              disabled={chosen !== null}
              className="w-full py-2.5 text-sm border transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Huỷ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── NON-PENDING_PAYMENT (Accept / Reject only) ────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Phản hồi yêu cầu</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{request.renterName} · {request.renterCompanyName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
            <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

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

        <div className="px-5 py-5 space-y-4">
          <button
            onClick={handleGeneralAccept}
            disabled={loading || chosen !== null}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 transition-all disabled:opacity-50"
            style={{ borderColor: '#22c55e', background: 'rgba(34,197,94,0.04)' }}
          >
            {chosen === 'reject'
              ? <Loader2 className="h-5 w-5 animate-spin shrink-0" style={{ color: '#22c55e' }} />
              : loading && chosen === 'accept'
                ? <Loader2 className="h-5 w-5 animate-spin shrink-0" style={{ color: '#22c55e' }} />
                : <CheckCircle className="h-5 w-5 shrink-0" style={{ color: '#22c55e' }} />}
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: '#22c55e' }}>Chấp nhận yêu cầu</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Chuyển yêu cầu sang trạng thái Đã chấp nhận</p>
            </div>
          </button>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Lý do từ chối <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Rất tiếc, kho hiện đã được đặt kín trong thời gian yêu cầu..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={chosen !== null}
              className="w-full text-sm px-3 py-2 border resize-none focus:outline-none transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={chosen !== null}
            className="flex-1 py-2.5 text-sm border transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Huỷ
          </button>
          <button
            onClick={handleGeneralReject}
            disabled={loading || !reason.trim() || chosen !== null}
            className="flex-1 py-2.5 text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#ef4444' }}
          >
            {chosen === 'accept'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : loading && chosen === 'reject'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <XCircle className="h-4 w-4" />} Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}
