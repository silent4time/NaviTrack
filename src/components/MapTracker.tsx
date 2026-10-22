import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Device, Geofence, MapTileProvider } from '../types/tracker';
import {
  Layers,
  Compass,
  AlertTriangle,
  Globe,
  Satellite,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface MapTrackerProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  geofences: Geofence[];
  showGeofences: boolean;
  showTrails: boolean;
  isSidebarCollapsed?: boolean;
}

export interface TileConfig {
  url: string;
  subdomains: string[];
  attribution: string;
  name: string;
  shortName: string;
  badge?: string;
  maxZoom: number;
}

export const TILE_LAYERS: Record<MapTileProvider, TileConfig> = {
  esri_streets: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: '&copy; Esri World Street Map',
    name: 'نقشه شهری Esri (۱۰۰٪ بدون فیلتر با IP ایران)',
    shortName: 'شهری Esri',
    badge: 'تست‌شده ایران',
    maxZoom: 19,
  },
  google_streets: {
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=fa',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    name: 'گوگل خیابانی با نام‌های فارسی (Google Streets)',
    shortName: 'گوگل خیابانی',
    badge: 'گوگل',
    maxZoom: 20,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: '&copy; Esri World Imagery',
    name: 'ماهواره‌ای هوایی Esri (بدون فیلتر)',
    shortName: 'ماهواره‌ای Esri',
    maxZoom: 19,
  },
  google_satellite: {
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=fa',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Satellite Hybrid',
    name: 'ماهواره‌ای ترکیبی گوگل (Google Hybrid)',
    shortName: 'ماهواره‌ای گوگل',
    maxZoom: 20,
  },
  google_hybrid: {
    url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Satellite Pure',
    name: 'ماهواره‌ای خالص گوگل (بدون نام)',
    shortName: 'ماهواره خالص',
    maxZoom: 20,
  },
  osm_hot: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap France',
    name: 'اوپن‌استریت‌مپ سرور فرانسه (OSM HOT)',
    shortName: 'OSM سریع',
    maxZoom: 19,
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    name: 'کارتو وویجر روشن و روان (Carto Voyager)',
    shortName: 'کارتو روشن',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    name: 'حالت تیره کنترل‌روم (Dark Mode)',
    shortName: 'حالت شب',
    maxZoom: 19,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap contributors',
    name: 'اوپن‌استریت‌مپ جهانی (OSM Global)',
    shortName: 'OSM جهانی',
    maxZoom: 19,
  },
};

export const MapTracker: React.FC<MapTrackerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  geofences,
  showGeofences,
  showTrails,
  isSidebarCollapsed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylinesRef = useRef<Record<string, L.Polyline>>({});
  const geofenceCirclesRef = useRef<L.Circle[]>([]);

  // Default to esri_streets because Esri is guaranteed 100% accessible across all Iranian ISPs without VPN
  const [activeTile, setActiveTile] = useState<MapTileProvider>('esri_streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [tileErrorDetected, setTileErrorDetected] = useState(false);
  const [autoFallbackMsg, setAutoFallbackMsg] = useState<string | null>(null);

  // Invalidate size helper
  const triggerMapResize = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize({ pan: false });
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial center: either selected device, first device, or Tehran center
    let initialCenter: [number, number] = [35.735, 51.39];
    let initialZoom = 12;

    if (selectedDevice) {
      initialCenter = [selectedDevice.telemetry.latitude, selectedDevice.telemetry.longitude];
      initialZoom = 14;
    } else if (devices.length > 0) {
      initialCenter = [devices[0].telemetry.latitude, devices[0].telemetry.longitude];
      initialZoom = 13;
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      // Prevents Leaflet coordinate flipping in RTL parents
      fadeAnimation: true,
      zoomAnimation: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerConfig = TILE_LAYERS[activeTile];
    const tileOptions: L.TileLayerOptions = {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom || 19,
      crossOrigin: true,
    };
    if (layerConfig.subdomains && layerConfig.subdomains.length > 0) {
      tileOptions.subdomains = layerConfig.subdomains;
    }

    const tileLayer = L.tileLayer(layerConfig.url, tileOptions).addTo(map);

    let errorCount = 0;
    tileLayer.on('tileerror', () => {
      errorCount++;
      if (errorCount >= 2) {
        setTileErrorDetected(true);
        // If Google was blocked on user's ISP, auto switch to Esri
        if (activeTile.startsWith('google_')) {
          setAutoFallbackMsg('سرور گوگل در اینترنت شما پاسخ نداد؛ نقشه خودکار به سرور پایدار Esri سوئیچ شد.');
          setActiveTile('esri_streets');
        }
      }
    });

    tileLayer.on('tileload', () => {
      setTileErrorDetected(false);
    });

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Multiple invalidateSize calls to guarantee tile calculation regardless of layout timing
    const t1 = setTimeout(triggerMapResize, 50);
    const t2 = setTimeout(triggerMapResize, 200);
    const t3 = setTimeout(triggerMapResize, 500);
    const t4 = setTimeout(triggerMapResize, 1000);

    const resizeObserver = new ResizeObserver(() => {
      triggerMapResize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    window.addEventListener('resize', triggerMapResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', triggerMapResize);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user selects a different provider
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layerConfig = TILE_LAYERS[activeTile];
    const tileOptions: L.TileLayerOptions = {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom || 19,
      crossOrigin: true,
    };
    if (layerConfig.subdomains && layerConfig.subdomains.length > 0) {
      tileOptions.subdomains = layerConfig.subdomains;
    }

    const newLayer = L.tileLayer(layerConfig.url, tileOptions).addTo(map);

    let errCount = 0;
    newLayer.on('tileerror', () => {
      errCount++;
      if (errCount >= 3) {
        setTileErrorDetected(true);
      }
    });

    newLayer.on('tileload', () => {
      setTileErrorDetected(false);
    });

    tileLayerRef.current = newLayer;
    triggerMapResize();
  }, [activeTile, triggerMapResize]);

  // When sidebar collapses or expands, resize map
  useEffect(() => {
    const timer1 = setTimeout(triggerMapResize, 40);
    const timer2 = setTimeout(triggerMapResize, 250);
    const timer3 = setTimeout(triggerMapResize, 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isSidebarCollapsed, triggerMapResize]);

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
        pingPulse = ignition
          ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50"></span>`
          : '';
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
        <div class="relative flex flex-col items-center cursor-pointer" style="direction: ltr;">
          <!-- Direction arrow + status circle -->
          <div class="relative" style="transform: rotate(${heading}deg); transition: transform 0.3s ease;">
            <div class="w-8 h-8 rounded-full ${statusBg} border-2 border-white shadow-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="text-white">
                <path d="M12 2L8 10h8L12 2z"/>
              </svg>
            </div>
            ${isSelected ? '<div class="absolute -inset-1 rounded-full border-2 border-cyan-400 animate-pulse"></div>' : ''}
          </div>
          <!-- Label -->
          <div class="mt-1 px-1.5 py-0.5 bg-slate-900/90 text-white text-[10px] font-medium rounded shadow whitespace-nowrap border border-slate-700">
            ${device.name.split(' ')[0]}
          </div>
          ${device.status === 'moving' && !device.engineCutOff ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white text-[8px] flex items-center justify-center text-white font-bold">${telemetry.speed}</div>` : ''}
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
    const latLngs = devices.map(
      (d) => [d.telemetry.latitude, d.telemetry.longitude] as [number, number]
    );
    const bounds = L.latLngBounds(latLngs);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  };

  // Quick select pills on top
  const quickPillKeys: MapTileProvider[] = [
    'esri_streets',
    'google_streets',
    'satellite',
    'google_satellite',
    'osm_hot',
    'dark',
  ];

  return (
    <div
      className="relative w-full h-full flex-1 overflow-hidden select-none bg-slate-950"
      dir="ltr"
      style={{ direction: 'ltr', width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Map Container - absolute inset-0 with strict direction: ltr */}
      <div
        ref={mapContainerRef}
        id="leaflet-map-canvas"
        dir="ltr"
        style={{
          direction: 'ltr',
          textAlign: 'left',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
        className="w-full h-full bg-slate-950"
      />

      {/* Floating Map Controls - Top Center / Left: Quick Tile Switchers */}
      <div
        className="absolute top-3 left-4 z-[1000] flex items-center gap-1.5 flex-wrap bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl"
        dir="rtl"
      >
        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-200">
          <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">نقشه:</span>
        </div>

        {quickPillKeys.map((key) => {
          const config = TILE_LAYERS[key];
          const isActive = activeTile === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTile(key);
                setTileErrorDetected(false);
                setAutoFallbackMsg(null);
              }}
              title={config.name}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-500 text-white shadow-lg font-bold ring-1 ring-cyan-300'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>{config.shortName}</span>
              {config.badge && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}

        {/* More layers dropdown toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="همه لایه‌های نقشه"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {showLayerMenu && (
            <div className="absolute top-9 left-0 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl backdrop-blur-lg flex flex-col gap-1 z-[1100]">
              <div className="text-[10px] text-slate-400 font-semibold px-2 py-1 border-b border-slate-800 mb-0.5">
                سرورهای نقشه (سازگار با IP ایران)
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
                      setTileErrorDetected(false);
                      setAutoFallbackMsg(null);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[11px] text-right transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{layer.name}</span>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Compass / Fit Bounds - Top Right */}
      <div className="absolute top-3 right-4 z-[1000] flex items-center gap-1.5" dir="rtl">
        <button
          onClick={fitAllDevices}
          title="مشاهده تمام خودروها روی نقشه"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md transition-all cursor-pointer text-xs font-bold"
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">تمرکز روی همه</span>
        </button>
      </div>

      {/* Auto-fallback feedback toast if Google was blocked */}
      {autoFallbackMsg && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-[1050] bg-slate-900/95 border border-cyan-500 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in"
          dir="rtl"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          <span>{autoFallbackMsg}</span>
          <button
            onClick={() => setAutoFallbackMsg(null)}
            className="text-slate-400 hover:text-white mr-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tile Error Fallback Notice (if user ISP blocks a specific CDN) */}
      {tileErrorDetected && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1050] bg-slate-900/95 border border-amber-500 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs backdrop-blur-md max-w-lg w-[90%] sm:w-auto"
          dir="rtl"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-[11px]">
            <div className="font-bold text-amber-300">سرور نقشه انتخابی توسط اینترنت شما فیلتر یا مسدود شده است</div>
            <div className="text-slate-300 text-[10px]">
              روی دکمه زیر کلیک کنید تا نقشه بدون نیاز به VPN با سرور پایدار Esri باز شود:
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTile('esri_streets');
              setTileErrorDetected(false);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer shrink-0 shadow"
          >
            تغییر به نقشه شهری Esri
          </button>
        </div>
      )}
    </div>
  );
};
