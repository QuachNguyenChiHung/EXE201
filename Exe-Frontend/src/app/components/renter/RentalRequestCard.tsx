import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
    MapPin, ChevronDown, LayoutGrid, Clock, XCircle, MessageSquare, FileText, AlertCircle, ExternalLink, Building, CheckCircle, Phone, X
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { CompositeWarehouse, CompositeWarehouseSection, CompositeRentRequest, CompositeContract } from "../../../types";
import { renterService } from "../../../services/renterService";
import { getUser } from "../../../utils/auth";
import {
    RequestStatus, STATUS_CONFIG, CARGO_LABEL, UNIT_LABEL, CONTRACT_CFG, fmtDate, fmtCurrency, relativeTime
} from "./RentalRequestUtils";

interface RentalRequestCardProps {
    request: CompositeRentRequest;
    warehouse: CompositeWarehouse | undefined;
    contract?: CompositeContract;
    isExpanded: boolean;
    onToggle: () => void;
    onWithdraw: (id: number) => void;
    onViewContract?: (contract: CompositeContract) => void;
    onSign?: (contractId: number) => void;
    onReject?: (contractId: number, reason: string) => void;
    onAcceptOffer?: (id: number) => void;
    onCounterOffer?: (id: number, note: string, newPrice: number) => void;
}

export function RentalRequestCard({ request, warehouse, contract, isExpanded, onToggle, onWithdraw, onSign, onReject, onAcceptOffer, onCounterOffer }: RentalRequestCardProps) {
    const navigate = useNavigate();
    const { users } = useApp();
    const currentUser = getUser();
    const [sectionOpen, setSectionOpen] = useState(false);
    const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [offerRejectReasonOpen, setOfferRejectReasonOpen] = useState(false);
    const [offerRejectReason, setOfferRejectReason] = useState("");
    const [offerNewPrice, setOfferNewPrice] = useState("");
    const [priceError, setPriceError] = useState("");
    const [sectionData, setSectionData] = useState<CompositeWarehouseSection | undefined>();
    const [contactInfo, setContactInfo] = useState<{ renterPhone: string; ownerPhone: string } | null>(null);

    const status = request.status as RequestStatus;
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;

    // Fetch contact info when card expands for an APPROVED request without a contract
    useEffect(() => {
        if (!isExpanded || status !== "APPROVED" || contract || contactInfo) return;
        renterService.getContactInfo(request.id_rentRequest)
            .then((info) => setContactInfo({ renterPhone: info.renterPhone, ownerPhone: info.ownerPhone }))
            .catch(() => setContactInfo(null));
    }, [isExpanded, status, contract, contactInfo, request.id_rentRequest]);

    // Fetch full warehouse detail on first expand to get real temp/humidity
    useEffect(() => {
        if (!sectionOpen || sectionData) return;
        const warehouseId = request.id_warehouse;
        if (!warehouseId) return;
        renterService.getWarehouseDetail(warehouseId)
            .then((fullWarehouse) => {
                const sectorNum = request.details?.[0]?.sector;
                const matched = fullWarehouse.sections?.find((s) => String(s.sector) === String(sectorNum));
                if (matched) setSectionData(matched);
            })
            .catch(() => { });
    }, [sectionOpen, sectionData, request.id_warehouse, request.details]);

    // Resolve section: prefer fetched data, then warehouse prop, then fallback to request.details
    const sectionById = warehouse?.sections
        ? warehouse.sections.find((s) => s.id_section?.toString() === request.sectionId?.toString())
        : undefined;

    const section = sectionData ?? sectionById ?? (request.details && request.details.length > 0
        ? {
            name: `Khu vực ${request.details[0].sector}`, label: undefined,
            temp_min: request.details[0].tempMin ?? request.details[0].temp_min ?? "-",
            temp_max: request.details[0].tempMax ?? request.details[0].temp_max ?? "-",
            humidity: request.details[0].humidity ?? "-",
            total_capacity: request.details[0].rentedArea, description: "-"
        }
        : undefined);

    const ownerUser = warehouse ? users.find((u) => u.id_user === warehouse.id_owner) : undefined;
    const warehouseName = warehouse?.name || request.warehouseName || "Kho không xác định";
    const ownerName = ownerUser?.name || warehouse?.ownerName || request.ownerName || "Chủ kho";
    const ownerPhone = contactInfo?.ownerPhone || contract?.owner_phone || request.ownerPhone || ownerUser?.phone;

    const existingContract = contract;

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
                                        <span className="font-semibold">{section.name}</span>
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
                                                    {typeof section.temp_min === 'number' && typeof section.temp_max === 'number'
                                                        ? `${section.temp_min}°C ~ ${section.temp_max}°C`
                                                        : `${section.temp_min ?? '-'}°C ~ ${section.temp_max ?? '-'}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Độ ẩm</p>
                                                <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                                                    {typeof section.humidity === 'number' ? `${section.humidity}%` : (section.humidity ?? '-')}
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

                            {/* Negotiating (owner sent a counter-offer) */}
                            {(status === "PENDING" || status === "NEGOTIATING") && (request.owner_note || request.offered_price) && (
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
                                    {/* Accept / Reject offer buttons */}
                                    {request.offered_price && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onAcceptOffer?.(request.id_rentRequest)}
                                                className="flex-1 text-xs py-2 text-white flex items-center justify-center gap-1.5 rounded hover:opacity-80 transition-opacity"
                                                style={{ background: "#16a34a" }}
                                            >
                                                <CheckCircle className="h-3 w-3" /> Chấp nhận giá
                                            </button>
                                            <button
                                                onClick={() => setOfferRejectReasonOpen(true)}
                                                className="flex-1 text-xs py-2 text-white flex items-center justify-center gap-1.5 rounded hover:opacity-80 transition-opacity"
                                                style={{ background: "#dc2626" }}
                                            >
                                                <XCircle className="h-3 w-3" /> Từ chối giá
                                            </button>
                                        </div>
                                    )}
                                    {offerRejectReasonOpen && (
                                        <div className="border border-[var(--color-border)] rounded p-3 space-y-3" style={{ background: "var(--color-surface)" }}>
                                            <div>
                                                <p className="text-[11px] mb-1 font-semibold" style={{ color: "var(--color-error)" }}>
                                                    Bạn phải nhập mức giá mới để gửi lại cho chủ kho
                                                </p>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full text-xs p-2 rounded pr-14 focus:outline-none focus:ring-1"
                                                        style={{ background: "var(--color-bg)", border: `1px solid ${priceError ? "#dc2626" : "var(--color-border)"}`, color: "var(--color-text)" }}
                                                        placeholder="Ví dụ: 300000"
                                                        value={offerNewPrice}
                                                        onChange={e => { setOfferNewPrice(e.target.value); setPriceError(""); }}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--color-text-muted)" }}>đ/m³/tháng</span>
                                                </div>
                                                {priceError && (
                                                    <p className="text-[10px] mt-1" style={{ color: "#dc2626" }}>{priceError}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[11px] mb-1" style={{ color: "var(--color-text-secondary)" }}>
                                                    Lý do/phản hồi (tùy chọn):
                                                </p>
                                                <textarea
                                                    className="w-full text-xs p-2 rounded resize-none focus:outline-none focus:ring-1"
                                                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                                                    rows={2}
                                                    placeholder="Nhập phản hồi cho chủ kho..."
                                                    value={offerRejectReason}
                                                    onChange={e => setOfferRejectReason(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const price = parseFloat(offerNewPrice);
                                                        if (!offerNewPrice || isNaN(price) || price <= 0) {
                                                            setPriceError("Vui lòng nhập mức giá hợp lệ!");
                                                            return;
                                                        }
                                                        onCounterOffer?.(request.id_rentRequest, offerRejectReason, price);
                                                        setOfferRejectReasonOpen(false);
                                                        setOfferRejectReason("");
                                                        setOfferNewPrice("");
                                                        setPriceError("");
                                                    }}
                                                    className="flex-1 text-xs py-2 text-white rounded"
                                                    style={{ background: "#dc2626" }}
                                                >
                                                    Gửi từ chối Giá
                                                </button>
                                                <button
                                                    onClick={() => { setOfferRejectReasonOpen(false); setOfferRejectReason(""); setOfferNewPrice(""); setPriceError(""); }}
                                                    className="flex-1 text-xs py-2 rounded"
                                                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
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
                                const isPendingContract = existingContract.status === "pending_renter" || existingContract.status === "PENDING";
                                const ccfg = CONTRACT_CFG[existingContract.status] ?? CONTRACT_CFG["draft"];
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
                                                    {existingContract.status === "active" || existingContract.status === "ACTIVE" ? (() => {
                                                        const start = existingContract.start_at;
                                                        const end = existingContract.end_at;
                                                        return start && end ? ` · ${fmtDate(start)} — ${fmtDate(end)}` : null;
                                                    })() : null}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/shared/contracts/${existingContract.id_contract}`)}
                                            className="w-full text-xs py-2 text-white flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                                            style={{ background: isPendingContract ? "#7c3aed" : ccfg.color }}
                                        >
                                            <FileText className="h-3 w-3" /> {ccfg.actionLabel}
                                        </button>
                                        {isPendingContract && (
                                            <>
                                                <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#7c3aed" }}>
                                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                                    Vui lòng xem và ký hợp đồng để hoàn tất thuê kho.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onSign?.(existingContract.id_contract)}
                                                        className="flex-1 text-xs py-1.5 text-white flex items-center justify-center gap-1.5 rounded hover:opacity-80 transition-opacity"
                                                        style={{ background: "#16a34a" }}
                                                    >
                                                        <CheckCircle className="h-3 w-3" /> Ký xác nhận
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectReasonOpen(true)}
                                                        className="flex-1 text-xs py-1.5 text-white flex items-center justify-center gap-1.5 rounded hover:opacity-80 transition-opacity"
                                                        style={{ background: "#dc2626" }}
                                                    >
                                                        <XCircle className="h-3 w-3" /> Từ chối
                                                    </button>
                                                </div>
                                                {rejectReasonOpen && (
                                                    <div className="border border-[var(--color-border)] rounded p-2 space-y-2" style={{ background: "var(--color-surface)" }}>
                                                        <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                                                            Lý do từ chối (tùy chọn):
                                                        </p>
                                                        <textarea
                                                            className="w-full text-xs p-2 rounded resize-none focus:outline-none focus:ring-1"
                                                            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                                                            rows={2}
                                                            placeholder="Nhập lý do từ chối..."
                                                            value={rejectReason}
                                                            onChange={e => setRejectReason(e.target.value)}
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => { onReject?.(existingContract.id_contract, rejectReason); setRejectReasonOpen(false); setRejectReason(""); }}
                                                                className="flex-1 text-xs py-1.5 text-white rounded"
                                                                style={{ background: "#dc2626" }}
                                                            >
                                                                Gửi từ chối
                                                            </button>
                                                            <button
                                                                onClick={() => { setRejectReasonOpen(false); setRejectReason(""); }}
                                                                className="flex-1 text-xs py-1.5 rounded"
                                                                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                                                            >
                                                                Hủy
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Contracted but no contract object yet */}
                            {status === "APPROVED" && !existingContract && (
                                <div className="space-y-2">
                                    <div
                                        className="flex items-center gap-2 px-3 py-2"
                                        style={{ background: "rgba(124,58,237,0.07)", borderLeft: "3px solid #7c3aed" }}
                                    >
                                        <FileText className="h-4 w-4 shrink-0" style={{ color: "#7c3aed" }} />
                                        <p className="text-xs" style={{ color: "#7c3aed" }}>Yêu cầu đã được chấp nhận. Hợp đồng đang được soạn thảo.</p>
                                    </div>

                                    {/* Owner contact card */}
                                    {ownerPhone && (
                                        <div
                                            className="flex items-start gap-3 px-3 py-2.5 border border-[var(--color-border)]"
                                            style={{ background: "rgba(34,197,94,0.04)" }}
                                        >
                                            <Phone className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                                                    Liên hệ chủ kho để tiến hành thuê kho
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                                    SĐT chủ kho: <span className="font-semibold" style={{ color: "var(--color-text)" }}>{ownerPhone}</span>
                                                </p>
                                            </div>
                                            <a
                                                href={`tel:${ownerPhone}`}
                                                className="px-2.5 py-1.5 text-xs font-medium text-white rounded shrink-0 hover:opacity-80 transition-opacity"
                                                style={{ background: "#22c55e" }}
                                            >
                                                Gọi ngay
                                            </a>
                                        </div>
                                    )}

                                    {/* Renter's own phone (same style as owner side — shown when owner contact is present) */}
                                    {ownerPhone && (
                                        <div
                                            className="flex items-start gap-3 px-3 py-2.5 border border-[var(--color-border)]"
                                            style={{ background: "rgba(34,197,94,0.04)" }}
                                        >
                                            <Phone className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                                                    Số điện thoại của bạn (đã cung cấp cho chủ kho)
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                                    SĐT người thuê: <span className="font-semibold" style={{ color: "var(--color-text)" }}>{currentUser?.phone || "---"}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Action row ── */}
                    <div
                        className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--color-border)]"
                        style={{ background: "var(--color-bg-secondary)" }}
                    >
                        {(status === "PENDING" || status === "NEGOTIATING") && (
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
