import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from '../../components/Footer';

import { MapComponent } from "../../components/MapComponent";
import { ColdStorage, RentRequest } from "../../../types";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useApp } from "../../../context/AppContext";

import {
  MapPin,
  Thermometer,
  Package,
  Shield,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  Droplets,
  Zap,
  Lock,
  ArrowLeft,
  Send,
  BarChart3,
  TrendingUp,
  MessageSquare,
  X,
  Snowflake,
  Eye,
  Heart,
  Share2,
  Info,
  Check,
  LayoutGrid,
  Tag,
  ChevronDown,
  ChevronUp,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { SubscriptionTierBadge } from "../../components/SubscriptionTierBadge";
import { SUBSCRIPTION_TIERS } from "../../../types";

// Price-unit short labels
const UNIT_SHORT: Record<string, string> = { month: "tháng", day: "ngày", year: "năm" };

// Cargo type options
const CARGO_TYPES = [
  { value: 'frozen_food', label: 'Thực phẩm đông lạnh', temp: '≤ -18°C' },
  { value: 'seafood', label: 'Hải sản tươi sống', temp: '-5°C ~ 2°C' },
  { value: 'vegetables', label: 'Rau củ quả tươi', temp: '2°C ~ 8°C' },
  { value: 'dairy', label: 'Sữa & chế phẩm', temp: '2°C ~ 6°C' },
  { value: 'pharma', label: 'Dược phẩm / y tế', temp: '2°C ~ 8°C' },
  { value: 'beverage', label: 'Đồ uống / nước giải khát', temp: '4°C ~ 12°C' },
  { value: 'cosmetics', label: 'Mỹ phẩm', temp: '15°C ~ 25°C' },
  { value: 'chemical', label: 'Hóa chất kiểm soát', temp: 'Tuỳ loại' },
  { value: 'other', label: 'Loại hàng khác', temp: '' },
];

const DURATION_UNITS = [
  { value: 'day', label: 'Ngày' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
];

// Fallback gallery used when a warehouse has no images yet (e.g. user-created)
const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1649260791830-5404cc5af05b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1758789667762-56175fe4601c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
];

// Inquiry form type
interface InquiryForm {
  name: string;
  phone: string;
  email: string;
  isWholeWarehouse: boolean;     // request entire warehouse (owner negotiates)
  selectedSectionIds: string[];  // selected section IDs (checkbox multi-select)
  selectedPriceTierId: string;   // price tier (only used when single section)
  cargoType: string;
  capacity: string;
  durationValue: string;
  durationUnit: 'day' | 'month' | 'year';
  startDate: string;
  endDate: string;
  message: string;
}

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── App state ───────────────────────────────────────────────────────────────
  const { bookmarkedIds, compareIds, user, warehouses: warehouseList, ratings: allRatings, toggleBookmark, toggleCompare, createRequest } = useApp();

  const [warehouse, setWarehouse] = useState<ColdStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showInquirySuccess, setShowInquirySuccess] = useState(false);

  // Inquiry form — pre-fill contact from logged-in user
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    isWholeWarehouse: false,
    selectedSectionIds: [],
    selectedPriceTierId: "",
    cargoType: "",
    capacity: "",
    durationValue: "",
    durationUnit: "month",
    startDate: "",
    endDate: "",
    message: "",
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  // Auto-compute endDate from startDate + duration
  useEffect(() => {
    if (!inquiryForm.startDate || !inquiryForm.durationValue) return;
    const val = parseInt(inquiryForm.durationValue, 10);
    if (isNaN(val) || val <= 0) return;
    const end = new Date(inquiryForm.startDate);
    if (inquiryForm.durationUnit === 'day') end.setDate(end.getDate() + val);
    if (inquiryForm.durationUnit === 'month') end.setMonth(end.getMonth() + val);
    if (inquiryForm.durationUnit === 'year') end.setFullYear(end.getFullYear() + val);
    setInquiryForm(f => ({ ...f, endDate: end.toISOString().split('T')[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryForm.startDate, inquiryForm.durationValue, inquiryForm.durationUnit]);

  // Re-fill contact fields if user logs in after page load
  useEffect(() => {
    if (user) {
      setInquiryForm(f => ({
        ...f,
        name: f.name || user.name || "",
        phone: f.phone || user.phone || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Ratings for this warehouse
  const warehouseRatings = allRatings.filter(r => r.warehouseId === id);
  const avgRating = warehouseRatings.length
    ? warehouseRatings.reduce((sum, r) => sum + r.rate, 0) / warehouseRatings.length
    : 0;

  // ── Load warehouse from Redux store (instant) ────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fromStore = warehouseList.find(w => w.id === id);
    if (fromStore) {
      setWarehouse(fromStore);
      setLoading(false);
      return;
    }
    // Fallback to mock API client (handles deep-link before store hydrates)
    import("../../../services/apiClient").then(({ warehousesAPI }) => {
      warehousesAPI.getById(id)
        .then(data => {
          if (data) setWarehouse(data);
          else { toast.error("Không tìm thấy kho lạnh"); navigate("/renter/search"); }
        })
        .catch(() => { toast.error("Không tìm thấy kho lạnh"); navigate("/renter/search"); })
        .finally(() => setLoading(false));
    });
  }, [id, warehouseList, navigate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  // ── Submit → dispatches a real RentRequest into Redux ────────────────────────
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse) return;

    // Auth guard
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê kho");
      navigate("/login");
      return;
    }
    if (user.role !== 'renter') {
      toast.error("Chỉ tài khoản doanh nghiệp mới có thể gửi yêu cầu thuê kho");
      return;
    }

    // Validate required fields
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.capacity || !inquiryForm.cargoType) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (isNaN(parseFloat(inquiryForm.capacity)) || parseFloat(inquiryForm.capacity) <= 0) {
      toast.error("Sức chứa cần thuê phải là số dương");
      return;
    }

    // Determine selection mode
    const isMulti = inquiryForm.selectedSectionIds.length > 1;
    const isSingleSection = inquiryForm.selectedSectionIds.length === 1;
    const selectedSection = isSingleSection
      ? warehouse.sections?.find(s => s.id === inquiryForm.selectedSectionIds[0])
      : undefined;

    // Resolve price tier — warehouse-level tiers take priority when available
    const whTiers = (warehouse.priceTiers ?? []).filter(t => t.value > 0);
    const sourceTiers = whTiers.length > 0
      ? whTiers
      : isSingleSection && selectedSection
        ? (selectedSection.priceTiers ?? []).filter(t => t.value > 0)
        : !warehouse.sections?.length && warehouse.pricePerCubicMeter > 0
          ? [{ id: '__legacy__', label: 'Giá theo tháng', value: warehouse.pricePerCubicMeter, unit: 'month' }]
          : []; // multi-section or whole warehouse → no tier required (owner negotiates)

    let resolvedTierId = inquiryForm.selectedPriceTierId;
    const hasTiers = sourceTiers.length > 0;
    if (hasTiers && !resolvedTierId) {
      if (sourceTiers.length === 1) {
        resolvedTierId = sourceTiers[0].id;
      } else {
        toast.error("Vui lòng chọn mức giá thuê");
        return;
      }
    }

    const resolvedTier = sourceTiers.find(t => t.id === resolvedTierId);
    const tierValue = resolvedTier?.value ?? (inquiryForm.isWholeWarehouse || isMulti ? undefined : warehouse.pricePerCubicMeter);
    const tierUnit = resolvedTier?.unit ?? 'month';
    const tierLabel = resolvedTier?.label ?? 'Giá theo tháng';

    // Build duration label
    const DUR_MAP: Record<string, string> = { day: 'ngày', month: 'tháng', year: 'năm' };
    const durVal = parseInt(inquiryForm.durationValue, 10);
    const durationLabel = inquiryForm.durationValue && !isNaN(durVal)
      ? `${durVal} ${DUR_MAP[inquiryForm.durationUnit]}`
      : '(không xác định)';

    const now = new Date().toISOString();
    const newRequest: RentRequest = {
      id: `req-${Date.now()}`,
      warehouseId: warehouse.id,
      renterId: user.id_user,
      sectionId: isSingleSection ? inquiryForm.selectedSectionIds[0] : undefined,
      sectionName: selectedSection?.name,
      sectionIds: inquiryForm.selectedSectionIds.length > 0 ? inquiryForm.selectedSectionIds : undefined,
      isWholeWarehouse: inquiryForm.isWholeWarehouse || undefined,
      // Renter identity (from form, pre-filled from auth)
      renterName: inquiryForm.name.trim(),
      renterPhone: inquiryForm.phone.trim(),
      renterEmail: (inquiryForm.email.trim() || user.email),
      renterCompany: user.companyName,
      // Cargo & logistics
      cargoType: inquiryForm.cargoType,
      requestedCapacity: parseFloat(inquiryForm.capacity),
      durationLabel,
      startDate: inquiryForm.startDate || new Date().toISOString().split('T')[0],
      endDate: inquiryForm.endDate || undefined,
      priceTierValue: tierValue,
      priceTierUnit: tierValue ? tierUnit : undefined,
      priceTierLabel: tierValue ? tierLabel : undefined,
      message: inquiryForm.message.trim() || undefined,
      // Lifecycle
      status: 'sent',
      submittedAt: now,
      updatedAt: now,
    };

    setSubmittingInquiry(true);

    try {
      await createRequest(newRequest);
      toast.success("Đã gửi yêu cầu thuê kho");
      setShowRequestModal(false);
      navigate("/renter/rental-requests");
    } catch (err) {
      toast.error("Lỗi khi gửi yêu cầu");
    }

    setSubmittingInquiry(false);

    if (createRequestAsync.rejected.match(result)) {
      toast.error((result.payload as string) ?? "Không thể gửi yêu cầu thuê");
      return;
    }
    setShowInquirySuccess(true);
    toast.success("Yêu cầu thuê đã được gửi thành công!");
    setTimeout(() => setShowInquirySuccess(false), 6000);

    // Reset cargo/logistics fields, keep contact info
    setInquiryForm(f => ({
      ...f,
      isWholeWarehouse: false,
      selectedSectionIds: [],
      selectedPriceTierId: "",
      cargoType: "",
      capacity: "",
      durationValue: "",
      durationUnit: "month",
      startDate: "",
      endDate: "",
      message: "",
    }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép link!");
  };

  const availabilityConfig = {
    available: {
      label: "Còn trống",
      color: "bg-[var(--color-success)]",
      textColor: "text-[var(--color-success)]",
      dot: "bg-[var(--color-success)]",
    },
    partially: {
      label: "Gần đầy",
      color: "bg-[var(--color-warning)]",
      textColor: "text-[var(--color-warning)]",
      dot: "bg-[var(--color-warning)]",
    },
    full: {
      label: "Đã đầy",
      color: "bg-[var(--color-error)]",
      textColor: "text-[var(--color-error)]",
      dot: "bg-[var(--color-error)]",
    },
  };

  const securityLabel = {
    high: "Cao",
    medium: "Trung bình",
    basic: "Cơ bản",
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-[var(--color-bg-tertiary)] rounded-lg w-64" />
            <div className="h-[480px] bg-[var(--color-bg-tertiary)] rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-[var(--color-bg-tertiary)] rounded-xl" />
                <div className="h-48 bg-[var(--color-bg-tertiary)] rounded-xl" />
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-[var(--color-bg-tertiary)] rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!warehouse) return null;

  // Use the warehouse's own images; fall back to the default gallery if empty
  const galleryImages =
    warehouse.images && warehouse.images.length > 0
      ? warehouse.images
      : FALLBACK_GALLERY;

  const avail = availabilityConfig[warehouse.availability];
  const capacityPercent = Math.round(
    ((warehouse.stats.totalCapacity -
      warehouse.stats.availableCapacity) /
      warehouse.stats.totalCapacity) *
    100,
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <button
              onClick={() => navigate("/renter/search")}
              className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kết quả tìm kiếm
            </button>
            <span>/</span>
            <span className="text-[var(--color-text)] truncate max-w-[200px]">
              {warehouse.name}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ─── HERO GALLERY ─── */}
        <div
          className="relative rounded-2xl overflow-hidden mb-6 bg-black"
          style={{ height: "480px" }}
        >
          <img
            src={galleryImages[activeImage]}
            alt={`${warehouse.name} - ảnh ${activeImage + 1}`}
            className="w-full h-full object-cover transition-all duration-500"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Navigation arrows */}
          <button
            onClick={() =>
              setActiveImage(
                (i) =>
                  (i - 1 + galleryImages.length) %
                  galleryImages.length,
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() =>
              setActiveImage(
                (i) => (i + 1) % galleryImages.length,
              )
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
            <Eye className="h-3.5 w-3.5" />
            {activeImage + 1} / {galleryImages.length}
          </div>

          {/* Certification warning badge on hero */}
          {!warehouse.hasCertification && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-[var(--color-warning)] text-white text-sm px-3 py-1.5 rounded-full">
              <AlertTriangle className="h-4 w-4" />
              Chưa có chứng chỉ
            </div>
          )}
          {warehouse.hasCertification && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-[var(--color-success)] text-white text-sm px-3 py-1.5 rounded-full">
              <CheckCircle className="h-4 w-4" />
              Đã chứng nhận
            </div>
          )}

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between">
              <div>
                <h1
                  className=" mb-1"
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {warehouse.name}
                </h1>
                {/* Subscription tier badge */}
                {warehouse.subscriptionTier && warehouse.subscriptionTier !== 'free' && (
                  <div className="flex items-center gap-2 mt-1">
                    <SubscriptionTierBadge tier={warehouse.subscriptionTier} size="md" />
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                      Đối tác {SUBSCRIPTION_TIERS[warehouse.subscriptionTier].labelVi}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {warehouse.location.address},{" "}
                    {warehouse.location.city},{" "}
                    {warehouse.location.province}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!warehouse) return;
                    await toggleBookmark(warehouse.id);
                    toast.success(
                      bookmarkedIds.includes(warehouse.id)
                        ? "Đã xoá khỏi danh sách lưu"
                        : "Đã lưu kho lạnh!",
                    );
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${bookmarkedIds.includes(warehouse?.id ?? '') ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/40"}`}
                  title={bookmarkedIds.includes(warehouse?.id ?? '') ? "Xoá khỏi lưu" : "Lưu kho lạnh"}
                >
                  <Heart
                    className={`h-5 w-5 ${bookmarkedIds.includes(warehouse?.id ?? '') ? "fill-current" : ""}`}
                  />
                </button>
                <button
                  onClick={async () => {
                    if (!warehouse) return;
                    const inCompare = compareIds.includes(warehouse.id);
                    if (!inCompare && compareIds.length >= 3) {
                      toast.error("Chỉ được so sánh tối đa 3 kho");
                      return;
                    }
                    // auto-bookmark if not already
                    if (!bookmarkedIds.includes(warehouse.id)) {
                      await toggleBookmark(warehouse.id);
                    }
                    toggleCompare(warehouse.id);
                    toast.success(
                      inCompare
                        ? "Đã xoá khỏi so sánh"
                        : "Đã thêm vào so sánh — xem tại Kho đã lưu",
                    );
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${compareIds.includes(warehouse?.id ?? '') ? "bg-blue-600 text-white" : "bg-white/20 text-white hover:bg-white/40"}`}
                  title={compareIds.includes(warehouse?.id ?? '') ? "Xoá khỏi so sánh" : "Thêm vào so sánh"}
                >
                  <BarChart3 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-0 right-0 p-3 flex gap-2">
            {/* shown only on wider screens - handled by visible thumbnails below */}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {galleryImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? "border-[var(--color-primary)] scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img
                src={img}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* ─── QUICK STATS BAR ─── */}
        <div id="section-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" style={{ scrollMarginTop: '80px' }}>
          <div className="bento-card p-4 flex items-center gap-3">
            <div className="bento-icon-container-sm bg-blue-50">
              <Package className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Tổng công suất
              </p>
              <p style={{ fontWeight: 700 }}>
                {warehouse.stats.totalCapacity.toLocaleString()}{" "}
                m³
              </p>
            </div>
          </div>
          <div className="bento-card p-4 flex items-center gap-3">
            <div className="bento-icon-container-sm bg-cyan-50">
              <Snowflake className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Nhiệt độ
              </p>
              <p style={{ fontWeight: 700 }}>
                {warehouse.stats.temperatureMin}°C ~{" "}
                {warehouse.stats.temperatureMax}°C
              </p>
            </div>
          </div>
          <div className="bento-card p-4 flex items-center gap-3">
            <div className="bento-icon-container-sm bg-green-50">
              <TrendingUp className="h-5 w-5 text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Còn trống
              </p>
              <p
                style={{ fontWeight: 700 }}
                className={avail.textColor}
              >
                {warehouse.stats.availableCapacity.toLocaleString()}{" "}
                m³
              </p>
            </div>
          </div>
          <div className="bento-card p-4 flex items-center gap-3">
            <div className="bento-icon-container-sm" style={{ background: '#fef3c7' }}>
              <Star className="h-5 w-5" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Đánh giá
              </p>
              <p style={{ fontWeight: 700 }}>
                {warehouseRatings.length > 0
                  ? <>{avgRating.toFixed(1)} <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({warehouseRatings.length})</span></>
                  : <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Chưa có</span>
                }
              </p>
            </div>
          </div>
        </div>

        {/* ─── QUICK NAV (md and below, collapsed by default) ─── */}
        <div className="lg:hidden mb-6 bento-card overflow-hidden">
          <button
            type="button"
            onClick={() => setQuickNavOpen(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            <List className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, color: 'var(--color-text)' }}>
              Điều hướng nhanh
            </span>
            {quickNavOpen
              ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              : <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            }
          </button>
          {quickNavOpen && (
            <div className="px-4 pt-3 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
              style={{ borderTop: '1px solid var(--color-border)' }}>
              {[
                { id: 'section-stats', label: 'Thống kê', icon: '📊' },
                { id: 'section-description', label: 'Mô tả', icon: '📝' },
                { id: 'section-location', label: 'Vị trí', icon: '📍' },
                { id: 'section-sections', label: 'Phân khu', icon: '🏗️' },
                { id: 'section-services', label: 'Dịch vụ', icon: '⚙️' },
                { id: 'section-certifications', label: 'Chứng chỉ', icon: '🛡️' },
                { id: 'section-ratings', label: 'Đánh giá', icon: '⭐' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setQuickNavOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--color-bg-secondary)]"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── MAIN LAYOUT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ───── LEFT COLUMN ───── */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* ── Phân khu kho ── */}
            <div id="section-sections" className="bento-card p-6" style={{ order: 3, scrollMarginTop: '80px' }}>
              <div className="flex items-center gap-2 mb-5">
                <LayoutGrid className="h-5 w-5 text-[var(--color-primary)]" />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Phân khu kho</h2>
                {warehouse.sections && warehouse.sections.length > 0 && (
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{ background: "var(--color-primary)", color: "#fff", fontWeight: 700 }}
                  >
                    {warehouse.sections.length} phân khu
                  </span>
                )}
              </div>

              {!warehouse.sections || warehouse.sections.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 text-center"
                  style={{ background: "var(--color-bg-secondary)" }}
                >
                  <LayoutGrid className="h-8 w-8 mb-3" style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Kho này chưa chia phân khu. Toàn bộ diện tích là một khu vực duy nhất.
                  </p>
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Tổng sức chứa</p>
                      <p style={{ fontWeight: 700 }}>{warehouse.stats.totalCapacity.toLocaleString()} m³</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Còn trống</p>
                      <p style={{ fontWeight: 700, color: "var(--color-success)" }}>{warehouse.stats.availableCapacity.toLocaleString()} m³</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Nhiệt độ</p>
                      <p style={{ fontWeight: 700 }}>{warehouse.stats.temperatureMin}°C ~ {warehouse.stats.temperatureMax}°C</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {warehouse.sections.map((sec) => {
                      const used = sec.capacity > 0
                        ? Math.round(((sec.capacity - sec.availableCapacity) / sec.capacity) * 100)
                        : 0;
                      const availColor =
                        sec.availability === "available" ? "var(--color-success)"
                          : sec.availability === "partially" ? "var(--color-warning)"
                            : "var(--color-error)";
                      const availLbl =
                        { available: "Còn trống", partially: "Gần đầy", full: "Đã đầy" }[sec.availability]
                        ?? sec.availability;
                      const barColor = used > 90 ? "var(--color-error)" : used > 65 ? "var(--color-warning)" : "var(--color-primary)";
                      const filledTiers = sec.priceTiers?.filter((t) => t.value > 0) ?? [];
                      return (
                        <div key={sec.id} className="border border-[var(--color-border)] p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.9rem" }}>{sec.name}</p>
                              {sec.description && (
                                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sec.description}</p>
                              )}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 flex-shrink-0" style={{ background: availColor, color: "#fff", fontWeight: 700 }}>
                              {availLbl}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#06b6d4" }} />
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              Nhiệt độ: <strong style={{ color: "var(--color-text)" }}>{sec.temperatureMin}°C ~ {sec.temperatureMax}°C</strong>
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                                <Package className="h-3 w-3" />Sức chứa
                              </span>
                              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{sec.capacity.toLocaleString()} m³</span>
                            </div>
                            <div className="h-1.5 w-full" style={{ background: "var(--color-bg-tertiary)" }}>
                              <div className="h-1.5" style={{ width: `${used}%`, background: barColor }} />
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-success)" }}>
                              Còn trống: {sec.availableCapacity.toLocaleString()} m³
                              <span style={{ color: "var(--color-text-muted)" }}> ({Math.max(0, 100 - used)}%)</span>
                            </p>
                          </div>
                          {filledTiers.length > 0 && (
                            <div className="pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                              <p className="text-[10px] uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
                                <Tag className="h-3 w-3" />Giá thuê
                              </p>
                              <div className="space-y-1">
                                {filledTiers.map((tier, idx) => (
                                  <div key={tier.id_rating} className="flex items-center justify-between">
                                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{tier.label || "Giá thuê"}</span>
                                    <span style={{ fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? "var(--color-primary)" : "var(--color-text-secondary)", fontSize: idx === 0 ? "0.85rem" : "0.78rem" }}>
                                      {formatCurrency(tier.value)}
                                      <span style={{ fontWeight: 400, fontSize: "0.68rem", color: "var(--color-text-muted)" }}>/m³/{UNIT_SHORT[tier.unit] ?? tier.unit}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 pt-4 grid grid-cols-3 gap-4 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Tổng sức chứa</p>
                      <p style={{ fontWeight: 700, color: "var(--color-text)" }}>{warehouse.sections.reduce((s, x) => s + x.capacity, 0).toLocaleString()} m³</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Còn trống</p>
                      <p style={{ fontWeight: 700, color: "var(--color-success)" }}>{warehouse.sections.reduce((s, x) => s + x.availableCapacity, 0).toLocaleString()} m³</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Phân khu trống</p>
                      <p style={{ fontWeight: 700, color: "var(--color-text)" }}>
                        {warehouse.sections.filter((x) => x.availability !== "full").length}
                        <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>/{warehouse.sections.length}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            <div id="section-description" className="bento-card p-6" style={{ order: 1, scrollMarginTop: '80px' }}>
              <h2
                className="mb-3"
                style={{ fontSize: "1.125rem", fontWeight: 600 }}
              >
                Mô tả kho lạnh
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {warehouse.description}
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Đăng ngày{" "}
                  {new Date(warehouse.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Cập nhật{" "}
                  {new Date(warehouse.updatedAt).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${avail.dot}`} />
                  <span className={avail.textColor}>{avail.label}</span>
                </div>
              </div>
            </div>

            {false && <div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Capacity */}
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bento-icon-container-sm bg-blue-100">
                    <Package className="h-4 w-4 text-[var(--color-primary)]" />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Sức chứa
                  </span>
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                  }}
                >
                  {warehouse.stats.totalCapacity.toLocaleString()}{" "}
                  m³
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Đã dùng</span>
                    <span>{capacityPercent}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]"
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-success)]">
                    Còn trống:{" "}
                    {warehouse.stats.availableCapacity.toLocaleString()}{" "}
                    m³
                  </p>
                </div>
              </div>

              {/* Temperature */}
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bento-icon-container-sm bg-cyan-100">
                    <Thermometer className="h-4 w-4 text-cyan-500" />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Nhiệt độ
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "1.25rem",
                    }}
                  >
                    {warehouse.stats.temperatureMin}°C
                  </p>
                  <span className="text-[var(--color-text-muted)] mb-1">
                    đến
                  </span>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "1.25rem",
                    }}
                  >
                    {warehouse.stats.temperatureMax}°C
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Droplets className="h-4 w-4 text-blue-400" />
                  <span className="text-[var(--color-text-muted)]">
                    Độ ẩm:{" "}
                    <strong>
                      {warehouse.stats.humidity}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Security */}
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bento-icon-container-sm bg-purple-100">
                    <Shield className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Bảo mật
                  </span>
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                  }}
                >
                  {
                    securityLabel[
                    warehouse.stats.securityLevel
                    ]
                  }
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {warehouse.stats.securityLevel ===
                    "high" ? (
                    <>
                      <Lock className="h-4 w-4 text-[var(--color-success)]" />
                      <span className="text-[var(--color-success)]">
                        Bảo mật tối đa
                      </span>
                    </>
                  ) : warehouse.stats.securityLevel ===
                    "medium" ? (
                    <>
                      <Lock className="h-4 w-4 text-[var(--color-warning)]" />
                      <span className="text-[var(--color-warning)]">
                        Bảo mật tiêu chuẩn
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
                      <span className="text-[var(--color-text-muted)]">
                        Bảo mật cơ bản
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Power Backup */}
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bento-icon-container-sm bg-yellow-100">
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Điện dự phòng
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {warehouse.stats.powerBackup ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p
                        style={{ fontWeight: 700 }}
                        className="text-[var(--color-success)]"
                      >
                        Có dự phòng
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[var(--color-error)] flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p
                        style={{ fontWeight: 700 }}
                        className="text-[var(--color-error)]"
                      >
                        Không có
                      </p>
                    </>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  {warehouse.stats.powerBackup
                    ? "Máy phát điện dự phòng 24/7"
                    : "Không có máy phát điện dự phòng"}
                </p>
              </div>
            </div>
            </div>}

            {/* Phân khu kho duplicate removed */}
            {false && warehouse.sections && warehouse.sections.length > 0 && (
              <div className="bento-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <LayoutGrid className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Phân khu kho</h2>
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{ background: "var(--color-primary)", color: "#fff", fontWeight: 700 }}
                  >
                    {warehouse.sections.length} phân khu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {warehouse.sections.map((sec) => {
                    const used = sec.capacity > 0
                      ? Math.round(((sec.capacity - sec.availableCapacity) / sec.capacity) * 100)
                      : 0;
                    const availColor =
                      sec.availability === "available" ? "var(--color-success)"
                        : sec.availability === "partially" ? "var(--color-warning)"
                          : "var(--color-error)";
                    const availLbl =
                      { available: "Còn trống", partially: "Gần đầy", full: "Đã đầy" }[sec.availability]
                      ?? sec.availability;
                    const barColor = used > 90 ? "var(--color-error)" : used > 65 ? "var(--color-warning)" : "var(--color-primary)";
                    const filledTiers = sec.priceTiers?.filter((t) => t.value > 0) ?? [];

                    return (
                      <div key={sec.id} className="border border-[var(--color-border)] p-4 flex flex-col gap-3">
                        {/* Name + badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.9rem" }}>
                              {sec.name}
                            </p>
                            {sec.description && (
                              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                                {sec.description}
                              </p>
                            )}
                          </div>
                          <span
                            className="text-[10px] px-2 py-0.5 flex-shrink-0"
                            style={{ background: availColor, color: "#fff", fontWeight: 700 }}
                          >
                            {availLbl}
                          </span>
                        </div>

                        {/* Temperature */}
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#06b6d4" }} />
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            Nhiệt độ:{" "}
                            <strong style={{ color: "var(--color-text)" }}>
                              {sec.temperatureMin}°C ~ {sec.temperatureMax}°C
                            </strong>
                          </span>
                        </div>

                        {/* Capacity bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                              <Package className="h-3 w-3" />
                              Sức chứa
                            </span>
                            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                              {sec.capacity.toLocaleString()} m³
                            </span>
                          </div>
                          <div className="h-1.5 w-full" style={{ background: "var(--color-bg-tertiary)" }}>
                            <div className="h-1.5" style={{ width: `${used}%`, background: barColor }} />
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-success)" }}>
                            Còn trống: {sec.availableCapacity.toLocaleString()} m³
                            <span style={{ color: "var(--color-text-muted)" }}> ({Math.max(0, 100 - used)}%)</span>
                          </p>
                        </div>

                        {/* Price tiers */}
                        {filledTiers.length > 0 && (
                          <div className="pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                            <p
                              className="text-[10px] uppercase tracking-wide mb-2 flex items-center gap-1"
                              style={{ color: "var(--color-text-muted)", fontWeight: 600 }}
                            >
                              <Tag className="h-3 w-3" />
                              Giá thuê
                            </p>
                            <div className="space-y-1">
                              {filledTiers.map((tier, idx) => (
                                <div key={tier.id_rating} className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                    {tier.label || "Giá thuê"}
                                  </span>
                                  <span
                                    style={{
                                      fontWeight: idx === 0 ? 700 : 500,
                                      color: idx === 0 ? "var(--color-primary)" : "var(--color-text-secondary)",
                                      fontSize: idx === 0 ? "0.85rem" : "0.78rem",
                                    }}
                                  >
                                    {formatCurrency(tier.value)}
                                    <span style={{ fontWeight: 400, fontSize: "0.68rem", color: "var(--color-text-muted)" }}>
                                      /m³/{UNIT_SHORT[tier.unit] ?? tier.unit}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary footer */}
                <div className="mt-5 pt-4 grid grid-cols-3 gap-4 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Tổng sức chứa</p>
                    <p style={{ fontWeight: 700, color: "var(--color-text)" }}>
                      {warehouse.sections.reduce((s, x) => s + x.capacity, 0).toLocaleString()} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Còn trống</p>
                    <p style={{ fontWeight: 700, color: "var(--color-success)" }}>
                      {warehouse.sections.reduce((s, x) => s + x.availableCapacity, 0).toLocaleString()} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Phân khu trống</p>
                    <p style={{ fontWeight: 700, color: "var(--color-text)" }}>
                      {warehouse.sections.filter((x) => x.availability !== "full").length}
                      <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        /{warehouse.sections.length}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Reviews / Ratings ── */}
            <div id="section-ratings" className="bento-card overflow-hidden" style={{ order: 6, scrollMarginTop: '80px' }}>
              {/* Collapsible header — click to expand */}
              <button
                type="button"
                onClick={() => setShowReviews(v => !v)}
                className="w-full flex items-center gap-3 p-6 text-left transition-colors hover:bg-[var(--color-bg-secondary)]"
                style={{ borderBottom: showReviews ? '1px solid var(--color-border)' : 'none' }}
              >
                <Star className="h-5 w-5 flex-shrink-0" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, flex: 1 }}>Đánh giá từ khách thuê</h2>
                {warehouseRatings.length > 0 && (
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{ background: '#f59e0b', color: '#fff', fontWeight: 700 }}
                  >
                    {warehouseRatings.length} đánh giá
                  </span>
                )}
                <ChevronDown
                  className="h-4 w-4 flex-shrink-0 ml-1 transition-transform duration-200"
                  style={{
                    color: 'var(--color-text-muted)',
                    transform: showReviews ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Collapsible body */}
              {showReviews && (
                <div className="p-6 pt-5">
                  {warehouseRatings.length === 0 ? (
                    <div className="py-8 text-center" style={{ background: 'var(--color-bg-secondary)' }}>
                      <Star className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--color-border)', fill: 'var(--color-border)' }} />
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá kho này!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Average score banner */}
                      <div className="flex items-center gap-6 px-5 py-4 mb-5" style={{ background: 'var(--color-bg-secondary)' }}>
                        <div className="text-center">
                          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
                            {avgRating.toFixed(1)}
                          </p>
                          <div className="flex items-center gap-0.5 mt-1 justify-center">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star
                                key={n}
                                className="h-4 w-4"
                                style={{
                                  color: n <= Math.round(avgRating) ? '#f59e0b' : 'var(--color-border)',
                                  fill: n <= Math.round(avgRating) ? '#f59e0b' : 'transparent',
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {warehouseRatings.length} đánh giá
                          </p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map(star => {
                            const count = warehouseRatings.filter(r => r.rate === star).length;
                            const pct = warehouseRatings.length ? (count / warehouseRatings.length) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="text-xs w-3 text-right" style={{ color: 'var(--color-text-muted)' }}>{star}</span>
                                <Star className="h-3 w-3 flex-shrink-0" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                <div className="flex-1 h-1.5" style={{ background: 'var(--color-border)' }}>
                                  <div className="h-1.5" style={{ width: `${pct}%`, background: '#f59e0b' }} />
                                </div>
                                <span className="text-xs w-5" style={{ color: 'var(--color-text-muted)' }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Individual reviews */}
                      <div className="space-y-4">
                        {warehouseRatings.map(rating => (
                          <div key={rating.id} className="border border-[var(--color-border)] p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                                  {rating.renterName}
                                </p>
                                {rating.renterCompany && (
                                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{rating.renterCompany}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <Star
                                      key={n}
                                      className="h-3.5 w-3.5"
                                      style={{
                                        color: n <= rating.rate ? '#f59e0b' : 'var(--color-border)',
                                        fill: n <= rating.rate ? '#f59e0b' : 'transparent',
                                      }}
                                    />
                                  ))}
                                </div>
                                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                  {new Date(rating.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            {rating.comment && (
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {rating.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Features / Amenities */}
            <div id="section-services" className="bento-card p-6" style={{ order: 4, scrollMarginTop: '80px' }}>
              <h2
                className="mb-4"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                }}
              >
                Tiện ích & Dịch vụ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {warehouse.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div id="section-certifications" className="bento-card p-6" style={{ order: 5, scrollMarginTop: '80px' }}>
              <h2
                className="mb-4"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                }}
              >
                Chứng chỉ & Kiểm định
              </h2>

              {!warehouse.hasCertification ? (
                <div className="rounded-xl border-2 border-[var(--color-warning)] bg-amber-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-warning)] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-[var(--color-warning)]" />
                    </div>
                    <div>
                      <h4
                        style={{ fontWeight: 600 }}
                        className="text-amber-800 mb-1"
                      >
                        Kho lạnh chưa được chứng nhận
                      </h4>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        Kho lạnh này chưa được cấp chứng chỉ an
                        toàn thực phẩm (HACCP, ISO, GMP...). Đây
                        có thể là rủi ro đối với hàng hóa yêu
                        cầu tiêu chuẩn vệ sinh cao. Vui lòng cân
                        nhắc kỹ trước khi ký hợp đồng.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Info className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-amber-600">
                          Liên hệ chủ kho để biết thêm thông tin
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {warehouse.certifications.map((cert) => {
                    const expiry = new Date(cert.expiryDate);
                    const now = new Date();
                    const daysLeft = Math.ceil(
                      (expiry.getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24),
                    );
                    const isExpiringSoon = daysLeft < 90;
                    const isExpired = daysLeft < 0;
                    return (
                      <div
                        key={cert.id}
                        className={`p-4 rounded-xl border-2 ${isExpired ? "border-[var(--color-error)] bg-red-50" : isExpiringSoon ? "border-[var(--color-warning)] bg-amber-50" : "border-[var(--color-success)] bg-green-50"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpired ? "bg-red-200" : isExpiringSoon ? "bg-amber-200" : "bg-green-200"}`}
                            >
                              <Shield
                                className={`h-5 w-5 ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-green-600"}`}
                              />
                            </div>
                            <div>
                              <h4 style={{ fontWeight: 600 }}>
                                {cert.label}
                              </h4>
                              <p className="text-sm text-[var(--color-text-muted)]">
                                Cấp bởi: {cert.issuer}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                                <span>
                                  Ngày cấp:{" "}
                                  {new Date(
                                    cert.issueDate,
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                                <span>
                                  Hết hạn:{" "}
                                  {new Date(
                                    cert.expiryDate,
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isExpired ? (
                              <Badge className="bg-[var(--color-error)] text-white text-xs">
                                Hết hạn
                              </Badge>
                            ) : isExpiringSoon ? (
                              <Badge className="bg-[var(--color-warning)] text-white text-xs">
                                Sắp hết hạn
                              </Badge>
                            ) : (
                              <Badge className="bg-[var(--color-success)] text-white text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Còn hiệu lực
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!isExpired && (
                          <div className="mt-3 pt-3 border-t border-white/50">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[var(--color-text-muted)]">
                                Thời hạn còn lại
                              </span>
                              <span
                                style={{ fontWeight: 600 }}
                                className={
                                  isExpiringSoon
                                    ? "text-amber-600"
                                    : "text-green-600"
                                }
                              >
                                {daysLeft} ngày
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Map */}
            <div id="section-location" className="bento-card p-6" style={{ order: 2, scrollMarginTop: '80px' }}>
              <h2
                className="mb-4"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                }}
              >
                Vị trí kho lạnh
              </h2>
              <div className="mb-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                <span className="text-[var(--color-text-secondary)]">
                  {warehouse.location.address},{" "}
                  {warehouse.location.city},{" "}
                  {warehouse.location.province}
                </span>
              </div>
              <MapComponent
                center={[
                  warehouse.location.latitude,
                  warehouse.location.longitude,
                ]}
                markers={[
                  {
                    position: [
                      warehouse.location.latitude,
                      warehouse.location.longitude,
                    ],
                    popup: warehouse.name,
                  },
                ]}
                height="380px"
              />
            </div>
          </div>

          {/* ───── RIGHT SIDEBAR ───── */}
          <div className="lg:col-span-2">
            <div
              className="space-y-5 sticky top-20"
              ref={sidebarRef}
            >
              {/* ── Card 1: Price info (non-interactive) ── */}
              <div className="bento-card overflow-hidden">
                <p className="text-xs text-center py-2 border-b border-[var(--color-border)]"
                  style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)' }}>
                  Giá thuê
                </p>
                {/* Section-level pricing — one row per section, primary tier shown */}
                {warehouse.sections && warehouse.sections.some(s => s.priceTiers?.some(t => t.value > 0)) ? (
                  <>
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      let globalIdx = 0;
                      warehouse.sections
                        .filter(s => s.priceTiers?.some(t => t.value > 0))
                        .forEach(sec => {
                          // Show only the first (cheapest/primary) tier per section in the sidebar to keep it compact
                          const firstTier = (sec.priceTiers ?? []).filter(t => t.value > 0)[0];
                          if (!firstTier) return;
                          const isFirst = globalIdx === 0;
                          const extraTiers = (sec.priceTiers ?? []).filter(t => t.value > 0).length - 1;
                          rows.push(
                            <div key={`${sec.id}-${firstTier.id_rating}`}
                              className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]"
                              style={{ background: isFirst ? 'var(--color-primary)' : 'var(--color-surface)' }}>
                              <div className="min-w-0 flex-1 mr-2">
                                <span className="text-sm block truncate"
                                  style={{ color: isFirst ? 'rgba(255,255,255,0.9)' : 'var(--color-text-secondary)' }}>
                                  {sec.name}
                                </span>
                                {extraTiers > 0 && (
                                  <span className="text-[10px]" style={{ color: isFirst ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)' }}>
                                    +{extraTiers} mức giá khác
                                  </span>
                                )}
                              </div>
                              <span className="flex-shrink-0">
                                <span style={{ fontWeight: 700, fontSize: isFirst ? '1rem' : '0.875rem', color: isFirst ? '#fff' : 'var(--color-primary)' }}>
                                  {formatCurrency(firstTier.value)}
                                </span>
                                <span className="text-[10px] ml-1" style={{ color: isFirst ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)' }}>
                                  /m³/{UNIT_SHORT[firstTier.unit] ?? firstTier.unit}
                                </span>
                              </span>
                            </div>
                          );
                          globalIdx++;
                        });
                      return rows;
                    })()}
                  </>
                ) : (
                  /* Fallback: legacy single price */
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]"
                    style={{ background: 'var(--color-primary)' }}>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Giá theo tháng</span>
                    <span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                        {formatCurrency(warehouse.pricePerCubicMeter)}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>/m³/tháng</span>
                    </span>
                  </div>
                )}

                {/* Warehouse-level purchasable tiers */}
                {warehouse.priceTiers && warehouse.priceTiers.filter(t => t.value > 0).length > 0 && (
                  <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <p className="text-[10px] uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      <Tag className="h-3 w-3" />Gói giá thuê
                    </p>
                    <div className="space-y-1.5">
                      {warehouse.priceTiers.filter(t => t.value > 0).map(tier => (
                        <div key={tier.id_rating} className="flex items-center justify-between px-2.5 py-1.5 border" style={{ borderColor: 'var(--color-success)', background: 'rgba(34,197,94,0.04)' }}>
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{tier.label}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-success)' }}>
                            {formatCurrency(tier.value)}
                            <span style={{ fontWeight: 400, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>/m³/{UNIT_SHORT[tier.unit] ?? tier.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium ${warehouse.availability === 'available' ? 'bg-green-50 text-green-700' : warehouse.availability === 'partially' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${avail.dot}`} />
                  {avail.label}
                </div>
              </div>

              {/* ── Card 2: Rental request form (separate) ── */}
              <div className="bento-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-border)]"
                  style={{ background: 'var(--color-bg-secondary)' }}>
                  <MessageSquare className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                  <h4 style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '1rem' }}>Gửi yêu cầu thuê kho</h4>
                </div>

                {showInquirySuccess ? (
                  <div className="py-10 px-5 text-center">
                    <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                      style={{ background: 'var(--color-success)' }}>
                      <CheckCircle className="h-7 w-7 text-white" />
                    </div>
                    <h4 style={{ fontWeight: 600 }} className="mb-2">Đã gửi yêu cầu!</h4>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      Chủ kho sẽ liên hệ bạn trong vòng 24 giờ.
                    </p>
                    <button onClick={() => navigate('/renter/requests')}
                      className="w-full py-2.5 text-base text-white mb-2"
                      style={{ background: 'var(--color-primary)' }}>
                      Xem yêu cầu của tôi →
                    </button>
                    <Button variant="ghost" size="sm" className="w-full"
                      onClick={() => setShowInquirySuccess(false)}>
                      Gửi yêu cầu khác
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="p-5 space-y-4">

                    {/* ── Step 1: Section picker — multi-select or whole warehouse ── */}
                    {warehouse.sections && warehouse.sections.length > 0 && (() => {
                      const availSections = warehouse.sections.filter(s => s.availability !== 'full');
                      const toggleSection = (secId: string) => {
                        setInquiryForm(f => {
                          const ids = f.selectedSectionIds.includes(secId)
                            ? f.selectedSectionIds.filter(id => id !== secId)
                            : [...f.selectedSectionIds, secId];
                          return { ...f, isWholeWarehouse: false, selectedSectionIds: ids, selectedPriceTierId: ids.length === 1 ? f.selectedPriceTierId : '' };
                        });
                      };
                      const toggleWhole = () => {
                        setInquiryForm(f => ({
                          ...f,
                          isWholeWarehouse: !f.isWholeWarehouse,
                          selectedSectionIds: [],
                          selectedPriceTierId: '',
                        }));
                      };
                      return (
                        <div>
                          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="w-5 h-5 flex items-center justify-center text-white text-xs"
                              style={{ background: 'var(--color-primary)' }}>1</span>
                            Chọn phân khu <span style={{ color: 'var(--color-error)' }}>*</span>
                          </p>
                          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                            Chọn nhiều phân khu hoặc toàn bộ kho — chủ kho sẽ thương lượng giá
                          </p>
                          <div className="space-y-1.5">
                            {/* Whole warehouse option */}
                            <button type="button"
                              onClick={toggleWhole}
                              className="w-full flex items-start gap-3 px-3 py-2.5 border text-left transition-colors"
                              style={{
                                borderColor: inquiryForm.isWholeWarehouse ? 'var(--color-primary)' : 'var(--color-border)',
                                background: inquiryForm.isWholeWarehouse ? 'var(--color-primary-100)' : 'var(--color-surface)',
                              }}>
                              <div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors"
                                style={{
                                  borderColor: inquiryForm.isWholeWarehouse ? 'var(--color-primary)' : 'var(--color-border)',
                                  background: inquiryForm.isWholeWarehouse ? 'var(--color-primary)' : 'transparent',
                                }}>
                                {inquiryForm.isWholeWarehouse && <div className="w-1.5 h-1.5 bg-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Toàn bộ kho</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                  Thuê tất cả {warehouse.sections.length} phân khu · Giá thương lượng với chủ kho
                                </p>
                              </div>
                            </button>

                            {availSections.length === 0 && (
                              <p className="text-sm py-2 px-3 text-center" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
                                Tất cả phân khu đã đầy
                              </p>
                            )}
                            {availSections.map(sec => {
                              const isSel = inquiryForm.selectedSectionIds.includes(sec.id);
                              const availColor = sec.availability === 'available' ? 'var(--color-success)' : 'var(--color-warning)';
                              const availLabel = sec.availability === 'available' ? 'Còn trống' : 'Gần đầy';
                              return (
                                <button type="button" key={sec.id}
                                  onClick={() => toggleSection(sec.id)}
                                  className="w-full flex items-start gap-3 px-3 py-2.5 border text-left transition-colors"
                                  style={{
                                    borderColor: isSel ? 'var(--color-primary)' : 'var(--color-border)',
                                    background: isSel ? 'var(--color-primary-100)' : 'var(--color-surface)',
                                  }}>
                                  {/* Checkbox style */}
                                  <div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors"
                                    style={{
                                      borderColor: isSel ? 'var(--color-primary)' : 'var(--color-border)',
                                      background: isSel ? 'var(--color-primary)' : 'transparent',
                                    }}>
                                    {isSel && <Check className="h-2.5 w-2.5 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{sec.name}</p>
                                      <span className="text-xs px-1.5 py-0.5 leading-none"
                                        style={{ background: availColor, color: '#fff' }}>{availLabel}</span>
                                    </div>
                                    <div className="flex gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                      <span>{sec.temperatureMin}°C ~ {sec.temperatureMax}°C</span>
                                      <span>Còn {sec.availableCapacity.toLocaleString()} m³</span>
                                    </div>
                                    {sec.description && (
                                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{sec.description}</p>
                                    )}
                                    {/* Show price tiers for this section */}
                                    {sec.priceTiers?.filter(t => t.value > 0).slice(0, 1).map(t => (
                                      <p key={t.id} className="text-xs mt-0.5 font-semibold" style={{ color: 'var(--color-primary)' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.value)}/m³/{t.unit === 'month' ? 'tháng' : t.unit === 'day' ? 'ngày' : 'năm'}
                                      </p>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}

                            {/* Selection summary */}
                            {inquiryForm.selectedSectionIds.length > 1 && (
                              <div className="px-3 py-2 text-sm flex items-center gap-1.5"
                                style={{ background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)', borderLeft: '3px solid var(--color-primary)' }}>
                                <LayoutGrid className="h-4 w-4" />
                                Đã chọn {inquiryForm.selectedSectionIds.length} phân khu · Chủ kho sẽ xác nhận giá
                              </div>
                            )}
                            {inquiryForm.isWholeWarehouse && (
                              <div className="px-3 py-2 text-sm flex items-center gap-1.5"
                                style={{ background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)', borderLeft: '3px solid var(--color-primary)' }}>
                                <LayoutGrid className="h-4 w-4" />
                                Yêu cầu toàn bộ kho · Chủ kho sẽ liên hệ thương lượng
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Step 2: Price tier picker (single section / no-section warehouse only) ── */}
                    {(() => {
                      // Multi-section or whole warehouse → no tier picker needed
                      const isMultiMode = inquiryForm.isWholeWarehouse || inquiryForm.selectedSectionIds.length > 1;
                      if (isMultiMode) return null;

                      let tiers: Array<{ id: string; label: string; value: number; unit: string }> = [];
                      // Always include warehouse-level tiers (purchasable packages) when available
                      const whTiers = (warehouse.priceTiers ?? []).filter(t => t.value > 0);
                      if (whTiers.length > 0) {
                        tiers = [...whTiers];
                      } else if (warehouse.sections && warehouse.sections.length > 0) {
                        if (inquiryForm.selectedSectionIds.length === 1) {
                          const sec = warehouse.sections.find(s => s.id === inquiryForm.selectedSectionIds[0]);
                          tiers = (sec?.priceTiers ?? []).filter(t => t.value > 0);
                        }
                        // no section selected yet → don't show tiers
                      } else {
                        // No sections & no warehouse tiers — fallback to legacy price
                        if (warehouse.pricePerCubicMeter > 0) {
                          tiers = [{ id: '__legacy__', label: 'Giá theo tháng', value: warehouse.pricePerCubicMeter, unit: 'month' }];
                        }
                      }

                      if (tiers.length === 0) return null;

                      // Auto-select if only one tier
                      const autoSel = tiers.length === 1 && !inquiryForm.selectedPriceTierId;
                      const hasSections = (warehouse.sections?.length ?? 0) > 0;

                      return (
                        <div>
                          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-secondary)' }}>
                            {hasSections && (
                              <span className="w-5 h-5 flex items-center justify-center text-white text-xs"
                                style={{ background: 'var(--color-primary)' }}>2</span>
                            )}
                            Chọn mức giá <span style={{ color: 'var(--color-error)' }}>*</span>
                          </p>
                          <div className="space-y-1">
                            {tiers.map(tier => {
                              const isSel = inquiryForm.selectedPriceTierId === tier.id || (autoSel && tiers.length === 1);
                              const unitLabel: Record<string, string> = { month: 'tháng', day: 'ngày', year: 'năm' };
                              return (
                                <div key={tier.id_rating}
                                  onClick={() => setInquiryForm(f => ({
                                    ...f,
                                    selectedPriceTierId: tier.id_rating,
                                    durationUnit: (tier.unit as 'day' | 'month' | 'year'),
                                  }))}
                                  className="flex items-center justify-between px-3 py-2.5 border cursor-pointer transition-colors"
                                  style={{
                                    borderColor: isSel ? 'var(--color-primary)' : 'var(--color-border)',
                                    background: isSel ? 'var(--color-primary-100)' : 'var(--color-surface)',
                                    borderLeft: isSel ? '3px solid var(--color-primary)' : '3px solid transparent',
                                  }}>
                                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    {tier.label || 'Giá thuê'}
                                  </span>
                                  <span>
                                    <span style={{
                                      fontWeight: 700,
                                      fontSize: '1rem',
                                      color: isSel ? 'var(--color-primary)' : 'var(--color-text)',
                                    }}>
                                      {formatCurrency(tier.value)}
                                    </span>
                                    <span className="text-xs ml-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                      /m³/{unitLabel[tier.unit] ?? tier.unit}
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Cargo type */}
                    <div>
                      <Label htmlFor="cargoType" className="text-sm mb-1.5 block">
                        Loại hàng hóa <span style={{ color: 'var(--color-error)' }}>*</span>
                      </Label>
                      <div className="relative">
                        <select id="cargoType"
                          value={inquiryForm.cargoType}
                          onChange={e => setInquiryForm(f => ({ ...f, cargoType: e.target.value }))}
                          className="w-full h-10 text-base px-3 pr-8 border appearance-none focus:outline-none transition-colors"
                          style={{
                            borderColor: 'var(--color-border)',
                            background: 'var(--color-surface)',
                            color: inquiryForm.cargoType ? 'var(--color-text)' : 'var(--color-text-muted)',
                          }}>
                          <option value="">-- Chọn loại hàng --</option>
                          {CARGO_TYPES.map(c => (
                            <option key={c.value} value={c.value}>
                              {c.label}{c.temp ? ` (${c.temp})` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                          style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>

                    {/* Contact */}
                    <div>
                      <Label htmlFor="inq-name" className="text-sm mb-1.5 block">
                        Họ tên <span style={{ color: 'var(--color-error)' }}>*</span>
                      </Label>
                      <Input id="inq-name" placeholder="Nguyễn Văn A"
                        value={inquiryForm.name}
                        onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                        className="h-10 text-base rounded-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="inq-phone" className="text-sm mb-1.5 block">
                          Điện thoại <span style={{ color: 'var(--color-error)' }}>*</span>
                        </Label>
                        <Input id="inq-phone" placeholder="+84 900..."
                          value={inquiryForm.phone}
                          onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                          className="h-10 text-base rounded-none" />
                      </div>
                      <div>
                        <Label htmlFor="inq-cap" className="text-sm mb-1.5 block">
                          Cần (m³) <span style={{ color: 'var(--color-error)' }}>*</span>
                        </Label>
                        <Input id="inq-cap" type="number" placeholder="500"
                          value={inquiryForm.capacity}
                          onChange={e => setInquiryForm(f => ({ ...f, capacity: e.target.value }))}
                          className="h-10 text-base rounded-none" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <Label className="text-sm mb-1.5 block">Thời gian thuê dự kiến</Label>
                      <div className="flex gap-2">
                        <Input type="number" min="1" placeholder="6"
                          value={inquiryForm.durationValue}
                          onChange={e => setInquiryForm(f => ({ ...f, durationValue: e.target.value }))}
                          className="h-10 text-base flex-1 rounded-none" />
                        <div className="relative w-32 shrink-0">
                          <select value={inquiryForm.durationUnit}
                            onChange={e => setInquiryForm(f => ({ ...f, durationUnit: e.target.value as 'day' | 'month' | 'year' }))}
                            className="w-full h-10 text-base px-2 pr-6 border appearance-none focus:outline-none"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                            {DURATION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
                            style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="inq-start" className="text-sm mb-1.5 block">Ngày bắt đầu</Label>
                        <Input id="inq-start" type="date"
                          value={inquiryForm.startDate}
                          onChange={e => setInquiryForm(f => ({ ...f, startDate: e.target.value }))}
                          className="h-10 text-base rounded-none" />
                      </div>
                      <div>
                        <Label htmlFor="inq-end" className="text-sm mb-1.5 block">
                          Ngày kết thúc
                          {inquiryForm.durationValue && (
                            <span className="ml-1 text-xs" style={{ color: 'var(--color-primary)' }}>(tự tính)</span>
                          )}
                        </Label>
                        <Input id="inq-end" type="date"
                          value={inquiryForm.endDate}
                          onChange={e => setInquiryForm(f => ({ ...f, endDate: e.target.value }))}
                          className="h-10 text-base rounded-none" />
                      </div>
                    </div>

                    {/* Estimated cost */}
                    {(() => {
                      const cap = parseFloat(inquiryForm.capacity);
                      const dur = parseFloat(inquiryForm.durationValue);
                      if (isNaN(cap) || isNaN(dur) || cap <= 0 || dur <= 0) return null;

                      // Find selected price tier value
                      let unitPrice = 0;
                      let unitLabel = inquiryForm.durationUnit === 'month' ? 'tháng' : inquiryForm.durationUnit === 'day' ? 'ngày' : 'năm';
                      if (inquiryForm.selectedPriceTierId) {
                        // Look in section tiers or warehouse tiers
                        const sec = warehouse.sections?.find(s => s.id === inquiryForm.selectedSectionId);
                        const allTiers = sec ? (sec.priceTiers ?? []) : (warehouse.priceTiers ?? []);
                        const found = allTiers.find(t => t.id === inquiryForm.selectedPriceTierId);
                        if (found) { unitPrice = found.value; unitLabel = { month: 'tháng', day: 'ngày', year: 'năm' }[found.unit] ?? found.unit; }
                      } else if (inquiryForm.selectedPriceTierId === '' && (!warehouse.sections || warehouse.sections.length === 0)) {
                        unitPrice = warehouse.pricePerCubicMeter;
                      }

                      if (unitPrice <= 0) return null;
                      const total = cap * unitPrice * dur;

                      return (
                        <div className="border border-[var(--color-border)]"
                          style={{ background: 'var(--color-primary-100)' }}>
                          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                              Ước tính chi phí
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {cap.toLocaleString()} m³ × {formatCurrency(unitPrice)}/{unitLabel} × {dur} {unitLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tổng dự kiến</span>
                            <span className="font-extrabold" style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                              ~{formatCurrency(total)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Notes */}
                    <div>
                      <Label htmlFor="inq-msg" className="text-sm mb-1.5 block">Ghi chú thêm</Label>
                      <Textarea id="inq-msg"
                        placeholder="Mô tả yêu cầu đặc biệt, lịch xuất nhập hàng, yêu cầu chứng nhận..."
                        value={inquiryForm.message}
                        onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                        className="text-base resize-none rounded-none" rows={3} />
                    </div>

                    <button type="submit" disabled={submittingInquiry}
                      className="w-full py-3 text-base text-white flex items-center justify-center gap-2 transition-colors"
                      style={{ background: submittingInquiry ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                      {submittingInquiry ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Gửi yêu cầu thuê
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>{/* end form card */}

              {/* Quick Info */}
              <div className="bento-card p-5">
                <h3
                  style={{ fontWeight: 600 }}
                  className="mb-3 text-sm"
                >
                  Thông tin thêm
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)]">
                      Mã kho
                    </span>
                    <span
                      style={{ fontWeight: 500 }}
                      className="font-mono text-xs bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded"
                    >
                      {warehouse.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)]">
                      Trạng thái
                    </span>
                    <Badge className="bg-[var(--color-success)] text-white text-xs">
                      Đang hoạt động
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[var(--color-text-muted)]">
                      Chứng nhận
                    </span>
                    {warehouse.hasCertification ? (
                      <Badge className="bg-[var(--color-success)] text-white text-xs">
                        Đã chứng nhận
                      </Badge>
                    ) : (
                      <Badge className="bg-[var(--color-warning)] text-white text-xs">
                        Chưa có
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Back to search */}
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => navigate("/renter/search")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại tìm kiếm
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}