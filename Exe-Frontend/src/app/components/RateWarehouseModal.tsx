import { useState, useEffect } from 'react';
import { Star, X, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WarehouseRating } from '../../types';
import { toast } from 'sonner';

interface Props {
  warehouseId: string;
  warehouseName: string;
  contractId: string;
  contractRef: string;
  existingRating?: WarehouseRating;
  onClose: () => void;
}

const STAR_LABELS = ['', 'Rất tệ', 'Không hài lòng', 'Tạm được', 'Hài lòng', 'Xuất sắc'];

export function RateWarehouseModal({
  warehouseId,
  warehouseName,
  contractId,
  contractRef,
  existingRating,
  onClose,
}: Props) {
  const { user, ratings, submitRating, updateRating, deleteRating } = useApp();
  const [allRatings, setAllRatings] = useState(ratings || []);

  useEffect(() => { setAllRatings(ratings || []); }, [ratings]);

  const [stars, setStars] = useState(existingRating?.stars ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayStars = hovered || stars;

  const handleSubmit = async () => {
    if (!user) return;
    if (stars === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));

    const now = new Date().toISOString();

    if (existingRating) {
      await updateRating(existingRating.id, {
        stars,
        comment: comment.trim() || undefined,
        updatedAt: now,
      });
      toast.success('Đã cập nhật đánh giá!');
    } else {
      const newRating: WarehouseRating = {
        id: `rating-${Date.now()}`,
        warehouseId,
        contractId,
        renterId: user.id_user,
        renterName: user.name,
        renterCompany: user.company?.company_name,
        stars,
        comment: comment.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      await submitRating(newRating);
      toast.success('Cảm ơn bạn đã đánh giá kho lạnh!');
    }

    setSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!existingRating) return;
    await deleteRating(existingRating.id);
    toast.success('Đã xóa đánh giá.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <div>
            <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>
              {existingRating ? 'Chỉnh sửa đánh giá' : 'Đánh giá kho lạnh'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {warehouseName} · HĐ: <span className="font-mono">{contractRef}</span>
            </p>
          </div>
          <button onClick={onClose}>
            <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Star selector */}
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Bạn đánh giá trải nghiệm thuê kho này như thế nào?
            </p>
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(n)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  style={{ padding: '4px' }}
                >
                  <Star
                    className="h-9 w-9 transition-colors"
                    style={{
                      color: n <= displayStars ? '#f59e0b' : 'var(--color-border)',
                      fill: n <= displayStars ? '#f59e0b' : 'transparent',
                      strokeWidth: 1.5,
                    }}
                  />
                </button>
              ))}
            </div>
            <p
              className="text-sm h-5 transition-all"
              style={{
                color: stars > 0 ? '#f59e0b' : 'var(--color-text-muted)',
                fontWeight: stars > 0 ? 600 : 400,
              }}
            >
              {STAR_LABELS[displayStars] || 'Chọn số sao'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
            >
              Nhận xét <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(không bắt buộc)</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 500))}
              placeholder="Chia sẻ trải nghiệm của bạn về chất lượng kho, dịch vụ, vị trí, nhân viên..."
              className="w-full text-sm px-3 py-2.5 border resize-none focus:outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            />
            <p className="text-right text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {comment.length}/500
            </p>
          </div>

          {/* Criteria chips (visual only, for guidance) */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Bạn có thể nhận xét về:
            </p>
            <div className="flex flex-wrap gap-2">
              {['Chất lượng bảo quản', 'Nhiệt độ ổn định', 'Vị trí thuận tiện', 'Nhân viên hỗ trợ', 'Giá cả hợp lý', 'Cơ sở vật chất'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setComment(c => c ? `${c} ${tag}.` : `${tag}.`)}
                  className="text-xs px-2.5 py-1 border transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t border-[var(--color-border)] flex items-center gap-3"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          {existingRating && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 border transition-colors"
              style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
          )}

          {showDeleteConfirm && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs" style={{ color: 'var(--color-error)' }}>Xác nhận xóa?</span>
              <button
                onClick={handleDelete}
                className="text-xs px-3 py-1.5 text-white"
                style={{ background: 'var(--color-error)' }}
              >
                Xóa
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs px-3 py-1.5 border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Hủy
              </button>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="text-sm px-4 py-2.5 border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Đóng
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || stars === 0}
            className="flex items-center gap-2 text-sm px-5 py-2.5 text-white transition-opacity"
            style={{
              background: 'var(--color-primary)',
              opacity: submitting || stars === 0 ? 0.6 : 1,
              cursor: submitting || stars === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                {existingRating ? <Edit3 className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                {existingRating ? 'Cập nhật' : 'Gửi đánh giá'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}