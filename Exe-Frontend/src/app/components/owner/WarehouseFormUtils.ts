import L from "leaflet";
import { PriceTier } from "../../../types";

// ── Icons ──────────────────────────────────────────────────────────────────
export function createWarehouseIcon() {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5.5" fill="#fff"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
  });
}

// ── Nominatim ──────────────────────────────────────────────────────────────
export interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  place?: string;
  suburb?: string;
  quarter?: string;
  neighbourhood?: string;
  hamlet?: string;
  village?: string;
  town?: string;
  city_district?: string;
  county?: string;
  city?: string;
  state?: string;
  province?: string;
  postcode?: string;
  country_code?: string;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

const BASE = "https://nominatim.openstreetmap.org";
const LANG = { headers: { "Accept-Language": "vi" } };

export async function nominatimSearch(
  houseNumber: string,
  street: string,
  city: string,
  state: string,
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "vn",
    limit: "5",
  });
  const streetParam = [houseNumber, street].filter(Boolean).join(" ");
  if (streetParam) params.set("street", streetParam);
  if (city) params.set("city", city);
  if (state) params.set("state", state);
  if (!streetParam && !city && !state) return [];
  const res = await fetch(`${BASE}/search?${params}`, LANG);
  if (!res.ok) throw new Error(`Nominatim search HTTP ${res.status}`);
  return res.json() as Promise<NominatimResult[]>;
}

export async function nominatimReverse(
  lat: number,
  lon: number,
): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
    lat: lat.toFixed(7),
    lon: lon.toFixed(7),
  });
  const res = await fetch(`${BASE}/reverse?${params}`, LANG);
  if (!res.ok) throw new Error(`Nominatim reverse HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) return null;
  return data as NominatimResult;
}

export function parseAddress(addr: NominatimAddress, displayName = "") {
  let houseNumber = addr.house_number || "";
  if (!houseNumber && displayName) {
    const firstToken = displayName.split(",")[0].trim();
    if (/^\d+[a-zA-Z]?(\/\d+)?$/.test(firstToken)) {
      houseNumber = firstToken;
    }
  }
  const street =
    addr.road || addr.pedestrian || addr.footway || addr.path || "";
  const ward =
    addr.suburb ||
    addr.quarter ||
    addr.neighbourhood ||
    addr.hamlet ||
    addr.village ||
    "";
  const district =
    addr.city_district || addr.county || addr.town || addr.city || "";
  const city = addr.state || addr.province || addr.city || "";

  return { houseNumber, street, ward, district, city };
}

// ── Constants ──────────────────────────────────────────────────────────────
export const UNIT_SHORT: Record<string, string> = {
  month: "tháng",
  day: "ngày",
  hour: "giờ",
  year: "năm",
};

export const UNIT_AREA_SHORT: Record<string, string> = {
  m3: "m³",
  m2: "m²",
  pallet: "pallet",
};

export const PRICE_TIER_OPTIONS = [
  { unit: "month", label: "Giá theo tháng" },
  { unit: "day", label: "Giá theo ngày" },
  { unit: "hour", label: "Giá theo giờ" },
];

export interface CertFile {
  name: string;
  size: number;
  file: File;
}
