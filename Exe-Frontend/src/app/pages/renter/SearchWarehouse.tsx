import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

import { useApp } from "../../../context/AppContext";
import { searchWarehouses } from "../../../services/api";
import { FilterOptions } from "../../../types";
import { WarehouseCard } from "../../components/WarehouseCard";
import { Input } from "../../components/ui/input";
import { Search, X, MapPin, ChevronDown, ChevronUp, Filter as FilterIcon } from "lucide-react";
import {
  vietnamProvinces,
  availableFeatures,
} from "../../../data/mockWarehouses";

type CollapsibleSection = "availability" | "features";

export default function SearchWarehouse() {
  const { warehouses } = useApp();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setLocalFilters] = useState<FilterOptions>({
    provinces: [],
    cities: [],
  });
  const [collapsed, setCollapsed] = useState<Record<CollapsibleSection, boolean>>({
    availability: true,
    features: true,
  });

  const toggleSection = (section: CollapsibleSection) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = searchWarehouses(warehouses, filters);
      // Search results are now just filtered from warehouses array
      // No need to store separately - component uses warehouses directly
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvince = (province: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      provinces: prev.provinces?.includes(province)
        ? prev.provinces.filter((p) => p !== province)
        : [...(prev.provinces || []), province],
    }));
  };

  const toggleFeature = (feature: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  const toggleAvailability = (
    availability: "available" | "partially",
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      availability: prev.availability?.includes(availability)
        ? prev.availability.filter((a) => a !== availability)
        : [...(prev.availability || []), availability],
    }));
  };

  const clearFilters = () => {
    setLocalFilters({
      provinces: [],
      cities: [],
    });
  };

  // Auto-close sidebar on mobile, auto-open on desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(e.matches);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses.length]);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [sidebarOpen]);

  const displayResults = warehouses;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Navbar />
      <div className="flex-1 flex relative">
        {/* ─── Mobile backdrop ─── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Sidebar ─── */}
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
                      className={`px-2.5 py-[3px] rounded-full text-[11px] border transition-colors ${
                        filters.provinces?.includes(province)
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

              {/* ── Tiện ích (collapsible) ── */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleSection("features")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tiện ích</span>
                  {collapsed.features ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                </button>
                {!collapsed.features && (
                  <div className="px-4 pb-3">
                    <div className="space-y-2">
                      {availableFeatures.map((feature) => (
                        <label key={feature} className="flex items-center gap-2.5 text-[13px] text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={filters.features?.includes(feature) ?? false}
                            onChange={() => toggleFeature(feature)}
                            className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
                          />
                          {feature}
                        </label>
                      ))}
                    </div>
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

        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3">
            {/* Filter toggle — shows on desktop when sidebar closed, and always on mobile */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 h-8 text-[13px] font-medium text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors shrink-0"
              >
                <FilterIcon size={14} /> Bộ lọc
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 h-8 text-[13px] font-medium text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors shrink-0"
            >
              <FilterIcon size={14} /> Lọc
            </button>
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Tìm theo tên, địa chỉ..."
                value={filters.keyword ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocalFilters((prev) => ({ ...prev, keyword: (e.target as HTMLInputElement).value }))
                }
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSearch()}
                className="w-full h-9 border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-3 sm:px-4 h-9 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 shrink-0"
            >
              <Search size={15} /> <span className="hidden sm:inline">{loading ? "Đang tìm..." : "Tìm kiếm"}</span>
            </button>
          </div>

          {/* Results area */}
          <div className="flex-1 px-3 sm:px-5 py-4 sm:py-5">
            <div className="mb-3 sm:mb-4 text-[13px] text-gray-500">
              <span>Hiển thị <strong className="text-gray-700">{warehouses.length}</strong> kho lạnh</span>
            </div>

            {displayResults.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg text-gray-500">Không tìm thấy kho lạnh phù hợp</p>
                <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className={`grid gap-4 sm:gap-5 grid-cols-1 ${sidebarOpen ? "sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
                {displayResults.map((warehouse) => (
                  <WarehouseCard key={warehouse.id} warehouse={warehouse} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}