import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  X,
  BarChart3,
  Download,
  Calendar,
  Gauge,
  Clock,
  Car,
  FileSpreadsheet,
  MapPin,
} from 'lucide-react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  devices,
}) => {
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month'>('today');

  if (!isOpen) return null;

  const totalKm = devices.reduce((sum, d) => sum + (d.telemetry.odometer || 0), 0);
  const movingCount = devices.filter((d) => d.status === 'moving').length;
  const avgSpeed = devices.length
    ? Math.round(devices.reduce((s, d) => s + d.telemetry.speed, 0) / devices.length)
    : 0;

  const rangeLabel = { today: 'امروز', week: '۷ روز اخیر', month: '۳۰ روز اخیر' }[selectedRange];

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">گزارش‌های ناوگان</h2>
              <p className="text-xs text-slate-400">خلاصه عملکرد دستگاه‌ها — {rangeLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Range Selector */}
        <div className="px-5 py-3 border-b border-slate-800 flex gap-2">
          {(['today', 'week', 'month'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedRange === r
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {{ today: 'امروز', week: 'هفته', month: 'ماه' }[r]}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Car className="w-4 h-4" /> دستگاه‌های فعال
            </div>
            <div className="text-2xl font-bold text-white">{devices.length}</div>
            <div className="text-xs text-emerald-400 mt-1">{movingCount} در حال حرکت</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <MapPin className="w-4 h-4" /> مجموع کیلومتر
            </div>
            <div className="text-2xl font-bold text-white">{Math.round(totalKm).toLocaleString('fa-IR')}</div>
            <div className="text-xs text-slate-500 mt-1">کیلومتر ثبت‌شده</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Gauge className="w-4 h-4" /> میانگین سرعت
            </div>
            <div className="text-2xl font-bold text-white">{avgSpeed}</div>
            <div className="text-xs text-slate-500 mt-1">km/h</div>
          </div>
        </div>

        {/* Device Table */}
        <div className="flex-1 overflow-auto px-5 pb-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="text-right p-3 font-medium">دستگاه</th>
                  <th className="text-right p-3 font-medium">IMEI</th>
                  <th className="text-right p-3 font-medium">وضعیت</th>
                  <th className="text-right p-3 font-medium">سرعت</th>
                  <th className="text-right p-3 font-medium">کیلومتر</th>
                  <th className="text-right p-3 font-medium">آخرین به‌روزرسانی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/50">
                    <td className="p-3 text-white font-medium">{d.name}</td>
                    <td className="p-3 font-mono text-cyan-300">{d.imei}</td>
                    <td className="p-3">
                      <span className={
                        d.status === 'moving' ? 'text-emerald-400' :
                        d.status === 'stopped' ? 'text-amber-400' : 'text-slate-500'
                      }>
                        {d.status === 'moving' ? 'متحرک' : d.status === 'stopped' ? 'متوقف' : 'آفلاین'}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{d.telemetry.speed} km/h</td>
                    <td className="p-3 font-mono">{Math.round(d.telemetry.odometer)}</td>
                    <td className="p-3 text-slate-400 font-mono">
                      {new Date(d.telemetry.lastUpdate).toLocaleTimeString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            خروجی اکسل
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs">
            <Download className="w-3.5 h-3.5" />
            دانلود PDF
          </button>
        </div>
      </div>
    </div>
  );
};
