import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Fix Leaflet default icon issue
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onLocationSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Map if not exists
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        minZoom: 2,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
      }).setView([20, 0], 2); // Default to world view

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        noWrap: true
      }).addTo(mapInstance.current);

      // Handle clicks
      mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    // Update Marker without panning
    if (lat !== undefined && lng !== undefined) {
      if (markerInstance.current) {
        markerInstance.current.setLatLng([lat, lng]);
      } else if (mapInstance.current) {
        markerInstance.current = L.marker([lat, lng], { icon: iconDefault }).addTo(mapInstance.current);
      }
    } else {
      // If coordinates are cleared/undefined, remove the marker
      if (markerInstance.current) {
        markerInstance.current.remove();
        markerInstance.current = null;
      }
    }

    // Cleanup
    return () => {
      // We don't destroy the map here on every render to preserve state
    };
  }, [lat, lng, onLocationSelect]);

  // Resize map on mount to ensure tiles load
  useEffect(() => {
    setTimeout(() => {
      mapInstance.current?.invalidateSize();
    }, 100);
  }, []);

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
      <div ref={mapContainer} className="w-full h-full z-0" />
      <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 text-xs rounded z-[1000] pointer-events-none">
        클릭하여 위치 선택
      </div>
    </div>
  );
};