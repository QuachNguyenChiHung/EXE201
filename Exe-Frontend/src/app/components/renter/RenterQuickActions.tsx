import { useNavigate } from "react-router";
import { Search, Sparkles, ClipboardList } from "lucide-react";

export function RenterQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] mb-8">
      {/* Traditional search */}
      <button
        onClick={() => navigate("/renter/search")}
        className="bg-[var(--color-surface)] p-8 text-left hover:bg-[var(--color-primary-50)] transition-colors group"
      >
        <div className="w-12 h-12 bg-[var(--color-primary)] flex items-center justify-center mb-4">
          <Search className="h-6 w-6 text-white" />
        </div>
        <h3 className="mb-2 group-hover:text-[var(--color-primary)] transition-colors">
          Tìm kiếm truyền thống
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-5">
          Sử dụng bộ lọc chi tiết để tìm kho lạnh phù hợp
        </p>
        <span className="inline-block bg-[var(--color-primary)] text-white text-sm px-4 py-2">
          Bắt đầu tìm kiếm →
        </span>
      </button>

      {/* AI search */}
      <button
        onClick={() => navigate("/renter/ai-search")}
        className="bg-[var(--color-text)] p-8 text-left hover:bg-[var(--color-primary-900)] transition-colors group"
      >
        <div className="w-12 h-12 bg-[var(--color-primary)] flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h3 className="mb-2" style={{ color: "white" }}>
          Tìm kiếm bằng AI
        </h3>
        <p className="text-gray-400 text-sm mb-5">
          Mô tả nhu cầu của bạn bằng ngôn ngữ tự nhiên
        </p>
        <span className="inline-block bg-[var(--color-primary)] text-white text-sm px-4 py-2">
          Thử AI Search →
        </span>
      </button>

      {/* Rented properties */}
      <button
        onClick={() => navigate("/renter/rented")}
        className="bg-[var(--color-surface)] p-8 text-left hover:bg-[var(--color-primary-50)] transition-colors group border-t border-[var(--color-border)] md:border-t-0"
      >
        <div className="w-12 h-12 bg-[var(--color-secondary)] flex items-center justify-center mb-4">
          <ClipboardList className="h-6 w-6 text-white" />
        </div>
        <h3 className="mb-2 group-hover:text-[var(--color-secondary)] transition-colors">
          Kho đang thuê
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-5">
          Xem và quản lý các hợp đồng thuê kho hiện tại
        </p>
        <span className="inline-block bg-[var(--color-secondary)] text-white text-sm px-4 py-2">
          Quản lý hợp đồng →
        </span>
      </button>
    </div>
  );
}
