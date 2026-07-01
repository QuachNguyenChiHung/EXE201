import React, { useState } from 'react';
import { ChevronDown, User, Building, Phone, Mail, LayoutGrid, Clock, Eye, MessageSquare, XCircle, CheckCircle, FilePlus, ExternalLink, Loader2, Calendar, Building2, Layers, Box } from 'lucide-react';
import { CompositeWarehouse } from '../../../types/warehouse';
import { CompositeContract } from '../../../types/renter';
import { IncomingRequest, RequestStatus, STATUS_CFG, CARGO_LABEL, UNIT_LABEL, CONTRACT_CFG, relativeTime, fmtDate, fmtCurrency } from './WarehouseRequestUtils';
import { ownerService } from '../../../services/ownerService';

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
  const [requestDetail, setRequestDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const handleExpand = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && !requestDetail) {
      setIsLoadingDetail(true);
      try {
        const data = await ownerService.getRequestDetail(req.id_rentRequest || (req as any).id);
        setRequestDetail(data);
      } catch (err) {
        console.error("Failed to fetch request detail", err);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  // Remove strict warehouse requirement so cards always render
  // if (!warehouse) return null;
  const cfg = STATUS_CFG[req.status as RequestStatus] ?? {
    label: req.status, color: 'var(--color-text-muted)', icon: <Clock className="h-3 w-3" />,
  };

  const section = req.sectionId && warehouse?.sections
    ? warehouse.sections.find(s => s.id_section === req.sectionId)
    : undefined;

  return (
    <div
      className="border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* ── Collapsed header ── */}
      <button
        onClick={handleExpand}
        className="w-full text-left px-4 py-3.5 flex items-center gap-4 hover:bg-[rgba(0,0,0,0.01)] transition-colors focus:outline-none"
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
            {req.renterCompanyName && (
              <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
                · {req.renterCompanyName}
              </span>
            )}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {warehouse?.name || req.warehouseName || 'Kho bãi không xác định'}
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
            <div className="p-4 space-y-4 border-r border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest pb-2 border-b border-[var(--color-border)]" style={{ color: 'var(--color-text-muted)' }}>
                Yêu cầu từ khách hàng
              </p>

              {isLoadingDetail ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Đang tải chi tiết...</p>
                </div>
              ) : requestDetail ? (
                <div className="space-y-6">
                  
                  {/* Kho bãi & Đối tác */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-1.5 pb-1 border-b" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                      <Building2 className="h-4 w-4" style={{ color: "var(--color-primary)" }} /> Kho bãi & Đối tác
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: "var(--color-text-muted)" }}>Tên kho</p>
                        <p className="text-sm font-medium">{requestDetail.warehouseName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: "var(--color-text-muted)" }}>Bên thuê</p>
                        <p className="text-sm font-medium">{requestDetail.renterName || 'Đang cập nhật'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin thuê */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-1.5 pb-1 border-b" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                      <Box className="h-4 w-4" style={{ color: "var(--color-primary)" }} /> Thông tin thuê
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: "var(--color-text-muted)" }}>Hàng hóa</p>
                        <p className="text-sm">{requestDetail.cargoDescription || 'Không có mô tả'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: "var(--color-text-muted)" }}>Thời gian thuê</p>
                        <p className="text-sm flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                            {requestDetail.duration} {requestDetail.durationUnit === 'MONTHS' ? 'Tháng' : requestDetail.durationUnit === 'YEARS' ? 'Năm' : requestDetail.durationUnit}
                          </span>
                          {requestDetail.startDate && requestDetail.endDate && (
                            <span className="text-[11px] text-[var(--color-text-muted)] ml-4.5">
                              (Từ {new Date(requestDetail.startDate).toLocaleDateString('vi-VN')} đến {new Date(requestDetail.endDate).toLocaleDateString('vi-VN')})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Các phân khu được chọn */}
                  {requestDetail.details && requestDetail.details.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5 pb-1 border-b" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                        <Layers className="h-4 w-4" style={{ color: "var(--color-primary)" }} /> Phân khu được chọn
                      </h3>
                      <div className="space-y-3">
                        {requestDetail.details.map((detail: any, idx: number) => (
                          <div key={idx} className="border border-[var(--color-border)] rounded-sm p-3" style={{ background: 'var(--color-bg-secondary)' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>Khu vực {detail.sector}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                                {detail.priceTierLabel}
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Diện tích thuê:</span>
                                <span className="font-medium">{detail.rentedArea} {detail.areaUnit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Đơn giá:</span>
                                <span className="font-medium">
                                  {fmtCurrency(detail.priceTierValue || 0)} / {detail.areaUnit}
                                </span>
                              </div>
                              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-[var(--color-border)]">
                                <span className="font-semibold" style={{ color: "var(--color-text)" }}>Thành tiền/tháng:</span>
                                <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                                  {fmtCurrency((detail.rentedArea || 0) * (detail.priceTierValue || 0))}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tổng ước tính */}
                      {(() => {
                        const totalMonthly = requestDetail.details.reduce((acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue), 0);
                        const isYears = requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm';
                        const durationMultiplier = isYears ? (requestDetail.duration * 12) : (requestDetail.duration || 1);
                        const totalExpected = totalMonthly * durationMultiplier;
                        const unitLabel = requestDetail.durationUnit === 'MONTHS' || requestDetail.durationUnit === 'Tháng' ? 'Tháng' : isYears ? 'Năm' : requestDetail.durationUnit;
                        return (
                          <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-4 text-xs">
                              <span style={{ color: "var(--color-text-muted)" }}>Tổng tiền thuê/tháng:</span>
                              <span className="font-bold" style={{ color: "var(--color-text)" }}>
                                {fmtCurrency(totalMonthly)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span style={{ color: "var(--color-text-muted)" }}>Ước tính doanh thu ({requestDetail.duration} {unitLabel}):</span>
                              <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                                {fmtCurrency(totalExpected)}
                              </span>
                            </div>
                            {requestDetail.renterOfferedPrice && (
                                <div className="flex items-center gap-4 text-sm">
                                  <span style={{ color: "var(--color-text-muted)" }}>Khách hàng đề xuất (trọn gói):</span>
                                  <span className="font-bold text-orange-600">
                                    {fmtCurrency(requestDetail.renterOfferedPrice)}
                                  </span>
                                </div>
                            )}
                            {requestDetail.offeredPrice && (
                                <div className="flex items-center gap-4 text-sm">
                                  <span style={{ color: "var(--color-text-muted)" }}>Bạn đã chốt giá (trọn gói):</span>
                                  <span className="font-bold text-green-600">
                                    {fmtCurrency(requestDetail.offeredPrice)}
                                  </span>
                                </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Lời nhắn */}
                  {requestDetail.otherDetail && (
                    <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                      {requestDetail.otherDetail && (
                        <div
                          className="px-3 py-2 text-xs border-l-2"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                        >
                          {requestDetail.otherDetail}
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Không thể tải chi tiết yêu cầu.</p>
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
              {req.status === 'PENDING' && (
                req.owner_note ? (
                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ background: 'rgba(245,158,11,0.07)', borderLeft: '3px solid #f59e0b' }}
                    >
                      <Clock className="h-4 w-4 shrink-0" style={{ color: '#f59e0b' }} />
                      <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Đã gửi đề xuất - Chờ khách phản hồi</p>
                    </div>
                    {req.offered_price && (
                      <div className="px-3 py-2 flex justify-between items-center rounded-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tổng mức giá đề xuất mới</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{fmtCurrency(req.offered_price)}</span>
                      </div>
                    )}
                    <div
                      className="px-3 py-2.5 text-xs border-l-2"
                      style={{ borderColor: '#f59e0b', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
                    >
                      <div className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Lời nhắn:</div>
                      <div className="italic">"{req.owner_note}"</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <Clock className="h-6 w-6" style={{ color: 'var(--color-text-muted)' }} />
                      <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                        Yêu cầu mới — chưa phản hồi
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* Rejected */}
              {req.status === 'REJECTED' && (
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

              {/* Inprogress / Approved */}
              {req.status === 'APPROVED' && (
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
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Tổng giá đề xuất</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                        {fmtCurrency(req.offered_price)}
                      </span>
                    </div>
                  )}

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
                  </div>
                );
              })()}


            </div>
          </div>

          {/* ── Action row ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border)]"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            <p className="text-[11px] flex-1" style={{ color: 'var(--color-text-muted)' }}>
              Gửi {relativeTime(req.submit_at)}
            </p>
            {(req.status === 'PENDING' || req.status === 'NEGOTIATING') && (
              <button
                onClick={() => onOpenModal(req)}
                className="text-xs px-4 py-2 font-medium text-white transition-colors hover:opacity-80 flex items-center gap-1.5 rounded-sm shadow-sm"
                style={{ background: 'var(--color-primary)' }}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Thương lượng
              </button>
            )}
            {req.status === 'APPROVED' && !existingContract && (
              <button
                onClick={() => onCreateContract(req.id_rentRequest.toString())}
                className="text-xs px-4 py-2 font-medium text-white transition-colors hover:opacity-80 flex items-center gap-1.5 rounded-sm shadow-sm"
                style={{ background: 'var(--color-primary)' }}
              >
                <FilePlus className="h-3.5 w-3.5" /> Soạn hợp đồng
              </button>
            )}
            {existingContract && (
              <button
                onClick={onViewContract}
                className="text-xs px-4 py-2 font-medium text-white transition-colors hover:opacity-80 flex items-center gap-1.5 rounded-sm shadow-sm"
                style={{ background: 'var(--color-primary)' }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {existingContract.status === 'draft' ? 'Tiếp tục soạn hợp đồng' : 'Xem hợp đồng'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
