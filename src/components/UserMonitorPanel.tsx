import React, { useState } from 'react';
import { Device, AlertNotification, Geofence } from '../types/tracker';
import { AuthSession } from '../types/auth';
import { Language, translations } from '../services/i18n';
import { MapTracker } from './MapTracker';
import { ProtrackSidebar } from './ProtrackSidebar';
import { ProtrackInfoBox } from './ProtrackInfoBox';
import { ProtrackPlaybackBar } from './ProtrackPlaybackBar';
import { AlertsDrawer } from './AlertsDrawer';
import {
  Navigation,
  User,
  LogOut,
  Bell,
  Play,
  Pause,
  Layers,
  ArrowRight,
  Shield,
  Smartphone,
  Eye,
  PanelRightOpen,
  PanelRightClose,
  Car,
} from 'lucide-react';

interface UserMonitorPanelProps {
  session: AuthSession;
  allDevices: Device[];
  onToggleEngineCut: (device: Device) => void;
  onLogout: () => void;
  onBackToDistributor?: () => void;
  isDistributorImpersonating?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  alerts: AlertNotification[];
  geofences: Geofence[];
  onMarkAllAlertsRead: () => void;
}

export const UserMonitorPanel: React.FC<UserMonitorPanelProps> = ({
  session,
  allDevices,
  onToggleEngineCut,
  onLogout,
  onBackToDistributor,
  isDistributorImpersonating,
  language,
  onLanguageChange,
  isSimulating,
  onToggleSimulation,
  alerts,
  geofences,
  onMarkAllAlertsRead,
}) => {
  const t = translations[language];

  // Filter only devices assigned to this specific user or the specific logged-in IMEI
  const userDevices = allDevices.filter((d) => {
    if (session.loginMethod === 'imei' && session.loginImei) {
      return d.imei === session.loginImei;
    }
    return session.user.assignedImeis.includes(d.imei);
  });

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(userDevices[0] || null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePlaybackDevice, setActivePlaybackDevice] = useState<Device | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const unreadAlertsCount = alerts.filter(
    (a) => !a.read && userDevices.some((d) => d.imei === a.imei)
  ).length;

  return (
    <div
      className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] overflow-hidden select-none"
      dir={language === 'fa' ? 'rtl' : 'ltr'}
    >
      {/* Top Header of User Panel */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-sm">
              <Navigation className="w-4 h-4 -rotate-45" />
            </div>
            <span className="font-mono font-black text-white text-sm tracking-wider">
              PROTRACK<span className="text-cyan-400 font-sans text-xs mr-1 font-bold">مشتری</span>
            </span>
          </div>

          {/* User profile badge */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white">{session.user.name}</span>
            <span className="text-slate-500 font-mono">({userDevices.length} خودرو)</span>
          </div>

          {isDistributorImpersonating && onBackToDistributor && (
            <button
              onClick={onBackToDistributor}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>بازگشت به پنل مدیریت فروشنده</span>
            </button>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 text-xs">
          {/* Explicit Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'نمایش مجدد فهرست خودروها (باکس راست)' : 'مخفی‌سازی فهرست خودروها'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              isSidebarCollapsed
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-cyan-400 text-cyan-200 shadow-md animate-pulse'
                : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpen className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <PanelRightClose className="w-3.5 h-3.5" />
            )}
            <span>{isSidebarCollapsed ? 'نمایش منوی راست (خودروها)' : 'مخفی‌سازی منو'}</span>
          </button>

          {/* Live GPS Simulation toggle */}
          <button
            onClick={onToggleSimulation}
            title={isSimulating ? 'توقف حرکت' : 'ادامه حرکت'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium cursor-pointer ${
              isSimulating
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span className="text-[10px] hidden sm:inline">{isSimulating ? 'زنده' : 'متوقف'}</span>
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => setIsAlertsOpen(true)}
            title={t.alerts}
            className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Language Switch */}
          <button
            onClick={() => onLanguageChange(language === 'fa' ? 'en' : 'fa')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold cursor-pointer"
          >
            {language === 'fa' ? 'EN' : 'فا'}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title={t.logout}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Map + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Protrack Left/Right Sidebar (Only user devices!) */}
        <ProtrackSidebar
          devices={userDevices}
          selectedDevice={selectedDevice}
          onSelectDevice={(dev) => setSelectedDevice(dev)}
          onOpenRegisterModal={() => {}}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          dir={language === 'fa' ? 'rtl' : 'ltr'}
        />

        {/* Full-bleed Map */}
        <div className="flex-1 h-full relative">
          <MapTracker
            devices={userDevices}
            selectedDevice={selectedDevice}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            geofences={geofences}
            showGeofences={true}
            showTrails={true}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Floating Protrack Info Box */}
          {selectedDevice && !activePlaybackDevice && (
            <ProtrackInfoBox
              device={selectedDevice}
              onClose={() => setSelectedDevice(null)}
              onOpenPlayback={(dev) => setActivePlaybackDevice(dev)}
              onToggleEngineCut={onToggleEngineCut}
              onOpenHardwareConfig={() => {}}
              onOpenWordPress={() => {}}
            />
          )}

          {/* Protrack Bottom Playback Bar */}
          {activePlaybackDevice && (
            <ProtrackPlaybackBar
              device={activePlaybackDevice}
              onClose={() => setActivePlaybackDevice(null)}
            />
          )}
        </div>
      </div>

      {/* Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts.filter((a) => userDevices.some((d) => d.imei === a.imei))}
        onMarkAllAsRead={onMarkAllAlertsRead}
        onSelectAlertDevice={(devId) => {
          const dev = userDevices.find((d) => d.id === devId);
          if (dev) {
            setSelectedDevice(dev);
            setIsAlertsOpen(false);
          }
        }}
      />
    </div>
  );
};
