import React, { useState, useEffect } from 'react';
import { StorageService, StoredLicenseRecord } from '../services/storage';
import { Device } from '../types/tracker';
import confetti from 'canvas-confetti';
import {
  X,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  CheckCircle,
  Copy,
  Sparkles,
} from 'lucide-react';

interface ActivateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  preSelectedDevice?: Device | null;
  onSuccess: () => void;
}

export const ActivateLicenseModal: React.FC<ActivateLicenseModalProps> = ({
  isOpen,
  onClose,
  devices,
  preSelectedDevice,
  onSuccess,
}) => {
  const [imei, setImei] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [availableLicenses, setAvailableLicenses] = useState<StoredLicenseRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedDevice) {
        setImei(preSelectedDevice.imei);
      } else if (devices.length > 0 && !imei) {
        setImei(devices[0].imei);
      }
      const stored = StorageService.getLicenses().filter((l) => !l.isUsed);
      setAvailableLicenses(stored);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, preSelectedDevice, devices]);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!imei.trim()) {
      setErrorMsg('لطفاً شناسه IMEI دستگاه را وارد کنید.');
      return;
    }
    if (!licenseKey.trim()) {
      setErrorMsg('لطفاً کد لایسنس را وارد کنید.');
      return;
    }

    const result = StorageService.activateLicenseForDevice(imei.trim(), licenseKey.trim());

    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setSuccessMsg(result.message);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
      onSuccess();
    }
  };

  const handlePickAvailable = (key: string) => {
    setLicenseKey(key);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">فعال‌سازی و تمدید لایسنس</h3>
              <p className="text-xs text-slate-400 mt-0.5">ثبت کد لایسنس روی شناسه سخت‌افزاری IMEI دستگاه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleActivate} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">عملیات موفق</p>
                <p className="mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Device Selection or manual IMEI */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              انتخاب دستگاه هدف یا ورود کد IMEI
            </label>
            {devices.length > 0 && (
              <div className="mb-2">
                <select
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- انتخاب از میان خودروهای ثبت شده --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.imei}>
                      {d.name} ({d.plateNumber}) - IMEI: {d.imei}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
              placeholder="یا کد ۱۵ رقمی IMEI را دستی تایپ کنید"
              maxLength={15}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono tracking-wider text-cyan-300 focus:outline-none focus:border-cyan-500"
              dir="ltr"
            />
          </div>

          {/* License Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              کد لایسنس اختصاصی (License Key)
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="NVTRK-XXXX-XXXX-XXXX"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono tracking-widest text-amber-300 uppercase focus:outline-none focus:border-cyan-500"
              dir="ltr"
            />
          </div>

          {/* Quick Available Unused Licenses list */}
          {availableLicenses.length > 0 && (
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                کدهای لایسنس آماده در سیستم (کلیک برای درج خودکار):
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {availableLicenses.map((lic) => (
                  <div
                    key={lic.key}
                    onClick={() => handlePickAvailable(lic.key)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                      licenseKey === lic.key
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold tracking-wider">{lic.key}</span>
                      <span className="text-[10px] text-slate-400 mr-2">({lic.planName})</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-medium">
                      استفاده
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 flex items-center gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              بستن
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تأیید و فعال‌سازی لایسنس</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
