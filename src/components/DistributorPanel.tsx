import React, { useState } from 'react';
import { Device } from '../types/tracker';
import { UserAccount, AuthSession } from '../types/auth';
import { StorageService, validateIMEI } from '../services/storage';
import { Language, translations } from '../services/i18n';
import { MapTracker } from './MapTracker';
import { ProtrackSidebar } from './ProtrackSidebar';
import { ProtrackInfoBox } from './ProtrackInfoBox';
import { ProtrackPlaybackBar } from './ProtrackPlaybackBar';
import {
  Users,
  Cpu,
  Plus,
  KeyRound,
  Shield,
  Smartphone,
  Car,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  LogOut,
  MapPin,
  RefreshCw,
  Layers,
  ChevronRight,
  UserCheck,
  UserPlus,
  Navigation,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';

interface DistributorPanelProps {
  session: AuthSession;
  devices: Device[];
  onDevicesUpdated: () => void;
  onSwitchToUserMonitor: (user: UserAccount) => void;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenHardwareGateway: () => void;
  onOpenWordPressGuide: () => void;
  onToggleEngineCut?: (device: Device) => void;
}

export const DistributorPanel: React.FC<DistributorPanelProps> = ({
  session,
  devices,
  onDevicesUpdated,
  onSwitchToUserMonitor,
  onLogout,
  language,
  onLanguageChange,
  onOpenHardwareGateway,
  onOpenWordPressGuide,
  onToggleEngineCut,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'monitor' | 'devices' | 'users'>('monitor');
  const [users, setUsers] = useState<UserAccount[]>(StorageService.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(devices[0] || null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePlaybackDevice, setActivePlaybackDevice] = useState<Device | null>(null);

  // Add device form
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newImei, setNewImei] = useState('');
  const [newName, setNewName] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('Teltonika FMB920');
  const [newSim, setNewSim] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [deviceError, setDeviceError] = useState('');

  // Create user form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [userError, setUserError] = useState('');

  // Assign modal
  const [assignDeviceImei, setAssignDeviceImei] = useState<string | null>(null);

  const handleRegisterDevice = (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceError('');

    const validation = validateIMEI(newImei);
    if (!validation.isValid) {
      setDeviceError(validation.message);
      return;
    }

    if (devices.some((d) => d.imei === newImei.trim())) {
      setDeviceError('دستگاهی با این کد IMEI قبلاً در سامانه ثبت شده است.');
      return;
    }

    const startLat = 35.735 + (Math.random() - 0.5) * 0.05;
    const startLng = 51.39 + (Math.random() - 0.5) * 0.05;

    const newDevice: Device = {
      id: `dev_${Date.now()}`,
      imei: newImei.trim(),
      name: newName.trim() || `خودرو ${newImei.slice(-4)}`,
      plateNumber: newPlate.trim() || '۲۴ ج ۵۸۱ ایران ۱۱',
      model: newModel,
      assetType: 'car',
      simNumber: newSim.trim() || '09120000000',
      ownerName: users.find((u) => u.id === targetUserId)?.name || 'مشتری جدید',
      status: 'moving',
      engineCutOff: false,
      telemetry: {
        latitude: Number(startLat.toFixed(6)),
        longitude: Number(startLng.toFixed(6)),
        speed: 60,
        heading: 90,
        altitude: 1250,
        satellites: 14,
        accuracy: 2.0,
        ignition: true,
        batteryVoltage: 12.8,
        backupBatteryPercent: 100,
        gsmSignalPercent: 95,
        odometer: 1500,
        lastUpdate: new Date().toISOString(),
      },
      license: {
        licenseKey: `NVTRK-DIST-${Date.now().toString(36).toUpperCase()}`,
        planName: 'اشتراک سالانه (فعال شده توسط نماینده)',
        planDurationMonths: 12,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        isExpired: false,
        status: 'active',
        features: {
          smsAlerts: true,
          geofenceLimit: 10,
          historyDays: 365,
          remoteImmobilizer: true,
        },
      },
      historyTrail: [[startLat, startLng]],
      createdAt: new Date().toISOString(),
    };

    StorageService.addDevice(newDevice);

    if (targetUserId) {
      StorageService.assignDeviceToUser(newDevice.imei, targetUserId);
      setUsers(StorageService.getUsers());
    }

    onDevicesUpdated();
    setShowAddDeviceModal(false);
    setNewImei('');
    setNewName('');
    setNewPlate('');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (!newUsername.trim()) {
      setUserError('نام کاربری الزامی است.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setUserError('این نام کاربری قبلاً انتخاب شده است.');
      return;
    }

    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      name: newUserName.trim() || newUsername.trim(),
      email: newUserEmail.trim() || `${newUsername.trim()}@client.local`,
      phone: newUserPhone.trim() || '09000000000',
      role: 'user',
      companyName: newUserCompany.trim(),
      assignedImeis: [],
      createdAt: new Date().toISOString(),
    };

    StorageService.addUser(newUser);
    setUsers(StorageService.getUsers());
    setShowAddUserModal(false);
    setNewUsername('');
    setNewUserName('');
    setNewUserPhone('');
  };

  const handleAssignDevice = (imei: string, userId: string) => {
    StorageService.assignDeviceToUser(imei, userId);
    setUsers(StorageService.getUsers());
    setAssignDeviceImei(null);
  };

  const getAssignedUserName = (imei: string) => {
    const found = users.find((u) => u.assignedImeis.includes(imei));
    return found ? found.name : 'آزاد (موجود در انبار نماینده)';
  };

  return (
    <div
      className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] select-none overflow-hidden"
      dir={language === 'fa' ? 'rtl' : 'ltr'}
    >
      {/* Top Header of Distributor Protrack Business Management */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-white text-sm tracking-wider">
                PROTRACK<span className="text-cyan-400 font-sans text-xs mr-1 font-bold">بیزنس</span>
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t.roleDistributor}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {session.user.name} ({session.user.companyName || 'پنل فروشنده'})
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'monitor' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 -rotate-45" />
            <span>{t.tabMonitor}</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'devices' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.tabDevices} ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabUsers} ({users.filter((u) => u.role === 'user').length})</span>
          </button>
        </div>

        {/* Actions / User Switcher / Logout */}
        <div className="flex items-center gap-2 text-xs">
          {/* Sidebar Toggle when on Monitor tab */}
          {activeTab === 'monitor' && (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'نمایش مجدد فهرست خودروها (باکس راست)' : 'مخفی‌سازی فهرست خودروها'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
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
              <span>{isSidebarCollapsed ? 'نمایش منوی راست' : 'مخفی‌سازی منو'}</span>
            </button>
          )}

          {/* Quick Monitor Switch */}
          {users.find((u) => u.role === 'user') && (
            <button
              onClick={() => onSwitchToUserMonitor(users.find((u) => u.role === 'user')!)}
              className="hidden md:flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>مشاهده مانیتورینگ مشتری</span>
            </button>
          )}

          {/* Hardware Gateway */}
          <button
            onClick={onOpenHardwareGateway}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer"
            title="پورت و اتصال سخت‌افزار"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Language Switch */}
          <button
            onClick={() => onLanguageChange(language === 'fa' ? 'en' : 'fa')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold cursor-pointer"
          >
            {language === 'fa' ? 'EN' : 'فا'}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title={t.logout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden ${activeTab === 'monitor' ? 'p-0 flex' : 'p-5 overflow-y-auto max-w-7xl mx-auto w-full'}`}>
        {/* Live Map Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="flex-1 flex overflow-hidden relative h-full w-full">
            <ProtrackSidebar
              devices={devices}
              selectedDevice={selectedDevice}
              onSelectDevice={(dev) => setSelectedDevice(dev)}
              onOpenRegisterModal={() => setShowAddDeviceModal(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              dir={language === 'fa' ? 'rtl' : 'ltr'}
            />
            <div className="flex-1 h-full relative">
              <MapTracker
                devices={devices}
                selectedDevice={selectedDevice}
                onSelectDevice={(dev) => setSelectedDevice(dev)}
                geofences={[]}
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
                  onToggleEngineCut={(dev) => onToggleEngineCut?.(dev)}
                  onOpenHardwareConfig={onOpenHardwareGateway}
                  onOpenWordPress={onOpenWordPressGuide}
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
        )}

        {/* Device Management Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی IMEI، نام، پلاک یا مشتری..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className="flex-1 sm:flex-initial py-2 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addDevice}</span>
                </button>
              </div>
            </div>

            {/* Devices Inventory Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-3">کد سخت‌افزار (IMEI)</th>
                      <th className="p-3">نام و مشخصات وسیله</th>
                      <th className="p-3">مدل ردیاب</th>
                      <th className="p-3">مشتری منتسب</th>
                      <th className="p-3">وضعیت لایسنس</th>
                      <th className="p-3">وضعیت اتصال</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {devices.map((dev) => {
                      const isAssigned = users.some((u) => u.assignedImeis.includes(dev.imei));
                      const assignedUser = users.find((u) => u.assignedImeis.includes(dev.imei));

                      return (
                        <tr key={dev.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="p-3 font-mono font-bold text-cyan-300">
                            {dev.imei}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{dev.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {dev.plateNumber}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300">{dev.model}</td>
                          <td className="p-3">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[11px]">
                                <UserCheck className="w-3 h-3" />
                                {assignedUser?.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                                در انبار نماینده
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-semibold text-[11px]">
                              {dev.license.status === 'active' ? 'فعال (۱۲ ماهه)' : 'منقضی'}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              تا {new Date(dev.license.expiresAt).toLocaleDateString('fa-IR')}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dev.status === 'moving'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${dev.status === 'moving' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                              {dev.status === 'moving' ? `${dev.telemetry.speed} km/h` : 'توقف'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setAssignDeviceImei(dev.imei)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-medium"
                              >
                                {isAssigned ? 'تغییر مشتری' : 'واگذاری'}
                              </button>
                              <button
                                onClick={() => {
                                  const months = 12;
                                  const base = Math.max(Date.now(), new Date(dev.license.expiresAt).getTime());
                                  const newExpiry = new Date(base + months * 30 * 86400000).toISOString();
                                  const updated = {
                                    ...dev,
                                    license: {
                                      ...dev.license,
                                      status: 'active' as const,
                                      isExpired: false,
                                      expiresAt: newExpiry,
                                      activatedAt: new Date().toISOString(),
                                      planName: 'تمدید ۱۲ ماهه (ادمین)',
                                    },
                                  };
                                  StorageService.updateDevice(updated);
                                  onDevicesUpdated();
                                }}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-medium"
                              >
                                تمدید لایسنس
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Client Accounts Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">حساب‌های کاربری مشتریان (Client Users)</h3>
                <p className="text-xs text-slate-400">مشتریان فقط دستگاه‌هایی را که شما به آن‌ها منتسب کرده‌اید در پنل خود مشاهده می‌کنند.</p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.createUser}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {users.filter((u) => u.role === 'user').map((client) => {
                const clientVehicles = devices.filter((d) => client.assignedImeis.includes(d.imei));

                return (
                  <div
                    key={client.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{client.name}</h4>
                        <p className="text-slate-400 text-xs font-mono mt-0.5">نام کاربری: {client.username}</p>
                      </div>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                        {clientVehicles.length} دستگاه
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>تماس: <span className="text-slate-200 font-mono">{client.phone}</span></div>
                      <div>شرکت: <span className="text-slate-200">{client.companyName || 'شخصی'}</span></div>
                      <div className="pt-1 text-[11px] text-cyan-300">
                        رمز ورود پیش‌فرض مشتری: <span className="font-mono font-bold">123456</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSwitchToUserMonitor(client)}
                        className="flex-1 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ورود به پنل این مشتری</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Device Modal (Distributor) */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">ثبت سخت‌افزار ردیاب جدید در انبار نماینده</h4>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {deviceError && (
              <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">شناسه ۱۵ رقمی IMEI سخت‌افزار:</label>
                <input
                  type="text"
                  maxLength={15}
                  value={newImei}
                  onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 864392049182740"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm tracking-wider dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">نام وسیله نقلیه:</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: دنا پلاس سفید"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">پلاک خودرو:</label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    placeholder="مثال: ۶۵ ج ۱۲۴ ایران ۷۷"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">مدل سخت‌افزار:</label>
                  <select
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Teltonika FMB920">Teltonika FMB920</option>
                    <option value="Concox GT06N">Concox GT06N</option>
                    <option value="SinoTrack ST-901">SinoTrack ST-901</option>
                    <option value="Coban TK103">Coban TK103</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">واگذاری به حساب مشتری:</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- بدون انتصاب (موجود در انبار) --</option>
                    {users.filter((u) => u.role === 'user').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  ثبت دستگاه و فعال‌سازی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">ایجاد حساب کاربری جدید برای مشتری</h4>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {userError && (
              <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نام کاربری مشتری (جهت ورود به سیستم):</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="مثال: ahmadi"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono dir-ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: مهندس حسام احمدی"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">شماره همراه مشتری:</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="09120000000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono dir-ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">نام سازمان / شرکت:</label>
                  <input
                    type="text"
                    value={newUserCompany}
                    onChange={(e) => setNewUserCompany(e.target.value)}
                    placeholder="اختیاری"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-cyan-300 border border-slate-800">
                رمز عبور پیش‌فرض برای مشتری جدید **123456** خواهد بود.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  ایجاد حساب مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Device to User Modal */}
      {assignDeviceImei && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl text-xs">
            <h4 className="font-bold text-white text-sm">واگذاری دستگاه به مشتری</h4>
            <p className="text-slate-400">
              دستگاه با IMEI <span className="text-cyan-300 font-mono">{assignDeviceImei}</span> به کدام حساب مشتری اختصاص یابد؟
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              <button
                onClick={() => handleAssignDevice(assignDeviceImei, '')}
                className="w-full p-2.5 text-right rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 cursor-pointer"
              >
                بدون انتصاب (بازگشت به انبار آزاد)
              </button>
              {users.filter((u) => u.role === 'user').map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleAssignDevice(assignDeviceImei, u.id)}
                  className="w-full p-2.5 text-right rounded-xl bg-slate-950 hover:bg-cyan-600/20 border border-slate-800 text-white font-medium cursor-pointer"
                >
                  {u.name} ({u.username})
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setAssignDeviceImei(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
