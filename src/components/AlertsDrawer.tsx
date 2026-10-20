import React from 'react';
import { AlertNotification } from '../types/tracker';
import {
  X,
  Bell,
  AlertTriangle,
  Zap,
  PowerOff,
  Radio,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertNotification[];
  onMarkAllAsRead: () => void;
  onSelectAlertDevice?: (deviceId: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAllAsRead,
  onSelectAlertDevice,
}) => {
  if (!isOpen) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overspeed':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'engine_cut':
        return <PowerOff className="w-4 h-4 text-rose-400" />;
      case 'vibration':
        return <Radio className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">مرکز هشدارهای امنیتی و تردد</h3>
              <p className="text-[11px] text-slate-400">گزارش لحظه‌ای سنسورها، تصادف، سرعت و رله</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">تعداد کل هشدارها: {alerts.length}</span>
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>خواندن همه</span>
          </button>
        </div>

        {/* List of Alerts */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {alerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 p-4">
              <ShieldAlert className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs">هیچ هشدار فعالی ثبت نشده است.</p>
              <p className="text-[10px] text-slate-600 mt-1">تمام خودروها در وضعیت نرمال و ایمن هستند.</p>
            </div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                onClick={() => onSelectAlertDevice?.(alt.deviceId)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !alt.read
                    ? 'bg-slate-850 border-rose-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-850'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-800 shrink-0 mt-0.5">
                  {getAlertIcon(alt.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-xs font-bold text-slate-200 truncate">
                      {alt.deviceName}
                    </h5>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(alt.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {alt.message}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-[10px]">
                    <span className="font-mono text-slate-400">IMEI: {alt.imei}</span>
                    {!alt.read && (
                      <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                        جدید
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
