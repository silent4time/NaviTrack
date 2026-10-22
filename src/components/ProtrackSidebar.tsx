import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  Search,
  Navigation,
  Car,
  Plus,
  Key,
  PanelRightClose,
  PanelRightOpen,
  Wifi,
  WifiOff,
  Circle,
} from 'lucide-react';

interface ProtrackSidebarProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onOpenRegisterModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dir?: 'rtl' | 'ltr';
}

export const ProtrackSidebar: React.FC<ProtrackSidebarProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onOpenRegisterModal,
  isCollapsed,
  onToggleCollapse,
  dir = 'rtl',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'moving' | 'static' | 'offline'>('all');

  const movingCount = devices.filter((d) => d.status === 'moving' && !d.engineCutOff).length;
  const staticCount = devices.filter((d) => d.status === 'stopped' && !d.engineCutOff).length;
  const offlineCount = devices.filter((d) => d.status === 'offline' || d.engineCutOff).length;

  const filteredDevices = devices.filter((dev) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      dev.name.toLowerCase().includes(q) ||
      dev.plateNumber.toLowerCase().includes(q) ||
      dev.imei.includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'moving') return dev.status === 'moving' && !dev.engineCutOff;
    if (activeTab === 'static') return dev.status === 'stopped' && !dev.engineCutOff;
    if (activeTab === 'offline') return dev.status === 'offline' || dev.engineCutOff;
    return true;
  });

  const getStatusColor = (dev: Device) => {
    if (dev.engineCutOff) return 'bg-red-500';
    if (dev.status === 'moving') return 'bg-emerald-500';
    if (dev.status === 'stopped') return 'bg-amber-400';
    return 'bg-slate-500';
  };

  const getStatusLabel = (dev: Device) => {
    if (dev.engineCutOff) return 'قطع سوخت';
    if (dev.status === 'moving') return `${dev.telemetry.speed} km/h`;
    if (dev.status === 'stopped') return 'متوقف';
    return 'آفلاین';
  };

  return (
    <>
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          title="نمایش فهرست دستگاه‌ها"
          style={dir === 'rtl' ? { right: 0, top: '56px' } : { left: 0, top: '56px' }}
          className="fixed z-[999] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-l-lg shadow-lg flex items-center gap-1.5 text-xs font-medium border border-slate-600 transition-colors"
        >
          <PanelRightOpen className="w-4 h-4" />
          <span>دستگاه‌ها ({devices.length})</span>
        </button>
      )}

      <aside
        className={`relative z-20 h-full bg-[#0f172a] border-l border-slate-700/80 shadow-xl flex flex-col transition-all duration-200 ease-out shrink-0 ${
          isCollapsed ? 'w-0 overflow-hidden opacity-0 pointer-events-none' : 'w-[320px] opacity-100'
        }`}
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-700/60 flex items-center justify-between bg-[#0c1322]">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">فهرست دستگاه‌ها</span>
            <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
              {devices.length}
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
            title="مخفی کردن"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        {/* Status Tabs - Protrack style */}
        <div className="grid grid-cols-4 text-[11px] font-medium border-b border-slate-700/50 bg-[#0c1322]">
          {[
            { key: 'all', label: 'همه', count: devices.length, color: 'text-white' },
            { key: 'moving', label: 'متحرک', count: movingCount, color: 'text-emerald-400' },
            { key: 'static', label: 'متوقف', count: staticCount, color: 'text-amber-400' },
            { key: 'offline', label: 'آفلاین', count: offlineCount, color: 'text-slate-400' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 text-center transition-colors ${
                activeTab === tab.key
                  ? 'bg-slate-800/80 border-b-2 border-cyan-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="text-[10px]">{tab.label}</div>
              <div className={`font-mono font-bold ${tab.color}`}>{tab.count}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-2 border-b border-slate-700/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="نام، پلاک یا IMEI..."
              className="w-full bg-slate-900 border border-slate-700 rounded-md pr-8 pl-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Device List */}
        <div className="flex-1 overflow-y-auto">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">دستگاهی یافت نشد</div>
          ) : (
            filteredDevices.map((dev) => {
              const isSelected = selectedDevice?.id === dev.id;
              return (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className={`px-2.5 py-2 border-b border-slate-800/60 cursor-pointer flex items-center gap-2.5 transition-colors ${
                    isSelected ? 'bg-cyan-950/40 border-r-2 border-r-cyan-500' : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Status Dot + Heading */}
                  <div className="relative shrink-0">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(dev)} absolute -top-0.5 -right-0.5 ring-2 ring-[#0f172a]`} />
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center ${
                        dev.engineCutOff
                          ? 'bg-red-500/20 text-red-400'
                          : dev.status === 'moving'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Navigation
                        className="w-3.5 h-3.5"
                        style={{ transform: `rotate(${dev.telemetry.heading}deg)` }}
                      />
                    </div>
                  </div>

                  {/* Name & Plate */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{dev.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      {dev.plateNumber}
                    </div>
                  </div>

                  {/* Speed / Status */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-mono font-semibold ${
                      dev.status === 'moving' && !dev.engineCutOff ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {getStatusLabel(dev)}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Key className={`w-3 h-3 ${dev.telemetry.ignition ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className="text-[10px] text-slate-500 font-mono">{dev.telemetry.batteryVoltage}V</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-slate-700/50 bg-[#0c1322]">
          <button
            onClick={onOpenRegisterModal}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن دستگاه (IMEI)
          </button>
        </div>
      </aside>
    </>
  );
};
