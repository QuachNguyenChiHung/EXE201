/**
 * api.ts — Pure utility functions (no external dependencies).
 * Search/filter logic operates on warehouse arrays passed as parameters.
 * All data comes from mock data stores.
 */
import { ColdStorage, FilterOptions, SearchResult, SUBSCRIPTION_TIERS } from '../types';

// ── Warehouse search (pure function — operates on provided list) ──────────────

/**
 * Client-side warehouse search/filter.
 * Accepts the full warehouse list (from Redux) and returns a paginated SearchResult.
 */
export function searchWarehouses(
  warehouses: ColdStorage[],
  filters: FilterOptions,
  page = 1,
  pageSize = 10,
): SearchResult {
  let filtered = [...warehouses].filter(w => w.status === 'active');

  // ── Keyword search ──────────────────────────────────────────────────────────
  if (filters.keyword && filters.keyword.trim()) {
    const kw = filters.keyword.trim().toLowerCase();
    filtered = filtered.filter(w =>
      w.name.toLowerCase().includes(kw) ||
      w.description.toLowerCase().includes(kw) ||
      w.location.address.toLowerCase().includes(kw) ||
      w.location.city.toLowerCase().includes(kw) ||
      w.location.province.toLowerCase().includes(kw)
    );
  }

  // ── helper: lowest monthly price across top-level tiers + all section tiers ──
  const effectiveMinPrice = (w: ColdStorage): number => {
    const prices: number[] = [w.pricePerCubicMeter];
    w.priceTiers?.forEach(t => { if (t.unit === 'month' && t.value > 0) prices.push(t.value); });
    w.sections?.forEach(s => s.priceTiers?.forEach(t => { if (t.unit === 'month' && t.value > 0) prices.push(t.value); }));
    return Math.min(...prices);
  };

  // Apply filters
  if (filters.provinces && filters.provinces.length > 0) {
    filtered = filtered.filter(w => filters.provinces!.includes(w.location.province));
  }

  if (filters.cities && filters.cities.length > 0) {
    filtered = filtered.filter(w => filters.cities!.includes(w.location.city));
  }

  // Capacity: main stats OR any section has enough available space
  if (filters.minCapacity !== undefined) {
    filtered = filtered.filter(w =>
      w.stats.availableCapacity >= filters.minCapacity! ||
      (w.sections?.some(s => s.availableCapacity >= filters.minCapacity!) ?? false)
    );
  }

  if (filters.maxCapacity !== undefined) {
    filtered = filtered.filter(w =>
      w.stats.availableCapacity <= filters.maxCapacity! ||
      (w.sections?.some(s => s.availableCapacity <= filters.maxCapacity!) ?? false)
    );
  }

  // Price: main price OR any section monthly tier falls in range
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter(w =>
      w.pricePerCubicMeter >= filters.minPrice! ||
      (w.sections?.some(s => s.priceTiers?.some(t => t.unit === 'month' && t.value >= filters.minPrice!)) ?? false)
    );
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter(w =>
      effectiveMinPrice(w) <= filters.maxPrice!
    );
  }

  // Temperature: main stats OR any section overlaps the requested range
  if (filters.temperatureRange) {
    const { min, max } = filters.temperatureRange;
    filtered = filtered.filter(w => {
      const mainOk = w.stats.temperatureMin <= max && w.stats.temperatureMax >= min;
      const sectionOk = w.sections?.some(s => s.temperatureMin <= max && s.temperatureMax >= min) ?? false;
      return mainOk || sectionOk;
    });
  }

  if (filters.availability && filters.availability.length > 0) {
    filtered = filtered.filter(w => filters.availability!.includes(w.availability));
  }

  if (filters.certificationRequired) {
    filtered = filtered.filter(w => w.hasCertification);
  }

  if (filters.features && filters.features.length > 0) {
    filtered = filtered.filter(w =>
      filters.features!.some(f => w.features.includes(f))
    );
  }

  if (filters.securityLevel && filters.securityLevel.length > 0) {
    filtered = filtered.filter(w => filters.securityLevel!.includes(w.stats.securityLevel));
  }

  // ── Sort by subscription tier boost (higher tier = higher priority) ──────────
  filtered.sort((a, b) => {
    const boostA = SUBSCRIPTION_TIERS[a.subscriptionTier ?? 'free'].boostFactor;
    const boostB = SUBSCRIPTION_TIERS[b.subscriptionTier ?? 'free'].boostFactor;
    if (boostB !== boostA) return boostB - boostA; // higher boost first
    // Secondary sort: rating score descending
    const ratingA = a.ratingScore ?? 0;
    const ratingB = b.ratingScore ?? 0;
    return ratingB - ratingA;
  });

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
  };
}

// ── Calculate route distance (geometry utility — no mock data) ────────────────

export const calculateRoute = async (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ distance: number; duration: number; route: [number, number][] }> => {
  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const route: [number, number][] = [
    [from.lat, from.lng],
    [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2],
    [to.lat, to.lng],
  ];

  return {
    distance: Math.round(distance * 100) / 100,
    duration: Math.round(distance / 50 * 60), // Assuming 50km/h average
    route,
  };
};