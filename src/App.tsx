/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Device, AlertNotification, Geofence } from './types/tracker';
import { StorageService } from './services/storage';
import { stepSimulation } from './services/simulator';
import { MapTracker } from './components/MapTracker';
import { ProtrackSidebar } from './components/ProtrackSidebar';
import { ProtrackInfoBox } from './components/ProtrackInfoBox';
import { ProtrackPlaybackBar } from './components/ProtrackPlaybackBar';
import { Navbar } from './components/Navbar';
import { RegisterDeviceModal } from './components/RegisterDeviceModal';
import { LicenseStoreModal } from './components/LicenseStoreModal';
import { ActivateLicenseModal } from './components/ActivateLicenseModal';
import { AdminLicenseGeneratorModal } from './components/AdminLicenseGeneratorModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { HardwareConnectorModal } from './components/HardwareConnectorModal';
import { WordPressPluginGuideModal } from './components/WordPressPluginGuideModal';
import { GeofenceManagerModal } from './components/GeofenceManagerModal';
import { ReportsModal } from './components/ReportsModal';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Protrack-style sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Active Playback mode (Protrack docked bottom bar)
  const [activePlaybackDevice, setActivePlaybackDevice] = useState<Device | null>(null);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isHardwareOpen, setIsHardwareOpen] = useState(false);
  const [isWordPressOpen, setIsWordPressOpen] = useState(false);
  const [isGeofencesOpen, setIsGeofencesOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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
    showToast(`دستگاه [${newDevice.name}] با موفقیت ثبت شد.`);
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

    const alert: AlertNotification = {
      id: `alert_${Date.now()}`,
      deviceId: device.id,
      imei: device.imei,
      deviceName: device.name,
      type: 'engine_cut',
      message: newCutState
        ? `فرمان قطع کن موتور صادر شد - سوخت‌رسانی متوقف است.`
        : `فرمان وصل مجدد سوخت صادر شد - استارت مجاز است.`,
      timestamp: new Date().toISOString(),
      read: false,
      severity: newCutState ? 'high' : 'low',
    };
    StorageService.addAlert(alert);
    setAlerts(StorageService.getAlerts());

    showToast(
      newCutState
        ? `رله خاموش‌کن برای ${device.name} فعال شد (موتور متوقف گردید).`
        : `رله سوخت ${device.name} وصل شد.`,
      newCutState ? 'warning' : 'success'
    );
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

  const handleMarkAllAlertsRead = () => {
    StorageService.markAllAlertsAsRead();
    setAlerts(StorageService.getAlerts());
  };

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-['Vazirmatn',sans-serif] overflow-hidden select-none" dir="rtl">
      {/* Sleek Minimal Top Bar */}
      <Navbar
        devices={devices}
        onOpenRegisterModal={() => setIsRegisterOpen(true)}
        onOpenHardwareModal={() => setIsHardwareOpen(true)}
        onOpenWordPressModal={() => setIsWordPressOpen(true)}
        onOpenAlertsDrawer={() => setIsAlertsOpen(true)}
        onOpenReportsModal={() => setIsReportsOpen(true)}
        onOpenGeofencesModal={() => setIsGeofencesOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        unreadAlertsCount={unreadAlertsCount}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Map Workspace with Protrack-style Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Protrack Left Sidebar */}
        <ProtrackSidebar
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={(dev) => setSelectedDevice(dev)}
          onOpenRegisterModal={() => setIsRegisterOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* 100% Full Bleed Map */}
        <div className="flex-1 h-full relative">
          <MapTracker
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            geofences={geofences}
            showGeofences={true}
            showTrails={true}
          />

          {/* Floating Protrack Info Box (Clean & Unobtrusive) */}
          {selectedDevice && !activePlaybackDevice && (
            <ProtrackInfoBox
              device={selectedDevice}
              onClose={() => setSelectedDevice(null)}
              onOpenPlayback={(dev) => setActivePlaybackDevice(dev)}
              onToggleEngineCut={handleToggleEngineCut}
              onOpenHardwareConfig={() => setIsHardwareOpen(true)}
              onOpenWordPress={() => setIsWordPressOpen(true)}
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

      {/* Clean Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[800] bg-slate-900 border border-slate-700 text-white px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 text-xs">
          {toastMessage.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
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
        onLicenseActivated={() => setDevices(StorageService.getDevices())}
      />

      <ActivateLicenseModal
        isOpen={isActivateOpen}
        onClose={() => setIsActivateOpen(false)}
        devices={devices}
        onSuccess={() => setDevices(StorageService.getDevices())}
      />

      <AdminLicenseGeneratorModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onLicensesUpdated={() => setDevices(StorageService.getDevices())}
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
