import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { warehousesAPI, storageAPI } from "../../../services/apiClient";
import { ColdStorage, Certification } from "../../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  AlertTriangle,
  Save,
  MapPin,
  Search,
  Upload,
  X,
  FileText,
  Thermometer,
  Package,
  Shield,
  Zap,
  Image,
  Loader2,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  LayoutGrid,
  Tag,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { vietnamProvinces } from "../../../data/mockWarehouses";
import { PriceUnit } from "../../../types";
import L from "leaflet";
import { ImageUploader } from "../../components/ImageUploader";

/** Inline SVG pin icon — same as AddWarehouse */
function createWarehouseIcon() {
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

// ── Nominatim types ────────────────────────────────────────────────────────
interface NominatimAddress {
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
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

const BASE = "https://nominatim.openstreetmap.org";
const LANG = { headers: { "Accept-Language": "vi" } };

async function nominatimSearch(
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

async function nominatimReverse(
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

function parseAddress(addr: NominatimAddress, displayName = "") {
  let houseNumber = addr.house_number || "";
  if (!houseNumber && displayName) {
    const firstToken = displayName.split(",")[0].trim();
    if (/^\d+[a-zA-Z]?(\/\d+)?$/.test(firstToken)) {
      houseNumber = firstToken;
    }
  }
  const road =
    addr.road ||
    addr.pedestrian ||
    addr.footway ||
    addr.path ||
    addr.place ||
    "";
  const district =
    addr.city_district ||
    addr.county ||
    addr.town ||
    addr.suburb ||
    addr.quarter ||
    addr.neighbourhood ||
    addr.village ||
    addr.hamlet ||
    "";
  const prov = addr.state || addr.province || addr.city || "";
  return { houseNumber, road, district, prov };
}

function matchProvince(prov: string): string {
  if (!prov) return "";
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/^thành phố\s+/i, "")
      .replace(/^tỉnh\s+/i, "")
      .replace(/^tp\.\s+/i, "")
      .replace(/[-\s]+/g, " ")
      .trim();
  const needle = normalize(prov);
  return (
    vietnamProvinces.find((p) => normalize(p) === needle) ||
    vietnamProvinces.find(
      (p) =>
        normalize(p).includes(needle) ||
        needle.includes(normalize(p)),
    ) ||
    ""
  );
}

// ── File types ─────────────────────────────────────────────────────────────
interface CertFile {
  name: string;
  size: number;
  file: File;
}
// ImgFile removed — image upload is now handled by <ImageUploader>

// ── Price tier draft (form state uses strings for inputs) ──────────────────
interface PriceTierDraft {
  id: string;
  label: string;
  value: string;  // raw input string
  unit: PriceUnit;
}

// ── Section draft ──────────────────────────────────────────────────────────
interface SectionDraft {
  id: string;
  name: string;
  description: string;
  capacity: string;
  availableCapacity: string;
  temperatureMin: string;
  temperatureMax: string;
  priceTiers: PriceTierDraft[];
  availability: "available" | "partially" | "full";
  collapsed: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────
const UNIT_SHORT: Record<PriceUnit, string> = {
  month: "tháng",
  day:   "ngày",
  year:  "năm",
};

const fmtVnd = (v: string | number) => {
  const n = typeof v === "string" ? parseInt(v) : v;
  return isNaN(n) ? "?" : new Intl.NumberFormat("vi-VN").format(n);
};

function mkTier(suffix = ""): PriceTierDraft {
  return { id: `tier-${Date.now()}-${suffix}`, label: "", value: "", unit: "month" };
}
function mkSection(idx: number): SectionDraft {
  return {
    id: `sec-${Date.now()}-${idx}`,
    name: "",
    description: "",
    capacity: "",
    availableCapacity: "",
    temperatureMin: "",
    temperatureMax: "",
    priceTiers: [mkTier("s")],
    availability: "available",
    collapsed: false,
  };
}

// ── PriceTierEditor ────────────────────────────────────────────────────────
function PriceTierEditor({
  tiers,
  onChange,
  showLabels = true,
}: {
  tiers: PriceTierDraft[];
  onChange: (t: PriceTierDraft[]) => void;
  showLabels?: boolean;
}) {
  const upd = (id: string, field: keyof PriceTierDraft, val: string) =>
    onChange(tiers.map((t) => (t.id === id ? { ...t, [field]: val } : t)));
  const remove = (id: string) => onChange(tiers.filter((t) => t.id !== id));
  const add = () => onChange([...tiers, mkTier(String(tiers.length))]);

  return (
    <div className="space-y-2">
      {tiers.map((tier, idx) => (
        <div key={tier.id} className="flex flex-wrap items-end gap-2">
          {/* Label */}
          <div style={{ flex: "1 1 140px", minWidth: 120 }}>
            {showLabels && idx === 0 && (
              <Label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                Tên mức giá
              </Label>
            )}
            <Input
              placeholder="Giá cơ bản"
              value={tier.label}
              onChange={(e) => upd(tier.id, "label", e.target.value)}
            />
          </div>

          {/* Value */}
          <div style={{ flex: "0 0 160px" }}>
            {showLabels && idx === 0 && (
              <Label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                Giá (VND / m³)
              </Label>
            )}
            <div className="relative">
              <Input
                type="number"
                min="0"
                placeholder="350000"
                value={tier.value}
                onChange={(e) => upd(tier.id, "value", e.target.value)}
                className="pr-6"
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              >
                ₫
              </span>
            </div>
          </div>

          {/* Unit */}
          <div style={{ flex: "0 0 110px" }}>
            {showLabels && idx === 0 && (
              <Label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                Đơn vị
              </Label>
            )}
            <Select
              value={tier.unit}
              onValueChange={(v) => upd(tier.id, "unit", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="month">/ tháng</SelectItem>
                <SelectItem value="day">/ ngày</SelectItem>
                <SelectItem value="year">/ năm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Remove button */}
          <div className={showLabels && idx === 0 ? "pb-0 mt-5" : ""}>
            {tiers.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(tier.id)}
                className="flex items-center justify-center w-8 h-9 border transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-error)"; e.currentTarget.style.color = "var(--color-error)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                title="Xoá mức giá"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : <div className="w-8" />}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors"
        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-primary)"; }}
      >
        <Plus className="h-3 w-3" />
        Thêm mức giá khác
      </button>

      {/* Preview chips */}
      {tiers.some((t) => t.value) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tiers.filter((t) => t.value).map((t) => (
            <span
              key={t.id}
              className="text-xs px-2 py-0.5 flex items-center gap-1"
              style={{
                border: "1px solid var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              <Tag className="h-2.5 w-2.5" />
              {t.label || "Giá"}:{" "}
              <strong>{fmtVnd(t.value)} ₫/m³/{UNIT_SHORT[t.unit]}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SectionCard ────────────────────────────────────────────────────────────
function SectionCard({
  section,
  index,
  onChange,
  onRemove,
  onDuplicate,
}: {
  section: SectionDraft;
  index: number;
  onChange: (s: SectionDraft) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const upd = (field: keyof SectionDraft, val: unknown) =>
    onChange({ ...section, [field]: val });

  const hasInfo = section.capacity || section.temperatureMin;
  const firstTier = section.priceTiers.find((t) => t.value);

  return (
    <div className="border border-[var(--color-border)]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]"
        style={{ background: "var(--color-surface)" }}
      >
        <span
          className="flex items-center justify-center w-5 h-5 text-xs"
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        <span
          className="flex-1 text-sm"
          style={{ fontWeight: 600, color: "var(--color-text)" }}
        >
          {section.name || `Phân khu ${index + 1}`}
        </span>

        {/* Summary chips when collapsed */}
        {section.collapsed && hasInfo && (
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {section.capacity && (
              <span className="text-[10px] px-1.5 py-0.5 border border-[var(--color-border)]" style={{ color: "var(--color-text-muted)" }}>
                {parseInt(section.capacity).toLocaleString()} m³
              </span>
            )}
            {section.temperatureMin && (
              <span className="text-[10px] px-1.5 py-0.5 border border-[var(--color-border)]" style={{ color: "var(--color-text-muted)" }}>
                {section.temperatureMin}°C ~ {section.temperatureMax}°C
              </span>
            )}
            {firstTier && (
              <span className="text-[10px] px-1.5 py-0.5" style={{ border: "1px solid var(--color-primary)", color: "var(--color-primary)" }}>
                {fmtVnd(firstTier.value)} ₫/{UNIT_SHORT[firstTier.unit]}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            type="button"
            onClick={onDuplicate}
            title="Nhân bản phân khu này"
            className="p-1 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Xoá phân khu"
            className="p-1 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => upd("collapsed", !section.collapsed)}
            className="p-1 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            {section.collapsed
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!section.collapsed && (
        <div className="p-4 space-y-4">
          {/* Name + description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`sec-name-${section.id}`}>Tên phân khu *</Label>
              <Input
                id={`sec-name-${section.id}`}
                placeholder="Khu A – Đông lạnh"
                value={section.name}
                onChange={(e) => upd("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`sec-desc-${section.id}`}>Mô tả ngắn</Label>
              <Input
                id={`sec-desc-${section.id}`}
                placeholder="Hải sản, thịt đông..."
                value={section.description}
                onChange={(e) => upd("description", e.target.value)}
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
              <span className="text-xs uppercase tracking-wide" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Sức chứa
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`sec-cap-${section.id}`}>Tổng (m³) *</Label>
                <Input
                  id={`sec-cap-${section.id}`}
                  type="number"
                  placeholder="2000"
                  value={section.capacity}
                  onChange={(e) => upd("capacity", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`sec-avail-${section.id}`}>Còn trống (m³)</Label>
                <Input
                  id={`sec-avail-${section.id}`}
                  type="number"
                  placeholder="1500"
                  value={section.availableCapacity}
                  onChange={(e) => upd("availableCapacity", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="h-3.5 w-3.5" style={{ color: "var(--color-info)" }} />
              <span className="text-xs uppercase tracking-wide" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Nhiệt độ
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`sec-tmin-${section.id}`}>Tối thiểu (°C)</Label>
                <Input
                  id={`sec-tmin-${section.id}`}
                  type="number"
                  placeholder="-25"
                  value={section.temperatureMin}
                  onChange={(e) => upd("temperatureMin", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`sec-tmax-${section.id}`}>Tối đa (°C)</Label>
                <Input
                  id={`sec-tmax-${section.id}`}
                  type="number"
                  placeholder="-18"
                  value={section.temperatureMax}
                  onChange={(e) => upd("temperatureMax", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Price tiers for this section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} />
              <span className="text-xs uppercase tracking-wide" style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Giá thuê phân khu
              </span>
            </div>
            <PriceTierEditor
              tiers={section.priceTiers}
              onChange={(t) => upd("priceTiers", t)}
              showLabels={false}
            />
          </div>

          {/* Availability */}
          <div>
            <Label>Tình trạng phân khu</Label>
            <Select
              value={section.availability}
              onValueChange={(v) =>
                upd("availability", v as SectionDraft["availability"])
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="available">Còn trống</SelectItem>
                <SelectItem value="partially">Gần đầy</SelectItem>
                <SelectItem value="full">Đầy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function EditWarehouse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouse, setWarehouse] = useState<ColdStorage | null>(null);
  const loadedRef = useRef(false); // prevent re-loading when warehouseList changes

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    houseNumber: "",
    address: "",
    city: "",
    province: "",
    latitude: 10.7769,
    longitude: 106.7009,
    humidity: "",
    powerBackup: true,
    securityLevel: "medium" as "basic" | "medium" | "high",
    hasCertification: false,
    availability: "available" as "available" | "partially" | "full",
    status: "active" as "active" | "pending" | "inactive",
  });

  // ── Warehouse sections ─────────────────────────────────────────────────────
  const [sections, setSections] = useState<SectionDraft[]>([]);

  // ── Warehouse-level price tiers (purchasable by renters) ───────────────────
  const [warehouseTiers, setWarehouseTiers] = useState<PriceTierDraft[]>([mkTier("wh")]);

  // All warehouse images (URLs) — unified state for existing + newly uploaded
  const [warehouseImages, setWarehouseImages] = useState<string[]>([]);

  // Existing certifications on the warehouse (already saved)
  const [existingCerts, setExistingCerts] = useState<Certification[]>([]);
  // New cert files being added
  const [certFiles, setCertFiles] = useState<CertFile[]>([]);
  // Track which existing cert is currently uploading a replacement PDF
  const [uploadingCertId, setUploadingCertId] = useState<number | null>(null);

  // Geocoding state
  const [geocoding, setGeocoding] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [reverseDisplay, setReverseDisplay] = useState("");

  const updateField = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Leaflet map refs ──────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Stores coords to fly to once map is initialized
  const pendingFlyRef = useRef<[number, number] | null>(null);

  // ── Load warehouse ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || loadedRef.current) return;
    const load = async () => {
      try {
        // Fetch warehouse directly from API
        let data = null;
        try {
          data = await warehousesAPI.getById(id);
        } catch (apiErr) {
          console.warn("[EditWarehouse] API fetch failed:", apiErr);
        }
        if (!data) {
          toast.error("Không tìm thấy kho lạnh");
          navigate("/warehouse/my-warehouses");
          return;
        }
        setWarehouse(data);
        loadedRef.current = true;

        // Split address into houseNumber + street
        const parts = data.location.address.split(" ");
        const firstPart = parts[0] || "";
        const isHouseNum = /^\d+[a-zA-Z]?(\/\d+)?$/.test(firstPart);
        const houseNumber = isHouseNum ? firstPart : "";
        const street = isHouseNum ? parts.slice(1).join(" ") : data.location.address;

        setFormData({
          name: data.name,
          description: data.description,
          houseNumber,
          address: street,
          city: data.location.city,
          province: data.location.province,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          humidity: String(data.stats.humidity),
          powerBackup: data.stats.powerBackup,
          securityLevel: data.stats.securityLevel,
          hasCertification: data.hasCertification,
          availability: data.availability,
          status: data.status,
        });

        // Load sections from warehouse data
        const loadedSections: SectionDraft[] = (data.sections ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          capacity: String(s.capacity),
          availableCapacity: String(s.availableCapacity),
          temperatureMin: String(s.temperatureMin),
          temperatureMax: String(s.temperatureMax),
          priceTiers: (s.priceTiers ?? []).map((t) => ({
            id: t.id,
            label: t.label,
            value: String(t.value),
            unit: t.unit,
          })),
          availability: s.availability,
          collapsed: true, // start collapsed for readability
        }));
        setSections(loadedSections);

        // Load warehouse-level price tiers
        const loadedWhTiers: PriceTierDraft[] = (data.priceTiers ?? []).map((t) => ({
          id: t.id,
          label: t.label,
          value: String(t.value),
          unit: t.unit,
        }));
        setWarehouseTiers(loadedWhTiers.length > 0 ? loadedWhTiers : [mkTier("wh")]);

        setWarehouseImages(data.images ?? []);
        setExistingCerts(data.certifications ?? []);

        // Schedule map fly-to once map is ready
        pendingFlyRef.current = [data.location.latitude, data.location.longitude];
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView(pendingFlyRef.current, 15);
          markerRef.current.setLatLng(pendingFlyRef.current);
          pendingFlyRef.current = null;
        }
      } catch {
        toast.error("Lỗi tải dữ liệu kho lạnh");
        navigate("/warehouse/my-warehouses");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, navigate, warehouse]);

  // ── Reverse geocode ───────────────────────────────────────────────────────
  const performReverse = useCallback(async (lat: number, lng: number) => {
    setReversing(true);
    setReverseDisplay("");
    try {
      const result = await nominatimReverse(lat, lng);
      if (!result) {
        toast.warning("Không tìm thấy địa chỉ cho vị trí này");
        return;
      }
      const { houseNumber, road, district, prov } = parseAddress(
        result.address,
        result.display_name,
      );
      setFormData((prev) => ({
        ...prev,
        houseNumber: houseNumber || prev.houseNumber,
        address: road || prev.address,
        city: district || prev.city,
        province: matchProvince(prov) || prev.province,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
      }));
      setReverseDisplay(result.display_name);
      setLocationConfirmed(true);
    } catch {
      toast.error("Lỗi kết nối khi lấy địa chỉ từ toạ độ");
    } finally {
      setReversing(false);
    }
  }, []);

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerRef.current = L.marker([10.7769, 106.7009], {
      draggable: true,
      icon: createWarehouseIcon(),
    }).addTo(map);
    markerRef.current.bindPopup("Vị trí kho lạnh").openPopup();

    markerRef.current.on("dragend", () => {
      const { lat, lng } = markerRef.current!.getLatLng();
      performReverse(lat, lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      markerRef.current?.setLatLng([lat, lng]);
      performReverse(lat, lng);
    });

    mapRef.current = map;

    if (pendingFlyRef.current) {
      const [lat, lng] = pendingFlyRef.current;
      map.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      pendingFlyRef.current = null;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flyToCoords = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current.openPopup();
  }, []);

  // ── Forward geocode ────────────────────────────────────────────────────────
  const handleGeocode = async () => {
    const { houseNumber, address, city, province } = formData;
    if (!houseNumber && !address && !city && !province) {
      toast.error("Vui lòng nhập ít nhất địa chỉ, quận/huyện hoặc tỉnh/thành phố");
      return;
    }
    setGeocoding(true);
    setSearchResults([]);
    try {
      const results = await nominatimSearch(houseNumber, address, city, province);
      if (!results.length) {
        toast.error("Không tìm thấy vị trí — thử địa chỉ chi tiết hơn");
        return;
      }
      if (results.length === 1) {
        applyResult(results[0]);
      } else {
        setSearchResults(results);
      }
    } catch {
      toast.error("Lỗi kết nối đến Nominatim");
    } finally {
      setGeocoding(false);
    }
  };

  const applyResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const { road, district, prov } = parseAddress(r.address, r.display_name);
    setFormData((prev) => ({
      ...prev,
      houseNumber: prev.houseNumber,
      address: road || prev.address,
      city: district || prev.city,
      province: matchProvince(prov) || prev.province,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    }));
    setReverseDisplay(r.display_name);
    flyToCoords(lat, lng);
    setLocationConfirmed(true);
    setSearchResults([]);
    toast.success("Đã xác định vị trí — kéo ghim để tinh chỉnh");
  };

  // ── Cert file upload ──────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const pdfs = files.filter((f) => f.type === "application/pdf");
    if (pdfs.length !== files.length) toast.warning("Chỉ chấp nhận file PDF");
    setCertFiles((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ name: f.name, size: f.size, file: f })),
    ]);
    e.target.value = "";
  };
  const removeCertFile = (idx: number) =>
    setCertFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeExistingCert = (certId: number) =>
    setExistingCerts((prev) => prev.filter((c) => c.id !== certId));

  const handleReuploadCert = async (certId: number, file: File) => {
    if (file.type !== "application/pdf") {
      toast.warning("Chỉ chấp nhận file PDF");
      return;
    }
    setUploadingCertId(certId);
    try {
      const url = await storageAPI.uploadDoc(file);
      setExistingCerts((prev) =>
        prev.map((c) => (c.id === certId ? { ...c, documentUrl: url } : c)),
      );
      toast.success("Tải lên PDF thành công!");
    } catch (err: any) {
      console.error(`[EditWarehouse] Re-upload cert failed for ${certId}:`, err);
      toast.error(`Lỗi tải lên: ${err?.message || "Unknown error"}`);
    } finally {
      setUploadingCertId(null);
    }
  };

  const fmtSize = (bytes: number) =>
    bytes < 1_048_576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;

  // ── Section helpers ────────────────────────────────────────────────────────
  const addSection = () => setSections((prev) => [...prev, mkSection(prev.length)]);
  const updateSection = (idx: number, s: SectionDraft) =>
    setSections((prev) => prev.map((x, i) => (i === idx ? s : x)));
  const removeSection = (idx: number) =>
    setSections((prev) => prev.filter((_, i) => i !== idx));
  const duplicateSection = (idx: number) => {
    setSections((prev) => {
      const src = prev[idx];
      const copy: SectionDraft = {
        ...src,
        id: `sec-${Date.now()}-dup`,
        name: src.name ? `${src.name} (bản sao)` : "",
        priceTiers: src.priceTiers.map((t) => ({ ...t, id: `tier-${Date.now()}-${Math.random()}` })),
        collapsed: false,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  // ── Computed section totals ────────────────────────────────────────────────
  const sectionTotalCapacity = sections.reduce(
    (s, sec) => s + (parseInt(sec.capacity) || 0), 0,
  );
  const sectionAvailCapacity = sections.reduce(
    (s, sec) => s + (parseInt(sec.availableCapacity) || 0), 0,
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!formData.name.trim()) missing.push("Tên kho lạnh");
    if (!formData.city.trim()) missing.push("Quận/Huyện");
    if (!formData.province) missing.push("Tỉnh/Thành phố");
    if (missing.length > 0) {
      toast.error(`Vui lòng điền: ${missing.join(", ")}`);
      return;
    }

    if (sections.length === 0) {
      toast.error("Vui lòng thêm ít nhất một phân khu kho để xác định giá thuê và thông số kỹ thuật");
      return;
    }
    if (!sections.some((s) => s.priceTiers.some((t) => t.value))) {
      toast.error("Vui lòng nhập giá thuê cho ít nhất một phân khu");
      return;
    }
    if (!user || !id || !warehouse) return;

    const totalCap = sectionTotalCapacity;
    const availCap = sectionAvailCapacity;

    if (totalCap === 0) {
      toast.error("Vui lòng nhập sức chứa cho các phân khu (m³)");
      return;
    }

    // Derive overall temperature range from sections
    const overallTempMin = Math.min(...sections.map(s => parseFloat(s.temperatureMin) || 0));
    const overallTempMax = Math.max(...sections.map(s => parseFloat(s.temperatureMax) || 0));

    // Derive primary price from first filled section tier
    const primaryPrice = (() => {
      for (const s of sections) {
        const t = s.priceTiers.find((p) => p.value);
        if (t) {
          const v = parseInt(t.value) || 0;
          if (t.unit === "day")  return Math.round(v * 30);
          if (t.unit === "year") return Math.round(v / 12);
          return v;
        }
      }
      return warehouse.pricePerCubicMeter;
    })();

    setSaving(true);
    try {
      // Upload new certification PDFs to storage
      const certUploadResults: { name: string; url: string }[] = [];
      if (formData.hasCertification && certFiles.length > 0) {
        for (const cf of certFiles) {
          try {
            const url = await storageAPI.uploadDoc(cf.file);
            certUploadResults.push({ name: cf.name, url });
          } catch (err: any) {
            console.warn(`[EditWarehouse] Cert upload failed for ${cf.name}:`, err?.message);
          }
        }
      }

      const newCertsFromFiles: Certification[] = certFiles.map((f, i) => ({
        id: Date.now() + i,
        label: f.name.replace(/\.pdf$/i, ""),
        issuer: "Tự khai báo",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        documentUrl: certUploadResults.find(r => r.name === f.name)?.url,
      }));
      const updated: import("../../../types").ColdStorage = {
        ...warehouse,
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: {
          address: [formData.houseNumber, formData.address]
            .filter(Boolean)
            .join(" ") || formData.city,
          city: formData.city,
          province: formData.province,
          country: "Vietnam",
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        stats: {
          totalCapacity: totalCap,
          availableCapacity: availCap,
          temperatureMin: overallTempMin,
          temperatureMax: overallTempMax,
          humidity: parseInt(formData.humidity) || 80,
          powerBackup: formData.powerBackup,
          securityLevel: formData.securityLevel,
        },
        certifications: [...existingCerts, ...newCertsFromFiles],
        hasCertification: formData.hasCertification,
        pricePerCubicMeter: primaryPrice,
        priceTiers: warehouseTiers
          .filter((t) => t.value)
          .map((t) => ({
            id: t.id,
            label: t.label || "Giá thuê",
            value: parseInt(t.value) || 0,
            unit: t.unit,
          })),
        sections: sections.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          capacity: parseInt(s.capacity) || 0,
          availableCapacity: parseInt(s.availableCapacity) || 0,
          temperatureMin: parseFloat(s.temperatureMin) || 0,
          temperatureMax: parseFloat(s.temperatureMax) || 0,
          priceTiers: s.priceTiers
            .filter((t) => t.value)
            .map((t) => ({
              id: t.id,
              label: t.label || "Giá thuê",
              value: parseInt(t.value) || 0,
              unit: t.unit,
            })),
          availability: s.availability,
        })),
        availability: formData.availability,
        status: formData.status,
        images: warehouseImages.length > 0 ? warehouseImages : [],
        updatedAt: new Date().toISOString(),
      };

      console.log("[EditWarehouse] Submitting update for:", updated.id, updated.name);
      try {
        await warehousesAPI.update(updated.id, updated);
        console.log("[EditWarehouse] Update success:", updated.id);
        toast.success("Cập nhật kho lạnh thành công!");
        navigate("/warehouse/my-warehouses");
      } catch (err: any) {
        console.error("[EditWarehouse] warehousesAPI.update failed:", err);
        toast.error(`Lỗi cập nhật kho lạnh: ${err?.message ?? err}`);
        return;
      }
    } catch (err: any) {
      console.error("[EditWarehouse] Unexpected update error:", err);
      toast.error(`Lỗi cập nhật kho lạnh: ${err?.message ?? err}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[var(--color-bg-tertiary)] rounded w-64" />
            <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-96" />
            <div className="h-48 bg-[var(--color-bg-tertiary)] rounded" />
            <div className="h-80 bg-[var(--color-bg-tertiary)] rounded" />
            <div className="h-64 bg-[var(--color-bg-tertiary)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────��─────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/warehouse/my-warehouses")}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách kho
          </button>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }} className="mb-2">
            Chỉnh sửa kho lạnh
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Cập nhật thông tin cho{" "}
            <span style={{ fontWeight: 600 }}>{warehouse?.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Thông tin cơ bản ─────────────────────────────────────────── */}
          <Card className="bento-card p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên kho lạnh *</Label>
                <Input
                  id="name"
                  placeholder="Kho lạnh Cát Lái"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về kho lạnh..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Availability + Status row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="availability">Tình trạng trống</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(v: "available" | "partially" | "full") =>
                      updateField("availability", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="available">Còn trống</SelectItem>
                      <SelectItem value="partially">Gần đầy</SelectItem>
                      <SelectItem value="full">Đã đầy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Trạng thái hoạt động</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: "active" | "pending" | "inactive") =>
                      updateField("status", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="inactive">Tạm ngừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security & Power */}
              <div className="border-t border-[var(--color-border)] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4" style={{ color: "var(--color-warning)" }} />
                  <span className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                    Bảo mật & Tiện ích kho
                  </span>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <div style={{ minWidth: 180 }}>
                    <Label htmlFor="securityLevel">Mức độ bảo mật</Label>
                    <Select
                      value={formData.securityLevel}
                      onValueChange={(v: "basic" | "medium" | "high") => updateField("securityLevel", v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="basic">Cơ bản</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <Label htmlFor="humidity">Độ ẩm (%)</Label>
                    <Input
                      id="humidity"
                      type="number"
                      placeholder="85"
                      value={formData.humidity}
                      onChange={(e) => updateField("humidity", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-0.5">
                    <Checkbox
                      id="powerBackup"
                      checked={formData.powerBackup}
                      onCheckedChange={(v) => updateField("powerBackup", v)}
                    />
                    <Label htmlFor="powerBackup" className="cursor-pointer flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" style={{ color: "var(--color-warning)" }} />
                      Có dự phòng điện
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Vị trí + Bản đồ ─────────────────────────────────────────── */}
          <Card className="bento-card p-6">
            <h2 className="text-xl font-semibold mb-4">Vị trí</h2>
            <div className="space-y-4">
              {/* Province + City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Tỉnh/Thành phố *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(v) => {
                      updateField("province", v);
                      setLocationConfirmed(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tỉnh/thành phố" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {vietnamProvinces.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">Quận/Huyện *</Label>
                  <Input
                    id="city"
                    placeholder="Quận 7"
                    value={formData.city}
                    onChange={(e) => {
                      updateField("city", e.target.value);
                      setLocationConfirmed(false);
                    }}
                    required
                  />
                </div>
              </div>

              {/* House number + Street */}
              <div className="flex gap-3">
                <div className="w-28 shrink-0">
                  <Label htmlFor="houseNumber">Số nhà</Label>
                  <Input
                    id="houseNumber"
                    placeholder="123"
                    value={formData.houseNumber}
                    onChange={(e) => {
                      updateField("houseNumber", e.target.value);
                      setLocationConfirmed(false);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="address">Tên đường <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(tuỳ chọn)</span></Label>
                  <Input
                    id="address"
                    placeholder="Đường Cát Lái — có thể để trống nếu dùng bản đồ"
                    value={formData.address}
                    onChange={(e) => {
                      updateField("address", e.target.value);
                      setLocationConfirmed(false);
                      setSearchResults([]);
                    }}
                  />
                </div>
              </div>

              {/* Search button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding || reversing}
                  className="flex items-center gap-2 text-sm border border-[var(--color-border)] px-4 py-2 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
                >
                  {geocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {geocoding ? "Đang tìm..." : "Tìm vị trí trên bản đồ"}
                </button>
                {locationConfirmed && !geocoding && !reversing && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: "var(--color-success)" }}>
                    <CheckCircle2 className="h-4 w-4" /> Đã xác nhận
                  </span>
                )}
                {reversing && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lấy địa chỉ...
                  </span>
                )}
              </div>

              {/* Result picker */}
              {searchResults.length > 1 && (
                <div className="border border-[var(--color-border)]">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Tìm thấy {searchResults.length} kết quả — chọn vị trí đúng:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchResults([])}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ul className="divide-y divide-[var(--color-border)] max-h-52 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <li key={r.place_id}>
                        <button
                          type="button"
                          onClick={() => applyResult(r)}
                          className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-primary)] hover:text-white transition-colors group"
                        >
                          <span className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[var(--color-text-muted)] group-hover:text-white" />
                            <span>
                              <span className="text-xs font-medium block">
                                {i + 1}. {r.display_name}
                              </span>
                              <span className="text-[10px] text-[var(--color-text-muted)] group-hover:text-white/70 font-mono">
                                {parseFloat(r.lat).toFixed(5)},{" "}
                                {parseFloat(r.lon).toFixed(5)}
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Map */}
              <div className="border border-[var(--color-border)]">
                <div className="bg-[var(--color-bg)] px-3 py-2 border-b border-[var(--color-border)] flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  Nhấn vào bản đồ hoặc kéo ghim — địa chỉ sẽ tự điền qua Nominatim Reverse
                </div>
                <div ref={mapContainerRef} style={{ height: 320 }} />
                <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)] px-3 py-2 space-y-1">
                  <div className="flex gap-4">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Vĩ độ: <code className="font-mono">{formData.latitude}</code>
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Kinh độ: <code className="font-mono">{formData.longitude}</code>
                    </span>
                    {reversing && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <Loader2 className="h-3 w-3 animate-spin" /> reverse geocoding...
                      </span>
                    )}
                  </div>
                  {reverseDisplay && !reversing && (
                    <p className="text-xs flex items-start gap-1" style={{ color: "var(--color-text-secondary)" }}>
                      <RotateCcw className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: "var(--color-info)" }} />
                      <span className="truncate">{reverseDisplay}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Phân khu (Sections) — mirrors AddWarehouse ───────────────── */}
          <Card className="bento-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-xl font-semibold">Phân khu kho</h2>
              <span className="text-xs border border-[var(--color-error)] px-2 py-0.5" style={{ color: "var(--color-error)" }}>
                Bắt buộc
              </span>
              {sections.length > 0 && (
                <span className="text-xs px-2 py-0.5" style={{ color: "var(--color-primary)", border: "1px solid var(--color-primary)" }}>
                  {sections.length} phân khu
                </span>
              )}
            </div>
            <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Mỗi phân khu có nhiệt độ, sức chứa và giá thuê riêng. Thống số tổng kho sẽ được tính tự động từ các phân khu.
            </p>

            {sections.length === 0 && (
              <div className="border-2 border-dashed border-[var(--color-error)] px-6 py-8 flex flex-col items-center gap-3 my-4" style={{ opacity: 0.8 }}>
                <LayoutGrid className="h-8 w-8" style={{ color: "var(--color-error)", opacity: 0.5 }} />
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Chưa có phân khu — nhấn nút bên dưới để thêm
                </p>
              </div>
            )}

            {sections.length > 0 && (
              <div className="space-y-3 mt-2">
                {sections.map((sec, idx) => (
                  <SectionCard
                    key={sec.id}
                    section={sec}
                    index={idx}
                    onChange={(s) => updateSection(idx, s)}
                    onRemove={() => removeSection(idx)}
                    onDuplicate={() => duplicateSection(idx)}
                  />
                ))}
              </div>
            )}

            {/* Section capacity summary */}
            {sections.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border border-[var(--color-border)] px-4 py-3">
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Tổng công suất</p>
                  <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "1.1rem" }}>
                    {sectionTotalCapacity.toLocaleString()} <span className="text-sm font-normal" style={{ color: "var(--color-text-secondary)" }}>m³</span>
                  </p>
                </div>
                <div className="border border-[var(--color-border)] px-4 py-3">
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Còn trống</p>
                  <p style={{ fontWeight: 700, color: "var(--color-success)", fontSize: "1.1rem" }}>
                    {sectionAvailCapacity.toLocaleString()} <span className="text-sm font-normal" style={{ color: "var(--color-text-secondary)" }}>m³</span>
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addSection}
              className="mt-4 flex items-center gap-2 text-sm px-4 py-2.5 border-2 border-dashed transition-colors w-full justify-center"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-primary)"; }}
            >
              <Plus className="h-4 w-4" />
              Thêm phân khu
            </button>
          </Card>

          {/* ── Gói giá thuê (Warehouse-level tiers) ──────────────────────── */}
          <Card className="bento-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-5 w-5 text-[var(--color-success)]" />
              <h2 className="text-xl font-semibold">Gói giá thuê</h2>
              {warehouseTiers.filter(t => t.value).length > 0 && (
                <span className="text-xs px-2 py-0.5" style={{ color: "var(--color-success)", border: "1px solid var(--color-success)" }}>
                  {warehouseTiers.filter(t => t.value).length} gói
                </span>
              )}
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
              Tạo các gói giá thuê mà người thuê có thể lựa chọn khi gửi yêu cầu thuê. Ví dụ: Gói Cơ bản, Gói Tiêu chuẩn, Gói Cao cấp.
            </p>

            <div className="flex items-start gap-2 mb-4 bg-[var(--color-bg-secondary)] px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-[var(--color-info)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Gói giá thuê giúp người thuê dễ dàng so sánh và chọn mức giá phù hợp. Mỗi gói bao gồm tên gói, giá tiền (VND/m³) và đơn vị thời gian. Bạn có thể tạo nhiều gói với các mức giá khác nhau.
              </p>
            </div>

            <PriceTierEditor
              tiers={warehouseTiers}
              onChange={setWarehouseTiers}
              showLabels={true}
            />
          </Card>

          {/* ── Chứng chỉ ────────────────────────────────────────────────── */}
          <Card className="bento-card p-6">
            <h2 className="text-xl font-semibold mb-4">Chứng chỉ</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasCertification"
                  checked={formData.hasCertification}
                  onCheckedChange={(v) => updateField("hasCertification", v)}
                />
                <Label htmlFor="hasCertification" className="cursor-pointer">
                  Kho lạnh có chứng chỉ
                </Label>
              </div>

              {!formData.hasCertification && (
                <div className="flex items-start gap-3 border-l-4 border-[var(--color-warning)] px-4 py-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-warning)" }} />
                  <div className="text-sm">
                    <p style={{ fontWeight: 600 }} className="mb-0.5">Cảnh báo</p>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                      Kho không có chứng chỉ sẽ hiển thị cảnh báo cho người thuê và có thể ảnh hưởng đến khả năng cho thuê.
                    </p>
                  </div>
                </div>
              )}

              {formData.hasCertification && (
                <div className="space-y-3">
                  {/* Existing certifications */}
                  {existingCerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
                        Chứng chỉ hiện có
                      </p>
                      {existingCerts.map((cert) => {
                        const expiry = new Date(cert.expiryDate);
                        const now = new Date();
                        const daysLeft = Math.ceil(
                          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                        );
                        const isExpired = daysLeft < 0;
                        const isExpiringSoon = daysLeft >= 0 && daysLeft < 90;
                        return (
                          <div
                            key={cert.id}
                            className={`flex items-center gap-3 border px-3 py-2.5 ${
                              isExpired
                                ? "border-[var(--color-error)]"
                                : isExpiringSoon
                                  ? "border-[var(--color-warning)]"
                                  : "border-[var(--color-border)]"
                            }`}
                          >
                            <FileText
                              className="h-5 w-5 flex-shrink-0"
                              style={{
                                color: isExpired
                                  ? "var(--color-error)"
                                  : isExpiringSoon
                                    ? "var(--color-warning)"
                                    : "var(--color-success)",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{cert.label}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5">
                                {cert.issuer && (
                                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    {cert.issuer}
                                  </span>
                                )}
                                {cert.expiryDate && (
                                  <span
                                    className="flex items-center gap-1 text-xs"
                                    style={{
                                      color: isExpired
                                        ? "var(--color-error)"
                                        : isExpiringSoon
                                          ? "var(--color-warning)"
                                          : "var(--color-text-muted)",
                                    }}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {isExpired
                                      ? "Hết hạn"
                                      : isExpiringSoon
                                        ? `Còn ${daysLeft} ngày`
                                        : `HH: ${new Date(cert.expiryDate).toLocaleDateString("vi-VN")}`}
                                  </span>
                                )}
                                {cert.documentUrl && (
                                  <a
                                    href={cert.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs hover:underline"
                                    style={{ color: "var(--color-primary)" }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Xem PDF
                                  </a>
                                )}
                                {!cert.documentUrl && uploadingCertId !== cert.id && (
                                  <span className="text-xs px-1.5 py-0.5 border border-amber-300 text-amber-600 bg-amber-50">
                                    Thiếu file PDF
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Re-upload / Upload PDF button */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {uploadingCertId === cert.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary)" }} />
                              ) : (
                                <label
                                  className="flex items-center gap-1 text-xs px-2 py-1 border border-dashed cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                  style={{
                                    borderColor: cert.documentUrl ? "var(--color-border)" : "var(--color-warning)",
                                    color: cert.documentUrl ? "var(--color-text-muted)" : "var(--color-warning)",
                                  }}
                                  title={cert.documentUrl ? "Thay thế file PDF" : "Tải lên file PDF"}
                                >
                                  <Upload className="h-3 w-3" />
                                  {cert.documentUrl ? "Thay PDF" : "Tải PDF"}
                                  <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleReuploadCert(cert.id, f);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              )}
                              <button
                                type="button"
                                onClick={() => removeExistingCert(cert.id)}
                                className="transition-colors"
                                style={{ color: "var(--color-text-muted)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                                title="Xóa chứng chỉ"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload new cert PDFs */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] px-6 py-6 flex flex-col items-center gap-2 transition-colors group"
                  >
                    <Upload className="h-6 w-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                      Tải lên chứng chỉ mới (PDF)
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Chỉ chấp nhận .pdf · Tối đa 10 MB mỗi file
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {certFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
                        File mới sẽ được thêm
                      </p>
                      {certFiles.map((cf, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 border border-[var(--color-border)] px-3 py-2.5"
                        >
                          <FileText className="h-5 w-5 flex-shrink-0" style={{ color: "var(--color-error)" }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{cf.name}</p>
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                              {fmtSize(cf.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCertFile(i)}
                            className="transition-colors"
                            style={{ color: "var(--color-text-muted)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* ── Hình ảnh ──────────────────────────────────────────────────── */}
          <Card className="bento-card p-6">
            <ImageUploader
              value={warehouseImages}
              onChange={setWarehouseImages}
              maxFiles={6}
              disabled={saving}
            />
          </Card>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/warehouse/my-warehouses")}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
