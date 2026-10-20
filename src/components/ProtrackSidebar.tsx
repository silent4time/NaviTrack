import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Car,
  Truck,
  Bike,
  Plus,
  Key,
  Compass,
} from 'lucide-react';

interface ProtrackSidebarProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onOpenRegisterModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ProtrackSidebar: React.FC<ProtrackSidebarProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onOpenRegisterModal,
  isCollapsed,
  onToggleCollapse,
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

  return (
    <div
      className={`relative z-20 h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-0 overflow-hidden' : 'w-80 md:w-88'
      }`}
    >
      {/* Collapse Toggle Handle */}
      <button
        onClick={onToggleCollapse}
        title={isCollapsed ? 'نمایش منوی دستگاه‌ها' : 'بستن منو (نقشه تمام‌صفحه)'}
        className="absolute -left-7 top-16 z-30 w-7 h-12 bg-slate-900/90 hover:bg-slate-800 border-y border-l border-slate-700 rounded-l-xl text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shadow-lg backdrop-blur-md"
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Protrack-style Status Counter Tabs */}
      <div className="bg-slate-950/80 p-2 border-b border-slate-800 text-[11px] grid grid-cols-4 gap-1 text-center font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div>همه</div>
          <div className="font-mono text-cyan-400 font-bold">{devices.length}</div>
        </button>

        <button
          onClick={() => setActiveTab('moving')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'moving'
              ? 'bg-slate-800 text-emerald-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div>متحرک</div>
          <div className="font-mono text-emerald-400 font-bold">{movingCount}</div>
        </button>

        <button
          onClick={() => setActiveTab('static')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'static'
              ? 'bg-slate-800 text-amber-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div>توقف</div>
          <div className="font-mono text-amber-400 font-bold">{staticCount}</div>
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'offline'
              ? 'bg-slate-800 text-slate-200 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div>قطع/آفلاین</div>
          <div className="font-mono text-slate-400 font-bold">{offlineCount}</div>
        </button>
      </div>

      {/* Clean Search Input */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-900">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، پلاک یا IMEI..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Protrack Compact Device List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
        {filteredDevices.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            موردی یافت نشد.
          </div>
        ) : (
          filteredDevices.map((dev) => {
            const isSelected = selectedDevice?.id === dev.id;
            const isMoving = dev.status === 'moving' && !dev.engineCutOff;

            return (
              <div
                key={dev.id}
                onClick={() => onSelectDevice(dev)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-sm'
                    : 'hover:bg-slate-800/70'
                }`}
              >
                {/* Right: Icon with heading & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Arrow Indicator with Heading Angle */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      dev.engineCutOff
                        ? 'bg-red-500/20 text-red-400'
                        : isMoving
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <Navigation
                      className="w-3.5 h-3.5 transition-transform duration-300"
                      style={{ transform: `rotate(${dev.telemetry.heading}deg)` }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-white truncate max-w-[130px] flex items-center gap-1.5">
                      <span>{dev.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-300">{dev.plateNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Left: Speed, ACC status */}
                <div className="flex flex-col items-end text-left shrink-0">
                  <span
                    className={`font-mono font-bold text-xs ${
                      isMoving ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {isMoving ? `${dev.telemetry.speed} km/h` : 'توقف'}
                  </span>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    {/* ACC Key indicator */}
                    <span title={dev.telemetry.ignition ? 'ACC روشن' : 'ACC خاموش'}>
                      <Key
                        className={`w-3 h-3 ${
                          dev.telemetry.ignition ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                    </span>
                    <span className="font-mono text-slate-500">{dev.telemetry.batteryVoltage}V</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer: Quick Register */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800">
        <button
          onClick={onOpenRegisterModal}
          className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن دستگاه (IMEI)</span>
        </button>
      </div>
    </div>
  );
};
