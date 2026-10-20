import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Device, Geofence, MapTileProvider } from '../types/tracker';
import { Layers, Maximize2, Compass, Eye, ShieldAlert, Zap } from 'lucide-react';

interface MapTrackerProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  geofences: Geofence[];
  showGeofences: boolean;
  showTrails: boolean;
}

const TILE_LAYERS: Record<MapTileProvider, { url: string; attribution: string; name: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'خیابانی (OpenStreetMap)',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    name: 'حالت شب / مانیتورینگ تیره',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    name: 'ماهواره‌ای هوایی (Satellite)',
  },
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    name: 'ناوبری روشن (Carto Light)',
  },
};

export const MapTracker: React.FC<MapTrackerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  geofences,
  showGeofences,
  showTrails,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylinesRef = useRef<Record<string, L.Polyline>>({});
  const geofenceCirclesRef = useRef<L.Circle[]>([]);

  const [activeTile, setActiveTile] = useState<MapTileProvider>('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Tehran
    const map = L.map(mapContainerRef.current, {
      center: [35.735, 51.39],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerConfig = TILE_LAYERS[activeTile];
    const tileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const layerConfig = TILE_LAYERS[activeTile];
    const newLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = newLayer;
  }, [activeTile]);

  // Update Markers & Trails
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    devices.forEach((device) => {
      const { latitude, longitude, heading, speed, ignition } = device.telemetry;
      const isSelected = selectedDevice?.id === device.id;
      const isEngineCut = device.engineCutOff;

      let statusColor = '#10b981'; // green moving
      let statusBg = 'bg-emerald-500';
      let pingPulse = `<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>`;

      if (isEngineCut) {
        statusColor = '#ef4444'; // red cut-off
        statusBg = 'bg-red-500';
        pingPulse = '';
      } else if (device.status === 'offline') {
        statusColor = '#64748b'; // slate offline
        statusBg = 'bg-slate-500';
        pingPulse = '';
      } else if (speed === 0) {
        statusColor = '#f59e0b'; // amber stopped
        statusBg = 'bg-amber-500';
        pingPulse = ignition ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50"></span>` : '';
      }

      // SVG Icon based on asset type
      const getIconSvg = () => {
        if (device.assetType === 'truck') {
          return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
        }
        if (device.assetType === 'motorcycle') {
          return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="16" r="3"/><circle cx="19" cy="16" r="3"/><path d="M12 17h4l4-7h-4l-3-4h-3l2 4h-4l-3 4"/></svg>`;
        }
        // default car
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
      };

      const customHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <!-- Selection ring -->
          ${isSelected ? `<div class="absolute -inset-2.5 rounded-full border-2 border-cyan-400 animate-pulse bg-cyan-400/20"></div>` : ''}
          
          <!-- Outer pin frame with heading rotation -->
          <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease-out;" class="relative w-11 h-11 rounded-2xl ${statusBg} text-white shadow-xl flex items-center justify-center border-2 border-slate-900 shadow-slate-950/80">
            ${pingPulse}
            <!-- Vehicle icon -->
            <div class="relative z-10 text-white">
              ${getIconSvg()}
            </div>
            <!-- Arrow tip pointing in heading direction -->
            <div class="absolute -top-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-white"></div>
          </div>

          <!-- Speed Badge -->
          <div class="absolute -bottom-2 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-700/80 shadow-md whitespace-nowrap dir-rtl">
            ${speed > 0 ? `${speed} <span class="text-[8px] font-normal text-slate-400">km/h</span>` : isEngineCut ? 'رله خاموش' : 'توقف'}
          </div>

          <!-- Floating Name Label on Hover or Selected -->
          <div class="absolute -top-7 px-2 py-0.5 rounded bg-slate-900/90 text-[11px] font-medium text-slate-200 border border-slate-700 shadow whitespace-nowrap opacity-90 transition-opacity">
            ${device.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: customHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Update or create marker
      if (markersRef.current[device.id]) {
        markersRef.current[device.id].setLatLng([latitude, longitude]);
        markersRef.current[device.id].setIcon(customIcon);
      } else {
        const marker = L.marker([latitude, longitude], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            onSelectDevice(device);
          });
        markersRef.current[device.id] = marker;
      }

      // Update Polyline Trail
      if (showTrails && device.historyTrail.length > 1) {
        if (polylinesRef.current[device.id]) {
          polylinesRef.current[device.id].setLatLngs(device.historyTrail);
        } else {
          const polyline = L.polyline(device.historyTrail, {
            color: isSelected ? '#38bdf8' : statusColor,
            weight: isSelected ? 4 : 3,
            opacity: 0.75,
            dashArray: device.status === 'stopped' ? '4, 8' : undefined,
          }).addTo(map);
          polylinesRef.current[device.id] = polyline;
        }
      } else if (!showTrails && polylinesRef.current[device.id]) {
        map.removeLayer(polylinesRef.current[device.id]);
        delete polylinesRef.current[device.id];
      }
    });

    // Remove deleted device markers
    const currentDeviceIds = new Set(devices.map((d) => d.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentDeviceIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
      if (polylinesRef.current[id] && !currentDeviceIds.has(id)) {
        map.removeLayer(polylinesRef.current[id]);
        delete polylinesRef.current[id];
      }
    });
  }, [devices, selectedDevice, showTrails]);

  // Geofence rendering
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean old circles
    geofenceCirclesRef.current.forEach((c) => map.removeLayer(c));
    geofenceCirclesRef.current = [];

    if (showGeofences) {
      geofences.forEach((geo) => {
        const circle = L.circle([geo.lat, geo.lng], {
          radius: geo.radiusMeters,
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '6, 6',
        }).addTo(map);

        circle.bindTooltip(`حصار: ${geo.name} (${geo.radiusMeters}m)`, {
          permanent: false,
          direction: 'top',
        });

        geofenceCirclesRef.current.push(circle);
      });
    }
  }, [geofences, showGeofences]);

  // Pan to selected device
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedDevice) return;
    const { latitude, longitude } = selectedDevice.telemetry;
    mapInstanceRef.current.panTo([latitude, longitude], {
      animate: true,
      duration: 0.8,
    });
  }, [selectedDevice?.id]);

  const fitAllDevices = () => {
    if (!mapInstanceRef.current || devices.length === 0) return;
    const latLngs = devices.map((d) => [d.telemetry.latitude, d.telemetry.longitude] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      {/* Floating Map Controls - Top Left */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        {/* Layer Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="تغییر لایه نقشه"
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl shadow-lg backdrop-blur-md transition-all text-xs font-medium cursor-pointer"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{TILE_LAYERS[activeTile].name.split(' ')[0]}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-11 left-0 w-56 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-lg flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] text-slate-400 font-semibold px-2 py-1 border-b border-slate-800 mb-1">
                انتخاب استایل و نوع نقشه
              </div>
              {(Object.keys(TILE_LAYERS) as MapTileProvider[]).map((key) => {
                const layer = TILE_LAYERS[key];
                const isActive = activeTile === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTile(key);
                      setShowLayerMenu(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-right transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{layer.name}</span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fit bounds button */}
        <button
          onClick={fitAllDevices}
          title="مشاهده تمام خودروها روی نقشه"
          className="flex items-center justify-center p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Floating Status Bar - Bottom Left Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>در حال حرکت: {devices.filter((d) => d.status === 'moving' && !d.engineCutOff).length}</span>
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>متوقف: {devices.filter((d) => d.status === 'stopped' && !d.engineCutOff).length}</span>
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>رله قطع کن: {devices.filter((d) => d.engineCutOff).length}</span>
        </div>
      </div>
    </div>
  );
};
