/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Device, AlertNotification, Geofence } from './types/tracker';
import { StorageService } from './services/storage';
import { stepSimulation } from './services/simulator';
import { MapTracker } from './components/MapTracker';
import { DeviceListSidebar } from './components/DeviceListSidebar';
import { Navbar } from './components/Navbar';
import { RegisterDeviceModal } from './components/RegisterDeviceModal';
import { LicenseStoreModal } from './components/LicenseStoreModal';
import { ActivateLicenseModal } from './components/ActivateLicenseModal';
import { AdminLicenseGeneratorModal } from './components/AdminLicenseGeneratorModal';
import { HistoryPlaybackModal } from './components/HistoryPlaybackModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { HardwareConnectorModal } from './components/HardwareConnectorModal';
import { WordPressPluginGuideModal } from './components/WordPressPluginGuideModal';
import { GeofenceManagerModal } from './components/GeofenceManagerModal';
import { ReportsModal } from './components/ReportsModal';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Map display toggles
  const [showTrails, setShowTrails] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);
  const [isHardwareOpen, setIsHardwareOpen] = useState(false);
  const [isWordPressOpen, setIsWordPressOpen] = useState(false);
  const [isGeofencesOpen, setIsGeofencesOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [playbackDevice, setPlaybackDevice] = useState<Device | null>(null);
  const [activatePreselectedDevice, setActivatePreselectedDevice] = useState<Device | null>(null);

  // Mobile sidebar drawer
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load initial data
  useEffect(() => {
    const loadedDevices = StorageService.getDevices();
    const loadedGeofences = StorageService.getGeofences();
    const loadedAlerts = StorageService.getAlerts();
    setDevices(loadedDevices);
    setSelectedDevice(loadedDevices[0] || null);
    setGeofences(loadedGeofences);
    setAlerts(loadedAlerts);
  }, []);

  // Real-time GPS Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDevices((currentDevices) => {
        const updated = stepSimulation(currentDevices, (newAlert) => {
          setAlerts((prevAlerts) => {
            const nextAlerts = [newAlert, ...prevAlerts];
            StorageService.saveAlerts(nextAlerts);
            return nextAlerts;
          });
        });
        StorageService.saveDevices(updated);
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Keep selected device synced with updated telemetry
  useEffect(() => {
    if (!selectedDevice) return;
    const current = devices.find((d) => d.id === selectedDevice.id);
    if (current && (current.telemetry.latitude !== selectedDevice.telemetry.latitude || current.engineCutOff !== selectedDevice.engineCutOff)) {
      setSelectedDevice(current);
    }
  }, [devices, selectedDevice]);

  // Handlers
  const handleDeviceRegistered = (newDevice: Device) => {
    StorageService.addDevice(newDevice);
    setDevices(StorageService.getDevices());
    setSelectedDevice(newDevice);
    showToast(`دستگاه [${newDevice.name}] با کد IMEI ${newDevice.imei} با موفقیت ثبت شد.`);
  };

  const handleToggleEngineCut = (device: Device) => {
    const newCutState = !device.engineCutOff;
    const updatedDevice: Device = {
      ...device,
      engineCutOff: newCutState,
      status: newCutState ? 'stopped' : 'moving',
      telemetry: {
        ...device.telemetry,
        speed: newCutState ? 0 : device.telemetry.speed,
        ignition: newCutState ? false : true,
      },
    };

    StorageService.updateDevice(updatedDevice);
    setDevices(StorageService.getDevices());
    if (selectedDevice?.id === device.id) {
      setSelectedDevice(updatedDevice);
    }

    // Add alert log
    const alert: AlertNotification = {
      id: `alert_${Date.now()}`,
      deviceId: device.id,
      imei: device.imei,
      deviceName: device.name,
      type: 'engine_cut',
      message: newCutState
        ? `فرمان قطع کن موتور صادر شد - سوخت‌رسانی متوقف است.`
        : `فرمان وصل مجدد سوخت صادر شد - استارت و حرکت مجاز است.`,
      timestamp: new Date().toISOString(),
      read: false,
      severity: newCutState ? 'high' : 'low',
    };
    StorageService.addAlert(alert);
    setAlerts(StorageService.getAlerts());

    showToast(
      newCutState
        ? `رله خاموش‌کن برای ${device.name} فعال شد (موتور متوقف گردید).`
        : `رله سوخت ${device.name} وصل شد (آماده استارت).`,
      newCutState ? 'warning' : 'success'
    );
  };

  const handleOpenActivateLicense = (device?: Device) => {
    setActivatePreselectedDevice(device || null);
    setIsActivateOpen(true);
  };

  const handleOpenPlayback = (device: Device) => {
    setPlaybackDevice(device);
    setIsPlaybackOpen(true);
  };

  const handleRefreshAfterLicenseChange = () => {
    const refreshed = StorageService.getDevices();
    setDevices(refreshed);
    if (selectedDevice) {
      const updated = refreshed.find((d) => d.id === selectedDevice.id);
      if (updated) setSelectedDevice(updated);
    }
    showToast('وضعیت لایسنس دستگاه با موفقیت به‌روزرسانی شد.');
  };

  const handleResetDemo = () => {
    StorageService.resetDemoData();
    const refreshed = StorageService.getDevices();
    setDevices(refreshed);
    setSelectedDevice(refreshed[0] || null);
    setGeofences(StorageService.getGeofences());
    setAlerts(StorageService.getAlerts());
    showToast('داده‌های دموی ردیاب‌ها و مسیرها بازنشانی گردید.');
  };

  const handleMarkAllAlertsRead = () => {
    StorageService.markAllAlertsAsRead();
    setAlerts(StorageService.getAlerts());
  };

  const handleHardwarePacketInjected = (imei: string, lat: number, lng: number, speed: number) => {
    setDevices((currentDevices) => {
      const idx = currentDevices.findIndex((d) => d.imei === imei);
      if (idx === -1) return currentDevices;
      const dev = currentDevices[idx];
      const updatedDev: Device = {
        ...dev,
        status: speed > 0 ? 'moving' : 'stopped',
        historyTrail: [...dev.historyTrail, [lat, lng]],
        telemetry: {
          ...dev.telemetry,
          latitude: lat,
          longitude: lng,
          speed,
          lastUpdate: new Date().toISOString(),
        },
      };
      const updated = [...currentDevices];
      updated[idx] = updatedDev;
      StorageService.saveDevices(updated);
      if (selectedDevice?.id === dev.id) {
        setSelectedDevice(updatedDev);
      }
      return updated;
    });
    showToast(`موقعیت سخت‌افزار IMEI [${imei}] با پکت دریافتی به‌روز شد.`);
  };

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-['Vazirmatn',sans-serif] overflow-hidden select-none" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        onOpenRegisterModal={() => setIsRegisterOpen(true)}
        onOpenStoreModal={() => setIsStoreOpen(true)}
        onOpenActivateLicenseModal={() => handleOpenActivateLicense()}
        onOpenAdminModal={() => setIsAdminOpen(true)}
        onOpenAlertsDrawer={() => setIsAlertsOpen(true)}
        onOpenHardwareModal={() => setIsHardwareOpen(true)}
        onOpenWordPressModal={() => setIsWordPressOpen(true)}
        onOpenGeofencesModal={() => setIsGeofencesOpen(true)}
        onOpenReportsModal={() => setIsReportsOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onResetDemo={handleResetDemo}
        unreadAlertsCount={unreadAlertsCount}
        showTrails={showTrails}
        onToggleTrails={() => setShowTrails(!showTrails)}
        showGeofences={showGeofences}
        onToggleGeofences={() => setShowGeofences(!showGeofences)}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Workspace: Sidebar + Map */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full">
          <DeviceListSidebar
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
            onOpenActivateLicenseModal={handleOpenActivateLicense}
            onOpenStoreModal={() => setIsStoreOpen(true)}
            onToggleEngineCut={handleToggleEngineCut}
            onOpenPlayback={handleOpenPlayback}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[500] flex bg-slate-950/70 backdrop-blur-sm md:hidden">
            <div className="w-5/6 max-w-sm h-full bg-slate-900 flex flex-col shadow-2xl animate-in slide-in-from-right">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <span className="font-bold text-xs text-white">لیست دستگاه‌ها و خودروها</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <DeviceListSidebar
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onSelectDevice={(dev) => {
                    setSelectedDevice(dev);
                    setIsMobileSidebarOpen(false);
                  }}
                  onOpenRegisterModal={() => {
                    setIsMobileSidebarOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  onOpenActivateLicenseModal={(dev) => {
                    setIsMobileSidebarOpen(false);
                    handleOpenActivateLicense(dev);
                  }}
                  onOpenStoreModal={() => {
                    setIsMobileSidebarOpen(false);
                    setIsStoreOpen(true);
                  }}
                  onToggleEngineCut={handleToggleEngineCut}
                  onOpenPlayback={(dev) => {
                    setIsMobileSidebarOpen(false);
                    handleOpenPlayback(dev);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Leaflet & OpenStreetMap Live Tracker */}
        <div className="flex-1 h-full relative">
          <MapTracker
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            geofences={geofences}
            showGeofences={showGeofences}
            showTrails={showTrails}
          />

          {/* Floating Live Telemetry HUD for Selected Device */}
          <TelemetryDrawer
            device={selectedDevice}
            onClose={() => setSelectedDevice(null)}
            onToggleEngineCut={handleToggleEngineCut}
            onOpenPlayback={handleOpenPlayback}
            onOpenLicenseRenew={handleOpenActivateLicense}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[800] bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in zoom-in-95">
          {toastMessage.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <RegisterDeviceModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onDeviceRegistered={handleDeviceRegistered}
      />

      <LicenseStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        devices={devices}
        onLicenseActivated={handleRefreshAfterLicenseChange}
      />

      <ActivateLicenseModal
        isOpen={isActivateOpen}
        onClose={() => setIsActivateOpen(false)}
        devices={devices}
        preSelectedDevice={activatePreselectedDevice}
        onSuccess={handleRefreshAfterLicenseChange}
      />

      <AdminLicenseGeneratorModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onLicensesUpdated={handleRefreshAfterLicenseChange}
      />

      <HistoryPlaybackModal
        isOpen={isPlaybackOpen}
        onClose={() => setIsPlaybackOpen(false)}
        device={playbackDevice}
      />

      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onMarkAllAsRead={handleMarkAllAlertsRead}
        onSelectAlertDevice={(devId) => {
          const dev = devices.find((d) => d.id === devId);
          if (dev) {
            setSelectedDevice(dev);
            setIsAlertsOpen(false);
          }
        }}
      />

      <HardwareConnectorModal
        isOpen={isHardwareOpen}
        onClose={() => setIsHardwareOpen(false)}
        devices={devices}
        onHardwarePacketInjected={handleHardwarePacketInjected}
      />

      <WordPressPluginGuideModal
        isOpen={isWordPressOpen}
        onClose={() => setIsWordPressOpen(false)}
      />

      <GeofenceManagerModal
        isOpen={isGeofencesOpen}
        onClose={() => setIsGeofencesOpen(false)}
        geofences={geofences}
        devices={devices}
        onGeofencesUpdated={() => setGeofences(StorageService.getGeofences())}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        devices={devices}
      />
    </div>
  );
}
