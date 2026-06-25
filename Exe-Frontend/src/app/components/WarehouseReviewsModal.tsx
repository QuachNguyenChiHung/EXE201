import { X, Star, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { renterService } from '../../services/renterService';
import { WarehouseRatingResponse } from '../../types/warehouse';

interface Props {
  warehouseId: number;
  warehouseName: string;
  onClose: () => void;
}

const STAR_LABELS: Record<number, string> = {
  5: 'Xuất sắc',
  4: 'Hài lòng',
  3: 'Tạm được',
  2: 'Không hài lòng',
  1: 'Rất tệ',
};

export function WarehouseReviewsModal({ warehouseId, warehouseName, onClose }: Props) {
  const [data, setData] = useState<WarehouseRatingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    renterService.getWarehouseRatings(warehouseId)
      .then(setData)
      .catch((err) => {
        console.error('[WarehouseReviewsModal] Failed to fetch reviews:', err);
        setError('Không thể tải đánh giá.');
      })
      .finally(() => setLoading(false));
  }, [warehouseId]);

  const reviews = data?.reviews ?? [];
  const count = data?.totalReviews ?? 0;
  const avg = data?.averageRating ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Star className="h-4 w-4 shrink-0" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            <div className="min-w-0">
              <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Đánh giá từ khách thuê</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                {warehouseName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 ml-3">
            <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Đang tải đánh giá...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && count === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare className="h-10 w-10 mb-3" style={{ color: 'var(--color-border)' }} />
              <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Chưa có đánh giá</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Kho này chưa có đánh giá nào từ khách thuê.
              </p>
            </div>
          ) : !loading && !error ? (
            <>
              {/* Summary */}
              <div
                className="flex items-center gap-6 px-6 py-5"
                style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
              >
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

                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const cnt = reviews.filter(r => r.rating === star).length;
                    const pct = count > 0 ? (cnt / count) * 100 : 0;
                    return (
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
                    );
                  })}
                </div>
              </div>

              {/* Review list */}
              <div className="divide-y divide-[var(--color-border)]">
                {reviews.map(review => (
                  <div key={review.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
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
                      <div className="flex flex-col items-end shrink-0 gap-1">
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
                        <span
                          className="text-xs px-1.5 py-0.5"
                          style={{
                            background: review.rating >= 4 ? 'rgba(34,197,94,0.1)' : review.rating === 3 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                            color: review.rating >= 4 ? 'var(--color-success)' : review.rating === 3 ? '#d97706' : 'var(--color-error)',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                          }}
                        >
                          {STAR_LABELS[review.rating]}
                        </span>
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="text-xs italic mt-2" style={{ color: 'var(--color-text-muted)' }}>
                        Không có nhận xét
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t border-[var(--color-border)] flex justify-end shrink-0"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <button
            onClick={onClose}
            className="text-sm px-5 py-2 border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
