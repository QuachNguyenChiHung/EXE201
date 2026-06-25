import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, ChevronDown, ChevronUp, Edit3, PenLine } from 'lucide-react';
import { renterService } from '../../../services/renterService';
import { ReviewResponse, WarehouseRatingResponse } from '../../../types/warehouse';
import { RateWarehouseForm } from './RateWarehouseForm';

interface Props {
  warehouseId: number;
  warehouseName: string;
  /** Whether the current user has rented this warehouse (can write a review) */
  canReview: boolean;
  /** Triggered when the user submits a review — callback to refresh the list */
  onReviewSubmitted?: () => void;
}

const STAR_LABELS: Record<number, string> = {
  5: 'Xuất sắc',
  4: 'Hài lòng',
  3: 'Tạm được',
  2: 'Không hài lòng',
  1: 'Rất tệ',
};

export function WarehouseReviewsSection({ warehouseId, warehouseName, canReview, onReviewSubmitted }: Props) {
  const [data, setData] = useState<WarehouseRatingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await renterService.getWarehouseRatings(warehouseId);
      setData(result);
    } catch (err: any) {
      console.error('[WarehouseReviewsSection] Failed to fetch reviews:', err);
      setError('Không thể tải đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSubmitted = async () => {
    setShowForm(false);
    await fetchReviews();
    onReviewSubmitted?.();
  };

  const avg = data?.averageRating ?? 0;
  const count = data?.totalReviews ?? 0;
  const reviews = data?.reviews ?? [];

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    cnt: reviews.filter(r => r.rating === star).length,
    pct: count > 0 ? (reviews.filter(r => r.rating === star).length / count) * 100 : 0,
  }));

  // Show max 3 reviews in collapsed view
  const visibleReviews = expanded ? reviews : reviews.slice(0, 3);

  return (
    <div id="section-reviews" className="bento-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
          <h2 className="text-lg font-semibold">Đánh giá từ khách thuê</h2>
          {count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 700 }}>
              {count}
            </span>
          )}
        </div>
        {canReview && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <PenLine className="h-4 w-4" />
            Viết đánh giá
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Đang tải đánh giá...
        </div>
      )}

      {error && (
        <div className="py-4 text-sm text-center" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {!loading && !error && count === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="h-10 w-10 mb-3" style={{ color: 'var(--color-border)' }} />
          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Chưa có đánh giá</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {canReview
              ? 'Hãy là người đầu tiên đánh giá kho lạnh này!'
              : 'Kho lạnh này chưa có đánh giá nào từ khách thuê.'}
          </p>
          {canReview && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-1.5 text-sm px-4 py-2 text-white transition-opacity"
              style={{ background: 'var(--color-primary)' }}
            >
              <PenLine className="h-4 w-4" />
              Viết đánh giá đầu tiên
            </button>
          )}
        </div>
      )}

      {!loading && !error && count > 0 && (
        <div className="space-y-5">
          {/* Summary row */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Big score */}
            <div className="text-center shrink-0">
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
                {avg.toFixed(1)}
              </p>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className="h-4 w-4"
                    style={{
                      color: n <= Math.round(avg) ? '#f59e0b' : 'var(--color-border)',
                      fill: n <= Math.round(avg) ? '#f59e0b' : 'transparent',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {count} đánh giá
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-2 w-full">
              {dist.map(({ star, cnt, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs w-3 text-right shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {star}
                  </span>
                  <Star className="h-3 w-3 shrink-0" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  <div className="flex-1 h-2" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-2 transition-all"
                      style={{ width: `${pct}%`, background: '#f59e0b' }}
                    />
                  </div>
                  <span className="text-xs w-5 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {cnt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review form inline */}
          {showForm && (
            <div className="border border-[var(--color-primary)] rounded-xl p-4" style={{ background: 'rgba(var(--color-primary-rgb, 59,130,246), 0.03)' }}>
              <RateWarehouseForm
                warehouseId={warehouseId}
                warehouseName={warehouseName}
                onSubmitted={handleReviewSubmitted}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Review list */}
          {visibleReviews.length > 0 && (
            <div className="divide-y divide-[var(--color-border)]">
              {visibleReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Expand/collapse */}
          {count > 3 && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 text-sm mx-auto"
              style={{ color: 'var(--color-primary)' }}
            >
              {expanded ? (
                <><ChevronUp className="h-4 w-4" /> Thu gọn</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> Xem thêm {count - 3} đánh giá</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        {/* Reviewer info */}
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="w-8 h-8 shrink-0 flex items-center justify-center text-xs"
            style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 700, borderRadius: '50%' }}
          >
            {(review.renterName || 'K')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
              {review.renterName || 'Khách thuê'}
            </p>
          </div>
        </div>

        {/* Stars + badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                className="h-3.5 w-3.5"
                style={{
                  color: n <= review.rating ? '#f59e0b' : 'var(--color-border)',
                  fill: n <= review.rating ? '#f59e0b' : 'transparent',
                }}
              />
            ))}
          </div>
          {review.rating >= 4 && (
            <span
              className="text-xs px-1.5 py-0.5"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.65rem' }}
            >
              {STAR_LABELS[review.rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      {review.comment ? (
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          "{review.comment}"
        </p>
      ) : (
        <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
          Không có nhận xét
        </p>
      )}
    </div>
  );
}
