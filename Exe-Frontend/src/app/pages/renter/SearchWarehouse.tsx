import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

import { useApp } from "../../../context/AppContext";
import { searchWarehouses } from "../../../services/api";
import { FilterOptions } from "../../../types";
import { WarehouseCard } from "../../components/WarehouseCard";
import { Input } from "../../components/ui/input";
import { Search, Filter as FilterIcon } from "lucide-react";
import { SearchSidebar } from "../../components/renter/SearchSidebar";

export default function SearchWarehouse() {
  const { warehouses } = useApp();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setLocalFilters] = useState<FilterOptions>({
    provinces: [],
    cities: [],
  });
  const [filteredWarehouses, setFilteredWarehouses] = useState<typeof warehouses>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = searchWarehouses(warehouses, filters);
      setFilteredWarehouses(results.items);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
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

  const displayResults = filteredWarehouses;

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
        <SearchSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          filters={filters}
          setLocalFilters={setLocalFilters}
          handleSearch={handleSearch}
          clearFilters={clearFilters}
          loading={loading}
        />

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
                  <WarehouseCard key={warehouse.id_warehouse} warehouse={warehouse} />
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