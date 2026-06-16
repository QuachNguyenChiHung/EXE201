import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";
import { createWarehouseIcon, nominatimReverse, parseAddress } from "./WarehouseFormUtils";

interface Props {
  lat: number;
  long: number;
  addressText?: string;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export function WarehouseMapDisplay({ lat, long, addressText }: Props) {
  const center: [number, number] = [lat, long];
  const icon = createWarehouseIcon();
  
  const [displayAddress, setDisplayAddress] = useState<string>(addressText || "");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

      const resolveExactAddress = async () => {
      setLoadingAddress(true);
      try {
        const data = await nominatimReverse(lat, long);
        
        let streetAddress = "";
        let newProvince = "";
        let newCommune = "";

        if (data) {
          const parsed = parseAddress(data.address, data.display_name);
          streetAddress = `${parsed.houseNumber ? parsed.houseNumber + " " : ""}${parsed.street}`.trim();
          newProvince = parsed.city || "";
          newCommune = parsed.district || "";
        }

        if (newProvince || newCommune || streetAddress) {
          const exactText = [streetAddress, newCommune, newProvince]
            .filter(Boolean)
            .join(", ");
            
          if (isMounted) setDisplayAddress(exactText);
        } else {
          // Fallback if nothing found
          if (isMounted && data?.display_name) {
            setDisplayAddress(data.display_name);
          }
        }
      } catch (error) {
        console.error("Failed to resolve exact address:", error);
      } finally {
        if (isMounted) setLoadingAddress(false);
      }
    };

    resolveExactAddress();

    return () => {
      isMounted = false;
    };
  }, [lat, long]);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-[var(--color-primary)]" />
        Vị trí trên bản đồ
      </h3>
      
      {loadingAddress ? (
        <p className="text-sm text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang xác định địa chỉ chính xác...
        </p>
      ) : displayAddress ? (
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {displayAddress}
        </p>
      ) : null}

      <div className="h-[350px] rounded-xl overflow-hidden border-2 border-[var(--color-border)] relative">
        {/* @ts-ignore */}
        <MapContainer
          center={center}
          zoom={16}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          scrollWheelZoom={false}
        >
          {/* @ts-ignore */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={center} zoom={16} />
          {/* @ts-ignore */}
          <Marker position={center} icon={icon} />
        </MapContainer>
      </div>
    </div>
  );
}
