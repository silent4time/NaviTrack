import React, { useState } from 'react';
import { Device, AssetType } from '../types/tracker';
import { validateIMEI, generateLicenseKey } from '../services/storage';
import {
  X,
  Smartphone,
  Car,
  Truck,
  Bike,
  ShieldCheck,
  AlertCircle,
  Hash,
  User,
  Phone,
  Layers,
} from 'lucide-react';

interface RegisterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceRegistered: (newDevice: Device) => void;
}

const COMMON_TRACKER_MODELS = [
  'Teltonika FMB920 (اروپا)',
  'Concox GT06N / WeTrack2',
  'SinoTrack ST-901 / ST-906',
  'Coban TK103 / TK303',
  'Queclink GV50 / GL300',
  'ردیاب آهنربایی پرتابل بدون سیم‌کشی',
  'ردیاب شخصی / همراه پرسنلی',
  'سایر مدل‌های پروتکل GT06/JT808',
];

export const RegisterDeviceModal: React.FC<RegisterDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceRegistered,
}) => {
  const [imei, setImei] = useState('');
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState(COMMON_TRACKER_MODELS[0]);
  const [assetType, setAssetType] = useState<AssetType>('car');
  const [simNumber, setSimNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const imeiValidation = validateIMEI(imei);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imeiValidation.isValid) {
      setErrorMsg(imeiValidation.message);
      return;
    }

    if (!name.trim()) {
      setErrorMsg('لطفاً عنوان یا نام شناسایی وسیله نقلیه را وارد کنید.');
      return;
    }

    // Default start coords (Tehran center around Enqelab or Hemmat)
    const startLat = 35.7000 + (Math.random() - 0.5) * 0.08;
    const startLng = 51.3900 + (Math.random() - 0.5) * 0.08;

    const initialLicenseKey = generateLicenseKey('NVTRK');

    const newDevice: Device = {
      id: `dev_${Date.now()}`,
      imei: imei.trim(),
      name: name.trim(),
      plateNumber: plateNumber.trim() || '۱۱ الف ۱۲۳ ایران ۱۱',
      model,
      assetType,
      simNumber: simNumber.trim() || '۰۹۱۲۰۰۰۰۰۰۰',
      ownerName: ownerName.trim() || 'کاربر جدید',
      status: 'moving',
      engineCutOff: false,
      telemetry: {
        latitude: Number(startLat.toFixed(6)),
        longitude: Number(startLng.toFixed(6)),
        speed: 65,
        heading: Math.floor(Math.random() * 360),
        altitude: 1250,
        satellites: 12,
        accuracy: 2.5,
        ignition: true,
        batteryVoltage: assetType === 'truck' ? 24.2 : 12.8,
        backupBatteryPercent: 100,
        gsmSignalPercent: 90,
        odometer: 1200,
        engineTemp: 82,
        fuelLevelPercent: 85,
        lastUpdate: new Date().toISOString(),
      },
      license: {
        licenseKey: initialLicenseKey,
        planName: 'اشتراک تست اولیه ۱ ماهه (هدیه ثبت)',
        planDurationMonths: 1,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        isExpired: false,
        status: 'active',
        features: {
          smsAlerts: true,
          geofenceLimit: 2,
          historyDays: 30,
          remoteImmobilizer: true,
        },
      },
      historyTrail: [[startLat, startLng]],
      createdAt: new Date().toISOString(),
    };

    onDeviceRegistered(newDevice);
    onClose();
  };

  // Quick filler for testing
  const handleFillDemo = () => {
    // Generate valid 15-digit Luhn IMEI
    const demoImeis = [
      '862908041539201',
      '358249091823704',
      '867493038491206',
      '861937049827365',
      '864392049182740',
    ];
    const pickedImei = demoImeis[Math.floor(Math.random() * demoImeis.length)];
    setImei(pickedImei);
    setName('تارا اتوماتیک نقره‌ای');
    setPlateNumber('۴۴ ب ۷۸۲ ایران ۲۱');
    setModel('Teltonika FMB920 (اروپا)');
    setAssetType('car');
    setSimNumber('09129876543');
    setOwnerName('امیرحسین کریمی');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ثبت دستگاه جدید با IMEI</h3>
              <p className="text-xs text-slate-400 mt-0.5">افزودن ردیاب خودرو، موتورسیکلت یا پرسنلی به پنل مانیتورینگ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Fill */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>+ پرکردن خودکار با مشخصات نمونه</span>
            </button>
          </div>

          {/* IMEI Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              کد شناسه ۱۵ رقمی سخت‌افزار (IMEI) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={15}
                value={imei}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setImei(val);
                  setErrorMsg('');
                }}
                placeholder="مثال: 862908041539201"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                dir="ltr"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">
                {imei.length}/15
              </span>
            </div>

            {/* Live IMEI Validation Status */}
            {imei.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                {imeiValidation.isValid ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    کد IMEI معتبر و استاندارد است
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {imeiValidation.message}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Asset Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نوع وسیله نقلیه
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAssetType('car')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  assetType === 'car'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Car className="w-5 h-5 mb-1" />
                <span>سواری / وانت</span>
              </button>
              <button
                type="button"
                onClick={() => setAssetType('truck')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  assetType === 'truck'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Truck className="w-5 h-5 mb-1" />
                <span>کامیون / خاور</span>
              </button>
              <button
                type="button"
                onClick={() => setAssetType('motorcycle')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  assetType === 'motorcycle'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bike className="w-5 h-5 mb-1" />
                <span>موتورسیکلت</span>
              </button>
            </div>
          </div>

          {/* Name & Plate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                عنوان / نام وسیله نقلیه <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: دنا پلاس توربو مشکی"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شماره پلاک خودرو
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="مثال: ۲۲ د ۳۴۵ ایران ۸۸"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Tracker Model & SIM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مدل سخت‌افزار ردیاب
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {COMMON_TRACKER_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شماره سیم‌کارت داخل دستگاه
              </label>
              <input
                type="text"
                value={simNumber}
                onChange={(e) => setSimNumber(e.target.value)}
                placeholder="مثال: 09121234567"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Driver / Owner Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نام مالک یا راننده مسئول
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="مثال: مهندس احمدی"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Gift License Notice */}
          <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-800/50 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              🎁
            </div>
            <div className="text-xs">
              <span className="font-bold text-cyan-300">۱ ماه اشتراک رایگان هدیه ثبت نام:</span>
              <p className="text-slate-400 mt-0.5">پس از ثبت دستگاه، ۱ ماه لایسنس فعال با دسترسی کامل به نقشه و رله تقدیم می‌گردد.</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex items-center gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!imeiValidation.isValid}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                imeiValidation.isValid
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              تأیید و ثبت دستگاه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
