import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  X,
  Navigation,
  Play,
  PowerOff,
  Power,
  Signal,
  Battery,
  MapPin,
  Clock,
  Gauge,
  ShieldAlert,
  Compass,
  Key,
  Radio,
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

  const statusColor = device.engineCutOff
    ? 'bg-red-500'
    : device.status === 'moving'
    ? 'bg-emerald-500'
    : device.status === 'stopped'
    ? 'bg-amber-400'
    : 'bg-slate-500';

  const statusText = device.engineCutOff
    ? 'قطع سوخت فعال'
    : device.status === 'moving'
    ? `متحرک • ${telemetry.speed} km/h`
    : device.status === 'stopped'
    ? 'متوقف'
    : 'آفلاین';

  return (
    <div className="absolute top-4 left-4 z-[400] w-[340px] bg-[#0f172a]/95 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden text-xs text-slate-200 select-none">
      {/* Header */}
      <div className="px-3 py-2.5 bg-[#0c1322] border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor} ${device.status === 'moving' && !device.engineCutOff ? 'animate-pulse' : ''}`} />
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">{device.name}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{device.plateNumber}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status Strip */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" style={{ transform: `rotate(${telemetry.heading}deg)` }} />
          <span className="font-medium text-white">{statusText}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {new Date(telemetry.lastUpdate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-px bg-slate-800/50 border-b border-slate-800">
        <div className="bg-[#0f172a] px-2 py-2 text-center">
          <Gauge className="w-3.5 h-3.5 mx-auto text-cyan-400 mb-0.5" />
          <div className="font-mono font-bold text-white">{telemetry.speed}</div>
          <div className="text-[9px] text-slate-500">km/h</div>
        </div>
        <div className="bg-[#0f172a] px-2 py-2 text-center">
          <Battery className="w-3.5 h-3.5 mx-auto text-amber-400 mb-0.5" />
          <div className="font-mono font-bold text-white">{telemetry.batteryVoltage}</div>
          <div className="text-[9px] text-slate-500">Volt</div>
        </div>
        <div className="bg-[#0f172a] px-2 py-2 text-center">
          <Signal className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-0.5" />
          <div className="font-mono font-bold text-white">{telemetry.gsmSignalPercent}%</div>
          <div className="text-[9px] text-slate-500">GSM</div>
        </div>
      </div>

      {/* Details */}
      <div className="px-3 py-2.5 space-y-1.5 border-b border-slate-800/60">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1"><Key className="w-3 h-3" /> سوئیچ ACC</span>
          <span className={telemetry.ignition ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
            {telemetry.ignition ? 'روشن' : 'خاموش'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1"><Compass className="w-3 h-3" /> ماهواره</span>
          <span className="font-mono text-cyan-300">{telemetry.satellites} SAT</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> مختصات</span>
          <span className="font-mono text-slate-300" dir="ltr">{telemetry.latitude.toFixed(5)}, {telemetry.longitude.toFixed(5)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">IMEI</span>
          <span className="font-mono text-slate-300">{device.imei}</span>
        </div>
      </div>

      {/* License Status */}
      <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/40 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">لایسنس:</span>
        <span className={
          license.status === 'active' ? 'text-emerald-400' :
          license.status === 'expiring_soon' ? 'text-amber-400' : 'text-red-400'
        }>
          {license.planName} • {license.status === 'expired' ? 'منقضی' : 'فعال'}
        </span>
      </div>

      {/* Actions */}
      {!showConfirmCut ? (
        <div className="p-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenPlayback(device)}
            className="flex items-center justify-center gap-1.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            بازپخش مسیر
          </button>
          <button
            onClick={() => setShowConfirmCut(true)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              device.engineCutOff
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {device.engineCutOff ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
            {device.engineCutOff ? 'وصل سوخت' : 'قطع سوخت'}
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-red-950/40 border-t border-red-900/50">
          <div className="text-[11px] text-red-300 mb-2 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {device.engineCutOff ? 'وصل مجدد سوخت؟' : 'قطع سوخت و خاموش کردن موتور؟'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmCut(false)}
              className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
            >
              انصراف
            </button>
            <button
              onClick={handleConfirmCut}
              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded text-xs"
            >
              تأیید
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
