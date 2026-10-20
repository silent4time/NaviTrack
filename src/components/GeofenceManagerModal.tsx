import React, { useState } from 'react';
import { Geofence, Device } from '../types/tracker';
import { StorageService } from '../services/storage';
import {
  X,
  Shield,
  Plus,
  Trash2,
  MapPin,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface GeofenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  geofences: Geofence[];
  devices: Device[];
  onGeofencesUpdated: () => void;
}

export const GeofenceManagerModal: React.FC<GeofenceManagerModalProps> = ({
  isOpen,
  onClose,
  geofences,
  devices,
  onGeofencesUpdated,
}) => {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('35.7350');
  const [lng, setLng] = useState('51.4000');
  const [radiusMeters, setRadiusMeters] = useState(1500);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [alertOnExit, setAlertOnExit] = useState(true);
  const [alertOnEnter, setAlertOnEnter] = useState(true);

  if (!isOpen) return null;

  const handleAddGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newGeo: Geofence = {
      id: `geo_${Date.now()}`,
      name: name.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusMeters,
      assignedDeviceImeis: selectedImeis.length > 0 ? selectedImeis : devices.map((d) => d.imei),
      alertOnExit,
      alertOnEnter,
    };

    const current = StorageService.getGeofences();
    current.push(newGeo);
    StorageService.saveGeofences(current);
    onGeofencesUpdated();

    setName('');
  };

  const handleDelete = (id: string) => {
    const updated = geofences.filter((g) => g.id !== id);
    StorageService.saveGeofences(updated);
    onGeofencesUpdated();
  };

  const toggleImei = (imei: string) => {
    if (selectedImeis.includes(imei)) {
      setSelectedImeis(selectedImeis.filter((i) => i !== imei));
    } else {
      setSelectedImeis([...selectedImeis, imei]);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مدیریت حصارهای جغرافیایی (Geofence)</h3>
              <p className="text-xs text-slate-400 mt-0.5">تعیین محدوده مجاز تردد خودروها و هشدارهای ورود و خروج</p>
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
          {/* Create new Form */}
          <form onSubmit={handleAddGeofence} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>افزودن حصار جغرافیایی جدید</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">نام محدوده / حصار:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: پارکینگ انبار مرکزی"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شعاع پوشش (متر):</label>
                <select
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value={500}>۵۰۰ متر (محلی کوچک)</option>
                  <option value={1000}>۱,۰۰۰ متر (۱ کیلومتر)</option>
                  <option value={2000}>۲,۰۰۰ متر (۲ کیلومتر)</option>
                  <option value={3500}>۳,۵۰۰ متر (طرح ترافیک شهری)</option>
                  <option value={8000}>۸,۰۰۰ متر (محدوده شهر)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="block text-slate-400 mb-1 font-sans">عرض جغرافیایی مرکز (Lat):</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none dir-ltr"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-sans">طول جغرافیایی مرکز (Lng):</label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none dir-ltr"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={alertOnExit}
                  onChange={(e) => setAlertOnExit(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>هشدار خروج از محدوده</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={alertOnEnter}
                  onChange={(e) => setAlertOnEnter(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>هشدار ورود به محدوده</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer transition-colors shadow"
            >
              ذخیره و نمایش حصار روی نقشه
            </button>
          </form>

          {/* Existing Geofences List */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-300">حصارهای تعریف شده ({geofences.length}):</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {geofences.map((geo) => (
                <div
                  key={geo.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">{geo.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        شعاع: {geo.radiusMeters} متر | {geo.alertOnExit ? 'هشدار خروج فعال' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(geo.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
