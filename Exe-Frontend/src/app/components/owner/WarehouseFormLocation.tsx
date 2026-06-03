import { useState, useRef, useCallback, useEffect } from "react";
import { CompositeWarehouse } from "../../../types";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
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
  
  const eventHandlers = useCallback({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  }, [onDragEnd]);

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

  const updateLocationField = (key: keyof CompositeWarehouse, val: any) => {
    onChange({ [key]: val });
  };

  useEffect(() => {
    if (warehouse.location_lat && warehouse.location_long) {
      setMapCenter([warehouse.location_lat, warehouse.location_long]);
      setMapZoom(16);
    }
    if (warehouse.address) {
      const parts = warehouse.address.split(" ");
      if (parts.length > 0) {
        if (/^\d/.test(parts[0])) {
          setHouseNumber(parts[0]);
          setStreet(parts.slice(1).join(" "));
        } else {
          setStreet(warehouse.address);
        }
      }
    }
  }, [warehouse.location_lat, warehouse.location_long, warehouse.address]);

  const handleSearchLocation = async () => {
    setSearchingLocation(true);
    try {
      const results = await nominatimSearch(
        houseNumber,
        street,
        warehouse.location_commune || "",
        warehouse.location_province || ""
      );

      if (results && results.length > 0) {
        const best = results[0];
        const lat = parseFloat(best.lat);
        const lon = parseFloat(best.lon);

        const parsed = parseAddress(best.address, best.display_name);
        if (parsed.houseNumber) setHouseNumber(parsed.houseNumber);
        if (parsed.street) setStreet(parsed.street);

        setMapCenter([lat, lon]);
        setMapZoom(17);
        
        onChange({
          location_lat: lat,
          location_long: lon,
          location_address_text: best.display_name,
          location_province: parsed.city || warehouse.location_province,
          location_commune: parsed.district || warehouse.location_commune,
          address: `${parsed.houseNumber ? parsed.houseNumber + " " : ""}${parsed.street}`,
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
      if (data) {
        const parsed = parseAddress(data.address, data.display_name);
        onChange({
          location_address_text: data.display_name,
          location_province: parsed.city || warehouse.location_province,
          location_commune: parsed.district || warehouse.location_commune,
          address: `${parsed.houseNumber ? parsed.houseNumber + " " : ""}${parsed.street}`,
        });
        if (parsed.houseNumber) setHouseNumber(parsed.houseNumber);
        if (parsed.street) setStreet(parsed.street);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
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

  return (
    <Card className="bento-card p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        Vị trí & Bản đồ
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label htmlFor="houseNumber">Số nhà/Ngõ</Label>
              <Input
                id="houseNumber"
                placeholder="VD: 123A"
                value={houseNumber}
                onChange={(e) => {
                  setHouseNumber(e.target.value);
                  updateLocationField("address", `${e.target.value} ${street}`.trim());
                }}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="street">Đường/Phố</Label>
              <Input
                id="street"
                placeholder="VD: Nguyễn Văn Linh"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  updateLocationField("address", `${houseNumber} ${e.target.value}`.trim());
                }}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="province">Tỉnh/Thành phố</Label>
            <Select
              value={warehouse.location_province || ""}
              onValueChange={(val) => updateLocationField("location_province", val)}
            >
              <SelectTrigger id="province" className="mt-1">
                <SelectValue placeholder="Chọn Tỉnh/Thành phố" />
              </SelectTrigger>
              <SelectContent>
                {vietnamProvinces.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="commune">Quận/Huyện</Label>
            <Input
              id="commune"
              placeholder="VD: Quận 7"
              value={warehouse.location_commune || ""}
              onChange={(e) => updateLocationField("location_commune", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Mã bưu chính (Tùy chọn)</Label>
            <Input
              id="postalCode"
              placeholder="VD: 700000"
              value={warehouse.location_postal_code || ""}
              onChange={(e) => updateLocationField("location_postal_code", e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleSearchLocation}
            disabled={searchingLocation}
          >
            {searchingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {searchingLocation ? "Đang tìm kiếm..." : "Tìm vị trí trên bản đồ"}
          </Button>
          {warehouse.location_address_text && (
            <div className="mt-2 p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
              <Label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Địa chỉ được ghim:</Label>
              <p className="text-sm font-medium">{warehouse.location_address_text}</p>
            </div>
          )}
        </div>

        <div className="h-[400px] rounded-xl overflow-hidden border-2 border-[var(--color-border)] relative">
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
