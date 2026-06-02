import { Heart, BarChart2, Trash2 } from 'lucide-react';

interface BookmarksHeaderProps {
  viewMode: 'list' | 'compare';
  setViewMode: (v: 'list' | 'compare') => void;
  bookmarkCount: number;
  compareCount: number;
  onClearAll: () => void;
}

export function BookmarksHeader({
  viewMode,
  setViewMode,
  bookmarkCount,
  compareCount,
  onClearAll,
}: BookmarksHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-4">
      <div>
        <h1 className="flex items-center gap-2">
          <Heart className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
          Kho đã lưu
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Quản lý {bookmarkCount} kho lạnh bạn đang quan tâm
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Toggle View */}
        <div className="flex p-0.5 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            <Heart className="h-4 w-4" />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm transition-colors ${
              viewMode === 'compare'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            So sánh
            {compareCount > 0 && (
              <span className="ml-1 text-[10px] bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded-full">
                {compareCount}
              </span>
            )}
          </button>
        </div>

        {/* Clear All */}
        {bookmarkCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-sm px-3 py-1.5 text-[var(--color-error)] hover:bg-[rgba(239,68,68,0.05)] transition-colors border border-transparent hover:border-[var(--color-error)]"
          >
            <Trash2 className="h-4 w-4" />
            Xóa tất cả
          </button>
        )}
      </div>
    </div>
  );
}
