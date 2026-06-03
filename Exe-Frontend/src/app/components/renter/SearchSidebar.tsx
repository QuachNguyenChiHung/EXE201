import { useState } from "react";
import { FilterOptions } from "../../../types";
import { Input } from "../ui/input";
import { Search, X, MapPin, ChevronDown, ChevronUp, Filter as FilterIcon } from "lucide-react";
import { vietnamProvinces } from "../../../data/mockWarehouses";

type CollapsibleSection = "availability";

interface SearchSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  filters: FilterOptions;
  setLocalFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  handleSearch: () => void;
  clearFilters: () => void;
  loading: boolean;
}

export function SearchSidebar({
  sidebarOpen,
  setSidebarOpen,
  filters,
  setLocalFilters,
  handleSearch,
  clearFilters,
  loading,
}: SearchSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<CollapsibleSection, boolean>>({
    availability: true,
  });

  const toggleSection = (section: CollapsibleSection) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleProvince = (province: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      provinces: prev.provinces?.includes(province)
        ? prev.provinces.filter((p) => p !== province)
        : [...(prev.provinces || []), province],
    }));
  };

  const toggleAvailability = (availability: "available" | "partially") => {
    setLocalFilters((prev) => ({
      ...prev,
      availability: prev.availability?.includes(availability)
        ? prev.availability.filter((a) => a !== availability)
        : [...(prev.availability || []), availability],
    }));
  };

  return (
    <aside
      className={`
        bg-white border-r border-gray-200 flex flex-col z-40
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 w-[85vw] max-w-[320px]
        md:relative md:inset-auto md:max-w-none md:shrink-0
        ${sidebarOpen
          ? "translate-x-0 md:translate-x-0 md:w-[280px]"
          : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        }
      `}
    >
      <div className="w-[85vw] max-w-[320px] md:w-[280px] md:max-w-none h-full flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FilterIcon size={15} className="text-gray-500" />
            <span className="text-[13px] font-bold text-gray-800 tracking-wide">Bộ lọc</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Address search ── */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Vị trí hiện tại
            </label>
            <Input
              placeholder="Nhập địa chỉ của bạn..."
              value={filters.keyword ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalFilters((prev) => ({ ...prev, keyword: (e.target as HTMLInputElement).value }))
              }
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSearch()}
              className="w-full h-8 text-[13px] border-gray-300 bg-gray-50 rounded"
            />
            <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">
              Tìm kho lạnh gần vị trí của bạn nhất
            </p>
          </div>

          {/* ── Địa điểm (Provinces) ── */}
          <div className="px-4 pt-3 pb-3 border-b border-gray-100">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              <MapPin size={11} /> Địa điểm
            </label>
            <div className="flex flex-wrap gap-1.5">
              {vietnamProvinces.map((province) => (
                <button
                  key={province}
                  onClick={() => toggleProvince(province)}
                  className={`px-2.5 py-[3px] rounded-full text-[11px] border transition-colors ${filters.provinces?.includes(province)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                >
                  {province}
                </button>
              ))}
            </div>
          </div>

          {/* ── Công suất (m²) ── */}
          <div className="px-4 pt-3 pb-3 border-b border-gray-100">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Công suất (m²)
            </label>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-gray-400 mb-0.5 block">Tối thiểu</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minCapacity ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, minCapacity: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="w-full h-8 text-[13px] border-gray-300 bg-gray-50 rounded"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 mb-0.5 block">Tối đa</span>
                <Input
                  type="number"
                  placeholder="100000"
                  value={filters.maxCapacity ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, maxCapacity: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="w-full h-8 text-[13px] border-gray-300 bg-gray-50 rounded"
                />
              </div>
            </div>
          </div>

          {/* ── Giá (VNĐ/m²/tháng) ── */}
          <div className="px-4 pt-3 pb-3 border-b border-gray-100">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Giá (VNĐ/m²/tháng)
            </label>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-gray-400 mb-0.5 block">Tối thiểu</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, minPrice: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="w-full h-8 text-[13px] border-gray-300 bg-gray-50 rounded"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 mb-0.5 block">Tối đa</span>
                <Input
                  type="number"
                  placeholder="5000000"
                  value={filters.maxPrice ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, maxPrice: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="w-full h-8 text-[13px] border-gray-300 bg-gray-50 rounded"
                />
              </div>
            </div>
          </div>

          {/* ── Tình trạng (collapsible) ── */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("availability")}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tình trạng</span>
              {collapsed.availability ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
            </button>
            {!collapsed.availability && (
              <div className="px-4 pb-3 space-y-2">
                <label className="flex items-center gap-2.5 text-[13px] text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.availability?.includes("available") ?? false}
                    onChange={() => toggleAvailability("available")}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
                  />
                  Còn trống
                </label>
                <label className="flex items-center gap-2.5 text-[13px] text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.availability?.includes("partially") ?? false}
                    onChange={() => toggleAvailability("partially")}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
                  />
                  Còn một phần
                </label>
                  </div>
                )}
              </div>
            </div>

        {/* Footer — search button */}
        <div className="border-t border-gray-200 px-4 py-3">
          <button
            onClick={() => { handleSearch(); clearFilters(); }}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <X size={12} /> Xóa tất cả bộ lọc
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full h-9 flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            <Search size={14} />
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>
      </div>
    </aside>
  );
}
