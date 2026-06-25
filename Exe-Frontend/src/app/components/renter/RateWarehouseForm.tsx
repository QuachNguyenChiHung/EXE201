import { useState } from 'react';
import { Star, CheckCircle, X } from 'lucide-react';
import { renterService } from '../../../services/renterService';
import { toast } from 'sonner';

interface Props {
  warehouseId: number;
  warehouseName: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

const STAR_LABELS = ['', 'Rất tệ', 'Không hài lòng', 'Tạm được', 'Hài lòng', 'Xuất sắc'];

export function RateWarehouseForm({ warehouseId, warehouseName, onSubmitted, onCancel }: Props) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayStars = hovered || stars;

  const handleSubmit = async () => {
    if (stars === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await renterService.createReview(warehouseId, stars, comment.trim() || undefined);
      toast.success('Cảm ơn bạn đã đánh giá kho lạnh!');
      onSubmitted();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || '';
      toast.error(msg || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Viết đánh giá</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {warehouseName}
          </p>
        </div>
        <button onClick={onCancel} type="button" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

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
                className="h-8 w-8 transition-colors"
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
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 500))}
          placeholder="Chia sẻ trải nghiệm của bạn về chất lượng kho, dịch vụ, vị trí..."
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

      {/* Quick tags */}
      <div className="flex flex-wrap gap-2">
        {['Chất lượng bảo quản', 'Nhiệt độ ổn định', 'Vị trí thuận tiện', 'Nhân viên hỗ trợ', 'Giá cả hợp lý'].map(tag => (
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

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-2 border transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || stars === 0}
          className="flex items-center gap-2 text-sm px-5 py-2 text-white transition-opacity"
          style={{
            background: 'var(--color-primary)',
            opacity: submitting || stars === 0 ? 0.6 : 1,
            cursor: submitting || stars === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Gửi đánh giá
            </>
          )}
        </button>
      </div>
    </div>
  );
}
