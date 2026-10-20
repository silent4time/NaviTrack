import React, { useState } from 'react';
import { Device, DeviceStatus } from '../types/tracker';
import {
  Car,
  Truck,
  Bike,
  Search,
  KeyRound,
  ShieldAlert,
  Zap,
  BatteryCharging,
  Signal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Navigation,
  PowerOff,
  Flame,
  Radio,
} from 'lucide-react';

interface DeviceListSidebarProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onOpenRegisterModal: () => void;
  onOpenActivateLicenseModal: (device?: Device) => void;
  onOpenStoreModal: () => void;
  onToggleEngineCut: (device: Device) => void;
  onOpenPlayback: (device: Device) => void;
}

export const DeviceListSidebar: React.FC<DeviceListSidebarProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onOpenRegisterModal,
  onOpenActivateLicenseModal,
  onOpenStoreModal,
  onToggleEngineCut,
  onOpenPlayback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'stopped' | 'alert' | 'unlicensed'>('all');

  const filteredDevices = devices.filter((d) => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.imei.includes(q) ||
      d.plateNumber.toLowerCase().includes(q) ||
      d.ownerName.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'moving') return d.status === 'moving' && !d.engineCutOff;
    if (statusFilter === 'stopped') return d.status === 'stopped' && !d.engineCutOff;
    if (statusFilter === 'alert') return d.engineCutOff || d.license.isExpired;
    if (statusFilter === 'unlicensed') return d.license.isExpired || d.license.status === 'expiring_soon';
    return true;
  });

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-5 h-5 text-indigo-400" />;
      case 'motorcycle':
        return <Bike className="w-5 h-5 text-emerald-400" />;
      default:
        return <Car className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getRemainingDays = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <aside className="w-full md:w-96 h-full flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl z-20 overflow-hidden">
      {/* Top Search & Actions */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با IMEI، نام خودرو، پلاک یا راننده..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            همه ({devices.length})
          </button>
          <button
            onClick={() => setStatusFilter('moving')}
            className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'moving'
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            متحرک ({devices.filter((d) => d.status === 'moving' && !d.engineCutOff).length})
          </button>
          <button
            onClick={() => setStatusFilter('stopped')}
            className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'stopped'
                ? 'bg-amber-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            توقف ({devices.filter((d) => d.status === 'stopped' && !d.engineCutOff).length})
          </button>
          <button
            onClick={() => setStatusFilter('unlicensed')}
            className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'unlicensed'
                ? 'bg-rose-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            تمدید لایسنس ({devices.filter((d) => d.license.isExpired || d.license.status === 'expiring_soon').length})
          </button>
        </div>
      </div>

      {/* Device List Items */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 divide-y-0">
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-center p-4">
            <Radio className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-400">هیچ دستگاهی با این مشخصات یافت نشد</p>
            <p className="text-xs text-slate-500 mt-1">می‌توانید دستگاه جدید را با ثبت کد IMEI اضافه کنید.</p>
            <button
              onClick={onOpenRegisterModal}
              className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium cursor-pointer shadow-lg shadow-cyan-600/30"
            >
              + ثبت دستگاه جدید با IMEI
            </button>
          </div>
        ) : (
          filteredDevices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            const remainingDays = getRemainingDays(device.license.expiresAt);
            const isExpired = device.license.isExpired || remainingDays <= 0;
            const isExpiringSoon = !isExpired && remainingDays <= 7;

            return (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className={`relative rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  isSelected
                    ? 'bg-slate-800/95 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {/* Header: Type icon, Name, Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl flex items-center justify-center ${
                        device.engineCutOff
                          ? 'bg-red-500/15 border border-red-500/30'
                          : device.status === 'moving'
                          ? 'bg-emerald-500/15 border border-emerald-500/30'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {getAssetIcon(device.assetType)}
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        {device.name}
                        {device.engineCutOff && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded font-normal">
                            رله خاموش
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <span className="text-slate-500 font-sans">IMEI:</span>
                        <span className="tracking-wider">{device.imei}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex flex-col items-end">
                    {device.engineCutOff ? (
                      <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        قطع موتور
                      </span>
                    ) : device.status === 'moving' ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        {device.telemetry.speed} km/h
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        متوقف
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {device.model}
                    </span>
                  </div>
                </div>

                {/* Iranian License Plate Display & Driver Info */}
                <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-xs">
                  {/* Plate box */}
                  <div className="inline-flex items-center bg-slate-100 text-slate-900 font-black px-2 py-0.5 rounded border border-slate-300 text-[11px] shadow-inner font-mono tracking-tight">
                    <span className="bg-blue-800 text-white text-[8px] px-1 py-0.5 rounded-r -mr-1.5 ml-1">
                      I.R.
                    </span>
                    <span>{device.plateNumber}</span>
                  </div>

                  <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {device.ownerName}
                  </span>
                </div>

                {/* Telemetry Mini Dashboard */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">سوئیچ</span>
                    <span className={device.telemetry.ignition ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {device.telemetry.ignition ? 'روشن' : 'خاموش'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">باتری</span>
                    <span className="text-cyan-400 font-mono font-medium">
                      {device.telemetry.batteryVoltage}V
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">ماهواره</span>
                    <span className="text-slate-300 font-mono">
                      {device.telemetry.satellites} SAT
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">سیگنال</span>
                    <span className="text-slate-300 font-mono">
                      {device.telemetry.gsmSignalPercent}%
                    </span>
                  </div>
                </div>

                {/* License Badge & Expiration status */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    {isExpired ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        اشتراک منقضی شده
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {remainingDays} روز تا انقضا
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {remainingDays} روز اعتبار فعال
                      </span>
                    )}
                  </div>

                  {/* Quick License Action */}
                  {isExpired || isExpiringSoon ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenActivateLicenseModal(device);
                      }}
                      className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      شارژ لایسنس
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      {device.license.planName.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex items-center gap-1.5 pt-1">
                  {/* Remote Engine Cut-Off */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEngineCut(device);
                    }}
                    title={device.engineCutOff ? 'وصل مجدد سوخت و استارت' : 'قطع کن موتور (خاموش کردن اضطراری)'}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                      device.engineCutOff
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>{device.engineCutOff ? 'وصل سوخت' : 'خاموش‌کن رله'}</span>
                  </button>

                  {/* Route History Playback */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlayback(device);
                    }}
                    title="مرور و بازپخش مسیرهای گذشته"
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[11px] font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    <span>مسیر</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={onOpenRegisterModal}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 cursor-pointer transition-all"
        >
          <span>+ ثبت دستگاه با IMEI</span>
        </button>

        <button
          onClick={onOpenStoreModal}
          title="خرید بسته لایسنس آنلاین"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>خرید لایسنس</span>
        </button>
      </div>
    </aside>
  );
};
