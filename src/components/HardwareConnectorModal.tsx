import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Terminal,
  Radio,
  Send,
  RefreshCw,
  Check,
  Copy,
  Layers,
  ArrowRight,
  Server,
  Smartphone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Device } from '../types/tracker';

interface HardwareConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onHardwarePacketInjected: (imei: string, lat: number, lng: number, speed: number) => void;
}

interface PacketLogItem {
  id: string;
  imei: string;
  protocol: string;
  rawPayload: string;
  decoded: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    acc?: number;
  };
  ip: string;
  timestamp: string;
}

export const HardwareConnectorModal: React.FC<HardwareConnectorModalProps> = ({
  isOpen,
  onClose,
  devices,
  onHardwarePacketInjected,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'simulator' | 'terminal'>('guide');
  const [selectedDeviceImei, setSelectedDeviceImei] = useState<string>(devices[0]?.imei || '');
  const [selectedProtocol, setSelectedProtocol] = useState<'gt06' | 'teltonika' | 'sinotrack' | 'http'>('gt06');

  // Simulator fields
  const [simLat, setSimLat] = useState('35.7510');
  const [simLng, setSimLng] = useState('51.4120');
  const [simSpeed, setSimSpeed] = useState('74');
  const [simHeading, setSimHeading] = useState('110');
  const [simAcc, setSimAcc] = useState('1');
  const [simStatusMsg, setSimStatusMsg] = useState('');

  // Terminal logs
  const [packetLogs, setPacketLogs] = useState<PacketLogItem[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchLogs = async () => {
    setIsFetchingLogs(true);
    try {
      const res = await fetch('/api/hardware/logs');
      if (res.ok) {
        const data = await res.json();
        setPacketLogs(data.logs || []);
      }
    } catch {
      // fallback local demo logs
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const handleSendTestPing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimStatusMsg('در حال ارسال بسته به سرور...');

    try {
      const res = await fetch('/api/gps/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedDeviceImei || '862908041539201',
          lat: parseFloat(simLat),
          lng: parseFloat(simLng),
          speed: parseFloat(simSpeed),
          heading: parseFloat(simHeading),
          ignition: simAcc === '1',
          protocol: selectedProtocol.toUpperCase(),
        }),
      });

      if (res.ok) {
        setSimStatusMsg('✓ پکت سخت‌افزاری با موفقیت توسط سرور دریافت، رمزگشایی و ثبت شد!');
        onHardwarePacketInjected(
          selectedDeviceImei || '862908041539201',
          parseFloat(simLat),
          parseFloat(simLng),
          parseFloat(simSpeed)
        );
        fetchLogs();
      } else {
        setSimStatusMsg('خطا در دریافت پکت توسط سرور');
      }
    } catch {
      // client-side update
      setSimStatusMsg('✓ پکت در حافظه کلاینت با موفقیت اعمال شد.');
      onHardwarePacketInjected(
        selectedDeviceImei || '862908041539201',
        parseFloat(simLat),
        parseFloat(simLng),
        parseFloat(simSpeed)
      );
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مرکز اتصال و پیکربندی سخت‌افزار ردیاب</h3>
              <p className="text-xs text-slate-400 mt-0.5">تنظیمات سرور، پروتکل‌های سخت‌افزاری و دریافت لحظه‌ای پکت‌ها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>راهنمای کانفیگ ردیاب فیزیکی (SMS/GPRS)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>تست و تزریق پکت GPS زنده</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'terminal'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>ترمینال لاگ پکت‌های خام ({packetLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              {/* Server Host info */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-cyan-400">مشخصات سرور جهت اتصال سخت‌افزار ردیاب:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">SERVER IP / HOST:</span>
                    <span className="text-white font-bold">app.navitrack.ir</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PORT (GT06/CONCOX):</span>
                    <span className="text-cyan-300 font-bold">5023 (TCP)</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">HTTP WEBHOOK PORT:</span>
                    <span className="text-amber-300 font-bold">3000 / 80 / 443</span>
                  </div>
                </div>
              </div>

              {/* Protocol SMS Commands Cheat Sheet */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200">دستورات پیامکی (SMS) تنظیم سرور روی سخت‌افزارها:</h4>

                {/* Concox GT06 */}
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">۱. ردیاب‌های Concox / WeTrack / GT06:</span>
                    <button
                      onClick={() => copyToClipboard('SERVER,1,app.navitrack.ir,5023,0#', 'gt06_sms')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      {copiedCode === 'gt06_sms' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>کپی پیامک</span>
                    </button>
                  </div>
                  <code className="block bg-slate-900 p-2 rounded-xl font-mono text-cyan-300 dir-ltr text-[11px]">
                    SERVER,1,app.navitrack.ir,5023,0#
                  </code>
                  <p className="text-[11px] text-slate-400">
                    تنظیم فاصله ارسال داده: <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-amber-300">TIMER,10,60#</code> (۱۰ ثانیه حین حرکت، ۶۰ ثانیه در توقف)
                  </p>
                </div>

                {/* SinoTrack */}
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">۲. ردیاب‌های SinoTrack (ST-901 / ST-906):</span>
                    <button
                      onClick={() => copyToClipboard('8040000 app.navitrack.ir 5023', 'sino_sms')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      {copiedCode === 'sino_sms' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>کپی پیامک</span>
                    </button>
                  </div>
                  <code className="block bg-slate-900 p-2 rounded-xl font-mono text-cyan-300 dir-ltr text-[11px]">
                    8040000 app.navitrack.ir 5023
                  </code>
                  <p className="text-[11px] text-slate-400">
                    تنظیم APN ایرانسل/همراه‌اول: <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-amber-300">8030000 mtnirancell</code>
                  </p>
                </div>

                {/* Teltonika */}
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">۳. ردیاب‌های Teltonika (FMB920 / FMC130):</span>
                    <button
                      onClick={() => copyToClipboard('  setparam 2004:app.navitrack.ir;2005:5027;2006:0', 'teltonika_sms')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      {copiedCode === 'teltonika_sms' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>کپی پیامک</span>
                    </button>
                  </div>
                  <code className="block bg-slate-900 p-2 rounded-xl font-mono text-cyan-300 dir-ltr text-[11px]">
                    setparam 2004:app.navitrack.ir;2005:5027;2006:0
                  </code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <form onSubmit={handleSendTestPing} className="space-y-4 text-xs">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-2xl text-cyan-300 flex items-center gap-2">
                <Radio className="w-4 h-4 shrink-0" />
                <span>
                  با استفاده از این فرم، می‌توانید یک پکت دیتای واقعی با مختصات دلخواه به عنوان ورودی ردیاب سخت‌افزاری به سرور ارسال کنید تا وضعیت آن فوراً روی نقشه اعمال گردد.
                </span>
              </div>

              {simStatusMsg && (
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium">
                  {simStatusMsg}
                </div>
              )}

              {/* Device Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">دستگاه هدف (بر اساس IMEI):</label>
                <select
                  value={selectedDeviceImei}
                  onChange={(e) => setSelectedDeviceImei(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.imei}>
                      {d.name} ({d.plateNumber}) - IMEI: {d.imei}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">عرض جغرافیایی (Latitude):</label>
                  <input
                    type="text"
                    value={simLat}
                    onChange={(e) => setSimLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none dir-ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">طول جغرافیایی (Longitude):</label>
                  <input
                    type="text"
                    value={simLng}
                    onChange={(e) => setSimLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none dir-ltr"
                  />
                </div>
              </div>

              {/* Speed & Heading */}
              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">سرعت (km/h):</label>
                  <input
                    type="number"
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none dir-ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">زاویه حرکت (0-360°):</label>
                  <input
                    type="number"
                    value={simHeading}
                    onChange={(e) => setSimHeading(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none dir-ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">سوئیچ احتراق:</label>
                  <select
                    value={simAcc}
                    onChange={(e) => setSimAcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="1">روشن (ACC ON)</option>
                    <option value="0">خاموش (ACC OFF)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>شبیه‌سازی ارسال پکت سخت‌افزار به سرور</span>
              </button>
            </form>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">آخرین پکت‌های خام و رمزگشایی شده:</span>
                <button
                  onClick={fetchLogs}
                  disabled={isFetchingLogs}
                  className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLogs ? 'animate-spin' : ''}`} />
                  <span>به‌روزرسانی لاگ</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[11px] max-h-80 overflow-y-auto space-y-2">
                {packetLogs.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 font-sans">
                    هنوز پکتی در صف لاگ دریافت نشده است.
                  </div>
                ) : (
                  packetLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="text-cyan-400 font-bold">پروتکل: {log.protocol}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString('fa-IR')}</span>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">IMEI: </span>
                        <span className="text-white font-bold">{log.imei}</span>
                        <span className="text-slate-500 mr-3">IP: </span>
                        <span className="text-slate-400">{log.ip}</span>
                      </div>
                      <div className="bg-black/50 p-1.5 rounded text-[10px] text-amber-300 break-all dir-ltr">
                        RAW: {log.rawPayload}
                      </div>
                      <div className="text-[10px] text-emerald-400 dir-ltr">
                        DECODED: lat={log.decoded.latitude}, lng={log.decoded.longitude}, spd={log.decoded.speed}km/h, heading={log.decoded.heading}°
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
