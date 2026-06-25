import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { CompositeWarehouse } from "../../../types";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { vietnamProvinces } from "../../../data/mockWarehouses";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nominatimSearch, parseAddress, createWarehouseIcon, nominatimReverse } from "./WarehouseFormUtils";
import { toast } from "sonner";

interface Props {
  warehouse: CompositeWarehouse;
  onChange: (updates: Partial<CompositeWarehouse>) => void;
}

const HCMC_CENTER: [number, number] = [10.8231, 106.6297];

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function LocationMarker({ position, onDragEnd }: { position: L.LatLngExpression; onDragEnd: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const icon = createWarehouseIcon();

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  }), [onDragEnd]);
  // @ts-ignore - Leaflet types might clash
  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    />
  );
}

export function WarehouseFormLocation({ warehouse, onChange }: Props) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(HCMC_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [ward, setWard] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [provincesData, setProvincesData] = useState<any[]>([]);
  const [quanhuyenData, setQuanhuyenData] = useState<any[]>([]);
  const [xaphuongData, setXaphuongData] = useState<any[]>([]);

  useEffect(() => {
    import("../../MapData/sapnhap-bando-vn.json").then((module) => {
      const data = (module.default || module) as any[];
      setProvincesData(data.filter((d: any) => d.kind === "province"));
      setQuanhuyenData(data.filter((d: any) => d.kind === "district"));
      setXaphuongData(data.filter((d: any) => d.kind === "commune"));
    }).catch(e => console.error("Failed to load map data", e));
  }, []);

  const provinceNames = useMemo(() => Array.from(new Set([...vietnamProvinces, ...provincesData.map(p => p.ten)])).sort(), [provincesData]);

  const filteredQuanhuyen = useMemo(() => {
    if (!warehouse.location_province) return [];
    const provMatch = warehouse.location_province
      .toLowerCase().replace(/^(thành phố|tỉnh|thủ đô)\s+/i, "").trim();
    return Array.from(new Set(
      quanhuyenData
        .filter(d => d.parent_ten && d.parent_ten.toLowerCase().includes(provMatch))
        .map(d => d.ten_short || d.ten)
    )).sort();
  }, [quanhuyenData, warehouse.location_province]);

  const filteredXaphuong = useMemo(() => {
    const wardNorm = ward
      ? ward.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, "").trim()
      : "";

    return Array.from(new Set(
      xaphuongData
        .filter(c => {
          const cNameNorm = (c.ten_short || c.ten || "")
            .toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, "").trim();

          const nameMatches = !wardNorm || cNameNorm.includes(wardNorm) || wardNorm.includes(cNameNorm);

          // If district is filled, only show communes of that district
          const districtNorm = (warehouse.location_commune || "")
            .toLowerCase().replace(/^(quận|huyện|thành phố|tỉnh|thị xã|thị trấn)\s+/i, "").trim();
          const parentNorm = (c.parent_ten || "")
            .toLowerCase().replace(/^(quận|huyện|thành phố|tỉnh|thị xã|thị trấn)\s+/i, "").trim();
          const districtMatches = !districtNorm || parentNorm === districtNorm;

          return nameMatches && districtMatches;
        })
        .map(c => c.ten_short || c.ten)
    )).sort();
  }, [xaphuongData, ward, warehouse.location_commune]);

  const normalizeProvince = (name: string) => {
    if (!name) return "";
    const normalized = name.replace(/^(Thành phố|Tỉnh|Thủ đô)\s+/i, '').trim();
    const match = vietnamProvinces.find(p => p.toLowerCase() === normalized.toLowerCase() || p.toLowerCase().includes(normalized.toLowerCase()) || normalized.toLowerCase().includes(p.toLowerCase()));
    return match || name;
  };

  const isWardPrefix = (v: string) => /^(xã|phường|thị trấn)\s+/i.test(v);

  const handleWardChange = (val: string) => {
    setWard(val);
    const combined = [houseNumber, street, val].filter(Boolean).join(", ");
    updateLocationField("address", combined);

    // If user picks a commune from the dropdown, auto-fill the district from parent_ten
    if (val) {
      const found = xaphuongData.find(c => (c.ten_short || c.ten) === val);
      if (found?.parent_ten) {
        updateLocationField("location_commune", found.parent_ten);
      }
    }

    handleInputSearch(combined, warehouse.location_commune || "", warehouse.location_province || "");
  };

  const handleDistrictChange = (val: string) => {
    updateLocationField("location_commune", val);
    handleInputSearch(warehouse.address || "", val, warehouse.location_province || "");
  };

  // Sync: if location_commune arrives with a ward/commune prefix (from backend/search),
  // redirect it to the ward input and clear the district field.
  useEffect(() => {
    const v = warehouse.location_commune;
    if (v && isWardPrefix(v)) {
      setWard(v);
      updateLocationField("location_commune", "");
    }
  }, [warehouse.location_commune]);

  // Sync: if province changes and the current ward no longer belongs to the new district,
  // clear the ward field.
  useEffect(() => {
    const v = warehouse.location_commune;
    if (!v) return;
    const found = xaphuongData.find(c => (c.ten_short || c.ten) === ward);
    if (found && found.parent_ten !== v) {
      setWard("");
    }
  }, [warehouse.location_commune, xaphuongData, ward]);

  const handleInputSearch = (addressStr: string, quanhuyen: string, province: string) => {
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(async () => {
      if (addressStr || quanhuyen || province) {
        try {
          const results = await nominatimSearch("", addressStr, quanhuyen, province);
          if (results && results.length > 0) {
            const best = results[0];
            const lat = parseFloat(best.lat);
            const lon = parseFloat(best.lon);
            setMapCenter([lat, lon]);
            setMapZoom(17);
            onChange({ location_lat: lat, location_long: lon });
          }
        } catch (err) {
          // Silent
        }
      }
    }, 800));
  };

  const updateLocationField = (key: keyof CompositeWarehouse, val: any) => {
    onChange({ [key]: val });
  };

  useEffect(() => {
    if (warehouse.location_lat && warehouse.location_long) {
      setMapCenter([warehouse.location_lat, warehouse.location_long]);
      setMapZoom(16);
    }
  }, [warehouse.location_lat, warehouse.location_long]);

  useEffect(() => {
    if (warehouse.address && !houseNumber && !street && !ward) {
      const parts = warehouse.address.split(",").map(p => p.trim());
      if (parts.length > 0) {
        if (parts.length >= 3) {
          setHouseNumber(parts[0]);
          setWard(parts[parts.length - 1]);
          setStreet(parts.slice(1, -1).join(", "));
        } else if (parts.length === 2) {
          if (/^\d/i.test(parts[0]) || /^s[ốo]\s*\d/i.test(parts[0]) || /^l[ôo]\s*[a-z0-9]/i.test(parts[0])) {
            setHouseNumber(parts[0]);
            setStreet(parts[1]);
          } else {
            setStreet(parts[0]);
            setWard(parts[1]);
          }
        } else {
          setStreet(warehouse.address);
        }
      }
    }
  }, [warehouse.address]);

  const handleSearchLocation = async () => {
    setSearchingLocation(true);
    try {
      const results = await nominatimSearch(
        "",
        warehouse.address || "",
        warehouse.location_commune || "",
        warehouse.location_province || ""
      );

      console.log("[Map Search Results]:", results);

      if (results && results.length > 0) {
        const best = results[0];
        const lat = parseFloat(best.lat);
        const lon = parseFloat(best.lon);

        const parsed = parseAddress(best.address, best.display_name);
        setHouseNumber(parsed.houseNumber || "");
        setStreet(parsed.street || "");
        setWard(parsed.ward || "");

        setMapCenter([lat, lon]);
        setMapZoom(17);

        onChange({
          location_lat: lat,
          location_long: lon,
          location_address_text: best.display_name,
          location_province: normalizeProvince(parsed.city || warehouse.location_province),
          location_commune: parsed.district || parsed.ward || warehouse.location_commune,
          address: [parsed.houseNumber, parsed.street, parsed.ward].filter(Boolean).join(", "),
        });

        toast.success("Đã tìm thấy vị trí");
      } else {
        toast.error("Không tìm thấy địa chỉ này trên bản đồ. Vui lòng thử nhấp trực tiếp lên bản đồ.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tìm kiếm địa chỉ");
    } finally {
      setSearchingLocation(false);
    }
  };

  const handlePinDrop = async (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
    onChange({ location_lat: lat, location_long: lon });

    try {
      const data = await nominatimReverse(lat, lon);

      console.log("[Map Pin Drop Result]:", {
        lat, lon,
        reverseGeocodeData: data
      });

      let newAddressText = data?.display_name || "";
      let newProvince = warehouse.location_province;
      let newQuanhuyen = warehouse.location_commune;
      let newAddress = warehouse.address;

      if (data) {
        const parsed = parseAddress(data.address, data.display_name);
        newProvince = normalizeProvince(parsed.city || newProvince);
        newQuanhuyen = parsed.district || parsed.ward || newQuanhuyen;
        newAddress = [parsed.houseNumber, parsed.street, parsed.ward].filter(Boolean).join(", ");

        setHouseNumber(parsed.houseNumber || "");
        setStreet(parsed.street || "");
        setWard(parsed.ward || "");

        onChange({
          location_address_text: newAddressText,
          location_province: newProvince,
          location_commune: newQuanhuyen,
          address: newAddress,
        });

        if (parsed.district || parsed.city) {
          toast.success(`Xác định được khu vực: ${parsed.district ? parsed.district + ", " : ""}${parsed.city || newProvince}`);
        } else {
          toast.success("Đã thả ghim vị trí.");
        }
      }

    } catch (err) {
      console.error("Geocoding error:", err);
      toast.error("Lỗi khi lấy thông tin vị trí.");
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        handlePinDrop(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const handleClearLocation = () => {
    setHouseNumber("");
    setStreet("");
    setWard("");
    setMapCenter(HCMC_CENTER);
    setMapZoom(13);
    onChange({
      location_lat: undefined as any,
      location_long: undefined as any,
      location_address_text: "",
      location_province: "",
      location_commune: "",
      address: "",
    });
  };

  return (
    <Card className="bento-card p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        Vị trí & Bản đồ
      </h2>

      <div className="flex flex-col gap-6 mb-6">
        {/* Row 1: Số nhà | Đường | Khu phố */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="houseNumber">Số nhà/Ngõ<span className="text-red-500">*</span></Label>
            <Input
              id="houseNumber"
              placeholder="VD: 123A"
              required
              value={houseNumber}
              onChange={(e) => {
                const val = e.target.value;
                setHouseNumber(val);
                const combined = [val, street, ward].filter(Boolean).join(", ");
                updateLocationField("address", combined);
                handleInputSearch(combined, warehouse.location_commune || "", warehouse.location_province || "");
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="street">Đường<span className="text-red-500">*</span></Label>
            <Input
              id="street"
              placeholder="VD: Nguyễn Văn Linh"
              value={street}
              required
              onChange={(e) => {
                const val = e.target.value;
                setStreet(val);
                const combined = [houseNumber, val, ward].filter(Boolean).join(", ");
                updateLocationField("address", combined);
                handleInputSearch(combined, warehouse.location_commune || "", warehouse.location_province || "");
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="xaphuong"> Xã / Phường <span className="text-red-500">*</span></Label>
            <Input
              id="xaphuong"
              list="xaphuong-list"
              placeholder="VD: Phường Tây Thạnh, Xã Bình Hưng"
              value={ward}
              required
              onChange={(e) => handleWardChange(e.target.value)}
              className="mt-1"
            />
            <datalist id="xaphuong-list">
              {filteredXaphuong.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Row 2: Quận/Huyện | Tỉnh/Thành phố */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quanhuyen">Quận/Huyện/Thành phố trực thuộc thành phố</Label>
            <Input
              id="quanhuyen"
              list="quanhuyen-list"
              placeholder="VD: Quận Tân Phú, Huyện Cái Bè"
              value={warehouse.location_commune || ""}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="mt-1"
            />
            <datalist id="quanhuyen-list">
              {filteredQuanhuyen.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="province">Tỉnh/Thành phố <span className="text-red-500">*</span></Label>
            <Input
              id="province"
              list="provinces-list"
              placeholder="VD: Thành phố Hồ Chí Minh"
              value={warehouse.location_province || ""}
              required
              onChange={(e) => {
                updateLocationField("location_province", e.target.value);
                updateLocationField("location_commune", "");
                handleInputSearch(warehouse.address || "", "", e.target.value);
              }}
              className="mt-1"
            />
            <datalist id="provinces-list">
              {provinceNames.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={handleClearLocation}>
            Xóa trắng
          </Button>
          <Button type="button" onClick={handleSearchLocation} disabled={searchingLocation}>
            {searchingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {searchingLocation ? "Đang tìm kiếm..." : "Tìm vị trí trên bản đồ"}
          </Button>
        </div>

        {/* Pinned address preview */}
        {warehouse.location_address_text && (
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
            <Label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Địa chỉ được ghim:</Label>
            <p className="text-sm font-medium">
              {[houseNumber, street, ward, warehouse.location_commune, warehouse.location_province].filter(Boolean).join(", ") || warehouse.location_address_text}
            </p>
          </div>
        )}

        {/* Map */}
        <div className="h-[500px] w-full rounded-xl overflow-hidden border-2 border-[var(--color-border)] relative">
          {/* @ts-ignore */}
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
          >
            {/* @ts-ignore */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapEvents />
            {warehouse.location_lat && warehouse.location_long && (
              <LocationMarker
                position={[warehouse.location_lat, warehouse.location_long]}
                onDragEnd={handlePinDrop}
              />
            )}
          </MapContainer>
          <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur text-xs p-2 rounded-lg shadow-sm border border-black/10 text-center pointer-events-none">
            Kéo thả ghim hoặc nhấp vào bản đồ để chọn chính xác vị trí kho lạnh
          </div>
        </div>
      </div>
    </Card>
  );
}
