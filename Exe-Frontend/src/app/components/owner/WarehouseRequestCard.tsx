import React, { useState } from 'react';
import { ChevronDown, User, Building, Phone, Mail, LayoutGrid, Clock, Eye, MessageSquare, XCircle, CheckCircle, FilePlus, ExternalLink } from 'lucide-react';
import { CompositeWarehouse } from '../../../types/warehouse';
import { CompositeContract } from '../../../types/renter';
import { IncomingRequest, RequestStatus, STATUS_CFG, CARGO_LABEL, UNIT_LABEL, CONTRACT_CFG, relativeTime, fmtDate, fmtCurrency } from './WarehouseRequestUtils';

interface RequestCardProps {
  req: IncomingRequest;
  warehouse: CompositeWarehouse | undefined;
  existingContract: CompositeContract | undefined;
  onOpenModal: (r: IncomingRequest) => void;
  onMarkViewed: (id: string) => void;
  onCreateContract: (requestId: string) => void;
  onViewContract: () => void;
}

export function WarehouseRequestCard({
  req, warehouse, existingContract, onOpenModal, onMarkViewed, onCreateContract, onViewContract,
}: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);

  if (!warehouse) return null;
  const cfg = STATUS_CFG[req.status as RequestStatus] ?? {
    label: req.status, color: 'var(--color-text-muted)', icon: <Clock className="h-3 w-3" />,
  };

  const section = req.sectionId
    ? warehouse.sections?.find(s => s.id_section === req.sectionId)
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
            {' · '}{relativeTime(req.submit_at)}
          </p>
        </div>

        {/* Quick chips */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-2 py-0.5 border border-[var(--color-border)]" style={{ color: 'var(--color-text-secondary)' }}>
            {req.requestedCapacity?.toLocaleString()} m³
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
                    {req.requestedCapacity?.toLocaleString()} m³
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
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{fmtDate(req.start_date)}</p>
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
                          {section.temp_min}°C ~ {section.temp_max}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Sức chứa trống</p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                          {section.available_capacity?.toLocaleString()} / {section.capacity?.toLocaleString()} m³
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
                        const months = parseInt(req.durationLabel || '');
                        if (!isNaN(months) && months > 0) return (
                          <div className="col-span-2 flex items-center justify-between px-3 py-2"
                            style={{ background: 'var(--color-primary-100)', borderLeft: '3px solid var(--color-primary)' }}>
                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              Ước tính doanh thu ({(req.requestedCapacity || 0).toLocaleString()} m³ × {req.durationLabel})
                            </span>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                              ~{fmtCurrency(req.priceTierValue * (req.requestedCapacity || 0) * months)}
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
                        onClick={() => onMarkViewed(req.id_rentRequest.toString())}
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
                  {req.rejection_reason && (
                    <div
                      className="px-3 py-2 text-xs border-l-2"
                      style={{ borderColor: '#ef4444', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                    >
                      {req.rejection_reason}
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
                  {req.owner_note && (
                    <div
                      className="px-3 py-2 text-xs border-l-2"
                      style={{ borderColor: '#22c55e', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                    >
                      {req.owner_note}
                    </div>
                  )}
                  {req.offered_price && (
                    <div
                      className="flex items-center justify-between px-3 py-2 border border-[var(--color-border)]"
                      style={{ background: 'var(--color-bg-secondary)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Giá đề xuất</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                        {fmtCurrency(req.offered_price)}
                        <span className="text-xs font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>/m³/tháng</span>
                      </span>
                    </div>
                  )}
                  {/* Contract actions */}
                  <div className="pt-1">
                    {!existingContract ? (
                      <button
                        onClick={() => onCreateContract(req.id_rentRequest.toString())}
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
                          {existingContract.status === 'active' && (existingContract as any).start_at && (
                            <> · {fmtDate((existingContract as any).start_at)} — {fmtDate((existingContract as any).end_at)}</>
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
              Gửi {relativeTime(req.submit_at)}
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
