import { useState } from "react";
import { useNavigate } from "react-router";
import {
    MapPin, ChevronDown, LayoutGrid, Clock, XCircle, MessageSquare, FileText, AlertCircle, ExternalLink, Building
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { CompositeRentRequest, CompositeWarehouse, CompositeContract } from "../../../types";
import {
    RequestStatus, STATUS_CONFIG, CARGO_LABEL, UNIT_LABEL, CONTRACT_CFG, fmtDate, fmtCurrency, relativeTime
} from "./RentalRequestUtils";

interface RentalRequestCardProps {
    request: CompositeRentRequest;
    warehouse: CompositeWarehouse | undefined;
    isExpanded: boolean;
    onToggle: () => void;
    onWithdraw: (id: number) => void;
}

export function RentalRequestCard({ request, warehouse, isExpanded, onToggle, onWithdraw }: RentalRequestCardProps) {
    const navigate = useNavigate();
    const { contracts, users } = useApp();
    const [sectionOpen, setSectionOpen] = useState(false);

    const status = request.status as RequestStatus;
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;

    // Use request.details for section info if warehouse is missing
    const section = warehouse?.sections
        ? warehouse.sections.find((s) => s.id_section?.toString() === request.sectionId?.toString())
        : request.details && request.details.length > 0
            ? { name: `Phân khu ${request.details[0].sector}`, temp_min: "-", temp_max: "-", total_capacity: request.details[0].rentedArea, description: "-" }
            : undefined;

    const ownerUser = warehouse ? users.find((u) => u.id_user === warehouse.id_owner) : undefined;
    const warehouseName = warehouse?.name || request.warehouseName || "Kho không xác định";
    const ownerName = ownerUser?.name || warehouse?.ownerName || request.ownerName || "Chủ kho";
    
    const existingContract = contracts.find((c: CompositeContract) => c.id_rent_request === request.id_rentRequest);

    return (
        <div
            className="border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
            style={{ borderLeft: `3px solid ${cfg.color}` }}
        >
            {/* ── Collapsed header ── */}
            <button
                onClick={onToggle}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
                <span
                    className="inline-flex items-center gap-1 text-white text-[11px] px-2 py-0.5 shrink-0"
                    style={{ background: cfg.color }}
                >
                    {cfg.icon} {cfg.label}
                </span>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        Yêu cầu thuê kho #{request.id_rentRequest}
                        {request.cargoType && (
                            <span className="ml-2 text-[12px] font-normal" style={{ color: "var(--color-text-secondary)" }}>
                                · {CARGO_LABEL[request.cargoType] ?? request.cargoType}
                            </span>
                        )}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        <Building className="inline h-2.5 w-2.5 mr-0.5" />
                        {warehouseName}
                        {request.sectionName && ` · ${request.sectionName}`}
                        {" · "}{relativeTime(request.submit_at || request.submit_at)}
                    </p>
                </div>

                <div className="hidden md:flex items-center gap-2 shrink-0">
                    <span className="text-[11px] px-2 py-0.5 border border-[var(--color-border)]" style={{ color: "var(--color-text-secondary)" }}>
                        {request.requestedCapacity?.toLocaleString() || request.duration} m³
                    </span>
                    {request.cargoType && (
                        <span className="text-[11px] px-2 py-0.5 border border-[var(--color-border)]" style={{ color: "var(--color-text-secondary)" }}>
                            {CARGO_LABEL[request.cargoType] ?? request.cargoType}
                        </span>
                    )}
                </div>

                <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform duration-200"
                    style={{ color: "var(--color-text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                />
            </button>

            {/* ── Expanded: two-box layout ── */}
            {isExpanded && (
                <div className="border-t border-[var(--color-border)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--color-border)" }}>

                        {/* ┌─────────────────────────────┐
                            │       YÊU CẦU CỦA BẠN       │
                            └─────────────────────────────┘ */}
                        <div className="p-4 space-y-3" style={{ background: "var(--color-surface)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest pb-2 border-b border-[var(--color-border)]" style={{ color: "var(--color-text-muted)" }}>
                                Yêu cầu của bạn
                            </p>

                            {/* Key fields */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                <div>
                                    <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Dung tích</p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                                        {request.requestedCapacity?.toLocaleString() || 0} m³
                                    </p>
                                </div>
                                {request.cargoType && (
                                    <div>
                                        <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Loại hàng</p>
                                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                                            {CARGO_LABEL[request.cargoType] ?? request.cargoType}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Từ ngày</p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{fmtDate(request.start_date)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                                        {request.end_date ? "Đến ngày" : "Thời hạn"}
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                                        {request.end_date ? fmtDate(request.end_date) : (request.durationLabel ?? `${request.duration} ${UNIT_LABEL[request.duration_unit] ?? request.duration_unit}`)}
                                    </p>
                                </div>
                                {request.priceTierValue && (
                                    <div className="col-span-2">
                                        <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Giá mục tiêu</p>
                                        <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                                            {fmtCurrency(request.priceTierValue)}
                                            <span className="font-normal text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>
                                                /m³/{UNIT_LABEL[request.priceTierUnit ?? "month"]}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Message */}
                            {request.message && (
                                <div
                                    className="px-3 py-2 text-xs border-l-2"
                                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-bg-secondary)" }}
                                >
                                    {request.message}
                                </div>
                            )}

                            {/* Section toggle */}
                            {section && (
                                <div>
                                    <button
                                        onClick={() => setSectionOpen((o) => !o)}
                                        className="flex items-center gap-1.5 text-xs transition-colors"
                                        style={{ color: "var(--color-primary)" }}
                                    >
                                        <LayoutGrid className="h-3 w-3 shrink-0" />
                                        Phân khu: <span className="font-semibold">{section.name}</span>
                                        <ChevronDown
                                            className="h-3 w-3 transition-transform"
                                            style={{ transform: sectionOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                        />
                                    </button>
                                    {sectionOpen && (
                                        <div
                                            className="mt-2 border border-[var(--color-border)] p-3 grid grid-cols-2 gap-x-4 gap-y-2"
                                            style={{ background: "var(--color-bg-secondary)" }}
                                        >
                                            <div>
                                                <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Nhiệt độ</p>
                                                <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                                                    {section.temp_min}°C ~ {section.temp_max}°C
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Sức chứa</p>
                                                <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                                                    {section.total_capacity?.toLocaleString()} m³
                                                </p>
                                            </div>
                                            {section.description && (
                                                <div className="col-span-2">
                                                    <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Mô tả</p>
                                                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{section.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ┌─────────────────────────────┐
                            │     PHẢN HỒI TỪ CHỦ KHO     │
                            └─────────────────────────────┘ */}
                        <div className="p-4 space-y-3" style={{ background: "var(--color-surface)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest pb-2 border-b border-[var(--color-border)]" style={{ color: "var(--color-text-muted)" }}>
                                Phản hồi từ chủ kho
                            </p>

                            {/* Pending / Negotiating */}
                            {status === "PENDING" && !request.owner_note && !request.offered_price && (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Clock className="h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                                    <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                                        Đang chờ chủ kho xử lý yêu cầu...
                                    </p>
                                </div>
                            )}

                            {/* Rejected */}
                            {status === "REJECTED" && (
                                <div className="space-y-2">
                                    <div
                                        className="flex items-center gap-2 px-3 py-2"
                                        style={{ background: "rgba(239,68,68,0.07)", borderLeft: "3px solid #ef4444" }}
                                    >
                                        <XCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
                                        <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>Đã từ chối yêu cầu</p>
                                    </div>
                                    {request.rejection_reason && (
                                        <div
                                            className="px-3 py-2 text-xs border-l-2"
                                            style={{ borderColor: "#ef4444", color: "var(--color-text-secondary)", background: "var(--color-bg-secondary)" }}
                                        >
                                            {request.rejection_reason}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Negotiating (Still PENDING but has owner note/price) */}
                            {status === "PENDING" && (request.owner_note || request.offered_price) && (
                                <div className="space-y-2">
                                    <div
                                        className="flex items-center gap-2 px-3 py-2"
                                        style={{ background: "rgba(34,197,94,0.07)", borderLeft: "3px solid #22c55e" }}
                                    >
                                        <MessageSquare className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }} />
                                        <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>Chủ kho muốn thương lượng</p>
                                    </div>
                                    {request.owner_note && (
                                        <div
                                            className="px-3 py-2 text-xs border-l-2"
                                            style={{ borderColor: "#22c55e", color: "var(--color-text-secondary)", background: "var(--color-bg-secondary)" }}
                                        >
                                            {request.owner_note}
                                        </div>
                                    )}
                                    {request.offered_price && (
                                        <div
                                            className="flex items-center justify-between px-3 py-2 border border-[var(--color-border)]"
                                            style={{ background: "var(--color-bg-secondary)" }}
                                        >
                                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Giá đề xuất</span>
                                            <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                                                {fmtCurrency(request.offered_price)}
                                                <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>/m³/tháng</span>
                                            </span>
                                        </div>
                                    )}
                                    {/* Contacts */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div className="px-2.5 py-2 border border-[var(--color-border)]">
                                            <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Liên hệ</p>
                                            <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
                                                {ownerName}
                                            </p>
                                        </div>
                                        {ownerUser?.phone && (
                                            <a href={`tel:${ownerUser.phone}`} className="px-2.5 py-2 border border-[var(--color-border)] hover:border-[#22c55e] transition-colors">
                                                <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Điện thoại</p>
                                                <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>{ownerUser.phone}</p>
                                            </a>
                                        )}
                                        {ownerUser?.email && (
                                            <a href={`mailto:${ownerUser.email}`} className="col-span-2 px-2.5 py-2 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                                                <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Email</p>
                                                <p className="text-xs font-semibold truncate" style={{ color: "var(--color-primary)" }}>{ownerUser.email}</p>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Contract banner */}
                            {existingContract && (() => {
                                const ccfg = CONTRACT_CFG[existingContract.status] ?? CONTRACT_CFG["draft"];
                                const isPending = existingContract.status === "pending_renter";
                                return (
                                    <div className="space-y-2">
                                        <div
                                            className="flex items-start gap-2 px-3 py-2.5"
                                            style={{ background: ccfg.bg, borderLeft: `3px solid ${ccfg.color}` }}
                                        >
                                            <span style={{ color: ccfg.color, flexShrink: 0, marginTop: 1 }}>{ccfg.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold" style={{ color: ccfg.color }}>{ccfg.label}</p>
                                                <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                                                    {ccfg.sublabel}
                                                    {existingContract.status === "active" && existingContract.start_at && (
                                                        <> · {fmtDate(existingContract.start_at)} — {fmtDate(existingContract.end_at)}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(isPending ? "/renter/rented" : `/renter/contracts/${existingContract.id_contract}`)}
                                            className="w-full text-xs py-2 text-white flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                                            style={{ background: isPending ? "#7c3aed" : ccfg.color }}
                                        >
                                            <FileText className="h-3 w-3" /> {ccfg.actionLabel}
                                        </button>
                                        {isPending && (
                                            <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#7c3aed" }}>
                                                <AlertCircle className="h-3 w-3 shrink-0" />
                                                Vui lòng xem và ký hợp đồng để hoàn tất thuê kho.
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Contracted but no contract object yet */}
                            {status === "APPROVED" && !existingContract && (
                                <div
                                    className="flex items-center gap-2 px-3 py-2"
                                    style={{ background: "rgba(124,58,237,0.07)", borderLeft: "3px solid #7c3aed" }}
                                >
                                    <FileText className="h-4 w-4 shrink-0" style={{ color: "#7c3aed" }} />
                                    <p className="text-xs" style={{ color: "#7c3aed" }}>Yêu cầu đã được chấp nhận. Hợp đồng đang được soạn thảo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Action row ── */}
                    <div
                        className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--color-border)]"
                        style={{ background: "var(--color-bg-secondary)" }}
                    >
                        {status === "PENDING" && (
                            <button
                                onClick={() => onWithdraw(request.id_rentRequest)}
                                className="text-xs px-3 py-1.5 border transition-colors hover:border-[var(--color-error)]"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
                            >
                                Rút yêu cầu
                            </button>
                        )}
                        {status === "REJECTED" && warehouse && (
                            <button
                                onClick={() => navigate(`/renter/warehouse/${warehouse.id_warehouse}`)}
                                className="text-xs px-3 py-1.5 border transition-colors hover:border-[var(--color-primary)]"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
                            >
                                Gửi lại yêu cầu
                            </button>
                        )}
                        {warehouse && (
                            <button
                                onClick={() => navigate(`/renter/warehouse/${warehouse.id_warehouse}`)}
                                className="text-xs px-3 py-1.5 border transition-colors flex items-center gap-1 hover:border-[var(--color-primary)]"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
                            >
                                <ExternalLink className="h-3 w-3" /> Xem kho
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
