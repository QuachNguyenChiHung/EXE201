import { ColdStorage } from '../../types';
import { Button } from './ui/button';
import {
  MapPin,
  Thermometer,
  Package,
  Shield,
  AlertTriangle,
  CheckCircle,
  Heart,
  BarChart2,
  LayoutGrid,
  Star,
  Eye,
  Tag,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionTierBadge, SubscriptionTierStrip } from './SubscriptionTierBadge';
import { SUBSCRIPTION_TIERS } from '../../types';
import { toast } from 'sonner';
import { WarehouseReviewsModal } from './WarehouseReviewsModal';

interface WarehouseCardProps {
  warehouse: ColdStorage;
  onSelect?: (warehouse: ColdStorage) => void;
  compact?: boolean;
  openInNewTab?: boolean;
}

// ─── Helpers to derive stats from sections ────────────────────────────────────
function getEffectivePrice(warehouse: ColdStorage): number {
  // Prefer the minimum monthly price across all section tiers
  const sectionPrices: number[] = [];
  warehouse.sections?.forEach(s =>
    s.priceTiers?.forEach(t => {
      if (t.unit === 'month' && t.value > 0) sectionPrices.push(t.value);
    }),
  );
  if (sectionPrices.length > 0) return Math.min(...sectionPrices);
  // Fall back to top-level tiers or legacy price
  const tierPrices = (warehouse.priceTiers ?? [])
    .filter(t => t.unit === 'month' && t.value > 0)
    .map(t => t.value);
  if (tierPrices.length > 0) return Math.min(...tierPrices);
  return warehouse.pricePerCubicMeter;
}

function getMaxEffectivePrice(warehouse: ColdStorage): number | null {
  const sectionPrices: number[] = [];
  warehouse.sections?.forEach(s =>
    s.priceTiers?.forEach(t => {
      if (t.unit === 'month' && t.value > 0) sectionPrices.push(t.value);
    }),
  );
  if (sectionPrices.length > 1) return Math.max(...sectionPrices);
  const tierPrices = (warehouse.priceTiers ?? [])
    .filter(t => t.unit === 'month' && t.value > 0)
    .map(t => t.value);
  if (tierPrices.length > 1) return Math.max(...tierPrices);
  return null;
}

function getEffectiveTempRange(warehouse: ColdStorage): { min: number; max: number } {
  if (warehouse.sections && warehouse.sections.length > 0) {
    return {
      min: Math.min(...warehouse.sections.map(s => s.temperatureMin)),
      max: Math.max(...warehouse.sections.map(s => s.temperatureMax)),
    };
  }
  return {
    min: warehouse.stats.temperatureMin,
    max: warehouse.stats.temperatureMax,
  };
}

function getEffectiveAvailableCapacity(warehouse: ColdStorage): number {
  if (warehouse.sections && warehouse.sections.length > 0) {
    return warehouse.sections.reduce((sum, s) => sum + s.availableCapacity, 0);
  }
  return warehouse.stats.availableCapacity;
}

export function WarehouseCard({
  warehouse,
  onSelect,
  compact = false,
  openInNewTab = false,
}: WarehouseCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookmarkedIds, compareIds, ratings, toggleBookmark, toggleCompare } = useApp();

  const [allRatings, setAllRatings] = useState(ratings || []);

  useEffect(() => {
    setAllRatings(ratings || []);
  }, [ratings]);
  
  const warehouseRatings = allRatings.filter(r => r.warehouseId === warehouse.id);
  const liveRatingCount = warehouseRatings.length;
  const liveRatingScore = liveRatingCount > 0
    ? warehouseRatings.reduce((sum, r) => sum + r.stars, 0) / liveRatingCount
    : (warehouse.ratingScore ?? null);
  const displayScore = liveRatingCount > 0 ? liveRatingScore : (warehouse.ratingScore ?? null);
  const displayCount = liveRatingCount > 0 ? liveRatingCount : (warehouse.ratingCount ?? 0);

  const [showReviews, setShowReviews] = useState(false);

  const isBookmarked = bookmarkedIds.includes(warehouse.id);
  const isInCompare = compareIds.includes(warehouse.id);
  const compareIsFull = compareIds.length >= 3 && !isInCompare;

  // Show the compare button only when on the bookmarks/compare page
  const showCompare = location.pathname === '/renter/bookmarks';

  const hasSections = (warehouse.sections?.length ?? 0) > 0;
  const availableSections = warehouse.sections?.filter(s => s.availability !== 'full').length ?? 0;
  const effectivePrice = getEffectivePrice(warehouse);
  const maxPrice = getMaxEffectivePrice(warehouse);
  const tempRange = getEffectiveTempRange(warehouse);
  const availableCapacity = getEffectiveAvailableCapacity(warehouse);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const getAvailabilityBadge = () => {
    switch (warehouse.availability) {
      case 'available':
        return (
          <span className="bg-[var(--color-success)] text-white text-xs px-2 py-0.5">
            Còn trống
          </span>
        );
      case 'partially':
        return (
          <span className="bg-[var(--color-warning)] text-white text-xs px-2 py-0.5">
            Gần đầy
          </span>
        );
      case 'full':
        return (
          <span className="bg-[var(--color-error)] text-white text-xs px-2 py-0.5">
            Đầy
          </span>
        );
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (onSelect) onSelect(warehouse);
    else {
      const url = `/renter/warehouse/${warehouse.id}`;
      if (openInNewTab) window.open(url, '_blank');
      else navigate(url);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBookmark(warehouse.id);
    toast.success(
      isBookmarked ? 'Đã xoá khỏi danh sách lưu' : 'Đã lưu kho lạnh!',
    );
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareIsFull) {
      toast.error('Chỉ được so sánh tối đa 3 kho cùng lúc');
      return;
    }
    toggleCompare(warehouse.id);
  };

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-colors"
      style={
        isInCompare
          ? { borderColor: 'var(--color-primary)', borderWidth: 2 }
          : undefined
      }
      onClick={handleClick}
    >
      {/* Image area */}
      <div
        className={`${compact ? 'aspect-[3/1]' : 'aspect-video'} relative overflow-hidden`}
        style={{ background: 'var(--color-primary-100)' }}
      >
        {warehouse.images && warehouse.images.length > 0 ? (
          <img
            src={warehouse.images[0]}
            alt={warehouse.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              // fallback to placeholder on broken link
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const icon = parent.querySelector('.fallback-icon') as HTMLElement | null;
                if (icon) icon.style.display = 'flex';
              }
            }}
          />
        ) : null}
        {/* Fallback icon — shown when no images or image fails to load */}
        <div
          className="fallback-icon absolute inset-0 flex items-center justify-center"
          style={{ display: warehouse.images && warehouse.images.length > 0 ? 'none' : 'flex' }}
        >
          <Package
            className={`${compact ? 'h-7 w-7' : 'h-12 w-12'} text-[var(--color-primary-300)]`}
          />
        </div>

        {/* Multiple images indicator — top-left when >1 image */}
        {!warehouse.hasCertification && (
          <div
            className="absolute top-0 left-0 flex items-center gap-1.5 text-white px-3 py-1.5"
            style={{
              background: 'var(--color-error)',
              fontSize: compact ? '0.65rem' : '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            <AlertTriangle className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} style={{ flexShrink: 0 }} />
            {!compact && 'CHƯA CÓ CHỨNG CHỈ'}
          </div>
        )}

        {/* Image count badge — top-left when certified and >1 image */}
        {warehouse.hasCertification && warehouse.images && warehouse.images.length > 1 && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5"
            style={{
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 600,
            }}
          >
            <Eye style={{ width: 10, height: 10 }} />
            {warehouse.images.length}
          </div>
        )}

        {/* Availability badge top-right */}
        <div className="absolute top-0 right-0 p-2">
          {getAvailabilityBadge()}
        </div>

        {/* Subscription tier overlay badge — bottom-right of image above bookmark */}
        {warehouse.subscriptionTier && warehouse.subscriptionTier !== 'free' && (() => {
          const cfg = SUBSCRIPTION_TIERS[warehouse.subscriptionTier];
          return (
            <div
              className="absolute bottom-0 right-0 flex items-center gap-1 px-2 py-1 font-bold"
              style={{
                background: cfg.color,
                color: '#fff',
                fontSize: compact ? '0.55rem' : '0.6rem',
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>{cfg.icon}</span>
              {cfg.label.toUpperCase()}
            </div>
          );
        })()}

        {/* Sections badge — bottom-left */}
        {hasSections && (
          <div
            className="absolute bottom-0 left-0 flex items-center gap-1 px-2 py-1"
            style={{
              background: 'rgba(0,0,0,0.55)',
              fontSize: '0.65rem',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            <LayoutGrid style={{ width: compact ? 10 : 12, height: compact ? 10 : 12 }} />
            {availableSections}/{warehouse.sections!.length} phân khu trống
          </div>
        )}

        {/* Bookmark button — bottom-right (shifted up if tier badge present) */}
        <button
          type="button"
          onClick={handleBookmark}
          title={isBookmarked ? 'Xoá khỏi lưu' : 'Lưu kho lạnh'}
          className="absolute right-2 w-7 h-7 flex items-center justify-center transition-colors"
          style={{
            bottom: (warehouse.subscriptionTier && warehouse.subscriptionTier !== 'free') ? 30 : 8,
            background: isBookmarked
              ? 'var(--color-error)'
              : 'rgba(255,255,255,0.85)',
          }}
        >
          <Heart
            className="h-3.5 w-3.5"
            style={{
              color: isBookmarked ? '#fff' : 'var(--color-error)',
              fill: isBookmarked ? '#fff' : 'none',
            }}
          />
        </button>
      </div>

      <div className={`${compact ? 'p-3 space-y-2' : 'p-4 space-y-4'}`}>
        {/* Name & location */}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3
              className="truncate"
              style={{ color: 'var(--color-text)', fontSize: compact ? '0.8rem' : undefined }}
            >
              {warehouse.name}
            </h3>
            <SubscriptionTierBadge tier={warehouse.subscriptionTier} size="sm" />
          </div>
          <div
            className="flex items-center gap-1 text-[var(--color-text-secondary)]"
            style={{ fontSize: '0.875rem' }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {warehouse.location.city}, {warehouse.location.province}
            </span>
          </div>

          {/* Live rating row */}
          {displayScore !== null && displayScore > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowReviews(true); }}
              className="flex items-center gap-1 mt-1 hover:opacity-75 transition-opacity"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  style={{
                    width: compact ? 10 : 12,
                    height: compact ? 10 : 12,
                    color: n <= Math.round(displayScore!) ? '#f59e0b' : 'var(--color-border)',
                    fill: n <= Math.round(displayScore!) ? '#f59e0b' : 'transparent',
                  }}
                />
              ))}
              <span
                className="ml-0.5"
                style={{
                  fontSize: compact ? '0.6rem' : '0.7rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {displayScore!.toFixed(1)} ({displayCount})
              </span>
            </button>
          )}
        </div>

        {!compact && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {warehouse.description}
          </p>
        )}

        {/* Stats row — derived from sections if available */}
        <div className={`grid grid-cols-2 gap-2`}>
          <div className="flex items-start gap-1.5">
            <div
              className="bento-icon-container-sm bg-[var(--color-primary-100)] shrink-0"
              style={compact ? { width: 24, height: 24 } : {}}
            >
              <Package
                className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-[var(--color-primary)]`}
              />
            </div>
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] mb-0.5">
                {hasSections ? 'Còn trống (tổng)' : 'Còn trống'}
              </div>
              <div
                style={{ fontSize: compact ? '0.85rem' : '1rem' }}
                className="font-semibold"
              >
                {availableCapacity.toLocaleString()}m³
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <div
              className="bento-icon-container-sm shrink-0"
              style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', ...(compact ? { width: 24, height: 24 } : {}) }}
            >
              <Thermometer
                className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-[var(--color-info)]`}
              />
            </div>
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] mb-0.5">
                {hasSections ? 'Nhiệt độ (dải)' : 'Nhiệt độ'}
              </div>
              <div
                style={{ fontSize: compact ? '0.85rem' : '1rem' }}
                className="font-semibold"
              >
                {tempRange.min}°~{tempRange.max}°C
              </div>
            </div>
          </div>
        </div>

        {/* Sections info strip — non-compact only */}
        {!compact && hasSections && (
          <div
            className="flex items-center gap-2 px-2 py-1.5 text-xs"
            style={{ background: 'rgba(37,99,235,0.06)', color: 'var(--color-primary)' }}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>{availableSections}</strong> / {warehouse.sections!.length} phân khu còn trống
              {warehouse.sections!.length > 0 && (() => {
                const temps = warehouse.sections!.map(s => `${s.temperatureMin}~${s.temperatureMax}°C`);
                const unique = [...new Set(temps)];
                return unique.length > 1
                  ? ` · ${unique.length} dải nhiệt độ`
                  : '';
              })()}
            </span>
          </div>
        )}

        {/* Subscription tier info strip — non-compact only */}
        {!compact && <SubscriptionTierStrip tier={warehouse.subscriptionTier} />}

        {/* Warehouse-level purchasable tiers strip */}
        {!compact && warehouse.priceTiers && warehouse.priceTiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1.5 px-1">
            {warehouse.priceTiers.map((tier) => (
              <span
                key={tier.id}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1 border"
                style={{
                  borderColor: 'var(--color-success)',
                  color: 'var(--color-success)',
                  background: 'rgba(34,197,94,0.05)',
                }}
              >
                <Tag className="h-2.5 w-2.5" />
                {tier.label}: <strong>{formatPrice(tier.value)}</strong>/{tier.unit === 'month' ? 'tháng' : tier.unit === 'day' ? 'ngày' : 'năm'}
              </span>
            ))}
          </div>
        )}

        {/* Price & CTA — price derived from sections */}
        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-[var(--color-text-muted)] mb-0.5">
              {hasSections ? 'Giá từ' : 'Giá thuê'}
            </div>
            <div
              className="font-bold text-[var(--color-primary)]"
              style={{ fontSize: compact ? '0.75rem' : undefined }}
            >
              {formatPrice(effectivePrice)}
              {maxPrice && maxPrice !== effectivePrice && (
                <span className="font-bold text-[var(--color-primary)]">
                  {' '}–{' '}{formatPrice(maxPrice)}
                </span>
              )}
              <span
                className="text-[var(--color-text-muted)]"
                style={{ fontSize: '0.7rem' }}
              >
                /m³/tháng
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shrink-0"
            style={compact ? { fontSize: '0.7rem', padding: '0.25rem 0.5rem', height: 'auto' } : {}}
            onClick={(e) => {
              e.stopPropagation();
              const url = `/renter/warehouse/${warehouse.id}`;
              if (openInNewTab) window.open(url, '_blank');
              else navigate(url);
            }}
          >
            Xem chi tiết
          </Button>
        </div>

        {/* Compare toggle */}
        {showCompare && (
          <button
            type="button"
            onClick={handleCompare}
            disabled={compareIsFull}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 border transition-colors disabled:opacity-40"
            style={{
              borderColor: isInCompare
                ? 'var(--color-primary)'
                : 'var(--color-border)',
              color: isInCompare
                ? 'var(--color-primary)'
                : 'var(--color-text-secondary)',
              background: isInCompare
                ? 'rgba(37,99,235,0.06)'
                : 'transparent',
            }}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            {isInCompare ? 'Đang so sánh ✓' : 'Thêm vào so sánh'}
          </button>
        )}
      </div>

      {showReviews && (
        <WarehouseReviewsModal
          warehouseId={warehouse.id}
          warehouseName={warehouse.name}
          onClose={() => setShowReviews(false)}
        />
      )}
    </div>
  );
}