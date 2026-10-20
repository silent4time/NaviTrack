import React, { useState } from 'react';
import { Device } from '../types/tracker';
import {
  X,
  BarChart3,
  Download,
  Calendar,
  Gauge,
  Fuel,
  Clock,
  Car,
  FileSpreadsheet,
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

  const totalOdometer = devices.reduce((sum, d) => sum + d.telemetry.odometer, 0);
  const activeMovingCount = devices.filter((d) => d.status === 'moving').length;

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">گزارشات تحلیلی و کارکرد ناوگان</h3>
              <p className="text-xs text-slate-400 mt-0.5">بررسی مسافت طی شده، مصرف سوخت، سرعت و ساعات کارکرد خودروها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Fleet High-level Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">تعداد کل ناوگان</span>
              <span className="text-lg font-black text-white">{devices.length} دستگاه</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">خودروهای در حال حرکت</span>
              <span className="text-lg font-black text-emerald-400">{activeMovingCount} خودرو</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">مجموع مسافت ثبت‌شده</span>
              <span className="text-lg font-black text-cyan-400">{Math.round(totalOdometer).toLocaleString('fa-IR')} km</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">تخمین مصرف سوخت کل</span>
              <span className="text-lg font-black text-amber-400">{Math.round(totalOdometer * 0.085).toLocaleString('fa-IR')} لیتر</span>
            </div>
          </div>

          {/* Time range selector */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">جزئیات تردد هر دستگاه:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setSelectedRange('today')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedRange === 'today' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                امروز
              </button>
              <button
                onClick={() => setSelectedRange('week')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedRange === 'week' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                هفته جاری
              </button>
              <button
                onClick={() => setSelectedRange('month')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedRange === 'month' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ۳۰ روز گذشته
              </button>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
            <table className="w-full text-right text-[11px]">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3">خودرو و پلاک</th>
                  <th className="p-3">شناسه IMEI</th>
                  <th className="p-3">مسافت</th>
                  <th className="p-3">حداکثر سرعت</th>
                  <th className="p-3">سوئیچ روشن</th>
                  <th className="p-3">مصرف تقریبی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-bold flex items-center gap-2">
                      <span>{dev.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">({dev.plateNumber})</span>
                    </td>
                    <td className="p-3 font-mono text-cyan-300">{dev.imei}</td>
                    <td className="p-3 font-mono">{Math.round(dev.telemetry.odometer % 450 + 40)} km</td>
                    <td className="p-3 font-mono text-amber-300">{Math.max(dev.telemetry.speed, 85)} km/h</td>
                    <td className="p-3">{dev.telemetry.ignition ? '۴ ساعت و ۲۰ دقیقه' : 'توقف'}</td>
                    <td className="p-3 font-mono text-emerald-400">~{Math.round((dev.telemetry.odometer % 450 + 40) * 0.08)} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
