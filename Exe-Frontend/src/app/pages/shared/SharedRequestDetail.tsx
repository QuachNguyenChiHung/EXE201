import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from '../../../utils/auth';
import {
  ArrowLeft, ClipboardList, Box, Calendar, Building2, Layers,
  Loader2, CheckCircle2, Clock, XCircle, Truck, FileText,
  MapPin, User, DollarSign, ChevronRight
} from "lucide-react";
import { employeeService } from "../../../services/employeeService";

// ─── Status Config ───────────────────────────────────────────────────────────
type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'EXPIRED' | 'PAYMENT_PENDING' | 'PAID' | string;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:           { label: 'Chờ duyệt',         color: '#92400E', bg: '#FEF3C7', icon: Clock },
  APPROVED:          { label: 'Đã phê duyệt',      color: '#065F46', bg: '#D1FAE5', icon: CheckCircle2 },
  REJECTED:          { label: 'Bị từ chối',         color: '#991B1B', bg: '#FEE2E2', icon: XCircle },
  CANCELED:          { label: 'Đã hủy',             color: '#374151', bg: '#F3F4F6', icon: XCircle },
  EXPIRED:           { label: 'Hết hạn',            color: '#6B7280', bg: '#F9FAFB', icon: Clock },
  PAYMENT_PENDING:   { label: 'Chờ thanh toán',     color: '#1D4ED8', bg: '#EFF6FF', icon: DollarSign },
  PAID:              { label: 'Đã thanh toán',      color: '#065F46', bg: '#D1FAE5', icon: CheckCircle2 },
};

const TIMELINE_STEPS = ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'PAID'];

function getTimelineIndex(status: string): number {
  if (status === 'REJECTED' || status === 'CANCELED' || status === 'EXPIRED') return -1;
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ─── Section Card ────────────────────────────────────────────────────────────
function SectionCard({ detail, index }: { detail: any; index: number }) {
  const subtotal = (detail.rentedArea || 0) * (detail.priceTierValue || 0);
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-5 hover:border-[var(--color-primary)] hover:shadow-lg transition-all duration-300 group">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: "var(--color-primary)" }} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--color-primary)" }}>
            {index + 1}
          </div>
          <div>
            <span className="font-bold text-base" style={{ color: "var(--color-text)" }}>Khu vực {detail.sector}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded text-xs font-medium border" style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
                background: "var(--color-primary-50)",
              }}>
                {detail.priceTierLabel}
              </span>
            </div>
          </div>
        </div>
        <Box className="h-6 w-6 opacity-20" style={{ color: "var(--color-primary)" }} />
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 opacity-50" />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Diện tích thuê</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{detail.rentedArea} {detail.areaUnit}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 opacity-50" />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Đơn giá</span>
          </div>
          <span className="font-medium text-sm">{formatCurrency(detail.priceTierValue || 0)}/{detail.areaUnit}</span>
        </div>
        <div className="pt-2 mt-1 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Thành tiền</span>
          <span className="font-bold text-base" style={{ color: "var(--color-primary)" }}>{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--color-primary-50)" }}>
        <Icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <p className="text-sm font-semibold leading-snug" style={{ color: highlight || "var(--color-text)" }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Timeline Progress ───────────────────────────────────────────────────────
function TimelineProgress({ status }: { status: string }) {
  const currentIdx = getTimelineIndex(status);
  if (currentIdx < 0) return null;

  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {TIMELINE_STEPS.map((step, idx) => {
        const config = STATUS_CONFIG[step];
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const Icon = config.icon;

        return (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10" style={{
                background: isDone || isActive
                  ? "var(--color-primary)"
                  : "var(--color-border)"
              }} />
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 mb-2 ${isDone ? 'border-white shadow-md' : isActive ? 'border-white shadow-md' : 'border-[var(--color-border)]'}`}
              style={{
                background: isDone || isActive ? "var(--color-primary)" : "white",
                boxShadow: (isDone || isActive) ? "0 0 0 4px rgba(37,99,235,0.15)" : "none",
              }}
            >
              <Icon className={`h-4 w-4 ${isDone || isActive ? 'text-white' : 'opacity-30'}`} style={{ color: isDone || isActive ? 'white' : undefined }} />
            </div>
            <span className="text-xs font-medium text-center leading-tight" style={{
              color: isDone || isActive ? "var(--color-primary)" : "var(--color-text-muted)",
              fontWeight: isActive ? 700 : 400,
            }}>
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rejection Banner ────────────────────────────────────────────────────────
function RejectionBanner({ reason }: { reason?: string }) {
  return (
    <div className="rounded-xl border border-red-200 overflow-hidden mb-6">
      <div className="flex items-center gap-3 px-5 py-3" style={{ background: '#FEF2F2' }}>
        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-700">Yêu cầu bị từ chối</p>
          {reason && <p className="text-xs text-red-600 mt-0.5">{reason}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Cancellation Banner ──────────────────────────────────────────────────────
function CancellationBanner({ reason }: { reason?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="flex items-center gap-3 px-5 py-3" style={{ background: '#F9FAFB' }}>
        <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-500">Yêu cầu đã bị hủy</p>
          {reason && <p className="text-xs text-gray-400 mt-0.5">{reason}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SharedRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequestDetail = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser) return;
    if (id) {
      setLoading(true);
      employeeService.getRequestDetail(Number(id))
        .then(res => setRequest(res))
        .catch(() => setError("Không tìm thấy yêu cầu hoặc có lỗi xảy ra."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => { fetchRequestDetail(); }, [fetchRequestDetail]);
  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-[var(--color-primary)] animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Đang tải yêu cầu...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-primary-100)" }}>
            <FileText className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>{error || "Không tìm thấy yêu cầu."}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[request.status] || { label: request.status, color: '#374151', bg: '#F3F4F6', icon: Clock };
  const StatusIcon = statusCfg.icon;

  const totalMonthly = (request.details || []).reduce((acc: number, d: any) => acc + ((d.rentedArea || 0) * (d.priceTierValue || 0)), 0);
  const isYears = request.durationUnit === 'YEARS' || request.durationUnit === 'Năm';
  const durationMultiplier = isYears ? (request.duration * 12) : (request.duration || 1);
  const totalExpected = totalMonthly * durationMultiplier;
  const unitLabel = request.durationUnit === 'MONTHS' || request.durationUnit === 'Tháng' ? 'Tháng' : isYears ? 'Năm' : (request.durationUnit || '');

  const durationText = request.startDate && request.endDate
    ? `Từ ${new Date(request.startDate).toLocaleDateString('vi-VN')} - ${new Date(request.endDate).toLocaleDateString('vi-VN')}`
    : `${request.duration} ${unitLabel}`;

  const isTerminal = ['REJECTED', 'CANCELED', 'EXPIRED'].includes(request.status);
  const isRejected = request.status === 'REJECTED';
  const isCanceled = request.status === 'CANCELED';

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <div className="bento-container pt-6 pb-20" style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium mb-5 hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-primary)" }}>
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold mb-1" style={{ color: "var(--color-text)" }}>
                  Yêu cầu thuê kho #{request.id}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusCfg.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Mã #{request.id} · {new Date(request.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>Tổng chi phí</p>
              <p className="text-2xl font-extrabold leading-tight" style={{ color: "var(--color-primary)" }}>
                {formatCurrency(request.offeredPrice || totalExpected)}
              </p>
            </div>
          </div>

          {/* Timeline (only for active flows) */}
          {!isTerminal && <div className="mt-6"><TimelineProgress status={request.status} /></div>}
        </div>

        {/* Rejection / Cancellation Banner */}
        {isRejected && <RejectionBanner reason={request.rejectionReason} />}
        {isCanceled && <CancellationBanner reason={request.renterRejectionReason} />}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Left: Rental Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-4 pb-3 flex items-center gap-2" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              <Truck className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              Thông tin thuê
            </h2>
            <InfoRow icon={Box} label="Hàng hóa lưu trữ" value={request.cargoDescription || 'Không có mô tả'} />
            <InfoRow icon={Calendar} label="Thời gian thuê" value={`${request.duration} ${unitLabel}`} />
            {request.startDate && (
              <InfoRow icon={Calendar} label="Thời gian cụ thể" value={durationText} />
            )}
          </div>

          {/* Right: Warehouse & Party Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-4 pb-3 flex items-center gap-2" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              <Building2 className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              Kho bãi & Đối tác
            </h2>
            <InfoRow icon={Building2} label="Tên kho" value={request.warehouseName || 'N/A'} />
            <InfoRow icon={User} label="Người thuê" value={request.renterName || 'Đang cập nhật'} />
            {request.ownerName && (
              <InfoRow icon={User} label="Chủ kho" value={request.ownerName} />
            )}
          </div>
        </div>

        {/* Sections Detail */}
        {request.details && request.details.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6 mb-5">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-5 pb-3 flex items-center gap-2" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              <Layers className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              Các phân khu được chọn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {request.details.map((detail: any, idx: number) => (
                <SectionCard key={idx} detail={detail} index={idx} />
              ))}
            </div>

            {/* Price Summary */}
            <div className="mt-6 pt-5 rounded-xl border-t border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Phí thuê / tháng</span>
                <span className="font-semibold text-sm">{formatCurrency(totalMonthly)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Thời gian thuê</span>
                <span className="font-semibold text-sm">{request.duration} {unitLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>Dự toán gốc (chưa thương lượng)</span>
                <span className="text-sm font-medium line-through opacity-50">{formatCurrency(totalExpected)}</span>
              </div>
              {request.offeredPrice && (
                <div className="flex items-center justify-between pt-2 mt-1 border-t-2 border-dashed" style={{ borderColor: "var(--color-primary)" }}>
                  <div>
                    <span className="font-bold text-base" style={{ color: "var(--color-text)" }}>Giá thương lượng</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                        Chốt bởi chủ kho
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-xl" style={{ color: "var(--color-primary)" }}>
                    {formatCurrency(request.offeredPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {(request.otherDetail || request.ownerNote || request.rejectionReason || request.renterRejectionReason) && (
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-4 pb-3" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              Ghi chú & Thương lượng
            </h2>
            <div className="space-y-4">
              {request.otherDetail && (
                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Ghi chú của bạn</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{request.otherDetail}</p>
                </div>
              )}
              {request.ownerNote && (
                <div className="p-4 rounded-xl border border-[var(--color-accent)] bg-orange-50">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-accent)" }}>Phản hồi chủ kho</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{request.ownerNote}</p>
                </div>
              )}
              {request.renterRejectionReason && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5 text-red-500">Lý do bạn hủy yêu cầu</p>
                  <p className="text-sm leading-relaxed text-red-700">{request.renterRejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
