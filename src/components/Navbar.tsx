import React, { useState, useEffect } from 'react';
import {
  Navigation,
  KeyRound,
  PlusCircle,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  Menu,
  Cpu,
  Globe,
} from 'lucide-react';
import { AlertNotification } from '../types/tracker';

interface NavbarProps {
  onOpenRegisterModal: () => void;
  onOpenStoreModal: () => void;
  onOpenActivateLicenseModal: () => void;
  onOpenAdminModal: () => void;
  onOpenAlertsDrawer: () => void;
  onOpenHardwareModal: () => void;
  onOpenWordPressModal: () => void;
  onOpenGeofencesModal: () => void;
  onOpenReportsModal: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetDemo: () => void;
  unreadAlertsCount: number;
  showTrails: boolean;
  onToggleTrails: () => void;
  showGeofences: boolean;
  onToggleGeofences: () => void;
  onToggleSidebarMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegisterModal,
  onOpenStoreModal,
  onOpenActivateLicenseModal,
  onOpenAdminModal,
  onOpenAlertsDrawer,
  onOpenHardwareModal,
  onOpenWordPressModal,
  onOpenGeofencesModal,
  onOpenReportsModal,
  isSimulating,
  onToggleSimulation,
  onResetDemo,
  unreadAlertsCount,
  showTrails,
  onToggleTrails,
  showGeofences,
  onToggleGeofences,
  onToggleSidebarMobile,
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

  return (
    <header className="h-16 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none backdrop-blur-md">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebarMobile}
          className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Navigation className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black text-white tracking-tight">
                سامانه ردیابی آنلاین ناویار
              </h1>
              <span className="hidden sm:inline-block text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                FLEET v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              پنل پایش موقعیت سخت‌افزار، تله‌متری و وب‌سرویس ووکامرس
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Live Clock & Navigation Shortcuts */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] text-slate-400">زمان زنده:</span>
          <span className="font-mono font-bold text-cyan-400 dir-ltr">{timeStr}</span>
        </div>

        <div className="w-px h-4 bg-slate-800 mx-1"></div>

        {/* Play/Pause Simulation button */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
            isSimulating
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
          title={isSimulating ? 'توقف موقت پایش زنده' : 'ادامه حرکت زنده خودروها'}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="text-[11px]">{isSimulating ? 'پایش زنده فعال' : 'شبیه‌ساز متوقف'}</span>
        </button>

        {/* Trail & Geofence Toggles */}
        <button
          onClick={onToggleTrails}
          className={`px-2 py-1 rounded-xl text-[11px] transition-colors cursor-pointer ${
            showTrails ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
          title="نمایش ردپای مسیر"
        >
          ردپا
        </button>
        <button
          onClick={onOpenGeofencesModal}
          className={`px-2 py-1 rounded-xl text-[11px] transition-colors cursor-pointer ${
            showGeofences ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
          title="مدیریت حصارهای جغرافیایی"
        >
          حصارها
        </button>

        <button
          onClick={onOpenReportsModal}
          className="px-2 py-1 rounded-xl text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          title="گزارشات و آمار ناوگان"
        >
          گزارشات
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Hardware Connector Modal Button */}
        <button
          onClick={onOpenHardwareModal}
          className="flex items-center gap-1.5 py-2 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm"
          title="تنظیمات و پورت اتصال سخت‌افزار ردیاب"
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">اتصال سخت‌افزار</span>
        </button>

        {/* WordPress Plugin Button */}
        <button
          onClick={onOpenWordPressModal}
          className="flex items-center gap-1.5 py-2 px-2.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm"
          title="افزونه ووکامرس / وردپرس"
        >
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">افزونه وردپرس</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlertsDrawer}
          className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="هشدارهای هوشمند"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow">
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
