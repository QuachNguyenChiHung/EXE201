import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths broken by bundlers (Vite: use `?url` to get asset URL)
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';

// Override the default icon once at module level
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  center: [number, number];
  markers?: Array<{
    position: [number, number];
    popup?: string;
  }>;
  route?: [number, number][];
  zoom?: number;
  height?: string;
}

export function MapComponent({
  center,
  markers = [],
  route,
  zoom = 13,
  height = '400px',
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center / zoom when props change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markers.forEach(({ position, popup }) => {
      const marker = L.marker(position);
      if (popup) marker.bindPopup(popup);
      marker.addTo(markersLayerRef.current!);
    });
  }, [markers]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (route && route.length > 0) {
      const polyline = L.polyline(route, {
        color: getComputedStyle(document.documentElement)
          .getPropertyValue('--color-primary')
          .trim() || '#2563eb',
        weight: 4,
      }).addTo(mapRef.current);
      routeLayerRef.current = polyline;
    }
  }, [route]);

  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
