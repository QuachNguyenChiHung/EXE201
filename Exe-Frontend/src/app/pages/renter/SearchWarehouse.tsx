import { useState, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

import { renterService } from "../../../services/renterService";
import { FilterOptions } from "../../../types";
import { WarehouseCard } from "../../components/WarehouseCard";
import { Input } from "../../components/ui/input";
import { Search, Filter as FilterIcon } from "lucide-react";
import { SearchSidebar } from "../../components/renter/SearchSidebar";
import { useApp } from "../../../context/AppContext";

type PriceUnit = "day" | "week" | "month" | "year";

// Prices are stored monthly on the backend; convert user input to monthly before sending
const PRICE_TO_MONTHLY: Record<PriceUnit, number> = {
  month: 1,
  day: 30,
  week: 4,
  year: 1 / 12,
};

const DEFAULT_PRICE_UNITS: PriceUnit[] = ["day", "week", "month", "year"];

export default function SearchWarehouse() {
  const { upsertRatings } = useApp();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [filters, setLocalFilters] = useState<FilterOptions>({
    provinces: [],
    cities: [],
    priceUnits: [],
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filterMeta, setFilterMeta] = useState<any>(null);

  // Load filter metadata (for the certification list)
  useEffect(() => {
    renterService
      .getFilterMeta()
      .then((meta) => setFilterMeta(meta))
      .catch(console.error);
  }, []);

  /**
   * Build query params matching `GET /api/warehouses/search`
   * (PublicWarehouseController#searchWarehouses).
   */
  const buildSearchParams = (currentPage: number) => {
    const params: Record<string, unknown> = {
      page: currentPage,
      size: 6,
    };

    if (filters.keyword && filters.keyword.trim() !== "") {
      params.keyword = filters.keyword.trim();
    }

    if (filters.provinces && filters.provinces.length > 0) {
      params.provinces = filters.provinces;
    }

    if (filters.minCapacity !== undefined) {
      params.minArea = filters.minCapacity;
    }
    if (filters.maxCapacity !== undefined) {
      params.maxArea = filters.maxCapacity;
    }

    // Price-unit conversion -> monthly equivalent
    const units =
      filters.priceUnits && filters.priceUnits.length > 0
        ? filters.priceUnits
        : DEFAULT_PRICE_UNITS;
    const avgMultiplier =
      units.reduce((sum, u) => sum + PRICE_TO_MONTHLY[u], 0) / units.length;
    if (filters.minPrice !== undefined) {
      params.minPrice = filters.minPrice * avgMultiplier;
    }
    if (filters.maxPrice !== undefined) {
      params.maxPrice = filters.maxPrice * avgMultiplier;
    }

    // Backend accepts `minRating` and `maxRating`; forward both bounds
    if (filters.ratingMin !== undefined) {
      params.minRating = filters.ratingMin;
    }
    if (filters.ratingMax !== undefined) {
      params.maxRating = filters.ratingMax;
    }

    // Backend accepts a `List<Long> certTypeIds` -> send as repeated params
    if (filters.certifications && filters.certifications.length > 0) {
      params.certTypeIds = filters.certifications
        .map((c) => Number(c))
        .filter((n) => !Number.isNaN(n));
    }

    return params;
  };

  const hasActiveFilters = (): boolean => {
    return (
      (filters.keyword?.trim().length ?? 0) > 0 ||
      (filters.provinces?.length ?? 0) > 0 ||
      filters.minCapacity !== undefined ||
      filters.maxCapacity !== undefined ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.ratingMin !== undefined ||
      filters.ratingMax !== undefined ||
      (filters.priceUnits?.length ?? 0) > 0 && filters.priceUnits!.length < 4 ||
      (filters.certifications?.length ?? 0) > 0
    );
  };

  const fetchWarehouses = async (currentPage: number) => {
    setLoading(true);
    try {
      const params = buildSearchParams(currentPage);
      console.log("[SearchWarehouse] GET /warehouses/search", params);
      const data = await renterService.searchWarehouses(params);

      setWarehouses(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);

      // Fetch live ratings for each returned warehouse and sync to AppContext
      // so WarehouseCard displays real stars without needing full mock-data refresh.
      const ratingFetches = (data.content as any[]).map(async (w) => {
        try {
          const result = await renterService.getWarehouseRatings(w.id_warehouse);
          if (result.reviews && result.reviews.length > 0) {
            const liveRatings = result.reviews.map((r: any) => ({
              id_rating: r.id,
              rate: r.rating,
              comment: r.comment || '',
              id_renter: undefined,
              warehouse_id: w.id_warehouse,
            }));
            upsertRatings(liveRatings);
          }
        } catch {
          // silently skip — fallback to warehouse.ratingScore will be used
        }
      });
      await Promise.allSettled(ratingFetches);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchWarehouses(0);
  };

  const clearFilters = () => {
    setLocalFilters({
      keyword: '',
      provinces: [],
      cities: [],
      priceUnits: [],
      minCapacity: undefined,
      maxCapacity: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      ratingMin: undefined,
      ratingMax: undefined,
      certifications: [],
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
    fetchWarehouses(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Navbar />

      {/* ─── Main content ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3">
          {/* Filter toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-1.5 px-3 h-8 text-[13px] font-medium border rounded transition-colors shrink-0 ${
              sidebarOpen
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "text-gray-600 border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <FilterIcon size={14} /> {sidebarOpen ? "Ẩn bộ lọc" : "Bộ lọc"}
          </button>
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Tìm theo tên, địa chỉ..."
              value={filters.keyword ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  keyword: (e.target as HTMLInputElement).value,
                }))
              }
              onKeyDown={(e: React.KeyboardEvent) =>
                e.key === "Enter" && handleSearch()
              }
              className="w-full h-9 border-gray-300 rounded text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-3 sm:px-4 h-9 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 shrink-0"
          >
            <Search size={15} />{" "}
            <span className="hidden sm:inline">
              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </span>
          </button>
        </div>

        {/* Horizontal Filter Bar */}
        {sidebarOpen && (
          <div className="bg-white border-b border-gray-200">
            <SearchSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              filters={filters}
              setLocalFilters={setLocalFilters}
              handleSearch={handleSearch}
              clearFilters={clearFilters}
              loading={loading}
              certifications={filterMeta?.certifications || []}
              locations={filterMeta?.locations || []}
            />
          </div>
        )}

        {/* Results area */}
        <div className="flex-1 px-3 sm:px-5 py-4 sm:py-5 flex flex-col">
          <div className="mb-3 sm:mb-4 text-[13px] text-gray-500 flex items-center gap-3">
            <span>
              Hiển thị <strong className="text-gray-700">{totalElements}</strong> kho lạnh
            </span>
            {hasActiveFilters() && (
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Đang lọc theo{" "}
                {[
                  filters.keyword && `"${filters.keyword}"`,
                  filters.provinces?.length
                    ? `${filters.provinces.length} tỉnh/TP`
                    : null,
                  filters.minCapacity !== undefined || filters.maxCapacity !== undefined
                    ? "diện tích"
                    : null,
                  filters.minPrice !== undefined || filters.maxPrice !== undefined
                    ? "giá"
                    : null,
                  filters.ratingMin !== undefined || filters.ratingMax !== undefined ? "đánh giá" : null,
                  filters.certifications?.length
                    ? `${filters.certifications.length} chứng chỉ`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>

          {warehouses.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg text-gray-500">
                Không tìm thấy kho lạnh phù hợp
              </p>
              <p className="text-sm mt-1">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {warehouses.map((warehouse) => (
                  <WarehouseCard
                    key={warehouse.id_warehouse}
                    warehouse={warehouse}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page === 0 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Trang trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}