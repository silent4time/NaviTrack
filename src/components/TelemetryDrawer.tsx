import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  X,
  Gauge,
  Zap,
  Battery,
  Signal,
  Flame,
  Radio,
  PowerOff,
  Navigation,
  KeyRound,
  ShieldAlert,
  Compass,
  MapPin,
  Calendar,
} from 'lucide-react';

interface TelemetryDrawerProps {
  device: Device | null;
  onClose: () => void;
  onToggleEngineCut: (device: Device) => void;
  onOpenPlayback: (device: Device) => void;
  onOpenLicenseRenew: (device: Device) => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  device,
  onClose,
  onToggleEngineCut,
  onOpenPlayback,
  onOpenLicenseRenew,
}) => {
  const [showConfirmCut, setShowConfirmCut] = useState(false);

  if (!device) return null;

  const { telemetry, license } = device;

  const handleConfirmCut = () => {
    setShowConfirmCut(false);
    onToggleEngineCut(device);
  };

  return (
    <div className="absolute bottom-4 right-4 left-4 md:left-auto md:right-96 md:w-[460px] z-[450] animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-4 text-slate-100 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                device.engineCutOff
                  ? 'bg-rose-500 ring-4 ring-rose-500/20'
                  : device.status === 'moving'
                  ? 'bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse'
                  : 'bg-amber-400 ring-4 ring-amber-400/20'
              }`}
            />
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>{device.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {device.plateNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                IMEI: {device.imei} | مدل: {device.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Speed & Heading Gauge Card */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 mb-0.5">سرعت لحظه‌ای</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {telemetry.speed}
              </span>
              <span className="text-[9px] text-slate-400">km/h</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-x border-slate-800">
            <span className="text-[10px] text-slate-400 mb-0.5">زاویه حرکت (Heading)</span>
            <div className="flex items-center gap-1 font-mono font-bold text-white text-sm">
              <Compass
                className="w-4 h-4 text-amber-400 transition-transform"
                style={{ transform: `rotate(${telemetry.heading}deg)` }}
              />
              <span>{telemetry.heading}°</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 mb-0.5">وضعیت سوئیچ</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                telemetry.ignition
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {telemetry.ignition ? 'روشن (ACC ON)' : 'خاموش (OFF)'}
            </span>
          </div>
        </div>

        {/* Telemetry Sensor Metrics */}
        <div className="grid grid-cols-4 gap-2 text-[10px] text-center">
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">ولتاژ باتری</span>
            <span className="font-mono font-bold text-cyan-300">
              {telemetry.batteryVoltage}V
            </span>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">باتری داخلی</span>
            <span className="font-mono font-bold text-emerald-400">
              {telemetry.backupBatteryPercent}%
            </span>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">ماهواره GPS</span>
            <span className="font-mono font-bold text-amber-300">
              {telemetry.satellites} SAT
            </span>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">کیلومترشمار</span>
            <span className="font-mono font-bold text-slate-200">
              {Math.round(telemetry.odometer)} km
            </span>
          </div>
        </div>

        {/* License Strip */}
        <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>لایسنس: {license.planName}</span>
          </div>
          <button
            onClick={() => onOpenLicenseRenew(device)}
            className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-semibold"
          >
            تمدید / تغییر پلن
          </button>
        </div>

        {/* Remote Engine Cut-off Confirmation Modal Inline */}
        {showConfirmCut ? (
          <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                {device.engineCutOff
                  ? 'آیا مایل به وصل مجدد سوخت و اجازه استارت خودرو هستید؟'
                  : 'هشدار امنیتی: خاموش کردن از راه دور موتور (قطع رله سوخت)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {device.engineCutOff
                ? 'فرمان اتصال مجدد مدار رله پمپ بنزین ارسال خواهد شد.'
                : 'این دستور با قطع جریان پمپ سوخت، خودرو را در اولین توقف یا بلافاصله خاموش می‌کند.'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowConfirmCut(false)}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmCut}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
              >
                تأیید و ارسال فرمان
              </button>
            </div>
          </div>
        ) : (
          /* Action Buttons */
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowConfirmCut(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                device.engineCutOff
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
              }`}
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>{device.engineCutOff ? 'وصل مجدد سوخت' : 'خاموش‌کن موتور (رله)'}</span>
            </button>

            <button
              onClick={() => onOpenPlayback(device)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>بازپخش مسیر</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
