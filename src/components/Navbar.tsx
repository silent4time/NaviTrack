import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Play,
  Pause,
  Bell,
  Cpu,
  Globe,
  Plus,
  Shield,
  Layers,
  BarChart3,
  Menu,
} from 'lucide-react';
import { Device } from '../types/tracker';

interface NavbarProps {
  devices: Device[];
  onOpenRegisterModal: () => void;
  onOpenHardwareModal: () => void;
  onOpenWordPressModal: () => void;
  onOpenAlertsDrawer: () => void;
  onOpenReportsModal: () => void;
  onOpenGeofencesModal: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  unreadAlertsCount: number;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  devices,
  onOpenRegisterModal,
  onOpenHardwareModal,
  onOpenWordPressModal,
  onOpenAlertsDrawer,
  onOpenReportsModal,
  onOpenGeofencesModal,
  isSimulating,
  onToggleSimulation,
  unreadAlertsCount,
  onToggleSidebar,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const movingCount = devices.filter((d) => d.status === 'moving' && !d.engineCutOff).length;

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between z-30 select-none shadow-sm">
      {/* Brand & Left Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title="منوی دستگاه‌ها"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-sm">
            <Navigation className="w-4 h-4 -rotate-45" />
          </div>
          <span className="font-black text-sm text-white tracking-wider font-mono">
            PROTRACK<span className="text-cyan-400 font-sans text-xs mr-1 font-bold">ناویار</span>
          </span>
        </div>

        {/* Live Status counter pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-400">متحرک:</span>
            <span className="font-mono font-bold text-emerald-400">{movingCount}</span>
          </div>
          <div className="w-px h-3 bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">کل:</span>
            <span className="font-mono font-bold text-slate-200">{devices.length}</span>
          </div>
        </div>
      </div>

      {/* Middle: Live Time */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
        <span className="font-mono text-cyan-400 font-semibold dir-ltr">{timeStr}</span>
      </div>

      {/* Right Tools - Clean Protrack Icons */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Toggle Live GPS Simulation */}
        <button
          onClick={onToggleSimulation}
          title={isSimulating ? 'توقف پایش زنده' : 'ادامه حرکت زنده'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
            isSimulating
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="text-[11px] hidden sm:inline">{isSimulating ? 'زنده' : 'متوقف'}</span>
        </button>

        {/* Hardware Connector */}
        <button
          onClick={onOpenHardwareModal}
          title="پیکربندی سخت‌افزار و پورت سرور"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700/80 cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px]">سخت‌افزار</span>
        </button>

        {/* WordPress Plugin */}
        <button
          onClick={onOpenWordPressModal}
          title="اتصال به افزونه وردپرس بر پایه IMEI"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700/80 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline text-[11px]">وردپرس</span>
        </button>

        {/* Reports */}
        <button
          onClick={onOpenReportsModal}
          title="گزارشات کارکرد"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Geofences */}
        <button
          onClick={onOpenGeofencesModal}
          title="حصارهای جغرافیایی"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlertsDrawer}
          title="هشدارهای هوشمند"
          className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
