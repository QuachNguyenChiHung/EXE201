import { useState } from "react";
import { FilterOptions } from "../../../types";
import { Input } from "../ui/input";
import { Search, MapPin, ChevronDown, Filter as FilterIcon, ShieldCheck, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import vietnamDistricts from "../../../data/vietnamDistricts.json";

type PriceUnit = 'day' | 'week' | 'month' | 'year';

const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
  year: 'Năm',
};

const PRICE_UNIT_TO_MONTHLY: Record<PriceUnit, number> = {
  month: 1,
  day: 30,
  week: 4,
  year: 1 / 12,
};

interface SearchSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  filters: FilterOptions;
  setLocalFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  handleSearch: () => void;
  clearFilters: () => void;
  loading: boolean;
  certifications?: any[];
}

export function SearchSidebar({
  filters,
  setLocalFilters,
  handleSearch,
  clearFilters,
  loading,
  certifications = [],
}: SearchSidebarProps) {
  const toggleProvince = (province: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      provinces: prev.provinces?.includes(province)
        ? prev.provinces.filter((p) => p !== province)
        : [...(prev.provinces || []), province],
    }));
  };

  const toggleCertification = (certID: string) => {
    setLocalFilters((prev) => {
      const current = prev.certifications || [];
      return {
        ...prev,
        certifications: current.includes(certID)
          ? current.filter((c) => c !== certID)
          : [...current, certID],
      };
    });
  };

  // Helper to count active filters
  const activeCount =
    (filters.provinces?.length || 0) +
    (filters.certifications?.length || 0) +
    (filters.minCapacity ? 1 : 0) +
    (filters.maxCapacity ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    ((filters.ratingMin !== undefined) || (filters.ratingMax !== undefined) ? 1 : 0) +
    (filters.priceUnits?.length ? 1 : 0);

  return (
    <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between px-3 sm:px-5 py-3 gap-3 bg-white">
      <div className="flex flex-wrap items-center gap-2 flex-1">

        {/* Địa điểm */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`h-8 px-3 rounded-full border text-[13px] flex items-center gap-1.5 transition-colors ${filters.provinces && filters.provinces.length > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              <MapPin size={14} /> Địa điểm {filters.provinces && filters.provinces.length > 0 && `(${filters.provinces.length})`} <ChevronDown size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white max-h-80 overflow-y-auto" align="start">
            <h4 className="font-semibold text-sm mb-3 text-gray-800">Chọn tỉnh / thành phố</h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(vietnamDistricts).sort().map((province) => (
                <button
                  key={province}
                  onClick={() => toggleProvince(province)}
                  className={`px-3 py-1 rounded-full text-[12px] border transition-colors ${filters.provinces?.includes(province)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                >
                  {province}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Công suất */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`h-8 px-3 rounded-full border text-[13px] flex items-center gap-1.5 transition-colors ${(filters.minCapacity || filters.maxCapacity) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              Công suất (m²) <ChevronDown size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 bg-white" align="start">
            <h4 className="font-semibold text-sm mb-3 text-gray-800">Khoảng công suất</h4>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tối thiểu</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minCapacity ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, minCapacity: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tối đa</label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  value={filters.maxCapacity ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, maxCapacity: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Giá */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`h-8 px-3 rounded-full border text-[13px] flex items-center gap-1.5 transition-colors ${(filters.minPrice || filters.maxPrice || (filters.priceUnits && filters.priceUnits.length > 0 && filters.priceUnits.length < 4)) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              Mức giá <ChevronDown size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white" align="start">
            <h4 className="font-semibold text-sm text-gray-800 mb-3">Mức giá(VNĐ)</h4>
            {/* Time-unit multi-select */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(['day', 'week', 'month', 'year'] as PriceUnit[]).map((unit) => {
                const selected = filters.priceUnits?.includes(unit) ?? false;
                return (
                  <button
                    key={unit}
                    onClick={() =>
                      setLocalFilters((prev) => {
                        const current = prev.priceUnits ?? [];
                        return {
                          ...prev,
                          priceUnits: selected
                            ? current.filter((u) => u !== unit)
                            : [...current, unit],
                        };
                      })
                    }
                    className={`px-3 py-1 rounded-full text-[12px] border transition-colors ${selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {PRICE_UNIT_LABELS[unit]}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tối thiểu</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, minPrice: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tối đa</label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  value={filters.maxPrice ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => ({ ...prev, maxPrice: Number((e.target as HTMLInputElement).value) || undefined }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Đánh giá */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`h-8 px-3 rounded-full border text-[13px] flex items-center gap-1.5 transition-colors ${(filters.ratingMin !== undefined || filters.ratingMax !== undefined) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              <Star size={14} style={{ color: '#facc15', fill: '#facc15' }} />
              Đánh giá
              {filters.ratingMin !== undefined || filters.ratingMax !== undefined ? (
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {filters.ratingMin ?? 1}–{filters.ratingMax ?? 5}
                </span>
              ) : null}
              <ChevronDown size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 bg-white" align="start">
            <h4 className="font-semibold text-sm text-gray-800 mb-3">Khoảng đánh giá</h4>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tối thiểu</label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  placeholder="1"
                  value={filters.ratingMin ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      const newMin = (val >= 1 && val <= 5) ? val : undefined;
                      const currentMax = prev.ratingMax;
                      const newMax = newMin !== undefined && currentMax !== undefined && currentMax < newMin
                        ? newMin
                        : currentMax;
                      return { ...prev, ratingMin: newMin, ratingMax: newMax };
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tối đa</label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  placeholder="5"
                  value={filters.ratingMax ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalFilters((prev) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      const newMax = (val >= 1 && val <= 5) ? val : undefined;
                      const currentMin = prev.ratingMin;
                      const newMin = newMax !== undefined && currentMin !== undefined && newMax < currentMin
                        ? newMax
                        : currentMin;
                      return { ...prev, ratingMax: newMax, ratingMin: newMin };
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Chứng chỉ */}
        {certifications && certifications.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className={`h-8 px-3 rounded-full border text-[13px] flex items-center gap-1.5 transition-colors ${filters.certifications && filters.certifications.length > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                <ShieldCheck size={14} /> Chứng chỉ {filters.certifications && filters.certifications.length > 0 && `(${filters.certifications.length})`} <ChevronDown size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 max-h-80 overflow-y-auto bg-white" align="start">
              <h4 className="font-semibold text-sm mb-3 text-gray-800">Chứng nhận yêu cầu</h4>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <label key={cert.certID} className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters.certifications?.includes(cert.certID.toString()) ?? false}
                      onChange={() => toggleCertification(cert.certID.toString())}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-blue-600 shrink-0"
                    />
                    <span className="leading-snug">{cert.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
        {activeCount > 0 && (
          <button
            onClick={() => { handleSearch(); clearFilters(); }}
            className="text-[12px] text-gray-500 hover:text-gray-800 px-2"
          >
            Xóa ({activeCount})
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-8 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50"
        >
          <Search size={14} />
          {loading ? "Đang tìm..." : "Áp dụng"}
        </button>
      </div>
    </div>
  );
}