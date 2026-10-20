/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Device, AlertNotification, Geofence } from './types/tracker';
import { AuthSession, UserAccount } from './types/auth';
import { Language } from './services/i18n';
import { StorageService } from './services/storage';
import { stepSimulation } from './services/simulator';
import { LoginPage } from './components/LoginPage';
import { DistributorPanel } from './components/DistributorPanel';
import { UserMonitorPanel } from './components/UserMonitorPanel';
import { HardwareConnectorModal } from './components/HardwareConnectorModal';
import { WordPressPluginGuideModal } from './components/WordPressPluginGuideModal';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('fa');
  const [session, setSession] = useState<AuthSession | null>(() => {
    const existing = StorageService.getCurrentSession();
    if (existing) return existing;
    const defaultAuth = StorageService.authenticateByAccount('dealer', '123456');
    return defaultAuth.session || null;
  });
  const [impersonatedUser, setImpersonatedUser] = useState<UserAccount | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Modals accessible from distributor or user
  const [isHardwareOpen, setIsHardwareOpen] = useState(false);
  const [isWordPressOpen, setIsWordPressOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load initial data
  useEffect(() => {
    setDevices(StorageService.getDevices());
    setGeofences(StorageService.getGeofences());
    setAlerts(StorageService.getAlerts());
  }, []);

  // Simulation Loop
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

  // Auth Handlers
  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setImpersonatedUser(null);
    showToast(`با موفقیت وارد شدید: ${newSession.user.name}`);
  };

  const handleLogout = () => {
    StorageService.setCurrentSession(null);
    setSession(null);
    setImpersonatedUser(null);
    showToast('از حساب کاربری خارج شدید.');
  };

  const handleSwitchToUserMonitor = (targetUser: UserAccount) => {
    setImpersonatedUser(targetUser);
    showToast(`در حال مشاهده پنل مانیتورینگ مشتری: ${targetUser.name}`);
  };

  const handleBackToDistributor = () => {
    setImpersonatedUser(null);
    showToast('به پنل مدیریت فروشنده بازگشتید.');
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
      return updated;
    });
    showToast(`موقعیت سخت‌افزار IMEI [${imei}] با پکت دریافتی به‌روز شد.`);
  };

  // If Not logged in, render the Protrack Login Page
  if (!session) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  // Active Effective User
  const isDistributor = session.user.role === 'distributor';
  const effectiveUser = impersonatedUser || session.user;

  // Render effective session for user view
  const effectiveSession: AuthSession = {
    ...session,
    user: effectiveUser,
  };

  return (
    <div className="font-['Vazirmatn',sans-serif]">
      {/* If Distributor and not viewing as client -> Distributor Panel */}
      {isDistributor && !impersonatedUser ? (
        <DistributorPanel
          session={session}
          devices={devices}
          onDevicesUpdated={() => setDevices(StorageService.getDevices())}
          onSwitchToUserMonitor={handleSwitchToUserMonitor}
          onLogout={handleLogout}
          language={language}
          onLanguageChange={setLanguage}
          onOpenHardwareGateway={() => setIsHardwareOpen(true)}
          onOpenWordPressGuide={() => setIsWordPressOpen(true)}
          onToggleEngineCut={handleToggleEngineCut}
        />
      ) : (
        /* End-User / Client Panel (Only their own assigned devices!) */
        <UserMonitorPanel
          session={effectiveSession}
          allDevices={devices}
          onToggleEngineCut={handleToggleEngineCut}
          onLogout={handleLogout}
          onBackToDistributor={isDistributor ? handleBackToDistributor : undefined}
          isDistributorImpersonating={Boolean(isDistributor && impersonatedUser)}
          language={language}
          onLanguageChange={setLanguage}
          isSimulating={isSimulating}
          onToggleSimulation={() => setIsSimulating(!isSimulating)}
          alerts={alerts}
          geofences={geofences}
          onMarkAllAlertsRead={() => {
            StorageService.markAllAlertsAsRead();
            setAlerts(StorageService.getAlerts());
          }}
        />
      )}

      {/* Floating Toast Notification */}
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

      {/* Hardware Connector Modal */}
      <HardwareConnectorModal
        isOpen={isHardwareOpen}
        onClose={() => setIsHardwareOpen(false)}
        devices={devices}
        onHardwarePacketInjected={handleHardwarePacketInjected}
      />

      {/* WordPress WooCommerce Plugin Guide Modal */}
      <WordPressPluginGuideModal
        isOpen={isWordPressOpen}
        onClose={() => setIsWordPressOpen(false)}
      />
    </div>
  );
}
