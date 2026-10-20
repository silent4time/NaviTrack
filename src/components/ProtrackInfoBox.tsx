import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  X,
  Navigation,
  Play,
  PowerOff,
  Radio,
  KeyRound,
  Signal,
  Battery,
  MapPin,
  Clock,
  Gauge,
  Sliders,
  ShieldAlert,
  Compass,
} from 'lucide-react';

interface ProtrackInfoBoxProps {
  device: Device | null;
  onClose: () => void;
  onOpenPlayback: (device: Device) => void;
  onToggleEngineCut: (device: Device) => void;
  onOpenHardwareConfig: () => void;
  onOpenWordPress: () => void;
}

export const ProtrackInfoBox: React.FC<ProtrackInfoBoxProps> = ({
  device,
  onClose,
  onOpenPlayback,
  onToggleEngineCut,
  onOpenHardwareConfig,
  onOpenWordPress,
}) => {
  const [showConfirmCut, setShowConfirmCut] = useState(false);

  if (!device) return null;

  const { telemetry, license } = device;

  const handleConfirmCut = () => {
    setShowConfirmCut(false);
    onToggleEngineCut(device);
  };

  return (
    <div className="absolute top-4 left-4 z-[400] w-80 md:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-xs text-slate-200 select-none animate-in fade-in slide-in-from-top-2">
      {/* Protrack-style Top Bar */}
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              device.engineCutOff
                ? 'bg-red-500'
                : device.status === 'moving'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-amber-500'
            }`}
          />
          <span className="font-bold text-white text-sm truncate max-w-[170px]">{device.name}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {device.plateNumber}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Info Body */}
      <div className="p-3.5 space-y-2.5">
        {/* Status banner */}
        <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">وضعیت:</span>
            {device.engineCutOff ? (
              <span className="text-red-400 font-bold">رله قطع سوخت فعال</span>
            ) : device.status === 'moving' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                در حال حرکت ({telemetry.speed} km/h)
              </span>
            ) : (
              <span className="text-amber-400 font-bold">متوقف (پارک)</span>
            )}
          </div>
          <span className="text-slate-500 font-mono text-[10px]">
            {new Date(telemetry.lastUpdate).toLocaleTimeString('fa-IR')}
          </span>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">سرعت لحظه‌ای:</span>
            <span className="font-mono font-bold text-cyan-300">{telemetry.speed} km/h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">سوئیچ (ACC):</span>
            <span className={telemetry.ignition ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {telemetry.ignition ? 'روشن (ON)' : 'خاموش (OFF)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">مسافت کل:</span>
            <span className="font-mono text-slate-200">{Math.round(telemetry.odometer)} km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">ولتاژ باتری:</span>
            <span className="font-mono text-amber-300">{telemetry.batteryVoltage} V</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">سیگنال GSM:</span>
            <span className="font-mono text-slate-300">{telemetry.gsmSignalPercent}% (4G)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">ماهواره GPS:</span>
            <span className="font-mono text-cyan-400">{telemetry.satellites} SAT</span>
          </div>
        </div>

        {/* Coords & Hardware IMEI */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
          <span>IMEI: {device.imei}</span>
          <span dir="ltr">
            {telemetry.latitude.toFixed(5)}, {telemetry.longitude.toFixed(5)}
          </span>
        </div>

        {/* Engine Cutoff confirmation modal inline */}
        {showConfirmCut ? (
          <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl space-y-1.5 text-[11px]">
            <span className="font-bold text-red-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {device.engineCutOff ? 'وصل مجدد سوخت و اجازه استارت؟' : 'قطع سوخت خودرو (خاموش‌کن رله)؟'}
            </span>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowConfirmCut(false)}
                className="flex-1 py-1 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmCut}
                className="flex-1 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer"
              >
                تأیید فرمان
              </button>
            </div>
          </div>
        ) : null}

        {/* Protrack Action Button Row */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800">
          {/* History Playback */}
          <button
            onClick={() => onOpenPlayback(device)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 rounded-xl font-medium cursor-pointer transition-colors"
            title="بازپخش مسیر تردد"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>بازپخش</span>
          </button>

          {/* Remote Cutoff */}
          <button
            onClick={() => setShowConfirmCut(true)}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl font-medium cursor-pointer transition-colors ${
              device.engineCutOff
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
            }`}
            title="فرمان رله قطع سوخت"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>{device.engineCutOff ? 'وصل سوخت' : 'قطع سوخت'}</span>
          </button>

          {/* Config / Hardware */}
          <button
            onClick={onOpenHardwareConfig}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium cursor-pointer transition-colors"
            title="تنظیمات پورت و سرور ردیاب"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>سخت‌افزار</span>
          </button>
        </div>
      </div>
    </div>
  );
};
