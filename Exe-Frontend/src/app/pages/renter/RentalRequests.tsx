import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { useApp } from '../../../context/AppContext';
import {
  Send, Eye, XCircle, MessageSquare, Clock, MapPin, Package,
  ChevronDown, ArrowLeft, CheckCircle, FileText, AlertCircle,
  Snowflake, ClipboardList, LayoutGrid, DollarSign, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { RentRequest, RentRequestStatus, ColdStorage } from "../../../types";

// ── Types ─────────────────────────────────────────────────────────────────────
type RequestStatus = RentRequestStatus;

const CARGO_LABEL: Record<string, string> = {
  frozen_food: "Thực phẩm đông lạnh",
  seafood: "Hải sản tươi sống",
  vegetables: "Rau củ quả tươi",
  dairy: "Sữa & chế phẩm",
  pharma: "Dược phẩm / y tế",
  beverage: "Đồ uống / nước giải khát",
  cosmetics: "Mỹ phẩm",
  chemical: "Hóa chất kiểm soát",
  other: "Loại hàng khác",
};

const UNIT_LABEL: Record<string, string> = {
  month: "tháng", day: "ngày", year: "năm",
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  sent:       { label: "Đã gửi",             color: "#3b82f6", icon: <Send className="h-3 w-3" />,          description: "Đang chờ chủ kho phản hồi." },
  viewed:     { label: "Đã xem",             color: "#f59e0b", icon: <Eye className="h-3 w-3" />,           description: "Chủ kho đã xem, đang cân nhắc." },
  rejected:   { label: "Từ chối",            color: "#ef4444", icon: <XCircle className="h-3 w-3" />,       description: "Chủ kho đã từ chối yêu cầu này." },
  inprogress: { label: "Đang thương lượng",  color: "#22c55e", icon: <MessageSquare className="h-3 w-3" />, description: "Chủ kho muốn liên hệ — xem thông tin bên dưới." },
  contracted: { label: "Có hợp đồng",        color: "#7c3aed", icon: <FileText className="h-3 w-3" />,      description: "Hợp đồng đã được soạn." },
};

type FilterTab = "all" | RequestStatus;
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",        label: "Tất cả" },
  { key: "sent",       label: "Đã gửi" },
  { key: "viewed",     label: "Đã xem" },
  { key: "inprogress", label: "Thương lượng" },
  { key: "contracted", label: "Có hợp đồng" },
  { key: "rejected",   label: "Từ chối" },
];

// ── Contract status config ────────────────────────────────────────────────────
const CONTRACT_CFG: Record<string, { label: string; sublabel: string; color: string; bg: string; actionLabel: string; icon: React.ReactNode }> = {
  draft:          { label: "Đang soạn hợp đồng",     sublabel: "Chủ kho chưa gửi cho bạn",           color: "#6b7280", bg: "rgba(107,114,128,0.07)", actionLabel: "Xem chi tiết",      icon: <FileText className="h-3.5 w-3.5" /> },
  pending_renter: { label: "Chờ bạn ký xác nhận",    sublabel: "Chủ kho đã gửi hợp đồng",            color: "#7c3aed", bg: "rgba(124,58,237,0.07)", actionLabel: "Xem & ký hợp đồng", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  active:         { label: "Hợp đồng đang hiệu lực", sublabel: "Đã ký — đang chạy",                  color: "#22c55e", bg: "rgba(34,197,94,0.07)",   actionLabel: "Xem hợp đồng",      icon: <CheckCircle className="h-3.5 w-3.5" /> },
  expired:        { label: "Hợp đồng hết hạn",       sublabel: "Đã kết thúc",                        color: "#9ca3af", bg: "rgba(156,163,175,0.07)", actionLabel: "Xem hợp đồng",      icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled:      { label: "Hợp đồng đã hủy",        sublabel: "Đã bị hủy",                          color: "#ef4444", bg: "rgba(239,68,68,0.07)",   actionLabel: "Xem hợp đồng",      icon: <XCircle className="h-3.5 w-3.5" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return fmtDate(iso);
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({
  request, warehouse, isExpanded, onToggle, onWithdraw,
}: {
  request: RentRequest;
  warehouse: ColdStorage | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onWithdraw: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { contracts, users } = useApp();
  const [sectionOpen, setSectionOpen] = useState(false);

  if (!warehouse) return null;
  const status = request.status as RequestStatus;
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  const section = request.sectionId
    ? warehouse.sections?.find((s) => s.id === request.sectionId)
    : undefined;
  const ownerUser        = users.find((u) => u.id === warehouse.ownerId);
  const existingContract = contracts.find((c) => c.requestId === request.id);

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
            {warehouse.name}
            {request.sectionName && (
              <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--color-primary)" }}>
                · {request.sectionName}
              </span>
            )}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            <MapPin className="inline h-2.5 w-2.5 mr-0.5" />
            {warehouse.location.city}, {warehouse.location.province}
            {" · "}{relativeTime(request.submittedAt)}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-2 py-0.5 border border-[var(--color-border)]" style={{ color: "var(--color-text-secondary)" }}>
            {request.requestedCapacity.toLocaleString()} m³
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
                    {request.requestedCapacity.toLocaleString()} m³
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
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{fmtDate(request.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {request.endDate ? "Đến ngày" : "Thời hạn"}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {request.endDate ? fmtDate(request.endDate) : (request.durationLabel ?? "—")}
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
                          {section.temperatureMin}°C ~ {section.temperatureMax}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Sức chứa còn lại</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                          {section.availableCapacity.toLocaleString()} / {section.capacity.toLocaleString()} m³
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

              {/* Waiting */}
              {(status === "sent" || status === "viewed") && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Clock className="h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                    {status === "sent" ? "Đang chờ chủ kho xem yêu cầu..." : "Chủ kho đã xem, đang cân nhắc..."}
                  </p>
                </div>
              )}

              {/* Rejected */}
              {status === "rejected" && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: "rgba(239,68,68,0.07)", borderLeft: "3px solid #ef4444" }}
                  >
                    <XCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
                    <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>Đã từ chối yêu cầu</p>
                  </div>
                  {request.rejectionReason && (
                    <div
                      className="px-3 py-2 text-xs border-l-2"
                      style={{ borderColor: "#ef4444", color: "var(--color-text-secondary)", background: "var(--color-bg-secondary)" }}
                    >
                      {request.rejectionReason}
                    </div>
                  )}
                </div>
              )}

              {/* In-progress */}
              {status === "inprogress" && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: "rgba(34,197,94,0.07)", borderLeft: "3px solid #22c55e" }}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }} />
                    <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>Chủ kho muốn thương lượng</p>
                  </div>
                  {request.ownerNote && (
                    <div
                      className="px-3 py-2 text-xs border-l-2"
                      style={{ borderColor: "#22c55e", color: "var(--color-text-secondary)", background: "var(--color-bg-secondary)" }}
                    >
                      {request.ownerNote}
                    </div>
                  )}
                  {request.offeredPrice && (
                    <div
                      className="flex items-center justify-between px-3 py-2 border border-[var(--color-border)]"
                      style={{ background: "var(--color-bg-secondary)" }}
                    >
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Giá đề xuất</span>
                      <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                        {fmtCurrency(request.offeredPrice)}
                        <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>/m³/tháng</span>
                      </span>
                    </div>
                  )}
                  {/* Contacts */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(ownerUser?.name ?? warehouse.ownerName) && (
                      <div className="px-2.5 py-2 border border-[var(--color-border)]">
                        <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>Liên hệ</p>
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
                          {ownerUser?.name ?? warehouse.ownerName}
                        </p>
                      </div>
                    )}
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
                          {existingContract.status === "active" && existingContract.startDate && (
                            <> · {fmtDate(existingContract.startDate)} — {fmtDate(existingContract.endDate)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(isPending ? "/renter/rented" : `/renter/contracts/${existingContract.id}`)}
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
              {status === "contracted" && !existingContract && (
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: "rgba(124,58,237,0.07)", borderLeft: "3px solid #7c3aed" }}
                >
                  <FileText className="h-4 w-4 shrink-0" style={{ color: "#7c3aed" }} />
                  <p className="text-xs" style={{ color: "#7c3aed" }}>Hợp đồng đang được soạn thảo.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Action row ── */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--color-border)]"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            {(status === "sent" || status === "viewed") && (
              <button
                onClick={() => onWithdraw(request.id)}
                className="text-xs px-3 py-1.5 border transition-colors hover:border-[var(--color-error)]"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
              >
                Rút yêu cầu
              </button>
            )}
            {status === "rejected" && (
              <button
                onClick={() => navigate(`/renter/warehouse/${warehouse.id}`)}
                className="text-xs px-3 py-1.5 border transition-colors hover:border-[var(--color-primary)]"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
              >
                Gửi lại yêu cầu
              </button>
            )}
            <button
              onClick={() => navigate(`/renter/warehouse/${warehouse.id}`)}
              className="text-xs px-3 py-1.5 border transition-colors flex items-center gap-1 hover:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
            >
              <ExternalLink className="h-3 w-3" /> Xem kho
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RentalRequests() {
  const navigate = useNavigate();
  const { user, isAuthenticated, requests: allRequests, warehouses: warehouseList, contracts, withdrawRequest } = useApp();

  const warehouses = useMemo<Record<string, ColdStorage>>(
    () => Object.fromEntries(warehouseList.map((w) => [w.id, w])),
    [warehouseList],
  );

  const requests = useMemo(
    () => allRequests.filter((r) => r.renterId === user?.id),
    [allRequests, user],
  );

  const [tab, setTab]             = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "renter") navigate("/login");
  }, [isAuthenticated, user, navigate]);

  // Auto-expand first inprogress
  useEffect(() => {
    const inprog = requests.find((r) => r.status === "inprogress");
    if (inprog && !expandedId) setExpandedId(inprog.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWithdraw = async (id: string) => {
    try {
      await withdrawRequest(id);
      if (expandedId === id) setExpandedId(null);
      toast.success("Đã rút yêu cầu thuê kho.");
    } catch (err) {
      toast.error('Không thể rút yêu cầu');
    }
  };

  const filtered = useMemo(
    () => tab === "all" ? requests : requests.filter((r) => r.status === tab),
    [requests, tab],
  );

  const counts: Record<FilterTab, number> = {
    all:        requests.length,
    sent:       requests.filter((r) => r.status === "sent").length,
    viewed:     requests.filter((r) => r.status === "viewed").length,
    inprogress: requests.filter((r) => r.status === "inprogress").length,
    contracted: requests.filter((r) => r.status === "contracted").length,
    rejected:   requests.filter((r) => r.status === "rejected").length,
  };


  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <div className="bento-container">
        {/* ── Header ── */}
        <div className="bento-header">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/renter")}
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <h1>Yêu cầu thuê kho</h1>
              </div>
              <p style={{ color: "var(--color-text-secondary)" }}>Theo dõi trạng thái các yêu cầu bạn đã gửi</p>
            </div>
            <button
              onClick={() => navigate("/renter/search")}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-white"
              style={{ background: "var(--color-primary)" }}
            >
              <Send className="h-4 w-4" /> Gửi yêu cầu mới
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[var(--color-border)] mb-6">
          {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setTab(tab === s ? "all" : s)}
                className="bg-[var(--color-surface)] p-4 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                style={{ outline: tab === s ? `2px solid ${c.color}` : "none", outlineOffset: -2 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 shrink-0" style={{ background: c.color }} />
                  <span className="text-2xl font-extrabold" style={{ color: "var(--color-text)" }}>{counts[s]}</span>
                </div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
              </button>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.key ? "var(--color-primary)" : "transparent",
                color: tab === t.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
              {t.key !== "all" && counts[t.key] > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Results bar ── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{filtered.length} yêu cầu</p>
          {expandedId && (
            <button
              onClick={() => setExpandedId(null)}
              className="text-xs hover:underline flex items-center gap-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <ChevronDown className="h-3 w-3" /> Thu gọn tất cả
            </button>
          )}
        </div>

        {/* ── List ── */}
        {requests.length === 0 ? (
          <div className="border p-10 text-center" style={{ background: "rgba(37,99,235,0.04)", borderColor: "rgba(37,99,235,0.2)" }}>
            <ClipboardList className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
            <h3 className="mb-2">Chưa có yêu cầu nào</h3>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              Tìm kiếm và gửi yêu cầu thuê kho để bắt đầu.
            </p>
            <button
              onClick={() => navigate("/renter/search")}
              className="text-white px-6 py-2.5 text-sm"
              style={{ background: "var(--color-primary)" }}
            >
              Tìm kho lạnh →
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-16 text-center">
            <Snowflake className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
            <p style={{ color: "var(--color-text-secondary)" }}>Không có yêu cầu nào trong mục này.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                warehouse={warehouses[req.warehouseId]}
                isExpanded={expandedId === req.id}
                onToggle={() => setExpandedId((p) => (p === req.id ? null : req.id))}
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}