import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { DiveLog } from '../types';

interface DiveMapProps {
  logs: DiveLog[];
  onSelectLog: (log: DiveLog) => void;
  focusedLogId?: string | null;
}

export const DiveMap: React.FC<DiveMapProps> = ({ logs, onSelectLog, focusedLogId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersMapRef = useRef<{[key: string]: L.Marker}>({});

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapInstance.current) {
      // Default view: Center of world (zoomed out)
      mapInstance.current = L.map(mapContainer.current, {
        minZoom: 2,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        noWrap: true
      }).addTo(mapInstance.current);
    }

    // Clear existing markers
    Object.values(markersMapRef.current).forEach((m: L.Marker) => m.remove());
    markersMapRef.current = {};

    // Add markers for logs
    logs.forEach(log => {
      if (log.geo?.lat && log.geo?.lng) {
        
        let customIcon;

        if (log.photos && log.photos.length > 0) {
            // Marker with Photo
            customIcon = L.divIcon({
                className: 'bg-transparent border-none', // Remove default Leaflet divIcon styles
                html: `
                    <div style="
                        width: 44px; 
                        height: 44px; 
                        border-radius: 50%; 
                        border: 3px solid white; 
                        box-shadow: 0 3px 8px rgba(0,0,0,0.4); 
                        background-image: url('${log.photos[0]}'); 
                        background-size: cover; 
                        background-position: center; 
                        background-color: #e0f2fe;
                        transition: transform 0.2s;
                    "></div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22], // Center the circle
                popupAnchor: [0, -22]
            });
        } else {
            // Marker without Photo (Default)
            customIcon = L.divIcon({
                className: 'bg-transparent border-none',
                html: `
                    <div style="
                        width: 36px; 
                        height: 36px; 
                        border-radius: 50%; 
                        border: 3px solid white; 
                        box-shadow: 0 3px 8px rgba(0,0,0,0.3); 
                        background-color: #0ea5e9; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-size: 18px;
                        color: white;
                    ">🤿</div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
      });

      requestAnimationFrame(() => {
        mapInstance.current?.invalidateSize();
      });
        }

        const marker = L.marker([log.geo.lat, log.geo.lng], { icon: customIcon })
          .addTo(mapInstance.current!)
          .bindPopup(`
            <div class="text-center p-1 font-sans">
              ${log.photos && log.photos.length > 0 ? 
                `<div class="w-full h-24 mb-2 rounded-lg overflow-hidden"><img src="${log.photos[0]}" class="w-full h-full object-cover"></div>` 
                : ''}
              <strong class="block text-sm text-gray-900 mb-1">${log.siteName}</strong>
              <span class="text-xs text-gray-500 block mb-3">${new Date(log.date).toLocaleDateString()}</span>
              <button id="marker-btn-${log.id}" class="text-xs bg-ocean-500 text-white px-4 py-1.5 rounded-full hover:bg-ocean-600 w-full transition-colors shadow-sm">
                자세히 보기
              </button>
            </div>
          `, {
              minWidth: 160,
              closeButton: false,
              className: 'rounded-xl overflow-hidden shadow-xl'
          });

        marker.on('popupopen', () => {
           const btn = document.getElementById(`marker-btn-${log.id}`);
           if (btn) {
             btn.onclick = () => onSelectLog(log);
           }
        });

        markersMapRef.current[log.id] = marker;
      }
    });

    // Fly to focused log if exists
    if (focusedLogId && markersMapRef.current[focusedLogId]) {
      const marker = markersMapRef.current[focusedLogId];
      const latLng = marker.getLatLng();
      mapInstance.current.flyTo(latLng, 13, { duration: 1.5 });
      setTimeout(() => marker.openPopup(), 1500);
    } 

  }, [logs, onSelectLog, focusedLogId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    let resizeFrame: number | null = null;

    const scheduleResize = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        mapInstance.current?.invalidateSize();
      });
    };

    window.addEventListener('resize', scheduleResize);
    scheduleResize();

    const ObserverCtor = window.ResizeObserver;
    let observer: ResizeObserver | null = null;

    if (ObserverCtor) {
      observer = new ObserverCtor(scheduleResize);
      observer.observe(mapContainer.current);
    } else {
      // Fallback: trigger once in case the tab becomes visible later
      scheduleResize();
    }

    return () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      window.removeEventListener('resize', scheduleResize);
    };
  }, []);

  // Re-trigger flyTo if focusedLogId changes separately
  useEffect(() => {
    if (focusedLogId && mapInstance.current && markersMapRef.current[focusedLogId]) {
       const marker = markersMapRef.current[focusedLogId];
       mapInstance.current.flyTo(marker.getLatLng(), 13, { duration: 1.5 });
       marker.openPopup();
    }
  }, [focusedLogId]);

  return (
    <div className="bg-white p-1 rounded-xl shadow-sm border border-ocean-100 animate-fade-in h-[600px] overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-full rounded-lg z-0" />
      
      {/* Legend/Help */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-gray-200 z-[400] text-xs text-gray-600">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-ocean-500 border border-white shadow mr-2"></div>
          <span>기본 마커</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-ocean-100 border border-ocean-300 mr-2 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-gray-300"></div>
          </div>
          <span>포토 마커</span>
        </div>
      </div>
    </div>
  );
};